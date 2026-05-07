const express = require('express');
const passport = require('passport');
const service = require('../service/authAdmin.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const jwt = require('jsonwebtoken');
const { getLocalDate } = require('../util/date-util');
const { logoutMiddleware } = require('../util/auth-middleware-jwt');

router.post('/loginAdmin', async (req, res) => {
    try {
        const adminId = req.body.adminId;
        if (adminId) {
            const result = await service.loginAdmin(adminId);
            console.log('loginAdmin result', result);
            if (result.status) {
                responsehanlder.success200(req, res, { status: result.status })
            } else {
                if (result.msg) {
                    responsehanlder.hasError402(res, result.msg);
                } else {
                    responsehanlder.hasError402(res, 'admin not registered');
                }
            }
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res, error)
    }
});
router.post('/verifyOTP', (req, res) => {
    passport.authenticate('local.admin', (err, admin, info) => {
        if (err) {
            responsehanlder.hasError500(res)
        }
        if (admin) {
            if (admin.attempts < 5) {
                const issuedTime = (new Date()).getTime();
                const token = jwt.sign({ _id: admin._id, type: 'Admin', issuedTime }, process.env.JWT_SECRET);
                //save token here
                service.saveToken(admin.adminId, token);
                service.getDeskDyneAdminToken().then(ddToken => {
                    responsehanlder.success200(req, res, { loginInfo: { adminId: admin.adminId, phoneNo: admin.phoneNo }, token, ddToken });
                });
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
            service.increaseAttempt(info.adminId, attempts);
            responsehanlder.hasError503(res, '105')
        }
    })(req, res)
});
router.get('/logout', logoutMiddleware, (req, res) => {
    service.deleteToken(req.id);
    req.logout();
    responsehanlder.success200(req, res, { status: 'logout' });
});

module.exports = router;