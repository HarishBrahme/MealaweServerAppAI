const express = require('express');
const service = require('../service/generalAppFeedback.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware, allAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/getGeneralAppFeeback/:pageNumber', adminAuthMiddleware, async (req, res) => {
    try {
        const pageNumber = req.params.pageNumber;
        if (pageNumber) {
            const getfeedbackfromlist = await service.getfeedbackfromlist(pageNumber);
            responsehanlder.success200(req, res, getfeedbackfromlist)
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log('getGeneralAppFeeback route error => ',error);
        responsehanlder.hasError500(res)
    }
});


router.post('/saveGeneralAppFeeback', allAuthMiddleware, async (req, res) => {
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
router.put('/feedbackacknowledge/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const update = await service.acknowledge(id);
            responsehanlder.success200(req, res, update);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log('acknowledgedishSuggestion.route.js error ==>',error);
        responsehanlder.hasError500(res);
    }
});
module.exports = router;
