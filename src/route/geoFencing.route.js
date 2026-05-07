const express = require('express');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const service = require('./../service/geoFencing.service');
const { adminAuthMiddleware, allAuthMiddleware,kitchenAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/getGeoFencingList', async (req, res) => {
    try {
        const result = await service.getGeoFencingList();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('error while fetching geofencing list',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getAllGeoFencingList', async (req, res) => {
    try {
        const result = await service.getAllGeoFencingList();
        responsehanlder.success200(req, res, result);
    } catch (error) {
        // console.log('error while fetching getAllGeoFencingList list',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/saveGeoFencing', adminAuthMiddleware, async (req, res) => {
    try {
        const geofencing = req.body;
        if (geofencing) {
            const result = await service.saveGeoFencing(geofencing);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.post('/updateGeoFencing/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const geofencing = req.body;
        if (id && geofencing) {
            const result = await service.updateGeoFencing(id, geofencing);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.delete('/deleteGeoFencing/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;;
        if (id) {
            const result = await service.deleteGeoFencing(id);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.put('/activateGeoFencing/:id/:active', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const active = req.params.active;
        if (id && active !== undefined) {
            const result = await service.activateGeoFencing(id, active);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.get('/getclusterDetailsByclusterId/:clusterId', kitchenAuthMiddleware, async (req, res) => {
    try {
        const clusterId = req.params.clusterId;
        if (clusterId  !== undefined) {
            const result = await service.getclusterDetailsByclusterId(clusterId);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

module.exports = router;