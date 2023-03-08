const sqlite3 = require('sqlite3').verbose();
const userDB = new sqlite3.Database('./users.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the user SQlite database.');
  });
const doorDB = new sqlite3.Database('./doors.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the door SQlite database.');
});

async function addUser(id, idDec, firstname, lastname, perms, admin, PIN, timestamp) {
    userDB.run(`INSERT OR REPLACE INTO users VALUES(?, ?, ?, ?, ?, ?, ?, ?)`, [id, idDec, firstname, lastname, perms, admin, PIN, timestamp])
}    
async function addDoor(MAC, name, timestamp) {
    doorDB.run('INSERT OR REPLACE INTO doors VALUES(NULL, ?, ?, ?)', [MAC, name, timestamp])
}  
async function deleteUser(id) {
    userDB.run(`DELETE FROM users WHERE id = '${id}'`)
}
async function addTempPerm(id, perm, to, from) {
    userDB.run('INSERT OR REPLACE INTO tempPerms VALUES(NULL, ?, ?, ?, ?)', [id, perm, from, to])
}

module.exports = {
    userDB,
    doorDB,
    addUser,
    addDoor,
    deleteUser,
    addTempPerm
}