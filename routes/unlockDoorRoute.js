const express = require('express')
const router = express.Router()

const {getID, getAdmin, getPerms, getUsers, getDoors} = require('../utils/getCommands')
const {log} = require('../utils/utils')

router.get("/", async function(req, res, next){
    var scannedID = req.query['id']
    var doorID = req.query['did']
    var MAC = req.query['MAC']

    var query  = JSON.stringify(req.query)
    if(query.includes(";")) {
        return next(error(401, 'Not allowed characters in request'))
    }
        
    if (!scannedID) return next(error(401, 'ID required'));
    if (!doorID) return next(error(401, 'Door ID required'));
    if (!doorID) return next(error(401, "MAC required"))
    var admin = await getAdmin(scannedID)
    if(admin.status != 200) {
        var permission = await getPerms(scannedID, doorID)
        if(permission.status != 200) {
            //return next(error(401, 'Permision Denied'));
            res.status(401)
        }
    }
    var json = await getID(scannedID)
    var response = JSON.stringify(json)
    if(json.status == 200) {
        res.end(JSON.stringify({'status':200}))
        var loggaddition = Date.now() + " " + json.firstname + " " + json.lastname + " opened door " + doorID + ", \n"
        log(loggaddition)
    } else if (json.status == 401) {
        res.end(JSON.stringify({'status':401}))
    } else  if (json.status == 0) {
        res.end(JSON.stringify({'status':401}))
    }
})
module.exports = router