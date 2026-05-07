const express = require('express');
const service = require('../service/offerVoucher.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/getOfferVoucherList', async (req, res) => {
    try {
        const list = await service.getOfferVoucherList();
        responsehanlder.success200(req, res, list);
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
router.get('/getValidOfferVoucherList', async (req, res) => {
    try {
        const list = await service.getValidOfferVoucherList();
        responsehanlder.success200(req, res, list);
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
router.post('/saveOfferVoucher', adminAuthMiddleware, async (req, res) => {
    try {
        const offer = req.body;
        if (offer) {
            const savedOffer = await service.saveOfferVoucher(offer);
            responsehanlder.success200(req, res, savedOffer)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.post('/updateOfferVoucher/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const offer = req.body;
        const id = req.params.id;
        if (offer && id) {
            const updatedOffer = await service.updateOfferVoucher(id, offer);
            responsehanlder.success200(req, res, updatedOffer)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        console.log('udpate error =>', error);
        responsehanlder.hasError500(res)
    }
});
router.delete('/deleteOfferVoucher/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const deleteOffer = await service.deleteOfferVoucher(id);
            responsehanlder.success200(req, res, deleteOffer)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.get('/validateVoucherCode/:voucherCode/:userId/:orderType', async (req, res) => {
    try {
        const voucherCode = req.params.voucherCode;
        const userId = req.params.userId;
        const orderType = req.params.orderType;
        if (voucherCode && userId && orderType) {
            const validObj = await service.validateVoucherCode(voucherCode, userId, orderType);
            responsehanlder.success200(req, res, validObj)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.post('/validateClusterVoucherCode/:voucherCode/:userId/:orderType', async (req, res) => {
    try {
        const voucherCode = req.params.voucherCode;
        const userId = req.params.userId;
        const orderType = req.params.orderType;
        const clusters = req.body.clusters;
        if (voucherCode && userId && orderType && clusters) {
            const validObj = await service.validateVoucherCode(voucherCode, userId, orderType, clusters);
            responsehanlder.success200(req, res, validObj)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});



module.exports = router;