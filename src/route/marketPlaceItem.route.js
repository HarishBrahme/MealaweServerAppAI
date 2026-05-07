const express = require('express');
const router = express.Router();
const service = require('../service/marketPlaceItem.service');
const responseHandler = require('../util/response-handler');
const { decryptMiddleware, adminAuthMiddleware, openAuthMiddleware } = require('../util/auth-middleware-jwt');
const upload = require('../util/image-handler');
router.use(decryptMiddleware);

router.get('/getAllMarketPlaceItem', openAuthMiddleware, async (req, res) => {
    try {
        const list = await service.getAllMarketPlaceItem();
        responseHandler.success200(req, res, list);
    } catch (error) {
        responseHandler.hasError500(res, error);
    }
});

router.get('/getMarketPlaceItemById/:id', openAuthMiddleware, async (req, res) => {
    try {
        const product = await service.getMarketPlaceItemById(req.params.id);
        if (!product) return responseHandler.hasError404(res, 'Item not found');
        responseHandler.success200(req, res, product);
    } catch (error) {
        responseHandler.hasError500(res, error);
    }
});

router.get('/getMarketPlaceItemByPathName/:pathName', openAuthMiddleware, async (req, res) => {
    try {
        const product = await service.getMarketPlaceItemByPathName(req.params.pathName);
        if (!product) return responseHandler.hasError404(res, 'Item not found');
        responseHandler.success200(req, res, product);
    } catch (error) {
        responseHandler.hasError500(res, error);
    }
});

router.get('/getBestsellorItemlist', openAuthMiddleware, async (req, res) => {
    try {
        const list = await service.getBestsellorItemlist();
        responseHandler.success200(req, res, list);
    } catch (error) {
        responseHandler.hasError500(res, error);
    }
});

router.get('/getComboItemList', openAuthMiddleware, async (req, res) => {
    try {
        const items = await service.getComboItemList();
        responseHandler.success200(req, res, items);
    } catch (error) {
        responseHandler.hasError500(res, error);
    }
});

router.get('/searchMarketPlaceItems/:searchTerm', openAuthMiddleware, async (req, res) => {
    try {
        const list = await service.searchMarketPlaceItems(req.params.searchTerm);
        responseHandler.success200(req, res, list);
    } catch (error) {
        responseHandler.hasError500(res, error);
    }
});

router.get('/getMarketPlaceCategoryItem/:category', openAuthMiddleware, async (req, res) => {
    try {
        const list = await service.getMarketPlaceCategoryItem(req.params.category);
        responseHandler.success200(req, res, list);
    } catch (error) {
        responseHandler.hasError500(res, error);
    }
});

router.post('/getMarketPlaceCategoryItem/:category', openAuthMiddleware, async (req, res) => {
    try {
        const list = await service.getMarketPlaceCategoryItem(req.params.category);
        responseHandler.success200(req, res, list);
    } catch (error) {
        responseHandler.hasError500(res, error);
    }
});

router.post('/saveMarketPlaceItem', adminAuthMiddleware, upload.array('image'), async (req, res) => {
    try {
        const files = (req.files && req.files.length > 0) ? req.files : [];
        const marketPlaceItemSaved = await service.saveMarketPlaceItem(req.body, files);
        responseHandler.success200(req, res, marketPlaceItemSaved);
    } catch (error) {
        responseHandler.hasError500(res, error);
        console.log('saveMarketPlaceItem error ==> ', error);
    }
});

router.post('/updateMarketPlaceItem/:id', adminAuthMiddleware, upload.array('image'), async (req, res) => {
    try {
        const marketPlaceItem = req.body;
        const id = req.params.id;
        const files = (req.files && req.files.length > 0) ? req.files : [];
        if (marketPlaceItem && id) {
            const result = await service.updateMarketPlaceItem(id, marketPlaceItem, files);
            responseHandler.success200(req, res, result);
        } else {
            responseHandler.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responseHandler.hasError500(res);
        console.log('updateMarketPlaceItem error ==> ', error);
    }
});

router.post('/updateMarketPlaceItemImage/:id/:index', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const index = Number(req.params.index);
        if (!req.file || isNaN(index)) return responseHandler.hasError402(res, 'Invalid request');
        const updated = await service.updateMarketPlaceItemImage(req.params.id, req.file.filename, index);
        responseHandler.success200(req, res, updated);
    } catch (error) {
        console.log('updateImage error ==> ', error);
        responseHandler.hasError500(res, error);
    }
});

router.delete('/deleteMarketPlaceItem/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const deleted = await service.deleteMarketPlaceItem(req.params.id);
        responseHandler.success200(req, res, deleted);
    } catch (error) {
        responseHandler.hasError500(res, error);
    }
});

router.delete('/deleteMarketPlaceItemImage/:id/:imageUrl', adminAuthMiddleware, async (req, res) => {
    try {
        const deleted = await service.deleteMarketPlaceItemImage(req.params.id, req.params.imageUrl);
        responseHandler.success200(req, res, deleted);
    } catch (error) {
        responseHandler.hasError500(res, error);
    }
});

module.exports = router;