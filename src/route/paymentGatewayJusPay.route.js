const express = require('express');
const router = express.Router();
const {decryptMiddleware,openAuthMiddleware, } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const {userAuthMiddleware,adminAuthMiddleware,} = require("../util/auth-middleware-jwt");
 const responsehanlder = require('../util/response-handler');
 const service = require("./../service/paymentGatewayJusPay.service");
 const processLockService = require('./../service/processLock.service'); 
 const path = require('path');
 

  router.get('/paymentCheck',openAuthMiddleware, async (req, res)=>{
     console.log('success payment ',req.body);
     try{
        res.render(path.join(__dirname, '../../public/views/transaction_check'),{});
     }catch(error){
         console.log(error);
        let message;        
        if(error && error.errorMsg){
            message = error.errorMsg;
        }
        responsehanlder.hasError500(res,message)
     }
 });

   router.get('/dummyPayment',openAuthMiddleware, async (req, res)=>{
     console.log('success payment ',req.body);
     try{
        res.render(path.join(__dirname, '../../public/views/dummy_checkout'),{});
     }catch(error){
         console.log(error);
        let message;        
        if(error && error.errorMsg){
            message = error.errorMsg;
        }
        responsehanlder.hasError500(res,message)
     }
 });

 router.post('/startJusPayPaymentProcess', userAuthMiddleware,async (req, res)=>{
    // console.log('startJusPayPaymentProcess',req.body);
    try{
        const data = req.body;
        if (data) {
            const order = await service.startJusPayPaymentProcess(data);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    }catch(error){
        console.log(error);
        let message;        
        if(error && error.errorMsg){
            message = error.errorMsg;
        }
        responsehanlder.hasError500(res,message)
     }    
 });

 router.post('/startBulkJusPayPaymentProcess',userAuthMiddleware, async (req, res)=>{
    try{
        const data = req.body;
        if(data){
            // console.log(req.body.customerId)
            // const processObj = await processLockService.saveProcessLock('JUSPAY_BULK_PAY_INITIATED_'+req.body.customerId);
            const order = await service.startBulkJusPayPaymentProcess(data);
            // await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req,res,order);
        }else{
            responsehanlder.hasError402(res);
        }        
    }catch(error){
        // console.log('startPaytmPaymentProcess error',error);
        if(error && error.msg){
            responsehanlder.hasError500(res,error.msg);
        }else{
            responsehanlder.hasError500(res);
        }        
    }
});

router.post('/startMarketPlaceJusPayPaymentProcess',userAuthMiddleware, async (req, res)=>{
    try{
        const data = req.body;
        if(data){
            // console.log(req.body.customerId)
            const processObj = await processLockService.saveProcessLock('JUSPAY_MARKETPLACE_PAY_INITIATED_'+req.body.customerId);
            const order = await service.startMarketPlaceJusPayPaymentProcess(data);
            await processLockService.deleteProcessLock(processObj._id);
            responsehanlder.success200(req,res,order);
        }else{
            responsehanlder.hasError402(res);
        }        
    }catch(error){
        console.log('startPaytmPaymentProcess error',error);
        if(error && error.msg){
            responsehanlder.hasError500(res,error.msg);
        }else{
            responsehanlder.hasError500(res);
        }        
    }
});



 router.post("/validateJusPayPaymentTransaction", userAuthMiddleware,  async (req, res) => {
      try {
        const data = req.body;
        if (data) {
          const successObj = await service.validateJusPayPaymentTransaction(data);
          responsehanlder.success200(req, res, successObj);
        } else {
          responsehanlder.hasError402(res);
        }
      } catch(error){
         console.log(error);
        let message;        
        if(error && error.errorMsg){
            message = error.errorMsg;
        }
        responsehanlder.hasError500(res,message)
     }
    }
  );


  router.post('/jusPaycallback', async (req, res) => {
    try {
        console.log('jusPaycallback called');
        responsehanlder.success200(req, res, { status: 'thank you for updating task status' });
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

 
 module.exports = router;