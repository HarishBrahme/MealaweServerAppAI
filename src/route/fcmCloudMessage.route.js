const express = require('express');
const service = require('../service/fcmCloudMessage.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);

router.post('/saveFcmToken', async (req, res) => {
    try {
        if (req.body) {
            const result = await service.saveToken(req.body);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'Invalid request')
        }
    } catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

module.exports = router;