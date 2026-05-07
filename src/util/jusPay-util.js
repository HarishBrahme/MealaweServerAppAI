const https = require('https');
const axios = require('axios');
const { serverLog } = require('./firebasedb-util');


let sessionURL = 'https://sandbox.juspay.in/session';
let jusPayURL = 'https://sandbox.juspay.in/orders';
let validateBeneficiaryURL = 'https://sandbox.juspay.in/payout/merchant/v2/benedetails';
let payoutURL = 'https://sandbox.juspay.in/payout/merchant/v1/orders';
let payoutCheckURL = 'https://sandbox.juspay.in/payout/merchant/v1/orders';
if(process.env.PRODUCTION === 'true'){
    sessionURL = 'https://api.juspay.in/session';
    jusPayURL = 'https://api.juspay.in/orders';
    validateBeneficiaryURL = 'https://api.juspay.in/payout/merchant/v2/benedetails';
    payoutURL = 'https://api.juspay.in/payout/merchant/v1/orders';
    payoutCheckURL = 'https://api.juspay.in/payout/merchant/v1/orders';
}


const startJusPaySession = (payload) => {
    return new Promise((resolve,reject) => {
        const jusPayMerchantId = process.env.JUSPAY_MERCHANT_ID;
        const authorization = btoa(`${process.env.JUSPAY_API_KEY}:`);
        const xRoutingId = payload.order_id;
        axios({
            method: 'POST',
            url: sessionURL,
            data: payload,
            headers: {
                'Authorization': `Basic ${authorization}`,
                'x-merchantid': jusPayMerchantId,
                'x-routing-id': xRoutingId,
                'content-type': 'application/json',
                'cache-control': 'no-cache'
            },
            responseType: 'json',
            timeout: 30000,
            })
        .then((res) => {
            const response = res;    
            if(response && response.data){
                resolve(response.data)
            }else{
                reject({errorMsg:'error creating startJusPaySession'})
            }
        })
        .catch(error =>{
            console.log('startJusPaySession error ',error);
            reject({errorMsg:'error creating startJusPaySession'})
        });
    });
}

const getJusPayOrderStatus = (order_id) => {
    return new Promise((resolve,reject) => {
        const jusPayMerchantId = process.env.JUSPAY_MERCHANT_ID;
        const authorization = btoa(`${process.env.JUSPAY_API_KEY}:`);
        axios({
            method: 'GET',
            url: `${jusPayURL}/${order_id}`,
            headers: {
                'Authorization': `Basic ${authorization}`,
                'x-merchantid': jusPayMerchantId,
                'content-type': 'application/json',
                'cache-control': 'no-cache'
            },
            responseType: 'json',
            timeout: 30000,
            })
        .then((res) => {
            const response = res.data;  
            if(response && response.status){                  
                let status;
                let txn_id = response.txn_id;
                let apiStatus = response.status;
                console.log('getJusPayOrderStatus',order_id,apiStatus);  
                if(apiStatus === 'CHARGED' || apiStatus === 'COD_INITIATED' || apiStatus === 'PARTIAL_CHARGED' ){
                    status = 'success';
                }
                else if(apiStatus === 'AUTHENTICATION_FAILED' || apiStatus === 'AUTHORIZATION_FAILED' || apiStatus === 'JUSPAY_DECLINED' ){
                    status = 'failed';
                }
                else if(apiStatus === 'PENDING_VBV' || apiStatus === 'AUTHORIZING' || apiStatus === 'STARTED' ){
                    status = 'pending';
                }else if(apiStatus === 'NEW' ){
                    status = 'new';
                }
                console.log('response getjusPayOrderStatus', response.status,status );
                resolve({status,txn_id})
            }else{
                 resolve({status:false});
            }
        })
        .catch(error =>{
            console.log('getJusPayOrderStatus error ',error);
             resolve({status:false});
        });
    });
}

const refundJusPayOrder = (order_id,amount,customerId,orderNo) => {
    return new Promise((resolve,reject) => {
        const jusPayMerchantId = process.env.JUSPAY_MERCHANT_ID;
        const authorization = btoa(`${process.env.JUSPAY_API_KEY}:`);
        const payload = {
                    unique_request_id: orderNo,
                    amount
                };
        axios({
            method: 'POST',
            url: `${sessionURL}/${order_id}/refunds`,
            data: payload,
            headers: {
                'Authorization': `Basic ${authorization}`,
                'x-merchantid': jusPayMerchantId,
                'x-routing-id': customerId,
                'content-type': 'application/json',
                'cache-control': 'no-cache'
            },
            responseType: 'json',
            timeout: 30000,
            })
        .then((res) => {
            const response = res;        
            if(response && response.body && response.body.status){
                resolve({status:response.body.status})
            }else{
                reject({errorMsg:'error refundJusPayOrder'})
            }
        })
        .catch(error =>{
            console.log('refundJusPayOrder error ',error);
            reject({errorMsg:'error creating refundJusPayOrder'})
        });
    });
}


