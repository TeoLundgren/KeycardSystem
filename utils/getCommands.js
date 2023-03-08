const {userDB, doorDB} = require('./database')
// Takes in an ID and returns ID, firstname, lastname in a JSON format if the user exists
async function getID(scannedID) {
    return new Promise((resolve, reject) => {
    var response = { status: 0 }
    userDB.get(`SELECT id, firstname, lastname FROM users WHERE id = '${scannedID}'`, [], (err, row) => {
        if (err) {
            reject(err.message)
        }
        if(row) {
                response = {
                        id: row.id,
                        firstname: row.firstname,
                        lastname: row.lastname,
                        status: 200
                        }
                resolve(response)
        
        } else {
        resolve(response)
        }
     })
    
    })

}

// Checks if a user is a admin through querying the ID and checking if it has the admin tag. Returns a JSON
async function getAdmin(id) {
return new Promise((resolve, reject) => {
var response = { status: 0 }

userDB.get(`SELECT id FROM users WHERE admin = 1 AND id = '${id}'`, [], async (err, row) => {
  if (err) {
    reject(err.message)
  }
 if(row) {
    response = { status: 200 }
    resolve(response)
  
  } else {
    resolve(response)
  }
});
})
}
// Checks if a user(id) has the permission to open the specified door
async function getPerms(id, doorID) {
    return new Promise((resolve, reject) => {
    var response = { status: 0 }
    userDB.get(`SELECT perms FROM users WHERE id = '${id}'`, [], async (err, row) => {
      if (err) {
        reject(err.message)
      }
      if(row) {
     var perms = await JSON.parse(row.perms)
     perms.doors.forEach(door => {
        if(doorID == door) {
            response = { status: 200 }
            resolve(response)
        }
        })
        userDB.all(`SELECT perm, perm_from, perms_to FROM tempPerms where id = '${id}'`, [], async (err, rows) => {
        if(rows) {
        rows.forEach(row => {
        if(doorID == row.perm) {
            if(row.perm_from > Date.now() && row.perms_to < Date.now()) {
            response = { status: 200 }
            resolve(response)
            }
        }
        })
        }
        })
        resolve(response)
        } else {
        resolve(response)
        } 
    })
    
})
}
// Gets all users in the database, also sorts them after the specified tag
async function getUsers(sortby) {
    return new Promise((resolve, reject) => {
    var response = { status: 0, data: [] }

    userDB.all(`SELECT id, idDec, firstname, lastname, perms, admin FROM users ORDER BY ${sortby}`, [], (err, rows) => {
        if (err) {
          reject(err.message)
          }
    rows.forEach((row) => {
        response.data.push({id: row.id, idDec: row.idDec, firstname: row.firstname, lastname: row.lastname, perms: row.perms, admin: row.admin, status: 200}) 
        response.status = 200
          
    })
    resolve(response)
    })
})
}

// Gets all doors in the database
async function getDoors() {
    return new Promise((resolve, reject) => {
    var response = { status: 0, data: [] }
    
    doorDB.all(`SELECT id, MAC, name FROM doors ORDER BY id`, [], (err, rows) => {
        if (err) {
            reject(err.message)
        }
        rows.forEach((row) => {
                 response.data.push({id: row.id, MAC: row.MAC, name: row.name, status: 200}) 
                   
        });
        resolve(response)
     });
    })
}

module.exports = {
    getID,
    getAdmin,
    getPerms,
    getUsers,
    getDoors
}