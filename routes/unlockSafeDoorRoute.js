const express = require('express')
const router = express.Router()

const {getID, getAdmin, getPerms} = require('../utils/getCommands')
const {checkPIN, log} = require('../utils/utils')

router.use('/', async function(req, res, next){
    var scannedID = req.query['id']
    var doorID = req.query['did']
    var PIN = req.query['PIN']
    var MAC = req.query['MAC']

    var query  = JSON.stringify(req.query)
    if(query.includes(";")) {
        return next(error(401, 'Not allowed characters in request'))
    }
        
    if (!scannedID) return next(error(401, 'ID required'));
    if (!doorID) return next(error(401, 'Door ID required'));
    if (!doorID) return next(error(401, "MAC required"))
    if (!PIN) return next(error(401, "PIN required"))
    var admin = await getAdmin(scannedID)
        var verifiedPIN = await checkPIN(scannedID, PIN)
        if(verifiedPIN.status == 200) {
        if(admin.status != 200) {
        var permission = await getPerms(scannedID, doorID)
        if(permission.status != 200) {
            res.status(401)
        }
        }
        } else {
            res.status(401)
        }
    var json = await getID(scannedID)
    var response = JSON.stringify(json)
    if(json.status == 200) {
        res.status(200)
        var loggaddition = Date.now() + " " + json.firstname + " " + json.lastname + " opened door " + doorID + ", \n"
        log(loggaddition)
    } else if (json.status == 401) {
        res.status(401)
    } else  if (json.status == 0) {
        res.status(408)
    }
        
})

module.exports = router