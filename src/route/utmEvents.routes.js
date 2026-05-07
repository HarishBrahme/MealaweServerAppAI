const express = require('express');
const router = express.Router();
const responseHandler = require('../util/response-handler');
const { decryptMiddleware, adminAuthMiddleware, openAuthMiddleware } = require('../util/auth-middleware-jwt');
const service = require('../service/utm-events.service');

router.use(decryptMiddleware);

router.post('/utmEvents/getAdminData', adminAuthMiddleware, async (req, res) => {
    try {
        const filters = req.body || {};
        const result = await service.getUtmEvents(filters);
        responseHandler.success200(req, res, result);
    } catch (error) {
        console.error('Error fetching admin UTM data:', error);
        responseHandler.hasError500(res);
    }
});

router.post('/utmEvents', openAuthMiddleware, async (req, res) => {
    try {
        const utmEventObj = req.body;
        const savedEvent = await service.saveUtmEvent(utmEventObj);
        responseHandler.success200(req, res, savedEvent);
    } catch (error) {
        console.error('Error saving UTM event:', error);
        responseHandler.hasError500(res);
    }
});

router.get('/utmEvents/:cluster_name?', adminAuthMiddleware, async (req, res) => {
    try {
        const cluster_name = req.params.cluster_name || null;
        const result = await service.getUtmEvents({ clusterName: cluster_name });
        responseHandler.success200(req, res, result);
    } catch (error) {
        console.error('Error fetching cluster UTM events:', error);
        responseHandler.hasError500(res);
    }
});

module.exports = router;