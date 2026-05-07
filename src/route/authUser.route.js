const express = require('express');
const passport = require('passport');
const service = require('../service/authUser.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const jwt = require('jsonwebtoken');
const { checkOTPCountLimit } = require('../util/security-util');

router.post('/registerPhoneNo', async (req, res) => {
    try {
        const phoneNo = req.body.phoneNo;
        const registeredPlatform = req.body.registeredPlatform || 'mealawe_app_ios';
        if (phoneNo) {
            const status = checkOTPCountLimit(phoneNo);
            if (status) {
                const userIsNew = await service.registerUser(phoneNo, registeredPlatform);
                responsehanlder.success200(req, res, { phoneNo, userIsNew })
            } else {
                responsehanlder.hasError500(res, 'Maximum attempt reached please try after 10 mins');
            }
        } else {
            responsehanlder.hasError500(res, 'provide phone No. ');
        }

    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res, error)
    }
});

router.post('/resendOTP', async (req, res) => {
    try {
        const phoneNo = req.body.phoneNo;
        const registeredPlatform = req.body.registeredPlatform || 'mealawe_app_ios';
        if (phoneNo) {
            const status = checkOTPSecurity(phoneNo, false);
            if (status) {
                await service.resendOTP(phoneNo, registeredPlatform);
                responsehanlder.success200(req, res, { phoneNo });
            } else {
                responsehanlder.hasError500(res, 'Maximum attempt reached please try after 10mins');
            }
        } else {
            responsehanlder.hasError500(res, 'provide phone No. ')
        }
    } catch (error) {
        responsehanlder.hasError500(res, error)
    }
});

router.post('/verifyOTP', (req, res) => {
    passport.authenticate('local.user', (err, user, info) => {
        const { registeredPlatform } = req.body;
        if (err) {
            responsehanlder.hasError500(res)
        }
        if (user) {
            const issuedTime = (new Date()).getTime();
            const token = jwt.sign({ _id: user._id, type: 'User', issuedTime }, process.env.JWT_SECRET);
            service.saveToken(user.phoneNo, token, registeredPlatform);
            responsehanlder.success200(req, res, { loginInfo: { phoneNo: user.phoneNo, loginId: user._id }, token });
        }
        if (info) {
            let attempts = 0;
            if (info.attempts) {
                attempts = info.attempts;
            }
            attempts++;
            service.increaseAttempt(info.phoneNo, attempts);
            responsehanlder.hasError503(res, '105');
        }
    })(req, res)
});

router.get('/logout', (req, res) => {
    req.logout();
    responsehanlder.success200(req, res, { status: 'logout' });
});

router.post('/signupUser', async (req, res) => {
    try {
        const phoneNo = req.body.phoneNo;
        const email = req.body.email;
        const registeredPlatform = req.body.registeredPlatform || 'mealawe_app_ios';
        const userName = req.body.userName;
        const installReferrer = req.body.installReferrer
        if (phoneNo && email && userName) {
            const userProfile = await service.signupUser({ phoneNo, email, userName, installReferrer, registeredPlatform });
            responsehanlder.success200(req, res, userProfile)
        } else {
            responsehanlder.hasError500(res, 'invalid request')
        }
    } catch (error) {
        console.log('error while signupUser ', error);
        const msg = error.msg ? error.msg : 'Error while sign up';
        responsehanlder.hasError500(res, msg);
    }
});

module.exports = router;