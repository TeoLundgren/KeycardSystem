const express = require('express')
const router = express.Router()

const {getAdmin, getUsers} = require('../utils/getCommands')

router.use("/", async function(req, res, next){ 
    var admin = req.query['admin']
    var sortby = req.query['sortby']

    var query  = JSON.stringify(req.query)
    if(query.includes(";")) {
        return next(error(401, 'Not allowed characters in request'))
    }
    
    if (!admin) return next(error(401, 'Admin login needed'));
    
    var response = await getAdmin(admin)
    var users = await getUsers(sortby)
    if(response.status != 200) {
        console.log("Access Denied")
        res.status(401)
    } else {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(users))
    }
})


module.exports = router