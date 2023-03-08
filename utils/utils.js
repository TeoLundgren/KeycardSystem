const {userDB, doorDB} = require('./database')

// Create all tables
function createTables() {
    userDB.exec(`
    create table if not exists users (
        id text primary key UNIQUE not null,
        idDec text UNIQUE,
        firstname text not null,
        lastname text not null,
        perms text,
        admin int not null, 
        PIN text,
        timestamp int
        );
        insert into users (id, idDec, firstname, lastname, perms, admin, PIN, timestamp)
        values ('000000', '1101010100', 'Example', 'user', '{"doors": [1]}', 1, 'cb3883c32dabcf0a57fa158f0712777198da364ff27dfe0a1a093c13c9182424', NULL);
        
        `, async ()  => {
            console.log("Created User Tables")
        });
        userDB.exec(`
        create table if not exists tempPerms (
        nmbr integer primary key autoincrement UNIQUE not null,
        id text not null,
        perm text not null,
        perm_from text, 
        perm_to text
        );
        `, async ()  => {
            console.log("Created tempPerms Tables")
        });
    doorDB.exec(`
        create table if not exists doors (
            id integer primary key autoincrement not null,
            MAC text not null,
            name text not null,
            timestamp int,
            UNIQUE(id, MAC)
            );
            insert into doors (id, MAC, name)
            values (1, 'FF:FF:FF:FF:FF:FF', 'test');
            
            `, async ()  => {
                console.log("Created Door Tables")
            });
}


async function removeTempPerms() {
    userDB.all(`SELECT id, perm, perm_to FROM tempPerms`, [], async (err, rows) => {
        if(err) {
            console.log(err)
        }
        if(rows) {
        rows.forEach(async row => {
        if(row.perm_to < Date.now()) {
            userDB.run(`DELETE FROM tempPerms WHERE id = '${row.id}' AND perm_to = '${row.perm_to}'`)
        } 
        })
        }
    })
}

// Compares a inputed PIN to the one stored in the database of specified ID, uses SHA265 + salt
async function checkPIN(id, PIN) {
    return new Promise((resolve, reject) => {
        const PINhash = createHash("sha256")
        .update(PIN)
        .update(createHash("sha256").update(salt, "utf8").digest("hex"))
        .digest("hex")
        var response = { status: 0 }
        userDB.get(`SELECT id FROM users WHERE id = '${id}' AND PIN = '${PINhash}'`, [], async (err, row) => {
          if (err) {
            reject(err.message)
          }
          if(row) {
            if(row.id == id) {
                response = { status: 200 }
                resolve(response)
            }
        
            resolve(response)
            } else {
            resolve(response)
            } 
        })
        
    })
}
function error(status, msg) {
    var err = new Error(msg);
    err.status = status;
    return err;
}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function log(log){
    try {
        fs.appendFileSync('./accesslog.txt', log);
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    createTables,
    removeTempPerms,
    checkPIN,
    error,
    sleep,
    log
}