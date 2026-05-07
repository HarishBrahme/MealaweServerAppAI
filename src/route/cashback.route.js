const express = require('express');
const service = require('../service/cashback.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { userAuthMiddleware, adminAuthMiddleware } = require('../util/auth-middleware-jwt');
const { sendTransactionFcmMessage } = require("../util/fcm-message-handler");

router.get('/getCashbackListUser/:id/:pageNumber', userAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const pageNumber = req.params.pageNumber;
        if (id && pageNumber) {
            const cartsave = await service.getCashbackListUser(id, pageNumber);
            responsehanlder.success200(req, res, cartsave);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }

    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getCashbackBalance/:id', userAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const balance = await service.getCashbackBalance(req.params.id);
            responsehanlder.success200(req, res, balance);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

// router.get('/getCashbackListForExpiry/:expiryday', async (req, res)=>{
//     try{       
//         const expiryday = req.params.expiryday;   
//         if(expiryday){
//             const list = await service.getCashbackListForExpiry(expiryday);
//             responsehanlder.success200(req,res,list);
//         }else{
//             responsehanlder.hasError402(res, 'invalid request');
//         }
//     }catch(error){
//         // console.log(error);
//         responsehanlder.hasError500(res);
//     }
// });

router.post('/saveCashback', adminAuthMiddleware, async (req, res) => {
    try {
        const cashbackObj = req.body;
        if (cashbackObj && cashbackObj.customerId) {
            const result = await service.saveCashBack(cashbackObj);
            sendTransactionFcmMessage('user_mealawe_credit', result.cashbackPoints, result.customerId, 'USER');
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

// router.get('/expireCashBackList', async (req, res)=>{
//     try{
//         const list = await service.expireCashBackList();
//         responsehanlder.success200(req,res,list);
//     }catch(error){
//         // console.log(error);
//         responsehanlder.hasError500(res);
//     }
// });

router.post('/exportCashbackList', userAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const list = await service.exportCashbackList(searchObj);
            responsehanlder.success200(req, res, list)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

module.exports = router;