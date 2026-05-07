const express = require('express');
const service = require('../service/bulkFoodOrder.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware, adminAuthMiddleware ,kitchenAuthMiddleware,commonAuthMiddleware} = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const processLockService = require('./../service/processLock.service');
const upload = require('../util/image-handler');

router.get('/getCustomerBulkOrderList/:customerId/:page', adminAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.customerId;
        const page = req.params.page;
        if (customerId && page) {
            const orderList = await service.getCustomerBulkOrderList(customerId, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('getCustomerPackageList foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getBulkFoodOrder/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const list = await service.getBulkFoodOrder(id);
            responsehanlder.success200(req, res, list);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    }
    catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.post('/updateBulkFoodOrder', kitchenAuthMiddleware, async (req, res) => {
    try {
        const foodOrder = req.body;
        if (foodOrder) {
            const processObj = await processLockService.saveProcessLock('UPDATE_BULK_FOOD_ORDER_' + foodOrder._id);
            const orderdetail = await service.updateBulkFoodOrder(foodOrder);
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

router.get('/getPastBulkFoodOrders/:id/:page', async (req, res) => {
    try {
        const id = req.params.id;
        const page = req.params.page;
        if (id && page) {
            const list = await service.getPastBulkFoodOrders(id, page);
            responsehanlder.success200(req, res, list);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    }
    catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

router.get('/getCurrentBulkOrdersCount/:clientDate', async (req, res) => {
    try {
        const clientDate = req.params.clientDate;
        if (clientDate) {
            const orderCount = await service.getCurrentBulkOrdersCount(clientDate);
            responsehanlder.success200(req, res, orderCount)
        }
        else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodorder.route.js getCurrentOrdersCount error =>', error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getClusterCurrentBulkOrdersCount', async (req, res) => {
    try {
        const clusterList = req.body.clusterList;
        if (clusterList) {
            const orderCount = await service.getClusterCurrentBulkOrdersCount(clusterList);
            responsehanlder.success200(req, res, orderCount)
        }
        else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodorder.route.js getCurrentOrdersCount error =>', error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getBulkOrderList/:page/:limit/:clientDate/:status', async (req, res) => {
    try {
        const page = req.params.page;
        const status = req.params.status;
        const limit = req.params.limit;
        const clientDate = req.params.clientDate;
        if (page && status && limit && clientDate) {
            const orderCount = await service.getBulkOrderList(status, page, limit);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('bulk foodorder.route.js getBulkOrderList error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getClusterBulkOrderList/:page/:limit/:status', async (req, res) => {
    try {
        const page = req.params.page;
        const status = req.params.status;
        const limit = req.params.limit;
        const clusterList = req.body.clusterList;
        if (page && status && limit && clusterList) {
            const orderCount = await service.getBulkOrderList(status, page, limit, clusterList);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('bulk foodorder.route.js getBulkOrderList error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/searchBulkOrderList/:page', async (req, res) => {
    try {
        const searchObj = req.body;
        const page = req.params.page;
        if (searchObj && page) {
            const orderList = await service.searchBulkOrderList(searchObj, page);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/performBulkOrderTransfer', async (req, res) => {
    try {
        const payload = req.body;
        if (payload && payload._id) {
            const order = await service.performBulkOrderTransfer(payload);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('performOrderTransfer foodroute error==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getKitchenBulkDashboardCount/:kitchenId/:clientDate/:orderType', async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        const clientDate = req.params.clientDate;
        const orderType = req.params.orderType;
        if (kitchenId && clientDate && orderType) {
            const orderCount = await service.getKitchenBulkDashboardCount(kitchenId, clientDate, orderType);
            responsehanlder.success200(req, res, orderCount)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('foodorder.route.js getKitchenDashboardCount error =>',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getKitchenBulkOrderDetail/:kitchenId/:clientDate', async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        const clientDate = req.params.clientDate;
        if (kitchenId) {
            const orderdetail = await service.getKitchenBulkOrderDetail(kitchenId, clientDate);
            responsehanlder.success200(req, res, orderdetail);
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.get('/checkBulkOrderValidForKitchen/:id/:currentStatus', async (req, res) => {
    try {
        const id = req.params.id;
        const currentStatus = req.params.currentStatus;
        if (id && currentStatus) {
            const result = await service.checkBulkOrderValidForKitchen(id, currentStatus);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodorder.route.js getFoodorder error ==> ',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/updateBulkPackageImage/:prop/:id', upload.single('image'), async (req, res) => {
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

router.put('/updateBulkManualDelivery/:id', async (req, res) => {
    try {
        if (req && req.params && req.params.id) {
            const result = await service.updateBulkManualDelivery(req.params.id);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
router.post('/exportBulkOrderList', async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const list = await service.exportBulkOrderList(searchObj);
            responsehanlder.success200(req, res, list);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    }
    catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getApartmentPastBulkFoodOrders/:id/:page', async (req, res) => {
    try {
        const id = req.params.id;
        const page = req.params.page;
        if (id && page) {
            const list = await service.getApartmentPastBulkFoodOrders(id, page);
            responsehanlder.success200(req, res, list);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    }
    catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

router.post('/kitchen/verifyBulkDeliveryOtp', kitchenAuthMiddleware, async (req, res) => {
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
        // if (order.orderstatus === 'delivered') {
        //     return responsehanlder.hasError402(res, 'Order is already delivered');
        // }

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

        console.log('✅ Order marked as delivered:', orderNo);
        
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
router.post('/kitchen/resendBulkApartmentOtp', kitchenAuthMiddleware, async (req, res) => {
    try {
        const { orderNo, kitchenId } = req.body;
        
        const order = await service.getFoodOrderByOrderNo(orderNo);
        if (!order || order.kitchenId.toString() !== kitchenId) {
            return responsehanlder.hasError402(res, 'Order not found or unauthorized');
        }

        if (order.orderType !== 'apartmentBulk') {
            return responsehanlder.hasError402(res, 'This is not an apartment order');
        }

        // Generate new OTP
        const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const updatedOrder = await service.updateApartmentBulkOrderOtp(order._id, newOtp);
        
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

router.post('/getApartmentBulkOrderListByDateRange', async (req, res) => {
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

        const orderList = await service.getApartmentBulkOrderListByDateRange(fromDate, toDate, apartmentIds, page, limit);
        responsehanlder.success200(req, res, orderList, page, limit, orderList.totalCount);

    } catch (error) {
        console.log('Error in getApartmentOrderListByDateRange:', error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getBulkFoodOrdersByCustomerEmailThinkowl/:email', commonAuthMiddleware, async (req, res) => {
    try {
        const email = req.params.email;
        if (email) {
            const order = await service.getBulkFoodOrdersByCustomerEmailThinkowl(email);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log('foodorder.route.js getFoodorder error ==> ',error);
        responsehanlder.hasError500(res);
    }
});


module.exports = router;