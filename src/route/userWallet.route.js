const express = require('express');
const service = require('../service/userWallet.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { userAuthMiddleware } = require('../util/auth-middleware-jwt');
const processLockService = require('./../service/processLock.service');

router.get('/getWalletBalance/:id', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.id;
        if (customerId) {
            const wallet = await service.getWalletBalance(customerId);
            responsehanlder.success200(req, res, wallet);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('getWalletBalance function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/depositeInWallet/:id', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.id;
        const walletObj = req.body
        if (customerId) {
            const data = await service.addMoneyPointsInWallet(customerId, walletObj.customerName, walletObj.rewardsPoints, walletObj.remark, walletObj.category);
            responsehanlder.success200(req, res, data);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('getWalletBalance function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/withdrawFromWallet/:id', userAuthMiddleware, async (req, res) => {
    try {
        const customerId = req.params.id;
        const walletObj = req.body;
        if (customerId) {
            const processObj = await processLockService.saveProcessLock('WITHDRAW_WALLET_INITIATED_' + customerId);
            const data = await service.deductMoneyPointsFromWallet(customerId, walletObj.customerName, walletObj.rewardsPoints, walletObj.remark, walletObj.category);
            await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req, res, data);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('getWalletBalance function ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/checkUserWallet', userAuthMiddleware, async (req, res) => {
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

router.post('/getMoneyWalletBalanceExportList', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const list = await service.getMoneyWalletBalanceExportList(searchObj);
            responsehanlder.success200(req, res, list);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

module.exports = router;
