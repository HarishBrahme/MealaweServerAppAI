
const express = require('express');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware, openAuthMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { sendWelcomeVideo, sendLowRatingCustomerMessage } = require('../util/whatsapp/whatsapp.service');

router.post('/sendWelcomeVideo', async (req, res) => {
    try {
        const { phoneNo, isKota } = req.body || {};
        if (!phoneNo) {
            return responsehanlder.success200(req, res, { status: 'error', message: 'Missing required field: phoneNo', });
        }
        const response = await sendWelcomeVideo(phoneNo, isKota);
        return responsehanlder.success200(req, res, { status: 'success', data: response });
    } catch (error) {
        console.error('❌ Error in /sendWelcomeVideo:', error);
        return responsehanlder.success200(req, res, { status: 'error', message: error.message || 'Unexpected error occurred.' });
    }
});

router.post('/sendLowRatingCustomerMessage', async (req, res) => {
    try {
        const { phoneNo, userName } = req.body || {};
        if (!phoneNo) {
            return responsehanlder.success200(req, res, { status: 'error', message: 'Missing required field: phoneNo', });
        }
        const response = await sendLowRatingCustomerMessage(phoneNo, userName);
        return responsehanlder.success200(req, res, { status: 'success', data: response });
    } catch (error) {
        console.error('❌ Error in /sendWelcomeVideo:', error);
        return responsehanlder.success200(req, res, { status: 'error', message: error.message || 'Unexpected error occurred.' });
    }
});


module.exports = router;