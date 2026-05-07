const express = require('express');
const service = require('../service/offerCoupon.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/getOfferCouponList', async (req, res) => {
    try {
        const list = await service.getOfferCouponList();
        responsehanlder.success200(req, res, list);
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.get('/getValidUserCouponList/:clientDate/:customerId', async (req, res) => {
    try {
        const clientDate = req.params.clientDate;
        const queryCustomerId = req.params.customerId;
        if (clientDate && queryCustomerId) {
            const customerId = queryCustomerId === 'all' ? undefined : queryCustomerId;
            const list = await service.getValidUserCouponList(clientDate, customerId);
            responsehanlder.success200(req, res, list);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/getValidClusterUserCouponList/:customerId', async (req, res) => {
    try {
        const queryCustomerId = req.params.customerId;
        const clusters = req.body.clusters;
        if (queryCustomerId && clusters) {
            const customerId = queryCustomerId === 'all' ? undefined : queryCustomerId;
            const list = await service.getValidClusterUserCouponList(customerId, clusters);
            responsehanlder.success200(req, res, list);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/getValidClusterOrderTypeUserCouponList/:customerId/:orderType', async (req, res) => {
    try {
        const queryCustomerId = req.params.customerId;
        const clusters = req.body.clusters;
        const orderType = req.params.orderType;
        if (queryCustomerId && clusters) {
            const customerId = queryCustomerId === 'all' ? undefined : queryCustomerId;
            const list = await service.getValidClusterOrderTypeUserCouponList(customerId, clusters, orderType);
            responsehanlder.success200(req, res, list);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.get('/getValidOfferCouponList', async (req, res) => {
    try {
        const list = await service.getValidOfferCouponList();
        responsehanlder.success200(req, res, list);
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/saveOfferCoupon', adminAuthMiddleware, async (req, res) => {
    try {
        const offer = req.body;
        if (offer) {
            const savedOffer = await service.saveOfferCoupon(offer);
            responsehanlder.success200(req, res, savedOffer)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/updateOfferCoupon/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const offer = req.body;
        const id = req.params.id;
        if (offer && id) {
            const updatedOffer = await service.updateOfferCoupon(id, offer);
            responsehanlder.success200(req, res, updatedOffer)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.delete('/deleteOfferCoupon/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const deleteOffer = await service.deleteOfferCoupon(id);
            responsehanlder.success200(req, res, deleteOffer)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.get('/validateCouponForUser/:couponCode/:userId/:clientDate', async (req, res) => {
    try {
        const couponCode = req.params.couponCode;
        const userId = req.params.userId;
        const clientDate = req.params.clientDate;
        if (couponCode && userId && clientDate) {
            const validObj = await service.validateCouponForUser(couponCode, userId, clientDate);
            responsehanlder.success200(req, res, validObj)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

module.exports = router;