const express = require('express');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const service = require('./../service/todaysMenu.service')
const { kitchenAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/todaysMenu/:id/:clientDate', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        const clientDate = req.params.clientDate;
        if (kitchenId && clientDate) {
            const result = await service.getTodaysMenu(kitchenId, clientDate);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError500(res, 'kitchen id not present')
        }

    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.post('/saveTodaysMenu', kitchenAuthMiddleware, async (req, res) => {
    try {
        const todaysMenu = req.body;
        if (todaysMenu) {
            const result = await service.saveTodaysMenu(todaysMenu);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('todaysMenu.route /saveTodaysMenu ==> ',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/updateTodaysMenu/:id', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.id;
        const todaysMenu = req.body;
        if (kitchenId && todaysMenu) {
            const result = await service.updateTodaysMenu(kitchenId, todaysMenu);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }

    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.post('/updateQuantityAvailable/:id', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.id;
        const itemList = req.body;
        if (kitchenId && itemList) {
            const result = await service.updateQuantityAvailable(kitchenId, itemList);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }

    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.post('/validateDailyFoodOrder/:clientDayStartTime', userAuthMiddleware, async (req, res) => {
    try {
        const clientDayStartTime = req.params.clientDayStartTime;
        if (req && req.body && clientDayStartTime) {
            const result = await service.validateDailyFoodOrder(req.body, clientDayStartTime);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

module.exports = router;
