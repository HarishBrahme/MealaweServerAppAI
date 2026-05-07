const express = require('express');
const service = require('../service/userMealaweWallet.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/getUserMelaweWalletBalance/:id', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.id;
        if (customerId) {
            const wallet = await service.getMealaweWalletBalance(customerId);
            responsehanlder.success200(req, res, wallet);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('getMealaweWalletBalance function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/checkUserMealaweWallet', userAuthMiddleware, async (req, res) => {
    try {
        const wallet = req.body;
        if (wallet) {
            const savedWallet = await service.checkUserWallet(wallet);
            responsehanlder.success200(req, res, savedWallet)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('checkkitchen wallet ', error);
        responsehanlder.hasError500(res)
    }
});

module.exports = router;
