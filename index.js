// Import all requirements
const express = require('express');
const app = express()
const port = 3000
const fs = require('fs');
var cors = require('cors')
const session = require('express-session');
const path = require('path');
const router = express.Router();
const { createHash } = require("crypto")
const { degrees, PDFDocument, rgb, StandardFonts, grayscale, } = require('pdf-lib')
const identicon = require('identicon.js')
const intToRGB = require('int-to-rgb');
const nodeCron = require("node-cron");

require('dotenv').config();

// Salt for encryption
const salt = process.env.SALT

const {userDB, doorDB, addUser, addDoor, deleteUser, addTempPerm } = require('./utils/database')
const {getID, getAdmin, getPerms, getUsers, getDoors} = require('./utils/getCommands')
const {createTables, removeTempPerms, checkPIN, error} = require('./utils/utils')

const unlockDoorRoute = require('./routes/unlockDoorRoute')
const unlockSafeDoorRoute = require('./routes/unlockSafeDoorRoute')
const addUserRoute = require('./routes/addUserRoute')
const getUserRoute = require('./routes/getUserRoute')
const sessionidRoute  = require('./routes/sessionidRoute')
const logoutRoute = require('./routes/logoutRoute')


// Express.JS configuration
const bodyParser = require('body-parser'); // Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
	secret: process.env.SECRET,
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors())

// Used to unlock a door, needs the ID of the user that wants to open the door, he ID of the door and the MAC of the reader, for security
app.use('/unlockDoor', unlockDoorRoute)

// Does the same as a the normal /unlockDoor, except that is also takes in a PIN and compares it to the one stored with the ID
app.use('/unlockSafeDoor', unlockSafeDoorRoute)

// Used to add a user, takes in the ID of the admin that issues the request,the id(hex) of the new user, the id(dec) of the new user, the first name of the new user, the last name of the user, the perms the user will be given and if the user should be an admin or not
app.use('/addUser', addUserRoute)

// API to get all users, admin ID needed and what to sort the users by
app.use('/getUsers', getUserRoute)

// API to get all doors, admin ID required
app.use('/getDoors', async function(req, res, next){ 
    var admin = req.query['admin']

    var query  = JSON.stringify(req.query)
    if(query.includes(";")) {
        return next(error(401, 'Not allowed characters in request'))
    }
    
    if (!admin) return next(error(401, 'Admin login needed'));
    
    var response = await getAdmin(admin)
    var users = await getDoors()
    if(response.status != 200) {
        console.log("Access Denied")
        return next(error(401, 'Access Denied'))
    } else {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(users))
    }


});

// API to add a door, needs admin ID, MAC of the reader and a "friendly name" of the door
app.use('/addDoor', async function(req, res, next){ 
    var admin = req.query['admin']
    var MAC = req.query['MAC']
    var name = req.query['name']
    var timestamp = Date.now()

    var query  = JSON.stringify(req.query)
    if(query.includes(";")) {
        return next(error(401, 'Bad request'))
    }
    
    if (!admin) return next(error(401, 'Admin login needed'));
    
    var response = await getAdmin(admin)
    if(response.status != 200) {
        console.log("Access Denied")
        res.status(401)
    } else {
       await addDoor(MAC, name, timestamp)
       res.end(JSON.stringify({'status':200}))
    }

}); 

// Routes to the login screen
app.get('/', function(request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/dashboard/login.html'));
});

// Routes to the dashboard
app.get('/dashboard', function(request, response) {
	// Render login template
    if (request.session.loggedin) {
        response.sendFile(`${__dirname}/dashboard/`, (err) => {
            if (err) {
              console.log(err);
              response.end(err.message);
            }
          });
    } else {
		// Not logged in
		response.send('<html>Please login to view this page! <a href="http://localhost:3000">Login</a></html>');
	}
});

// API to get the ID of the logged in user
app.use('/sessionid', sessionidRoute)


// route to logout the user
app.use('/logout', logoutRoute)

// API to authenticate a login to the dashboard
app.use('/auth', function(req, res, next) {

    var query  = JSON.stringify(req.query)
    if(query.includes(";")) {
        return next(error(401, 'Not allowed characters in request'))
    }

    var username = req.query['username']
    var PIN = req.query['PIN']
    const PINhash = createHash("sha256")
    .update(PIN)
    .update(createHash("sha256").update(salt, "utf8").digest("hex"))
    .digest("hex")
    userDB.get('SELECT idDec, id FROM users WHERE idDec = ? AND admin = 1 AND PIN = ?',[username, PINhash], async (err, row) => {
        if (err) throw error;
        // If the account exists
        if(row) {
        if (row.idDec == username) {
            // Authenticate the user
            req.session.loggedin = true;
            req.session.username = username;
            req.session.userid = row.id
            // Redirect to home page
            res.redirect('/dashboard');
        } 
    }else {
            res.send('<html>Invalid login! Please try again <a href="http://localhost:3000">Login</a></html>');
        }	
    	
    });
})