const validateBeneficiary = (beneficiaryDetial) => {   
    const beneficiaryId = parseInt(Math.ceil(Math.random() * 1000000000000000));
    const payload = {
    beneId: `${beneficiaryId}`,
    beneDetails : {
                details: {
                    name:  beneficiaryDetial.beneficiaryName,
                    ifsc: beneficiaryDetial.beneficiaryIfscCode,
                    account: beneficiaryDetial.beneficiaryAccountNumber
                    },
                type: 'ACCOUNT_IFSC'
            },
    command : 'VALIDATE',
    customerId : beneficiaryDetial.customerId,
    email: beneficiaryDetial.beneficiaryEmail,
    phone: beneficiaryDetial.beneficiaryMobile
    };
    
    return new Promise((resolve,reject) => {
        const jusPayMerchantId = process.env.JUSPAY_MERCHANT_ID;
        const authorization = btoa(`${process.env.JUSPAY_PAYOUT_API_KEY}:`);
        axios({
            method: 'POST',
            url: validateBeneficiaryURL,
            headers: {
                'Authorization': `Basic ${authorization}`,
                'x-merchantid': jusPayMerchantId,
                'content-type': 'application/json',
                'cache-control': 'no-cache'
            },
            data: payload,
            responseType: 'json',
            timeout: 30000,
            })
        .then((res) => {
            const response = res.data;  
            if(response && response.status){
                if( response.status === 'VALID' || response.status === 'PENDING'){                                   
                    resolve({status:true,beneficiaryId: response.uniqueId});
                }else if( response.status === 'INVALID'){
                   reject({errorMsg:'INVALID Account Details'});
                }            }
            else{
                reject({errorMsg:'error validate Beneficiary'});
            }
        })
        .catch(error =>{
            console.log('validateBeneficiary error ',error);
            reject({errorMsg:'error validate Beneficiary'})
        });
    });
}

const payoutJusPay = (beneficiaryDetial,amount) => {
    return new Promise((resolve,reject) => {        
        const orderId = parseInt(Math.ceil(Math.random() * 1000000000000000));
        const data = {
            orderId: `${orderId}`,
            fulfillments: [
                {
                    amount,
                    beneficiaryDetails: {
                        details: {
                            name: beneficiaryDetial.beneficiaryName,
                            account:  beneficiaryDetial.beneficiaryAccountNumber,
                            ifsc : beneficiaryDetial.beneficiaryIfscCode
                        },
                        type: 'ACCOUNT_IFSC'
                    },
                    additionalInfo: {
                        remark: 'Payout Transaction'
                    }
                }
            ],
            amount,
            customerId: beneficiaryDetial.customerId,
            customerPhone: beneficiaryDetial.beneficiaryMobile,
            customerEmail: beneficiaryDetial.beneficiaryEmail,
            type: 'FULFILL_ONLY'
        };
        const jusPayMerchantId = process.env.JUSPAY_MERCHANT_ID;
        const authorization = btoa(`${process.env.JUSPAY_PAYOUT_API_KEY}:`);
        axios({
            method: 'POST',
            url: payoutURL,
            data,
            headers: {
                'Authorization': `Basic ${authorization}`,
                'x-merchantid': jusPayMerchantId,
                'content-type': 'application/json',
                'cache-control': 'no-cache'
            },
            responseType: 'json',
            timeout: 30000,
        }).then((res) => {
            const response = res.data;   
            serverLog("payoutJusPay=>",response.status);     
            if(response && response.status){
                if( response.status === 'READY_FOR_FULFILLMENT' || response.status === 'FULFILLMENTS_SCHEDULED'){                                   
                    resolve({status:'Pending',transactionId: orderId});
                }else if( response.status === 'FULFILLMENTS_FAILURE' || response.status === 'FULFILLMENTS_CANCELLED'){
                   resolve({status:'Failed',transactionId: orderId});
                }else if( response.status === 'FULFILLMENTS_MANUAL_REVIEW'){
                   resolve({status:'Review_With_Bank',transactionId: orderId});
                }else if( response.status === 'FULFILLMENTS_SUCCESSFUL'){
                   resolve({status:'Success',transactionId: orderId});
                }    
            }else{
                reject({errorMsg:'error white payoutJusPay'});
            }
        }).catch(error =>{
            serverLog("payoutJusPa error=>",error);
            console.log('payoutJusPay error ',error);
            reject({errorMsg:'error while payoutJusPay'})
        });
    });
}

const checkJusPayPayoutStatus = (orderId) => {
    return new Promise((resolve,reject) => {
        const jusPayMerchantId = process.env.JUSPAY_MERCHANT_ID;
        const authorization = btoa(`${process.env.JUSPAY_PAYOUT_API_KEY}:`);
        axios({
            method: 'GET',
            url: `${payoutCheckURL}/${orderId}?expand=fulfillment,payment,refund`,
            headers: {
                'Authorization': `Basic ${authorization}`,
                'x-merchantid': jusPayMerchantId,
                'content-type': 'application/json',
                'cache-control': 'no-cache'
            },
            responseType: 'json',
            timeout: 30000,
            })
        .then((res) => {
             const response = res.data;        
            if(response && response.status){
                if( response.status === 'READY_FOR_FULFILLMENT' || response.status === 'FULFILLMENTS_SCHEDULED'){                                   
                    resolve({status:'pending',transactionId: orderId});
                }else if( response.status === 'FULFILLMENTS_FAILURE' || response.status === 'FULFILLMENTS_CANCELLED'){
                   resolve({status:'failed',transactionId: orderId});
                }else if( response.status === 'FULFILLMENTS_MANUAL_REVIEW'){
                     resolve({status:'review_with_bank',transactionId: orderId});
                }else if( response.status === 'FULFILLMENTS_SUCCESSFUL'){
                   resolve({status:'success',transactionId: orderId});
                }    
            }else{
                reject({errorMsg:'error white payoutJusPay'});
            }
        })
        .catch(error =>{
            console.log('error checkPayoutStatus ',error);
            reject({errorMsg:'error checkPayoutStatus'})
        });
    });
}


module.exports = {
    startJusPaySession,
    getJusPayOrderStatus,
    validateBeneficiary,
    payoutJusPay,
    checkJusPayPayoutStatus,
}