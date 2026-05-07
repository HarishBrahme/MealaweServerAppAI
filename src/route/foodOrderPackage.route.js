const express = require('express');
const service = require('../service/foodOrderPackage.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { kitchenAuthMiddleware, userAuthMiddleware, adminAuthMiddleware, commonAuthMiddleware } = require('../util/auth-middleware-jwt');
const processLockService = require('./../service/processLock.service');

router.get('/getCustomerPackageList/:customerId/:page', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const page = req.params.page;
        if (customerId && page) {
            const orderList = await service.getCustomerPackageList(customerId, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerPackageList foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getOrderPackage/:orderId', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.orderId;
        if (customerId) {
            const orderList = await service.getOrderPackage(customerId)
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerPackageList foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getKitchenSubDashboardCount/:kitchenId/:onlyCount', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        const onlyCount = req.params.onlyCount;
        if (kitchenId && onlyCount) {
            const orderCount = await service.getKitchenSubDashboardCount(kitchenId, onlyCount);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderPackage.route.js getKitchenSubDashboardCount error =>',error);
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
        // console.log('foodOrderPackage.route.js checkSubOrderValidForKitchen error ==> ',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/createDailyPackageOrder', kitchenAuthMiddleware, async (req, res) => {
    let processObj;
    try {
        const foodOrder = req.body;
        if (foodOrder) {
            processObj = await processLockService.saveProcessLock('UPDATE_PACKAGE_FOOD_ORDER_' + foodOrder._id);
            const orderdetail = await service.createDailyPackageOrder(foodOrder);
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
router.post('/updatePackageFoodOrder', kitchenAuthMiddleware, async (req, res) => {
    let processObj;
    try {
        const foodOrder = req.body;
        if (foodOrder) {
            processObj = await processLockService.saveProcessLock('UPDATE_PACKAGE_FOOD_ORDER_' + foodOrder._id);
            const orderdetail = await service.updateOrderPackage(foodOrder);
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

router.get('/getKitchenPastPackageOrders/:id/:page', kitchenAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const page = req.params.page;
        if (id && page) {
            const result = await service.getKitchenPastPackageOrders(id, page);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodOrderPackage.route.js getKitchenPastPackageOrders error ==> ',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getCurrentPackageCount', adminAuthMiddleware, async (req, res) => {
    try {
        const orderCount = await service.getCurrentPackageCount();
        responsehanlder.success200(req, res, orderCount);
    } catch (error) {
        // console.log('foodOrderPackage.route.js getCurrentPackageCount error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getClusterCurrentPackageCount', adminAuthMiddleware, async (req, res) => {
    try {
        const clusterList = req.body.clusterList;
        if (clusterList) {
            const orderCount = await service.getClusterCurrentPackageCount(clusterList);
            responsehanlder.success200(req, res, orderCount);
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderPackage.route.js getCurrentPackageCount error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getCurrentPackageOrdersList/:page/:limit/:status', adminAuthMiddleware, async (req, res) => {
    try {
        const page = req.params.page;
        const status = req.params.status;
        const limit = req.params.limit;
        if (page && status && limit) {
            const orderCount = await service.getCurrentPackageOrdersList(status, page, limit);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderPackage.route.js getCurrentPackageOrdersList error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getClusterCurrentPackageOrdersList/:page/:limit/:status', adminAuthMiddleware, async (req, res) => {
    try {
        const clusterList = req.body.clusterList;
        const page = req.params.page;
        const status = req.params.status;
        const limit = req.params.limit;
        if (clusterList && page && status && limit) {
            const orderCount = await service.getCurrentPackageOrdersList(status, page, limit, clusterList);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderPackage.route.js getCurrentPackageOrdersList error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/resechedulePackageOrder/:orderDate/:foodOrderId/:packageOrderId', commonAuthMiddleware, async (req, res) => {
    try {
        const orderDate = req.params.orderDate;
        const foodOrderId = req.params.foodOrderId;
        const packageOrderId = req.params.packageOrderId;
        let body ={
            updatedBy : req.body.updatedBy,
            updateByType : req.body.updateByType
        }
        
        if (orderDate && foodOrderId && packageOrderId) {
            const updatedOrder = await service.resechedulePackageOrder(packageOrderId, foodOrderId, orderDate,body);
            responsehanlder.success200(req, res, updatedOrder)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderPackage.route.js resechedulePackageOrder error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/checkRescheduleConflict/:packageOrderId/:orderDate/:mealType', userAuthMiddleware, async (req, res) => {
    try {
        const packageOrderId = req.params.packageOrderId;
        const orderDate = req.params.orderDate;
        const mealType = req.params.mealType;
        if (packageOrderId && orderDate && mealType) {
            const result = await service.checkRescheduleConflict(packageOrderId, orderDate, mealType);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderPackage.route.js checkRescheduleConflict error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/changeMealTypeAndDatePackageOrder/:mealType/:foodOrderId/:orderDate/:packageOrderId', userAuthMiddleware, async (req, res) => {
    try {
        const mealType = req.params.mealType;
        const foodOrderId = req.params.foodOrderId;
        const packageOrderId = req.params.packageOrderId;
        const orderDate = req.params.orderDate;
        const slot = req.body.slot;
        // console.log(mealType,foodOrderId,packageOrderId)
        if (mealType && foodOrderId && packageOrderId && slot) {
            const updatedOrder = await service.changeMealTypeAndDatePackageOrder(packageOrderId, foodOrderId, mealType, slot, orderDate, req.body);
            if (updatedOrder && updatedOrder._id) {
                responsehanlder.success200(req, res, updatedOrder)
            }
            else {
                responsehanlder.hasError503(res, '106')
            }
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderPackage.route.js changeMealTypePackageOrder error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/changeMealTypePackageOrder/:mealType/:foodOrderId/:orderDate/:packageOrderId', commonAuthMiddleware, async (req, res) => {
    try {
        const mealType = req.params.mealType;
        const foodOrderId = req.params.foodOrderId;
        const packageOrderId = req.params.packageOrderId;
        const slot = req.body.slot;
        const orderDate = req.params.orderDate;
        if (mealType && foodOrderId && packageOrderId && slot) {
            const updatedOrder = await service.changeMealTypeAndDatePackageOrder(packageOrderId, foodOrderId, mealType, slot, orderDate, req.body);
            responsehanlder.success200(req, res, updatedOrder)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderPackage.route.js changeMealTypePackageOrder error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/changeMealTypeFromAdmin/:mealType/:foodOrderId/:packageOrderId', userAuthMiddleware, async (req, res) => {
    try {
        const mealType = req.params.mealType;
        const foodOrderId = req.params.foodOrderId;
        const packageOrderId = req.params.packageOrderId;
        const slot = req.body.slot;
        
        // console.log(mealType,foodOrderId,packageOrderId)
        if (mealType && foodOrderId && packageOrderId && slot) {
            const updatedOrder = await service.changeMealTypePackageOrder(packageOrderId, foodOrderId, mealType, slot, req.body);
            responsehanlder.success200(req, res, updatedOrder)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodOrderPackage.route.js changeMealTypePackageOrder error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/performPackageOrderTransfer', adminAuthMiddleware, async (req, res) => {
    try {
        const payload = req.body;
        if (payload && payload._id) {
            const order = await service.performPackageOrderTransfer(payload);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('performPackageOrderTransfer error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getPackageRefundOrders', adminAuthMiddleware, async (req, res) => {
    try {
        const order = await service.getPackageRefundOrders();
        responsehanlder.success200(req, res, order)
    } catch (error) {
        // console.log('getPackageRefundOrders error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/searchPackageFoodOrderList/:page', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        const page = req.params.page;
        if (searchObj && page) {
            const orderList = await service.searchPackageFoodOrderList(searchObj, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/woocommerce_callback/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // console.log('woocommerce_callback',id);
        if (id) {
            await getWooCommerceMealOneOrder(id);
            responsehanlder.success200(req, res, { msg: 'Thanks for letting us know.' })
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('woocommerce_callback error',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getSubscriptionEndDetails', async (req, res) => {
    try {
        const order = await service.getSubscriptionEndDetails();
        responsehanlder.success200(req, res, order)
    } catch (error) {
        // console.log('getSubscriptionEndDetails error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getOrderPackageByOrderNo/:orderNo', userAuthMiddleware, async (req, res) => {
    try {
        const orderNo = req.params.orderNo;
        if (orderNo) {
            const orderList = await service.getOrderPackageByOrderNo(orderNo)
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getOrderPackageByOrderNo foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getCustomerPastOrderInfo/:customerId', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        if (customerId) {
            const count = await service.getCustomerPastOrderInfo(customerId)
            responsehanlder.success200(req, res, { count })
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerPastOrderInfo foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});


router.get('/getCustomerPastSubscriptionInfo/:customerId', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        if (customerId) {
            const count = await service.getCustomerPastSubscriptionInfo(customerId)
            responsehanlder.success200(req, res, { count })
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerPastOrderInfo foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getCustomerPastTrialOrderCount/:customerId', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        if (customerId) {
            const count = await service.getCustomerPastTrialOrderCount(customerId)
            responsehanlder.success200(req, res, { count })
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerPastTrialOrderCount foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/exportFoodOrderPackageList', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const orderList = await service.exportFoodOrderPackageList(searchObj);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/exportActiveUserActiveOrders', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const orderList = await service.exportActiveUserActiveOrders(searchObj);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/exportPaymentFailedOrderList', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const orderList = await service.exportPaymentFailedOrderList(searchObj);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/checkForFreePlantation/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const result = await service.checkForFreePlantation(id);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodOrderPackage.route.js checkForFreePlantation error ==> ',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/updatePackageRouteInfo/:foodOrderId', userAuthMiddleware, async (req, res) => {
    try {
        const foodOrderId = req.params.foodOrderId;
        const routeNo = req.body.routeNo;
        const routeRank = req.body.routeRank;

        const DinnerrouteNo = req.body.DinnerrouteNo;
        const DinnerrouteRank = req.body.DinnerrouteRank;

        const LunchrouteNo = req.body.LunchrouteNo;
        const LunchrouteRank = req.body.LunchrouteRank;
        if (foodOrderId && ((routeNo && routeRank)) || (DinnerrouteNo && DinnerrouteRank) || (LunchrouteNo && LunchrouteRank)) {
            const orderList = await service.updateRouteInfo(foodOrderId, req.body);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/assignRMtoUserOrder', adminAuthMiddleware, async (req, res) => {
    try {
        const payload = req.body;
        if (payload) {
            const order = await service.assignRMtoUserOrder(payload);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log('assignRMtoUserOrder error ==>', error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getSubscriptionEndDetailsByUserId/:customerId', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        if (customerId) {
            const List = await service.getSubscriptionEndDetailsByUserId(customerId)
            responsehanlder.success200(req, res, { List });
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerPastOrderInfo foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});
router.post('/firstTrialaftersubscription', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const orderList = await service.firstTrialaftersubscription(searchObj);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getFoodOrdersPackageByCustomerEmailThinkowl/:email', commonAuthMiddleware, async (req, res) => {
    try {
        const email = req.params.email;
        if (email) {
            const order = await service.getFoodOrdersPackageByCustomerEmailThinkowl(email);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodorder.route.js getFoodorder error ==> ',error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getChildOrdersStatusByPackageId/:packageId', commonAuthMiddleware, async (req, res) => {
    try {
        const packageId = req.params.packageId;
        if (packageId) {
            const result = await service.getChildOrdersStatusByPackageId(packageId);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
module.exports = router;