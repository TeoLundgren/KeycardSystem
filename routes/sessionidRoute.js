const express = require('express')
const router = express.Router()

router.get("/", async function (req, res, next) {
    if (req.session.loggedin) {
        res.end(JSON.stringify({"userid": req.session.userid, "status": 200}))
     } else {
         // Not logged in
         res.status(401)
     }
})
module.exports = router