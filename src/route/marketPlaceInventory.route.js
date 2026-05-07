const express = require('express');
const service = require('../service/marketPlaceInventory.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const upload = require('../util/image-handler');
const { adminAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/saveMarketPlaceInventory', adminAuthMiddleware, async (req, res) => {
    try {
        const inventory = await service.saveMarketPlaceInventory(req.body);
        responsehanlder.success200(req, res, inventory);
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.get('/getMarketPlaceInventory', adminAuthMiddleware, async (req, res) => {
    try {
        const list = await service.getMarketPlaceInventory();
        responsehanlder.success200(req, res, list);
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.get('/getMarketPlaceInventoryById/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const inventory = await service.getMarketPlaceInventoryById(id);
            responsehanlder.success200(req, res, inventory);
        } else {
            responsehanlder.hasError500(res, 'invlaid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
        console.log('getMarketPlaceInventoryById error ==> ', error);
    }
});

router.post('/updateMarketPlaceInventory/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const inventory = await service.updateMarketPlaceInventory(id, req.body);
            responsehanlder.success200(req, res, inventory);
        } else {
            responsehanlder.hasError500(res, 'invlaid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
        console.log('getMarketPlaceInventoryById error ==> ', error);
    }
});

router.delete('/deleteMarketPlaceInventory/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const inventory = await service.deleteMarketPlaceInventory(id);
            responsehanlder.success200(req, res, inventory);
        } else {
            responsehanlder.hasError500(res, 'invlaid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
        console.log('deleteMarketPlaceInventory error ==> ', error);
    }
});

router.get('/getMarketPlaceInventoryByItemId/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const inventory = await service.getMarketPlaceInventoryByItemId(id);
            responsehanlder.success200(req, res, inventory);
        } else {
            responsehanlder.hasError500(res, 'invlaid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
        console.log('getMarketPlaceInventoryByItemId error ==> ', error);
    }
});

router.post('/updateInventoryItemLimit/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const itemInfo = req.body;
        if (id) {
            const inventory = await service.updateInventoryItemLimit(id, itemInfo);
            responsehanlder.success200(req, res, inventory);
        } else {
            responsehanlder.hasError500(res, 'invlaid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
        console.log('getMarketPlaceInventoryByItemId error ==> ', error);
    }
});

module.exports = router;