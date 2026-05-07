const express = require('express');
const service = require('../service/foodorder.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const upload = require('../util/image-handler');
const { kitchenAuthMiddleware, userAuthMiddleware, adminAuthMiddleware, commonAuthMiddleware } = require('../util/auth-middleware-jwt');
const processLockService = require('./../service/processLock.service');
const { payServerFoodOrderAmtToKitchenDirect } = require('../util/order-callback-util');

router.get('/getKitchenOrderDetail/:kitchenId/:orderType/:clientDate', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        const orderType = req.params.orderType
        const clientDate = req.params.clientDate;
        if (kitchenId && orderType) {
            const orderdetail = await service.getKitchenOrderDetail(kitchenId, orderType, clientDate);
            console.log({orderdetail});
            
            responsehanlder.success200(req, res, orderdetail);
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.get('/getKitchenSubOrderDetail/:kitchenId/:orderType/:mealType/:clientDate', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        const orderType = req.params.orderType;
        const mealType = req.params.mealType
        const clientDate = req.params.clientDate;
        if (kitchenId && orderType && mealType && clientDate) {
            const orderdetail = await service.getKitchenSubOrderDetail(kitchenId, orderType, mealType, clientDate);
            responsehanlder.success200(req, res, orderdetail);
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.get('/getCustomerOrderDetail/:customerId', async (req, res) => {
    try {
        const customerId = req.params.customerId;
        if (customerId) {
            const orderdetail = await service.getCustomerOrderDetail(customerId);
            responsehanlder.success200(req, res, orderdetail);
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.get('/checkCancelEligibility/:orderId', userAuthMiddleware, async (req, res) => {
    try {
        if (req && req.params.orderId) {
            const { cancelEligibleObj } = await service.checkCancelEligibility(req.params.orderId);
            responsehanlder.success200(req, res, cancelEligibleObj)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('checkCancelEligibility food.route error ==>',error)
        responsehanlder.hasError500(res)
    }
});

router.get('/getKitchenOrdersCount/:kitchenId/:clientDate', kitchenAuthMiddleware, async (req, res) => {
    try {
        const clientDate = req.params.clientDate;
        if (req && req.params && req.params.kitchenId && clientDate) {
            const orderCount = await service.getKitchenOrdersCount(req.params.kitchenId, clientDate);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getLastUnratedDeliveredOrder/:customerId', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId
        if (customerId) {
            const order = await service.getLastUnratedDeliveredOrder(customerId);
            responsehanlder.success200(req, res, { order })
        }
        else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getLastUnratedDeliveredOrderList/:customerId', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId
        if (customerId) {
            const order = await service.getLastUnratedDeliveredOrderList(customerId);
            responsehanlder.success200(req, res, { order })
        }
        else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.post('/updateOrderStatus', kitchenAuthMiddleware, async (req, res) => {
    try {
        const ids = req.body.ids;
        const status = req.body.status;
        if (ids && status) {
            const firstOrder = ids[0];
            const processObj = await processLockService.saveProcessLock('UPDATE_FOOD_ORDER_' + firstOrder);
            const orderdetail = await service.updateOrderStatus(ids, status, req.body);
            await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req, res, orderdetail)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
router.post('/updateFoodOrder', kitchenAuthMiddleware, async (req, res) => {
    try {
        const foodOrder = req.body;
        if (foodOrder) {
            const processObj = await processLockService.saveProcessLock('UPDATE_FOOD_ORDER_' + foodOrder._id);
            const orderdetail = await service.updateFoodOrder(foodOrder);
            await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req, res, orderdetail)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
router.post('/updateRunnerLocation', kitchenAuthMiddleware, async (req, res) => {
    try {
        const { orderId, location } = req.body;
        if (orderId && location && location.lat !== undefined && location.lng !== undefined) {
            const updatedOrder = await service.updateRunnerLocation(orderId, location);
            responsehanlder.success200(req, res, updatedOrder)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/updateRouteInfo', userAuthMiddleware, async (req, res) => {
    try {
        const { foodOrderId, routeNo, routeRank, updatedBy, updateByType, mealType } = req.body;
        
        if (foodOrderId) {
            const updatedOrder = await service.updateRouteInfo(foodOrderId, {
                routeNo,
                routeRank,
                updatedBy,
                updateByType,
                mealType
            });
            responsehanlder.success200(req, res, updatedOrder);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        console.log('error updating route info:', error);
        responsehanlder.hasError500(res);
    }
});
router.post('/updatePendingOrdersProps', adminAuthMiddleware, async (req,res) => {
    try {
        const updateProp = req.body.updateProp;
        const orderIds = req.body.orderIds;
        const updateInfo = {
             updatedBy: req.body.updatedBy,
             updateByType: req.body.updateByType
        }
        const subsPackageId = req.body.masterId;
        if(orderIds) {
            let updatedOrders = '';
            if(updateProp.rescheduleOrder){
                 updatedOrders = await service.updatePendingOrdersDate(orderIds, updateProp, updateInfo, subsPackageId)
            }else {
                 updatedOrders = await service.updatePendingOrdersProps(orderIds, updateProp, updateInfo, subsPackageId);
            }
            responsehanlder.success200(req,res, updatedOrders);
        }
    }catch(error) {
        console.log('error in order prop update', error)
        responsehanlder.hasError500(res);
    }
})


router.post('/getKitchenPastOrders', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.body.kitchenId;
        const fromDate = req.body.fromDate;
        const toDate = req.body.toDate;
        if (kitchenId && fromDate && toDate) {
            const orderList = await service.getKitchenPastOrders(kitchenId, fromDate, toDate);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
router.post('/getKitchenPastOrdersReport', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.body.kitchenId;
        const fromDate = req.body.fromDate;
        const toDate = req.body.toDate;
        if (kitchenId && fromDate && toDate) {
            const orderList = await service.getKitchenPastOrdersReport(kitchenId, fromDate, toDate);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.put('/updateFeedbackstatus/:id', userAuthMiddleware, async (req, res) => {
    try {
        if (req && req.params && req.params.id) {
            const result = await service.updateFeedbackstatus(req.params.id);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.post('/searchFoodOrderList/:page', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        const page = req.params.page;
        if (searchObj && page) {
            const orderList = await service.searchFoodOrderList(searchObj, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getdashboardCount', userAuthMiddleware, async (req, res) => {
    try {
        const orderList = await service.getdashboardCount();
        responsehanlder.success200(req, res, orderList);
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.post('/getListForReward', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const orderList = await service.getListForReward(searchObj);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getFoodOrder/:id', commonAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const order = await service.getFoodOrder(id);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodorder.route.js getFoodorder error ==> ',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getFoodOrderByorderNo/:orderNo', commonAuthMiddleware, async (req, res) => {
    try {
        const orderNo = req.params.orderNo;
        if (orderNo) {
            const order = await service.getFoodOrderByorderNo(orderNo);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodorder.route.js getFoodorder error ==> ',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getFoodOrderbyOrderNoThinkOwl/:id', commonAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const order = await service.getFoodOrderbyOrderNoThinkOwl(parseInt(id));
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodorder.route.js getFoodorder error ==> ',error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getFoodOrderbyCustomerEmailThinkOwl/:email', commonAuthMiddleware, async (req, res) => {
    try {
        const email = req.params.email;
        if (email) {
            const order = await service.getFoodOrderbyCustomerEmailThinkOwl(email);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodorder.route.js getFoodorder error ==> ',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/payAmtToKitchen', adminAuthMiddleware, async (req, res) => {
    try {
        const payload = req.body;
        // console.log(payload)
        if (payload && payload.ids) {
            const intOrdersNo = {
                ids: payload.ids.map(ele => parseInt(ele)),
                server: payload.server
            }
            await service.payAmtToKitchen(intOrdersNo);
            responsehanlder.success200(req, res, { status: 'completed' })
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('payAmtToKitchen by Admin foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getCustomerOpenOrders/:customerId', commonAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        if (customerId) {
            const orderList = await service.getCustomerOpenOrders(customerId);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerOpenOrders foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getCustomerCurrentOpenOrders/:customerId/:clientDate', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const clientDate = req.params.clientDate;
        if (customerId && clientDate) {
            const orderList = await service.getCustomerCurrentOpenOrders(customerId, clientDate);
            responsehanlder.success200(req, res, [...orderList[0], ...orderList[1], ...orderList[2]])
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerOpenOrders foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getCustomerSpecificOrders/:customerId/:page/:getNonCompletedOrder', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const page = req.params.page;
        const getNonCompletedOrder = req.params.getNonCompletedOrder;
        if (customerId && page && getNonCompletedOrder) {
            const orderList = await service.getCustomerSpecificOrders(customerId, page, getNonCompletedOrder);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerSpecificOrders foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});
router.get('/checkOrderValidForKitchen/:id/:currentStatus', kitchenAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const currentStatus = req.params.currentStatus;
        if (id && currentStatus) {
            const result = await service.checkOrderValidForKitchen(id, currentStatus);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodorder.route.js getFoodorder error ==> ',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getKitchenDashboardCount/:kitchenId/:clientDate/:orderType', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        const clientDate = req.params.clientDate;
        const orderType = req.params.orderType;
        if (kitchenId && clientDate && orderType) {
            const orderCount = await service.getKitchenDashboardCount(kitchenId, clientDate, orderType);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodorder.route.js getKitchenDashboardCount error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getCurrentOrdersCount/:clientDate', adminAuthMiddleware, async (req, res) => {
    try {
        const clientDate = req.params.clientDate;
        if (clientDate) {
            const orderCount = await service.getCurrentOrdersCount(clientDate);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodorder.route.js getCurrentOrdersCount error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getClusterCurrentOrdersCount', adminAuthMiddleware, async (req, res) => {
    try {
        const clusterList = req.body.clusterList;
        if (clusterList) {
            const orderCount = await service.getClusterCurrentOrdersCount(clusterList);
            responsehanlder.success200(req, res, orderCount);
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodorder.route.js getCurrentOrdersCount error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getCurrentOrdersList/:clientDate/:page/:limit/:status', adminAuthMiddleware, async (req, res) => {
    try {
        const clientDate = req.params.clientDate;
        const page = req.params.page;
        const status = req.params.status;
        const limit = req.params.limit;
        if (clientDate && page && status && limit) {
            const orderCount = await service.getCurrentOrdersList(status, clientDate, page, limit);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodorder.route.js getCurrentOrdersList error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getClusterCurrentOrdersList/:page/:limit/:status', adminAuthMiddleware, async (req, res) => {
    try {
        const clusterList = req.body.clusterList;
        const page = req.params.page;
        const status = req.params.status;
        const limit = req.params.limit;
        if (clusterList && page && status && limit) {
            const orderCount = await service.getClusterCurrentOrdersList(status, clusterList, page, limit);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodorder.route.js getCurrentOrdersList error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/performOrderTransfer', adminAuthMiddleware, async (req, res) => {
    try {
        const payload = req.body;
        if (payload && payload._id) {
            const order = await service.performOrderTransfer(payload);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('performOrderTransfer foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getRefundOrders', adminAuthMiddleware, async (req, res) => {
    try {
        const order = await service.getRefundOrders();
        responsehanlder.success200(req, res, order)
    } catch (error) {
        // console.log('getRefundOrders error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getCustomerPastOrders/:customerId/:page/:clientDate', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const page = req.params.page;
        const clientDate = req.params.clientDate;
        if (customerId && page && clientDate) {
            const orderList = await service.getCustomerPastOrders(customerId, page, clientDate);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerPastOrders foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getCustomerPastOrdersByType/:customerId/:page/:clientDate/:type', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const type = req.params.type;
        const page = req.params.page;
        const clientDate = req.params.clientDate;
        if (customerId && page && clientDate) {
            const orderList = await service.getCustomerPastOrdersByType(customerId, page, clientDate, type);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerPastOrders foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.put('/updateManualDelivery/:id', userAuthMiddleware, async (req, res) => {
    try {
        if (req && req.params && req.params.id) {
            const result = await service.updateManualDelivery(req.params.id);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.put('/deliveryByMealaweBoy/:id', userAuthMiddleware, async (req, res) => {
    try {
        if (req && req.params && req.params.id) {
            const result = await service.updateDeliveryByMealaweBoy(req.params.id);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.post('/updatePackageImage/:prop/:id', kitchenAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const prop = req.params.prop;
        const id = req.params.id;
        const filename = req.file && req.file.filename ? req.file.filename : null;
        if (prop && id && filename) {
            const result = await service.updatePackageImage(id, prop, filename);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

const RIDER_TRIP_IMAGE_PROPS = ['selfieImageUrl', 'odometerImageUrl'];

router.post('/updateRiderTripImage/:prop/:id', kitchenAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const prop = req.params.prop;
        const id = req.params.id;
        const filename = req.file && req.file.filename ? req.file.filename : null;
        if (!RIDER_TRIP_IMAGE_PROPS.includes(prop)) {
            return responsehanlder.hasError402(res, 'invalid prop');
        }
        if (!id || !filename) {
            return responsehanlder.hasError402(res, 'invalid request');
        }
        const result = await service.setRiderTripImage(id, prop, filename);
        responsehanlder.success200(req, res, result);
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.post('/uploadOrderProofImage/:id', kitchenAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const filename = req.file && req.file.filename ? req.file.filename : null;
        if (!id || !filename) {
            return responsehanlder.hasError402(res, 'invalid request');
        }
        const gps = (req.body && req.body.lat != null && req.body.lng != null)
            ? { lat: req.body.lat, lng: req.body.lng }
            : null;
        const result = await service.setOrderProofImage(id, filename, gps);
        responsehanlder.success200(req, res, result);
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.post('/rider/trip/start', kitchenAuthMiddleware, async (req, res) => {
    try {
        const payload = req.body;
        if (!payload || !payload.orderId) {
            return responsehanlder.hasError402(res, 'invalid request');
        }
        const result = await service.startRiderTrip(payload);
        responsehanlder.success200(req, res, result);
    } catch (error) {
        if (error && /required|numeric/i.test(error.message || '')) {
            return responsehanlder.hasError402(res, error.message);
        }
        responsehanlder.hasError500(res);
    }
});

router.post('/exportFoodOrderList', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const orderList = await service.exportFoodOrderList(searchObj);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});


router.post('/getKitchenAssignedOrders', adminAuthMiddleware, async (req, res) => {
    try {
        const kitchenIdList = req.body.kitchenIdList;
        if (kitchenIdList) {
            const orderList = await service.getKitchenAssignedOrders(kitchenIdList);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/changeFoodOrderAddress/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const newAddress = req.body;
        if (id && newAddress) {
            const order = await service.changeFoodOrderAddress(id, newAddress);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/changeChildOrdersAddress', adminAuthMiddleware, async (req, res) => {
    try {
        const ids = req.body.ids;
        const newAddress = req.body.address;
        if (ids && newAddress) {
            const order = await service.changeChildOrdersAddress(ids, newAddress);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getAssignedMontlyOrders/:id', async (req, res) => {
    try {
        if (req && req.params && req.params.id) {
            const result = await service.getAssignedMontlyOrders(req.params.id);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.get('/kitchenWiseOrders', async (req, res) => {
    try {
        const orderList = await service.kitchenWiseOrders();
        responsehanlder.success200(req, res, orderList);
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getCustomerPastFoodOrderInfo/:id', userAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const orderList = await service.getCustomerPastFoodOrderInfo(id);
            responsehanlder.success200(req, res, orderList);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

// router.post('/payServerFoodOrderAmtToKitchen',adminAuthMiddleware,async(req,res)=>{
//     try{
//         const payload = req.body;
//         // console.log(payload)
//         if(payload && payload.ids){
//             const intOrdersNo = {
//                 ids:payload.ids.map(ele => parseInt(ele)),
//                 server:payload.server
//             }
//             await payServerFoodOrderAmtToKitchenDirect(intOrdersNo.ids,intOrdersNo.server);
//             responsehanlder.success200(req,res, {status: 'completed'})
//         }else{
//             responsehanlder.hasError402(res,'invalid request body');
//         }        
//     }catch(error){
//         // console.log('payAmtToKitchen by Admin foodroute error==>',error);
//         responsehanlder.hasError500(res);
//     }
// });

router.post('/payServerFoodOrderAmtToKitchenDirect', kitchenAuthMiddleware, async (req, res) => {
    try {
        const payload = req.body;
        // console.log(payload)
        if (payload && payload.ids) {
            const intOrdersNo = {
                ids: payload.ids.map(ele => parseInt(ele)),
                server: payload.server
            }
            await payServerFoodOrderAmtToKitchenDirect(intOrdersNo.ids, intOrdersNo.server);
            responsehanlder.success200(req, res, { status: 'completed' })
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('payAmtToKitchen by Admin foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/getCustomerFirstOrder', async (req, res) => {
    try {
        const payload = req.body;
        if (payload && payload.ids) {
            const orderList = await service.getCustomerFirstOrder(payload.ids);
            responsehanlder.success200(req, res, orderList);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/orderListToDeliver', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const orderList = await service.orderListToDeliver(searchObj);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getOrdersByOrderTypeAndCustomerId/:orderType/:customerId', userAuthMiddleware, async (req, res) => {
    try {
        const orderType = req.params.orderType;
        const customerId = req.params.customerId;
        const orderList = await service.getOrdersByOrderTypeAndCustomerId(orderType, customerId);
        responsehanlder.success200(req, res, orderList)

    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/kitchen/verifyDeliveryOtp', kitchenAuthMiddleware, async (req, res) => {
    try {
        const { orderNo, apartmentOtp, kitchenId } = req.body;
        
        console.log('📦 Kitchen delivery verification request:', { orderNo, kitchenId });
        
        // Validate input
        if (!orderNo || !apartmentOtp) {
            return responsehanlder.hasError402(res, 'Order number and OTP are required');
        }

        // Get the order
        const order = await service.getFoodOrderByOrderNo(orderNo);
        if (!order) {
            return responsehanlder.hasError402(res, 'Order not found');
        }

        // Verify kitchen owns this order
        if (order.kitchenId.toString() !== kitchenId) {
            return responsehanlder.hasError402(res, 'This order does not belong to your kitchen');
        }

        // Verify OTP
        if (order.apartmentOtp !== apartmentOtp) {
            return responsehanlder.hasError402(res, 'Invalid OTP. Please check and try again.');
        }

        // Check if order is already delivered
        if (order.orderstatus === 'delivered') {
            return responsehanlder.hasError402(res, 'Order is already delivered');
        }

        // Update order status to delivered
        const updatedOrder = await service.updateOrderStatus(
            [order._id], 
            'delivered', 
            {
                updatedBy: kitchenId,
                updateByType: 'Kitchen',
                deliveryNotes: 'Delivered by kitchen staff with OTP verification'
            }
        );
        
        responsehanlder.success200(req, res, {
            message: 'Order successfully marked as delivered',
            orderNo: order.orderNo,
            customerName: order.customerName,
            apartment: `${order.apartmentName} - Wing ${order.wingName}, Room ${order.roomNumber}`
        });

    } catch (error) {
        console.error('❌ Error in kitchen delivery verification:', error);
    }
});
router.post('/getOyoOrderListByDateRange', async (req, res) => {
    try {
        let { fromDate, toDate, hotelIds = [], page = 1, limit = 10 } = req.body;

        if (!fromDate || !toDate || !hotelIds) {
            responsehanlder.hasError402(res, 'invalid request body');
        }

        if (!Array.isArray(hotelIds)) {
            hotelIds = [hotelIds];
        }

        page = parseInt(page);
        limit = parseInt(limit);

        const orderList = await service.getOyoOrderListByDateRange(fromDate, toDate, hotelIds, page, limit);
        responsehanlder.success200(req, res, orderList, page, limit, orderList.length);

    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.post('/getApartmentOrderListByDateRange', async (req, res) => {
    try {
        let { fromDate, toDate, apartmentIds = [], page = 1, limit = 10 } = req.body;

        if (!fromDate || !toDate) {
            return responsehanlder.hasError402(res, 'fromDate and toDate are required');
        }

        // Ensure apartmentIds is always an array and filter out invalid values
        if (!Array.isArray(apartmentIds)) {
            apartmentIds = [apartmentIds];
        }

        // Filter out undefined and invalid IDs
        apartmentIds = apartmentIds.filter(id => 
            id && id !== 'undefined' && mongoose.Types.ObjectId.isValid(id)
        );

        page = parseInt(page);
        limit = parseInt(limit);

        const orderList = await service.getApartmentOrderListByDateRange(fromDate, toDate, apartmentIds, page, limit);
        responsehanlder.success200(req, res, orderList, page, limit, orderList.totalCount);

    } catch (error) {
        console.log('Error in getApartmentOrderListByDateRange:', error);
        responsehanlder.hasError500(res);
    }
});


router.post('/kitchen/resendApartmentOtp', kitchenAuthMiddleware, async (req, res) => {
    try {
        const { orderNo, kitchenId } = req.body;
        
        const order = await service.getFoodOrderByOrderNo(orderNo);
        if (!order || order.kitchenId.toString() !== kitchenId) {
            return responsehanlder.hasError402(res, 'Order not found or unauthorized');
        }

        if (order.orderType !== 'apartment_today' && order.orderType !== 'apartment_advance') {
            return responsehanlder.hasError402(res, 'This is not an apartment order');
        }

        // Generate new OTP
        const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const updatedOrder = await service.updateApartmentOrderOtp(order._id, newOtp);
        
        console.log('🔄 New OTP generated for apartment order:', orderNo);
        
        // TODO: Integrate with SMS service to send OTP to customer
        // await sendOtpToCustomer(order.customerPhoneNo, newOtp, order.customerName);
        
        responsehanlder.success200(req, res, {
            message: 'New OTP generated successfully',
            orderNo: order.orderNo,
            customerPhone: order.customerPhoneNo // For SMS integration
        });
        
    } catch (error) {
        console.error('❌ Error resending apartment OTP:', error);
        responsehanlder.hasError500(res);
    }
});

// Get today's apartment orders count
router.get('/getApartmentTodayOrderCount/:kitchenId', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        if (kitchenId) {
            const todayCount = await service.getApartmentTodayOrderCount(kitchenId);
            responsehanlder.success200(req, res, todayCount);
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        console.log('Error in getApartmentTodayOrderCount:', error);
        responsehanlder.hasError500(res)
    }
});

// Get advance apartment orders count (tomorrow, day after)
router.get('/getApartmentAdvanceOrderCount/:kitchenId', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        if (kitchenId) {
            const advanceCount = await service.getApartmentAdvanceOrderCount(kitchenId);
            responsehanlder.success200(req, res, advanceCount);
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        console.log('Error in getApartmentAdvanceOrderCount:', error);
        responsehanlder.hasError500(res)
    }
});

// Get apartment meal type counts for today/advance
router.get('/getApartmentMealTypeCounts/:kitchenId/:apartmentType', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        const apartmentType = req.params.apartmentType; // 'today' or 'advance'
        
        if (kitchenId && apartmentType) {
            const mealTypeCounts = await service.getApartmentMealTypeCounts(kitchenId, apartmentType);
            responsehanlder.success200(req, res, mealTypeCounts);
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        console.log('Error in getApartmentMealTypeCounts:', error);
        responsehanlder.hasError500(res)
    }
});

// Get apartment order counts by status and meal type
router.get('/getApartmentOrderCounts/:kitchenId/:apartmentType/:mealType', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        const apartmentType = req.params.apartmentType; // 'today' or 'advance'
        const mealType = req.params.mealType; // 'Breakfast', 'Lunch', 'HighTea', 'Dinner'
        
        if (kitchenId && apartmentType && mealType) {
            const orderCounts = await service.getApartmentOrderCounts(kitchenId, apartmentType, mealType);
            responsehanlder.success200(req, res, orderCounts);
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        console.log('Error in getApartmentOrderCounts:', error);
        responsehanlder.hasError500(res)
    }
});

// Add this route in foodorder.route.js
router.get('/getApartmentOrdersByType/:kitchenId/:apartmentType/:mealType/:status', kitchenAuthMiddleware, async (req, res) => {
  try {
    const kitchenId = req.params.kitchenId;
    const apartmentType = req.params.apartmentType; // 'today' or 'advance'
    const mealType = req.params.mealType; // 'Breakfast', 'Lunch', 'HighTea', 'Dinner'
    const status = req.params.status; // 'new', 'accepted', 'preparing', etc.

    if (kitchenId && apartmentType && mealType && status) {
      const orders = await service.getApartmentOrdersByType(kitchenId, apartmentType, mealType, status);
      responsehanlder.success200(req, res, orders);
    } else {
      responsehanlder.hasError402(res, 'invalid request')
    }
  } catch (error) {
    console.log('Error in getApartmentOrdersByType:', error);
    responsehanlder.hasError500(res)
  }
});

// Add this route to get apartment order counts by date category
router.get('/getApartmentOrderCountsByDate/:kitchenId', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        if (kitchenId) {
            // Get today and advance counts
            const todayCount = await service.getApartmentTodayOrderCount(kitchenId);
            const advanceCount = await service.getApartmentAdvanceOrderCount(kitchenId);
            
            // Get meal type counts
            const mealTypeCounts = await service.getApartmentMealTypeCounts(kitchenId, 'today');
            const advanceMealTypeCounts = await service.getApartmentMealTypeCounts(kitchenId, 'advance');
            
            responsehanlder.success200(req, res, {
                todayCount: todayCount.todayCount || 0,
                advanceCount: advanceCount.advanceCount || 0,
                mealTypeCounts: mealTypeCounts || {
                    breakfastOrder: 0,
                    lunchOrder: 0,
                    HighTeaOrder: 0,
                    dinnerOrder: 0
                },
                advanceMealTypeCounts: advanceMealTypeCounts || {
                    breakfastOrder: 0,
                    lunchOrder: 0,
                    HighTeaOrder: 0,
                    dinnerOrder: 0
                }
            });
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        console.log('Error in getApartmentOrderCountsByDate:', error);
        responsehanlder.hasError500(res)
    }
});

router.post('/exportApartmentFoodOrderList', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const orderList = await service.exportApartmentFoodOrderList(searchObj);
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