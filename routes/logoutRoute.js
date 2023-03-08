const express = require('express')
const router = express.Router()

router.get("/", function(req, res ) {
    req.session.loggedin = false
    req.session.username = ""
    req.session.userid = ""
    res.redirect('/')
})
module.exports = router