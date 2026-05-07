const express = require('express');
const service = require('../service/orderBooking.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/saveOrderBooking', userAuthMiddleware, async (req, res) => {
    try {
        const orderBooking = req.body;
        if (orderBooking) {
            const savedOrderBooking = await service.saveOrderBooking(orderBooking);
            responsehanlder.success200(req, res, savedOrderBooking)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('saveOrderBooking error ',error);
        responsehanlder.hasError500(res)
    }
});
router.post('/updateOrderBooking', adminAuthMiddleware, async (req, res) => {
    try {
        const orderBooking = req.body;
        if (orderBooking) {
            const updatedOrderBooking = await service.updateOrderBooking(orderBooking);
            responsehanlder.success200(req, res, updatedOrderBooking)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('updateOrderBooking error ',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/searchOrderBookingList/:page', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        const page = req.params.page;
        if (searchObj && page) {
            const orderList = await service.searchOrderBookingList(searchObj, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/isSpecialOrderBooked/:customerId/:specialMenuId', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const specialMenuId = req.params.specialMenuId;
        if (customerId && specialMenuId) {
            const status = await service.isSpecialOrderBooked(customerId, specialMenuId);
            responsehanlder.success200(req, res, status)
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

module.exports = router;
