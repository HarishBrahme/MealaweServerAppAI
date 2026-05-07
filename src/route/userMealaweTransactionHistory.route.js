const express = require('express');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const service = require('./../service/userMealaweTransactionHistory.service')
const { userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/userMealaweRewardsPointsHistory/:payee_id/:pageNumber/:nPerPage', userAuthMiddleware, async (req, res) => {
    try {
        const payee_id = req.params.payee_id;
        const pageNumber = req.params.pageNumber;
        const nPerPage = req.params.nPerPage;
        if (payee_id && pageNumber && nPerPage) {
            const result = await service.getUserMealaweTransactionHistory(payee_id, pageNumber, nPerPage);
            responsehanlder.success200(req, res, [...result])
        } else {
            responsehanlder.hasError500(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

module.exports = router;