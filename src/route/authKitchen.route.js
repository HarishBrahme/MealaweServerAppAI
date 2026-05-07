const express = require('express');
const passport = require('passport');
const service = require('../service/authKitchen.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const jwt = require('jsonwebtoken');

router.post('/loginKitchen', async (req, res) => {
    try {
        const kitchenId = req.body.kitchenId;
        if (kitchenId) {
            const result = await service.loginKitchen(kitchenId);
            if (result.status) {
                responsehanlder.success200(req, res, { status: result.status })
            } else {
                if (result.msg) {
                    responsehanlder.hasError402(res, result.msg);
                } else {
                    responsehanlder.hasError402(res, 'Kitchen not registered');
                }
            }
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res, error)
    }
});
router.post('/verifyOTP', (req, res) => {
    passport.authenticate('local.kitchen', (err, kitchen, info) => {
        try {
            if (err) {
                responsehanlder.hasError500(res)
            }
            if (kitchen) {
                if (kitchen.attempts < 5) {
                    const issuedTime = (new Date()).getTime();
                    const token = jwt.sign({ _id: kitchen._id, type: 'Kitchen', issuedTime }, process.env.JWT_SECRET);
                    service.saveToken(kitchen.kitchenId, token);
                    responsehanlder.success200(req, res, { loginInfo: { kitchenId: kitchen.kitchenId, phoneNo: kitchen.phoneNo }, token });
                } else {
                    responsehanlder.hasError503(res, '107')
                }
            }
            if (info) {
                let attempts = 0;
                if (info.attempts) {
                    attempts = info.attempts;
                }
                attempts++;
                service.increaseAttempt(info.kitchenId, attempts);
                responsehanlder.hasError503(res, '105');
            }
        } catch (error) {
            console.log(error);
            responsehanlder.hasError500(res, error)
        }
    })(req, res)
});
router.get('/logout', (req, res) => {
    req.logout();
    responsehanlder.success200(req, res, { status: 'logout' });
});

module.exports = router;