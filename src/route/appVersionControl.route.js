const express = require('express');
const service = require('../service/appVersionControl.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const upload = require('../util/image-handler');
const { adminAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/saveAppVersion', adminAuthMiddleware, async (req, res) => {
    try {
        if (req.body) {
            const saved = await service.saveAppVersion(req.body);
            responsehanlder.success200(req, res, saved);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.post('/updateAppVersion', adminAuthMiddleware, async (req, res) => {
    try {
        if (req.body) {
            const updated = await service.updateAppVersion(req.body);
            responsehanlder.success200(req, res, updated);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getAllAppVersionList', adminAuthMiddleware, async (req, res) => {
    try {
        const getAllVersions = await service.getAllAppVersionList();
        responsehanlder.success200(req, res, getAllVersions);
    } catch (error) {   // console.log("Error at appVersionControl.roue.js getAllAppVersionList ==> ",error);
        responsehanlder.hasError500(res);
    }
});

router.get('/gerAppVersion/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const version = await service.gerAppVersion(id);
            responsehanlder.success200(req, res, version);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getAppVersionByName/:appName', async (req, res) => {
    try {
        const appName = req.params.appName;
        if (appName) {
            const version = await service.getAppVersionByName(appName);
            responsehanlder.success200(req, res, version);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

module.exports = router;
