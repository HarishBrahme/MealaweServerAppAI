const express = require('express');
const service = require('../service/testUser.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/createKitchenTestUser', adminAuthMiddleware, async (req, res) => {
    try {
        const payload = req.body;
        // console.log('createKitchenTestUser ',payload);
        if (payload) {
            const user = await service.createKitchenTestUser(payload);
            responsehanlder.success200(req, res, user);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('createKitchenTestUser',error);
        responsehanlder.hasError500(res)
    }
});

module.exports = router;