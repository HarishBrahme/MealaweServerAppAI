const express = require('express');
const service = require('../service/dishSuggestion.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { kitchenAuthMiddleware, userAuthMiddleware, adminAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/saveDishList', kitchenAuthMiddleware, async (req, res) => {
    try {
        if (req.body) {
            const savedDish = await service.saveDishList(req.body);
            responsehanlder.success200(req, res, savedDish);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log('saveDishList dishSuggestion.route.js error ==>',error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getDishList/:pageNumber', userAuthMiddleware, async (req, res) => {
    try {
        const pageNumber = req.params.pageNumber;
        if (pageNumber) {
            const dishList = await service.getDishList(pageNumber);
            responsehanlder.success200(req, res, [...dishList]);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log('getDishList dishSuggestion.route.js error ==>',error);
        responsehanlder.hasError500(res);
    }
});
router.put('/dishacknowledge/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const update = await service.acknowledge(id);
            responsehanlder.success200(req, res, update);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log('acknowledgedishSuggestion.route.js error ==>',error);
        responsehanlder.hasError500(res);
    }
});
module.exports = router;
