const express = require('express');
const service = require('../service/feedback.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { kitchenAuthMiddleware, adminAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/getfeedbackfromlist', async (req, res) => {
    try {
        const getfeedbackfromlist = await service.getfeedbackfromlist();
        responsehanlder.success200(req, res, getfeedbackfromlist)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});


router.post('/savefeedback', userAuthMiddleware, async (req, res) => {
    try {
        if (req.body) {
            const savefeedback = await service.savefeedback(req.body);
            responsehanlder.success200(req, res, savefeedback)
        } else {
            responsehanlder.hasError402(res, 'Invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
})


router.get('/getfeedback/:id/:pageNumber/:nPerPage', async (req, res) => {
    try {
        const pageNumber = req.params.pageNumber;
        const nPerPage = req.params.nPerPage;
        const id = req.params.id;
        if (id && pageNumber && nPerPage) {
            const getfeebdack = await service.getfeedbackTolist(id, pageNumber, nPerPage);
            responsehanlder.success200(req, res, getfeebdack);
        } else {
            responsehanlder.hasError500(res, 'invalid request')
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
})
router.put('/acknowledge/:id', userAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const update = await service.acknowledged(id);
            responsehanlder.success200(req, res, update);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log('acknowledgefeedback.route.js error ==>',error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getfeedbackToListCount/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const count = await service.getfeedbackToListCount(id);
            responsehanlder.success200(req, res, count);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log('getfeedbackToListCount.route.js error ==>',error);
        responsehanlder.hasError500(res);
    }
});

router.post('/exportFeedbackList', async (req, res) => {
    try {
        const { fromDate, toDate } = req.body;
        if (!fromDate || !toDate) {
            return responsehanlder.hasError402(res, 'fromDate and toDate are required');
        }
        const feedbackList = await service.exportFeedbackList(fromDate, toDate);
        responsehanlder.success200(req, res, feedbackList);
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

module.exports = router;
