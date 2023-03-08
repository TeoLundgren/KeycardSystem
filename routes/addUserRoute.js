const express = require('express')
const router = express.Router()

const {addUser} = require('../utils/database')
const {getAdmin, getUsers, getDoors} = require('../utils/getCommands')
const {error} = require('../utils/utils')

router.get("/", async function (req, res, next) {
    var admin = req.query['admin']
    var id = req.query['id']
    var idDec = req.query['idDec']
    var firstname = req.query['firstname']
    var lastname = req.query['lastname']
    var perms = '{"doors": [' + req.query['perms'] + "]}"
    var isAdmin = req.query['isAdmin']
    var PIN = req.query['PIN']
    var timestamp = Date.now()
    const badPIN = []
    badPIN.push("0000", "1111", "1234", "4321", "2023") 

    var query  = JSON.stringify(req.query)
    if(query.includes(";")) {
        return next(error(401, 'Not allowed characters in request'))
    }
    
    i = 0
    while(i < badPIN.length) {
        if(badPIN[i] == PIN) {
            return next(error(401, 'Bad PIN combination'))
        }
        i++
    }

    const PINhash = createHash("sha256")
    .update(PIN)
    .update(createHash("sha256").update(salt, "utf8").digest("hex"))
    .digest("hex")
    if (!admin) return next(error(401, 'Admin login needed'));
    var response = await getAdmin(admin)
    if(response.status != 200) {
        console.log("Access Denied")
        return next(error(401, 'Access Denied'))
    } else {
        await addUser(id, idDec, firstname, lastname, perms, isAdmin, PINhash, timestamp)
        res.end(JSON.stringify({'status':200}))
    }


}); 

module.exports = router