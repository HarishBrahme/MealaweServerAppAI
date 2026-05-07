const express = require('express');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const service = require('./../service/marketPlaceInventoryItemHistory.service')
const { userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/getInventoryItemHistory/:inventoryId/:page', userAuthMiddleware, async (req, res) => {
    try {
        const inventoryId = req.params.inventoryId;
        const page = req.params.page;
        if (inventoryId && page) {
            const result = await service.getInventoryItemHistory(inventoryId, page);
            responsehanlder.success200(req, res, [...result])
        } else {
            responsehanlder.hasError500(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

module.exports = router;