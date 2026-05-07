const express = require('express');
const router = express.Router();
const imageGroupConfigService = require('../service/imageGroupConfig.service');
const { adminAuthMiddleware, openAuthMiddleware, decryptMiddleware } = require('../util/auth-middleware-jwt');
const responseHandler = require('../util/response-handler');

router.use(decryptMiddleware);

router.post('/createImageGroupConfig', adminAuthMiddleware, async (req, res) => {
    try {
        const config = await imageGroupConfigService.getImageGroupConfigByName(req.body.name);
        if (config) {
            responseHandler.hasError404(res, 'Image Group Config is Present');
        } else {
            const config1 = await imageGroupConfigService.createImageGroupConfig(req.body);
            responseHandler.success200(req, res, config1);
        }
    } catch (err) {
        responseHandler.hasError500(res, err.message);
    }
});

router.put('/updateImageGroupConfig/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const config = await imageGroupConfigService.updateImageGroupConfig(req.params.id, req.body);
        if (!config) {
            responseHandler.hasError404(res, 'Image Group Config not found');
        } else {
            responseHandler.success200(req, res, config);
        }
    } catch (err) {
        responseHandler.hasError500(res, err.message);
    }
});

router.delete('/deleteImageGroupConfig/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const config = await imageGroupConfigService.deleteImageGroupConfig(req.params.id);
        if (!config) {
            responseHandler.hasError404(res, 'Image Group Config not found');
        } else {
            responseHandler.success200(req, res, config);
        }
    } catch (err) {
        responseHandler.hasError500(res, err.message);
    }
});

router.get('/getAllImageGroupConfigs/:page/:pageSize', adminAuthMiddleware, async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pageSize) || 10;
    try {
        const result = await imageGroupConfigService.getAllImageGroupConfigs(page, pageSize);
        responseHandler.success200(req, res, result);
    } catch (err) {
        responseHandler.hasError500(res, err.message);
    }
});

router.get('/getImageGroupConfigById/:id', openAuthMiddleware, async (req, res) => {
    try {
        const config = await imageGroupConfigService.getImageGroupConfigById(req.params.id);
        if (!config) {
            responseHandler.hasError404(res, 'Image Group Config not found');
        } else {
            responseHandler.success200(req, res, config);
        }
    } catch (err) {
        responseHandler.hasError500(res, err.message);
    }
});

router.get('/getImageGroupConfigByName/:name', openAuthMiddleware, async (req, res) => {
    try {
        const config = await imageGroupConfigService.getImageGroupConfigByName(req.params.name);
        if (!config) {
            responseHandler.success200(req, res, {imageData:[]});
            // responseHandler.hasError404(res, 'Image Group Config not found');
        } else {
            responseHandler.success200(req, res, config);
        }
    } catch (err) {
        responseHandler.hasError500(res, err.message);
    }
});

module.exports = router;