// API to delete a user 
app.use('/deleteUser', async function(req, res, next) {
    var query  = JSON.stringify(req.query)
    if(query.includes(";")) {
        return next(error(401, 'Not allowed characters in request'))
    }
    var admin = req.query['admin']
    var id = req.query['id']

    if (!admin) return next(error(401, 'Admin login needed'));
    if (!id) return next(error(401, 'ID needed'));
    
    var response = await getAdmin(admin) 
    if(response.status != 200) {
        res.status(401)
    }
    deleteUser(id)
    res.redirect('/dashboard')
})

// API to create a PDF to be printed on a keycard
app.use('/createKeyCard', async function(req, res, next) {
    var query  = JSON.stringify(req.query)
    if(query.includes(";")) {
        return next(error(401, 'Not allowed characters in request'))
    }
    var admin = req.query['admin']
    var id = req.query['id']

    if (!admin) return next(error(401, 'Admin login needed'));
    if (!id) return next(error(401, 'ID needed'));
    
    var response = await getAdmin(admin) 
    if(response.status != 200) {
        res.status(401)
    }
    var user = await getID(id)
    var username = user.firstname + " " + user.lastname
    const userHash = createHash("sha256")
    .update(username)
    .update(createHash("sha256").update(salt, "utf8").digest("hex"))
    .digest("hex")

    const hashCode = (str) => {
        let hash = Math.abs(str.hash_code()) * 0.007812499538
        return Math.floor(hash)
    }
    String.prototype.hash_code = function () {
        let hash = 0
        if (this.length == 0) {
            return hash
        }
        for (let i = 0; i < this.length; i++) {
            var char = this.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash // Convert to 32bit integer
        }
        return hash
    }
    let RGB = intToRGB(hashCode(userHash))

    let options = {
        foreground: [RGB.red, RGB.green, RGB.blue, 255], // rgba black
        background: [parseInt(RGB.red / 10), parseInt(RGB.green / 10), parseInt(RGB.blue / 10), 0], // rgba white
        margin: 0, // 20% margin
        size: 70, // 70px square
        format: "PNG", // use SVG instead of PNG
    }

    const buffer = new identicon(userHash, options).toString()
    
    fs.writeFileSync(__dirname + '/identicon.png', Buffer.from(buffer, "base64"))

    const existingPdfBytes = fs.readFileSync('./keycard-design.pdf')
    const pngImageBytes = fs.readFileSync('./identicon.png')

    const pdfDoc = await PDFDocument.load(existingPdfBytes)
 const pngImage = await pdfDoc.embedPng(pngImageBytes)

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const pages = pdfDoc.getPages()
    const firstPage = pages[0]

    const { width, height } = firstPage.getSize()
    //const jpgDims = jpgImage.scale(0.3)
    const pngDims = pngImage.scale(1)

    const information = await getID(id)

    const name = information.firstname + " " + information.lastname

   firstPage.drawImage(pngImage, {
       x: 5,
       y: height / 2 + 30 - pngDims.height / 2,
       width: pngDims.width,
       height: pngDims.height,
    })
    firstPage.drawRectangle({
        x: 4,
        y: height / 2 + 29 - pngDims.height / 2,
        width: pngDims.width + 2,
        height: pngDims.height + 2,
        borderWidth: 2,
        borderColor: rgb(0,0,0),//grayscale(0.5),
       // opacity: 0.5,
       // borderOpacity: 0.75,
      })
    firstPage.drawText(name, {
        x: 5,
        y: height / 3 + 15,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
    })

    const pdfBytes = await pdfDoc.save()
    const fileName = "./keycard-" + information.firstname + "-" + information.lastname + ".pdf"

  fs.writeFileSync(fileName, pdfBytes)
  res.download(fileName)
  await sleep(10000)
  fs.unlink(fileName, function(err) {
    if (err) {
        next(err)
    }
  })
  fs.unlink("./identicon.png", function(err) {
    if (err) {
        next(err)
    }
  })
  
  

})
app.get('/addTempPerms', async function(req, res) {
    var admin = req.query['admin']
	var id = req.query['id']
    var perm = req.query['perm']
    var to = req.query['to']
    var from = req.query['from']

    var response = await getAdmin(admin) 
    if(response.status != 200) {
        res.status(401)
    }
    addTempPerm(id, perm, to, from)
    res.status(200)
});

app.listen(port, function(err){
    if (err) console.log(err);
    console.log("Server listening on port", port);
});
createTables()

const job = nodeCron.schedule("* 0 * * *", () => {
    removeTempPerms()
});

