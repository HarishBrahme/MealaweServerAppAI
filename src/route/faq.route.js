const express = require('express');
const service = require('../service/faq.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware, userAuthMiddleware, kitchenAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/saveFAQ', adminAuthMiddleware, async (req, res) => {
    try {
        if (req.body) {
            const savedFAQ = await service.saveFAQ(req.body);
            responsehanlder.success200(req, res, savedFAQ);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.get('/getAllFAQs', adminAuthMiddleware, async (req, res) => {
    try {
        const getAllFAQ = await service.getAllFAQs();
        responsehanlder.success200(req, res, getAllFAQ);
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.get('/getKitchenFAQ', kitchenAuthMiddleware, async (req, res) => {
    try {
        const getAllFAQ = await service.getFAQFor('Kitchen');
        responsehanlder.success200(req, res, getAllFAQ);
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.get('/getUserFAQ', async (req, res) => {
    try {
        const getAllFAQ = await service.getFAQFor('User');
        responsehanlder.success200(req, res, getAllFAQ);
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.post('/updateFAQ', adminAuthMiddleware, async (req, res) => {
    try {
        const faq = req.body;
        if (faq) {
            const getAllFAQ = await service.updateFAQ(faq);
            responsehanlder.success200(req, res, getAllFAQ);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log('/updateFAQ', error);
        responsehanlder.hasError500(res);
    }
});
router.delete('/deleteFAQ/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const getAllFAQ = await service.deleteFAQ(id);
            responsehanlder.success200(req, res, getAllFAQ);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

module.exports = router;