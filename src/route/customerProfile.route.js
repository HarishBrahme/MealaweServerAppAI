const express = require('express');
const service = require('../service/customerProfile.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
var upload = require('../util/image-handler');
const { adminAuthMiddleware, userAuthMiddleware, commonAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/customerProfile', userAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const filename = req.file && req.file.filename ? req.file.filename : null
        const customerProfilesaved = await service.saveNewCustomerProfile(req.body, filename);
        if (customerProfilesaved && customerProfilesaved._id) {
            responsehanlder.success200(req, res, customerProfilesaved);
        } else {
            responsehanlder.hasError401(res, 'Invalid request');
        }

    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getCustomerProfileList', adminAuthMiddleware, async (req, res) => {
    try {
        const getCustomerProfileList = await service.getCustomerProfileList();
        responsehanlder.success200(req, res, getCustomerProfileList)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.get('/getcustomerprofile/:id', userAuthMiddleware, async (req, res) => {
    try {
        const getcustomerprofile = await service.getCustomerProfile(req.params.id);
        responsehanlder.success200(req, res, getcustomerprofile)
    }
    catch (error) {
        responsehanlder.hasError500(res)
    }
});


router.post('/updatecustomerprofile/:id', userAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const filename = req.file && req.file.filename ? req.file.filename : null;
        const updatecustomerprofile = await service.updateCustomerProfile(req.params.id, req.body, filename);
        if (updatecustomerprofile && updatecustomerprofile._id) {
            responsehanlder.success200(req, res, updatecustomerprofile)
        } else {
            responsehanlder.hasError500(res, 'Invalid Request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.post('/updatecustomercurrlocation/:id', userAuthMiddleware, async (req, res) => {
    try {
        if (req.params.id) {
            const updatedProfile = await service.updatecustomerCurrLocation(req.params.id, req.body);
            responsehanlder.success200(req, res, updatedProfile)
        }
        else {
            responsehanlder.hasError500(res, 'Invalid Request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getUserCount', adminAuthMiddleware, async (req, res) => {
    try {
        const result = await service.getUserCount();
        responsehanlder.success200(req, res, { result });
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/validateReferralCode/:installReferrer', userAuthMiddleware, async (req, res) => {
    try {
        const installReferrer = req.params.installReferrer;
        if (installReferrer) {
            const result = await service.validateReferralCode(installReferrer);
            if (result.referralCodeValid) {
                service.updateInstallReferrer(req.loginId, installReferrer);
            }
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.post('/searchUserWithFilter/:page', adminAuthMiddleware, async (req, res) => {
    try {
        const filterObj = req.body;
        const page = req.params.page;
        if (filterObj && page) {
            const result = await service.searchUserWithFilter(filterObj, page);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.put('/updateCouponList/:phoneNo/:couponCode', adminAuthMiddleware, async (req, res) => {
    try {
        const phoneNo = req.params.phoneNo;
        const couponCode = req.params.couponCode;
        if (phoneNo && couponCode) {
            const result = await service.updateCouponList(phoneNo, couponCode);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getCustomerProfileByMobile/:phoneNo', commonAuthMiddleware, async (req, res) => {
    try {
        const phoneNo = req.params.phoneNo;
        if (phoneNo) {
            const result = await service.getCustomerProfileByMobile(phoneNo);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});


router.post('/exportCustomerList', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const orderList = await service.exportCustomerList(searchObj);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.post('/updateUserRMInfo', adminAuthMiddleware, async (req, res) => {
    try {
        const payload = req.body;
        if (payload) {
            const user = await service.updateRMInfo(payload.id, payload.rmInfo);
            responsehanlder.success200(req, res, user)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.post('/updateOrderPlaced', userAuthMiddleware, async (req, res) => {
    try {
        const { customerId, platform } = req.body;

        if (!customerId || !platform) {
            return responsehanlder.hasError402(res, 'invalid request');
        }

        const result = await service.updateOrderPlaced(customerId, platform);
        responsehanlder.success200(req, res, result);

    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

module.exports = router;