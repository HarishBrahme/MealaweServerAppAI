const express = require('express');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const path = require('path');
const { userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/homeCheftermNcondition', async (req, res) => {
    try {
        res.render(path.join(__dirname, '../../public/views/homeChef_termAndCondition.ejs'), { serverurl: process.env.SERVER_URL });
    } catch (e) {
        // console.log(e);
        responsehanlder.hasError500(res)
    }
});
router.get('/usertermNcondition', async (req, res) => {
    try {
        res.render(path.join(__dirname, '../../public/views/user_termAndCondition.ejs'), { serverurl: process.env.SERVER_URL });
    } catch (e) {
        // console.log(e);
        responsehanlder.hasError500(res)
    }
});
router.get('/serverlogs/:fileName', userAuthMiddleware, async (req, res) => {
    try {
        const fileName = req.params.fileName;
        const filePath = path.join(__dirname, `../../${fileName}`);
        res.sendFile(filePath)
    } catch (e) {
        // console.log(e);
        responsehanlder.hasError500(res)
    }
})

module.exports = router;