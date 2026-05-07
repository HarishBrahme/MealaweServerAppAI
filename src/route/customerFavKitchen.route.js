const express = require('express');
const service = require('../service/customerFavKitchen.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/getFavKitchenList/:customerId', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        if (customerId) {
            const order = await service.getFavKitchenList(customerId);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('customerFavKitchen.route.js getFavKitchenList error ==> ',error);
        responsehanlder.hasError500(res);
    }
});
router.post('/setFavKitchenList', userAuthMiddleware, async (req, res) => {
    try {
        const payload = req.body;
        if (payload && payload.customerId && payload.favKitchens) {
            const saved = await service.setFavKitchenList(req.body);
            responsehanlder.success200(req, res, saved)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('customerFavKitchen.route.js setFavKitchenList error ==> ',error);
        responsehanlder.hasError500(res)
    }
});
module.exports = router;