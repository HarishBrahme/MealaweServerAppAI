const express = require('express');
const service = require('../service/marketPlaceMainOrder.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');
const processLockService = require('./../service/processLock.service');

router.get('/getMarketPlaceMainOrderByOrderNo/:orderNo', userAuthMiddleware, async (req, res) => {
    try {
        const orderNo = req.params.orderNo;
        if (orderNo) {
            const orderList = await service.getMarketPlaceMainOrderByOrderNo(orderNo);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerPastOrders foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getMarketPlaceMainOrdersCount', userAuthMiddleware, async (req, res) => {
    try {
        const orderList = await service.getMarketPlaceMainOrdersCount();
        responsehanlder.success200(req, res, orderList);
    } catch (error) {
        console.log('getCustomerPastOrders foodroute error==>', error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getMarketPlaceMainOrdersList/:status/:page/:limit', userAuthMiddleware, async (req, res) => {
    try {
        const status = req.params.status;
        const page = req.params.page;
        const limit = req.params.limit;
        if (status && page && limit) {
            const orderList = await service.getMarketPlaceMainOrdersList(status, page, limit);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerPastOrders foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/updateMarketPlaceMainAndItemOrder', userAuthMiddleware, async (req, res) => {
    try {
        const order = await service.updateMarketPlaceMainAndItemOrder(req.body);
        responsehanlder.success200(req, res, order);
    } catch (error) {
        console.log('updateMarketPlaceMainAndItemOrder error==>', error);
        responsehanlder.hasError500(res);
    }
});

router.post('/updateMarketPlaceMainAndItemOrderInfo/:orderNo/:msg', userAuthMiddleware, async (req, res) => {
    try {
        const orderNo = req.params.orderNo;
        const msg = req.params.msg;
        if (orderNo && msg) {
            const order = await service.updateMarketPlaceMainAndItemOrderInfo(orderNo, msg, req.body);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }

    } catch (error) {
        console.log('updateMarketPlaceMainAndItemOrder error==>', error);
        responsehanlder.hasError500(res);
    }
});

router.post('/searchMarketPlaceMainOrderList/:page', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        const page = req.params.page;
        if (searchObj && page) {
            const orderList = await service.searchMarketPlaceMainOrderList(searchObj, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('searchMarketPlaceMainOrderList', error);
        responsehanlder.hasError500(res);
    }
});

router.post('/getMarketPlaceMainOrdersByDateRange', adminAuthMiddleware, async (req, res) => {
    try {
        const { fromDate, toDate } = req.body;
        if (fromDate && toDate) {
            const orderList = await service.getMarketPlaceMainOrdersByDateRange(fromDate, toDate);
            responsehanlder.success200(req, res, orderList);
        } else {
            responsehanlder.hasError402(res, 'Invalid fromDate or toDate');
        }
    } catch (error) {
        console.log('getMarketPlaceMainOrdersByDateRange error =>', error);
        responsehanlder.hasError500(res);
    }
 });
 

module.exports = router;