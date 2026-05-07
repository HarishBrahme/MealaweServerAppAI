const express = require('express');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const responsehanlder = require('../util/response-handler');
const path = require('path');
const service = require('./../service/paymentGateway.service');
const { userAuthMiddleware, kitchenAuthMiddleware } = require('../util/auth-middleware-jwt');
const processLockService = require('./../service/processLock.service');

router.post('/paymentcallback/:transactionIdentifier', async (req, res) => {
    const transactionIdentifier = req.params.transactionIdentifier;
    // console.log('success payment ',req.body,transactionIdentifier);
    const data = req.body;
    try {
        const successObj = await service.paymentSuccess(req.body, transactionIdentifier);
        if (successObj.error) {
            res.redirect('/transaction/paymentError');
        } else if (successObj.status) {
            res.redirect('/transaction/paymentSuccess');
        } else {
            res.redirect('/transaction/paymentFailed');
        }
    } catch (e) {
        // console.log(e);
        res.redirect('/transaction/paymentError');
    }
});
router.get('/paymentSuccess', async (req, res) => {
    res.render(path.join(__dirname, '../../public/views/transaction_success'), {});
});
router.get('/paymentFailed', async (req, res) => {
    res.render(path.join(__dirname, '../../public/views/transaction_failed'), {});
});
router.get('/paymentError', async (req, res) => {
    res.render(path.join(__dirname, '../../public/views/transaction_error'), {});
});
router.post('/createFoodOrder', userAuthMiddleware, async (req, res) => {
    try {
        const data = req.body;
        if (data) {
            const order = await service.createFoodOrder(data);
            responsehanlder.success200(req, res, { orderDbId: order._id });
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (e) {
        // console.log(e);
        responsehanlder.hasError500(res)
    }
});
router.post('/checkout', userAuthMiddleware, async (req, res) => {
    try {
        const data = req.body;
        if (data) {
            const order = await service.getCheckOutDetails(data);
            if (order.amount > 0) {
                res.render(path.join(__dirname, '../../public/views/checkout'), { ...order });
            } else {
                res.render(path.join(__dirname, '../../public/views/mealawecheckout'), { ...order });
            }
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (e) {
        // console.log('checkout error ==> ',e);
        responsehanlder.hasError500(res)
    }
});
router.post('/refund', userAuthMiddleware, async (req, res) => {
    try {
        const orderId = req.body.orderId;
        const comment = req.body.comment;
        if (orderId) {
            const processObj = await processLockService.saveProcessLock('UPDATE_FOOD_ORDER_' + orderId);
            const { status, code, data } = await service.cancelFoodOrder(orderId, comment);
            await processLockService.deleteProcessLock(processObj._id);
            if (status) {
                responsehanlder.success200(req, res, data)
            } else {
                responsehanlder.hasError503(res, code)
            }
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log('refund error ', error);
        responsehanlder.hasError500(res)
    }
});

router.post('/startPaymentProcess', userAuthMiddleware, async (req, res) => {
    try {
        const data = req.body;
        if (data) {
            const order = await service.startPaymentProcess(data);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log('startPaymentProcess error',error);
        if (error && error.msg) {
            responsehanlder.hasError500(res, error.msg);
        } else {
            responsehanlder.hasError500(res);
        }

    }
});
router.post('/validatePaymentTransaction', userAuthMiddleware, async (req, res) => {
    try {
        const data = req.body;
        if (data) {
            const successObj = await service.validatePaymentTransaction(data);
            responsehanlder.success200(req, res, successObj);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (e) {
        // console.log(e);
        responsehanlder.hasError500(res)
    }
});


router.get('/getGatewayPaymentHistory/:paymentOrderid', userAuthMiddleware, async (req, res) => {
    try {
        const paymentOrderid = req.params.paymentOrderid;
        if (paymentOrderid) {
            const order = await service.getGatewayPaymentHistory(paymentOrderid);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (e) {
        // console.log(e);
        responsehanlder.hasError500(res)
    }
});

router.post('/refundGatewayPayment/:foodOrderId/:orderType', userAuthMiddleware, async (req, res) => {
    try {
        const id = req.body.id;
        const order_id = req.body.order_id;
        const amount = req.body.amount;
        const foodOrderId = req.params.foodOrderId;
        const orderType = req.params.orderType;
        if (id && order_id && amount && foodOrderId && orderType) {
            const order = await service.refundGatewayPayment(id, order_id, amount, foodOrderId, orderType);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (e) {
        // console.log(e);
        if (e && e.error && e.error.description) {
            responsehanlder.hasError500(res, e.error.description);
        } else {
            responsehanlder.hasError500(res);
        }
    }
});

router.put('/refundToUserWallet/:foodOrderId/:orderType', userAuthMiddleware, async (req, res) => {
    try {
        const foodOrderId = req.params.foodOrderId;
        const orderType = req.params.orderType;
        if (foodOrderId && orderType) {
            const order = await service.refundToUserWallet(foodOrderId, orderType);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (e) {
        // console.log(e);
        if (e && e.error && e.error.description) {
            responsehanlder.hasError500(res, e.error.description);
        } else {
            responsehanlder.hasError500(res);
        }
    }
});

router.post('/placePaymentFailedOrder/:foodOrderId/:orderType/:paymentId', userAuthMiddleware, async (req, res) => {
    try {
        const foodOrderId = req.params.foodOrderId;
        const orderType = req.params.orderType;
        const paymentId = req.params.paymentId;
        if (foodOrderId && orderType && paymentId) {
            const order = await service.placePaymentFailedOrder(foodOrderId, orderType, paymentId);
            responsehanlder.success200(req, res, order)
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (e) {
        // console.log(e);
        if (e && e.error && e.error.description) {
            responsehanlder.hasError500(res, e.error.description);
        } else {
            responsehanlder.hasError500(res);
        }
    }
});

router.post('/createFoodOrderByAdmin', userAuthMiddleware, async (req, res) => {
    try {
        const data = req.body;
        if (data) {
            const order = await service.createFoodOrderByAdmin(data);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (e) {
        // console.log(e);
        responsehanlder.hasError500(res)
    }
});

router.post('/startPaytmPaymentProcess', userAuthMiddleware, async (req, res) => {
    let processObj;
    try {
        const data = req.body;
        if (data) {
            processObj = await processLockService.saveProcessLock('PAYTM_PAY_INITIATED_' + req.body.customerId);
            const order = await service.startPaytmPaymentProcess(data);
            await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        if (processObj && processObj._id) {
            processLockService.deleteProcessLock(processObj._id);
        }
        console.log('startPaytmPaymentProcess error', error);
        if (error && error.msg) {
            responsehanlder.hasError500(res, error.msg);
        } else {
            responsehanlder.hasError500(res);
        }
    }
});

router.post('/startBulkPaytmPaymentProcess', userAuthMiddleware, async (req, res) => {
    try {
        const data = req.body;
        if (data) {
            // console.log(req.body.customerId)
            const processObj = await processLockService.saveProcessLock('PAYTM_BULK_PAY_INITIATED_' + req.body.customerId);
            const order = await service.startBulkPaytmPaymentProcess(data);
            await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log('startPaytmPaymentProcess error',error);
        if (error && error.msg) {
            responsehanlder.hasError500(res, error.msg);
        } else {
            responsehanlder.hasError500(res);
        }
    }
});

router.post('/startMarketPlacePaytmPaymentProcess', userAuthMiddleware, async (req, res) => {
    try {
        const data = req.body;
        if (data) {
            // console.log(req.body.customerId)
            const processObj = await processLockService.saveProcessLock('PAYTM_MARKETPLACE_PAY_INITIATED_' + req.body.customerId);
            const order = await service.startMarketPlacePaytmPaymentProcess(data);
            await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log('startPaytmPaymentProcess error',error);
        if (error && error.msg) {
            responsehanlder.hasError500(res, error.msg);
        } else {
            responsehanlder.hasError500(res);
        }
    }
});

router.post('/validatePaytmPaymentTransaction', userAuthMiddleware, async (req, res) => {
    try {
        const data = req.body;
        if (data) {
            const successObj = await service.validatePaytmPaymentTransaction(data);
            responsehanlder.success200(req, res, successObj);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (e) {
        // console.log(e);
        responsehanlder.hasError500(res)
    }
});

module.exports = router;