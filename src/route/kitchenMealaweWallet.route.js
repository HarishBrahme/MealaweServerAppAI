const express = require('express');
const service = require('../service/kitchenMealaweWallet.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { kitchenAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/getKitchenMelaweWalletBalance/:id', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.id;
        if (kitchenId) {
            const wallet = await service.getMealaweWalletBalance(kitchenId);
            responsehanlder.success200(req, res, wallet);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('getMealaweWalletBalance function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/checkKitchenMealaweWallet', async (req, res) => {
    try {
        const wallet = req.body;
        if (wallet) {
            const savedWallet = await service.checkKitchenWallet(wallet);
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
