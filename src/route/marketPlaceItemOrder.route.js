const express = require('express');
const service = require('../service/marketPlaceItemOrder.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');
const processLockService = require('./../service/processLock.service');

router.post('/updateMarketPlaceItemOrderStatus', userAuthMiddleware, async (req, res) => {
    try {
        const ids = req.body.ids;
        const status = req.body.status;
        if (ids && status) {
            const firstOrder = ids[0];
            const processObj = await processLockService.saveProcessLock('UPDATE_MARKET_PLACE_ITEM_ORDER_' + firstOrder);
            const orderdetail = await service.updateOrderStatus(ids, status, req.body);
            await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req, res, orderdetail)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/updateMarketPlaceItemOrder', userAuthMiddleware, async (req, res) => {
    try {
        const marketPlaceItemOrder = req.body;
        if (marketPlaceItemOrder) {
            const processObj = await processLockService.saveProcessLock('UPDATE_MARKETPLACE_ITEM_ORDER_' + marketPlaceItemOrder._id);
            const orderdetail = await service.updateMarketPlaceItemOrder(marketPlaceItemOrder);
            await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req, res, orderdetail)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        console.log('updateMarketPlaceItemOrder error==>', error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getCustomerMarketPlaceItemPastOrders', userAuthMiddleware, async (req, res) => {
    try {
        const orderList = await service.getCustomerPastOrders(req.body);
        responsehanlder.success200(req, res, orderList)
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getCustomerMarketPlaceItemPastOrders/:customerId/:page', userAuthMiddleware, async (req, res) => {
    try {
        if (req.params.customerId && req.params.page) {
            const body = {
                customerId: req.params.customerId,
                pageNumber: Number(req.params.page),
                status: ''
            }
            const orderList = await service.getCustomerPastOrders(body);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getCustomerMarketPlaceItemOpenOrders/:customerId/:page', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const page = req.params.page;
        if (customerId && page) {
            const orderList = await service.getCustomerMarketPlaceItemOpenOrders(customerId, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getMarketPlaceItemOrderByOrderNo/:orderNo', userAuthMiddleware, async (req, res) => {
    try {
        const orderNo = req.params.orderNo;
        if (orderNo) {
            const orderList = await service.getMarketPlaceItemOrderByOrderNo(orderNo);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getMarketPlaceItemOrdersCount', userAuthMiddleware, async (req, res) => {
    try {
        const orderList = await service.getMarketPlaceItemOrdersCount();
        responsehanlder.success200(req, res, orderList);
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getMarketPlaceItemOrdersCountByInventory/:id', userAuthMiddleware, async (req, res) => {
    try {
        const inventoryId = req.params.id;
        const orderList = await service.getMarketPlaceItemOrdersCountByInventory(inventoryId);
        responsehanlder.success200(req, res, orderList);
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getMarketPlaceItemOrdersList/:status/:page/:limit', userAuthMiddleware, async (req, res) => {
    try {
        const status = req.params.status;
        const page = req.params.page;
        const limit = req.params.limit;
        if (status && page && limit) {
            const orderList = await service.getMarketPlaceItemOrdersList(status, page, limit);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getMarketPlaceItemOrdersListByInventoryId/:id/:status/:page/:limit', userAuthMiddleware, async (req, res) => {
    try {
        const status = req.params.status;
        const page = req.params.page;
        const limit = req.params.limit;
        const inventoryId = req.params.id;
        if (status && page && limit && inventoryId) {
            const orderList = await service.getMarketPlaceItemOrdersListByInventoryId(status, page, limit, inventoryId);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/getrecentOrders/:id', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.id;
        if (customerId) {
            const Orders = await service.getrecentOrders(customerId);
            responsehanlder.success200(req, res, Orders);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.post('/updateAllItemOrdersInfo/:orderNo/:msg', userAuthMiddleware, async (req, res) => {
    try {
        const orderNo = req.params.orderNo;
        const msg = req.params.msg;
        if (orderNo && msg) {
            const order = await service.updateAllItemOrdersInfo(orderNo, msg, req.body);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }

    } catch (error) {
        console.log('updateMarketPlaceMainAndItemOrder error==>', error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getCombineOrderForDelivery/:status', userAuthMiddleware, async (req, res) => {
    try {
        const status = req.params.status;
        if (status) {
            const orderList = await service.getCombineOrderForDelivery(status);
            responsehanlder.success200(req, res, orderList);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('getCombineOrderForDelivery error==>', error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getCombineOrderForDeliveryByInventoryId/:status/:id', userAuthMiddleware, async (req, res) => {
    try {
        const status = req.params.status;
        const inventoryId = req.params.id;
        if (status) {
            const orderList = await service.getCombineOrderForDeliveryByInventoryId(status, inventoryId);
            responsehanlder.success200(req, res, orderList);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('getCombineOrderForDelivery error==>', error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getLastUnratedNavmoolDeliveredOrderList/:customerId', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId
        if (customerId) {
            const order = await service.getLastUnratedNavmoolDeliveredOrderList(customerId);
            responsehanlder.success200(req, res, { order })
        }
        else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.put('/updateNavmoolFeedbackstatus/:id', userAuthMiddleware, async (req, res) => {
    try {
        if (req && req.params && req.params.id) {
            const result = await service.updateNavmoolFeedbackstatus(req.params.id);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/updateStandAloneShipment', userAuthMiddleware, async (req, res) => {
    try {
        const body = req.body;
        const orderNo = body.orderNo;
        if (orderNo) {
            const order = await service.updateStandAloneShipment(body);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }

    } catch (error) {
        console.log('updateStandAloneShipment error==>', error);
        responsehanlder.hasError500(res);
    }
});

router.post('/cancelMarketPlaceItemOrder', userAuthMiddleware, async (req, res) => {
    try {
        const order = await service.cancelMarketPlaceItemOrder(req.body);
        responsehanlder.success200(req, res, order);
    } catch (error) {
        console.log('cancelMarketPlaceItemOrder error==>', error);
        responsehanlder.hasError500(res);
    }
});

router.post('/searchMarketPlaceItemOrderList/:page', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        const page = req.params.page;
        if (searchObj && page) {
            const orderList = await service.searchMarketPlaceItemOrderList(searchObj, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('searchMarketPlaceItemOrderList', error);
        responsehanlder.hasError500(res);
    }
});

module.exports = router;