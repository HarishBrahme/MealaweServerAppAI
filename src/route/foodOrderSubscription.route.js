const express = require('express');
const service = require('../service/foodOrderSubscription.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const upload = require('../util/image-handler');
const { kitchenAuthMiddleware, userAuthMiddleware, adminAuthMiddleware } = require('../util/auth-middleware-jwt');
const processLockService = require('./../service/processLock.service');

router.get('/getCustomerSubscriptionList/:customerId/:page', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const page = req.params.page;
        if (customerId && page) {
            const orderList = await service.getCustomerSubscriptionList(customerId, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerSubscriptionList foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getOrderSubscription/:orderId', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.orderId;
        if (customerId) {
            const orderList = await service.getOrderSubscription(customerId)
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerSubscriptionList foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getKitchenSubDashboardCount/:kitchenId/:clientDate/:onlyCount', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        const clientDate = req.params.clientDate;
        const onlyCount = req.params.onlyCount;
        if (kitchenId && clientDate && onlyCount) {
            const orderCount = await service.getKitchenSubDashboardCount(kitchenId, clientDate, onlyCount);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderSubscription.route.js getKitchenSubDashboardCount error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/checkSubOrderValidForKitchen/:id/:currentStatus', kitchenAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const currentStatus = req.params.currentStatus;
        if (id && currentStatus) {
            const result = await service.checkSubOrderValidForKitchen(id, currentStatus);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodOrderSubscription.route.js checkSubOrderValidForKitchen error ==> ',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/acceptSubscriptionOrder', kitchenAuthMiddleware, async (req, res) => {
    let processObj;
    try {
        const foodOrder = req.body;
        if (foodOrder) {
            processObj = await processLockService.saveProcessLock('UPDATE_SUB_FOOD_ORDER_' + foodOrder._id);
            const orderdetail = await service.acceptSubscriptionOrder(foodOrder);
            await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req, res, orderdetail)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        if (processObj && processObj._id) {
            processLockService.deleteProcessLock(processObj._id);
        }
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
router.post('/updateSubscriptionFoodOrder', kitchenAuthMiddleware, async (req, res) => {
    let processObj;
    try {
        const foodOrder = req.body;
        if (foodOrder) {
            processObj = await processLockService.saveProcessLock('UPDATE_SUB_FOOD_ORDER_' + foodOrder._id);
            const orderdetail = await service.updateOrderSubscription(foodOrder);
            await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req, res, orderdetail)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        if (processObj && processObj._id) {
            processLockService.deleteProcessLock(processObj._id);
        }
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getKitchenPastSubscriptionOrders/:id/:page', kitchenAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const page = req.params.page;
        if (id && page) {
            const result = await service.getKitchenPastSubscriptionOrders(id, page);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodOrderSubscription.route.js getKitchenPastSubscriptionOrders error ==> ',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getCurrentSubscriptionCount/:clientDate', adminAuthMiddleware, async (req, res) => {
    try {
        const clientDate = req.params.clientDate;
        if (clientDate) {
            const orderCount = await service.getCurrentSubscriptionCount(clientDate);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderSubscription.route.js getCurrentSubscriptionCount error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getClusterCurrentSubscriptionCount', adminAuthMiddleware, async (req, res) => {
    try {
        const clusterList = req.body.clusterList;
        if (clusterList) {
            const orderCount = await service.getClusterCurrentSubscriptionCount(clusterList);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderSubscription.route.js getCurrentSubscriptionCount error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getCurrentSubOrdersList/:clientDate/:page/:limit/:status', adminAuthMiddleware, async (req, res) => {
    try {
        const clientDate = req.params.clientDate;
        const page = req.params.page;
        const status = req.params.status;
        const limit = req.params.limit;
        if (clientDate && page && status && limit) {
            const orderCount = await service.getCurrentSubOrdersList(status, clientDate, page, limit);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderSubscription.route.js getCurrentSubOrdersList error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/resecheduleSubscriptionOrder/:orderDate/:foodOrderId/:subscriptionOrderId', userAuthMiddleware, async (req, res) => {
    try {
        const orderDate = req.params.orderDate;
        const foodOrderId = req.params.foodOrderId;
        const subscriptionOrderId = req.params.subscriptionOrderId;
        if (orderDate && foodOrderId && subscriptionOrderId) {
            const updatedOrder = await service.resecheduleSubscriptionOrder(subscriptionOrderId, foodOrderId, orderDate);
            responsehanlder.success200(req, res, updatedOrder)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderSubscription.route.js resecheduleSubscriptionOrder error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/performSubscriptionOrderTransfer', adminAuthMiddleware, async (req, res) => {
    try {
        const payload = req.body;
        if (payload && payload._id) {
            const order = await service.performSubscriptionOrderTransfer(payload);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('performSubscriptionOrderTransfer error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getSubscriptionRefundOrders', adminAuthMiddleware, async (req, res) => {
    try {
        const order = await service.getSubscriptionRefundOrders();
        responsehanlder.success200(req, res, order)
    } catch (error) {
        // console.log('getSubscriptionRefundOrders error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/searchSubscriptionFoodOrderList/:page', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        const page = req.params.page;
        if (searchObj && page) {
            const orderList = await service.searchSubscriptionFoodOrderList(searchObj, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

module.exports = router;