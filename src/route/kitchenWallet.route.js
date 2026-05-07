const express = require('express');
const service = require('../service/kitchenWallet.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { kitchenAuthMiddleware, adminAuthMiddleware } = require('../util/auth-middleware-jwt');
const processLockService = require('./../service/processLock.service');

router.get('/getKitchenWallet/:id', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        if (kitchenId) {
            const wallet = await service.getKitchenWallet(kitchenId);
            responsehanlder.success200(req, res, wallet);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
router.post('/saveKitchenWallet', async (req, res) => {
    try {
        const wallet = req.body;
        if (wallet) {
            const savedWallet = await service.saveKitchenWallet(wallet);
            responsehanlder.success200(req, res, savedWallet)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.post('/updateKitchenWallet/:id', async (req, res) => {
    try {
        const wallet = req.body;
        const kitchenId = req.params.id;
        if (wallet && kitchenId) {
            const savedWallet = await service.updateKitchenWallet(kitchenId, wallet);
            responsehanlder.success200(req, res, savedWallet)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        let message;
        if (error && error.error && error.error.description) {
            message = error.error.description;
        }
        responsehanlder.hasError402(res, message);
    }
});

router.put('/withdrawal/:kitchenId', kitchenAuthMiddleware, async (req, res) => {
    try {
        // const kitchenId = req.params.kitchenId;
        // if (kitchenId) {
        //     const processObj = await processLockService.saveProcessLock('KITCHEN_WITHDRAWAL_' + kitchenId);
        //     const updated = await service.withdrawal(kitchenId);
        //     await processLockService.deleteProcessLock(processObj._id);
        //     responsehanlder.success200(req, res, updated)
        // } else {
        //     responsehanlder.hasError402(res, 'invalid request');
        // }
        responsehanlder.hasError500({ message: 'Withdrawal functionality currently is not available!!' });
    } catch (error) {
        console.log('withdrawal kitchen route error', error);
        responsehanlder.hasError500(res);
    }
});


router.post('/checkJusPaypayOutStatus', kitchenAuthMiddleware, async (req, res) => {
    try {
        const wallet = req.body;
            const updated = await service.checkJusPaypayOutStatus(wallet);
            responsehanlder.success200(req, res, updated)
        
    } catch (error) {
        console.log('withdrawal kitchen route error', error);
        responsehanlder.hasError500(res);
    }
});

router.post('/checkKitchenWallet', async (req, res) => {
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

router.get('/getAllKitchenWalletList', async (req, res) => {
    try {
        const walletList = await service.getAllKitchenWalletList();
        responsehanlder.success200(req, res, walletList);
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

module.exports = router;
