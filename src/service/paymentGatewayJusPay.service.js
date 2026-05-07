
const orderService = require('./foodorder.service');
const bulkOrderService = require('./bulkFoodOrder.service');
const orderPackageService = require('./foodOrderPackage.service');
const { foodordervalidation, bulkFoodordervalidation, marketPlaceOrderValidation } = require('../util/order-validation-util');
const { saveMarketPlaceMainOrder, getMarketPlaceMainOrderById, updateMarketPlaceMainAndItemOrder } = require('./marketPlaceMainOrder.service');
const { startJusPaySession, getJusPayOrderStatus, validateBeneficiary,payoutJusPay,checkJusPayPayoutStatus} = require('../util/jusPay-util');
const { serverLog } = require('../util/firebasedb-util');
// const {saveKitchenTransactionHistory } = require('./kitchenTransactionHistory.service');

let gateway_reference_id = 'dummy_pg';
if(process.env.PRODUCTION === 'true'){
    gateway_reference_id = 'mealawe_juspay';
}

const getJusPayPaymentParams = (checkoutDetails,navmoolOrder) => {
  const returnURL = `${process.env.SERVER_URL}/transaction/paymentCheck`
  const return_url = checkoutDetails.returnURL? checkoutDetails.returnURL: returnURL;
  const order_id = 'juspay' + Math.ceil(Math.random() * 10000000000) + Math.ceil(Math.random() * 10000000000);
  const amount = `${checkoutDetails.amount}`;
  const customer_id = checkoutDetails.customerId;
  const first_name = checkoutDetails.customerName;
  const customer_email = checkoutDetails.customerEmail;
  const customer_phone = checkoutDetails.customerPhoneNo;
  const payment_page_client_id = process.env.JUSPAY_CLIENT_ID;
  
  const jusPayParams = {
    order_id,
    amount,
    customer_id,
    customer_email,
    customer_phone,
    payment_page_client_id,
    action: 'paymentPage',
    return_url,
    description: 'Complete your payment',
    first_name,
    last_name: '',
    "metadata.JUSPAY:gateway_reference_id": navmoolOrder ? 'navmool_juspay' : gateway_reference_id
  }
  console.log('jusPayParams',jusPayParams);
  return jusPayParams;
};

const startJusPayPaymentProcess = (data) => {
    return new Promise(async (resolve, reject) => {
      const checkoutDetails = {
        ...data,
      };     
      try {
        const { status, msg } = await foodordervalidation(data);
          if (status) {
            let jusPaySessionObj = {};
            let jusPayPaymentLink = '';
            if (data.amount > 0) {
              const jusPayParams = getJusPayPaymentParams(checkoutDetails);
              const {payment_links,sdk_payload} = await startJusPaySession(jusPayParams);
              checkoutDetails.order_id = jusPayParams.order_id;
              checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000);;
              checkoutDetails.orderstatus = 'paymentInprogress';  
              checkoutDetails.pgName = 'jusPay'
              jusPaySessionObj = sdk_payload;
              jusPayPaymentLink = payment_links.web;
              if (data.orderType === 'subscriptionPackage') {
                const transactionOrder = await orderPackageService.saveOrderPackage(checkoutDetails);
                resolve({checkoutDetails:transactionOrder,jusPaySessionObj,jusPayPaymentLink});
              } else {
                const transactionOrder = await orderService.saveFoodOrder(checkoutDetails);
                resolve({checkoutDetails:transactionOrder,jusPaySessionObj,jusPayPaymentLink});
              }
            } else {
              // check for wallet ballance
              checkoutDetails.order_id =  'order_' + Math.ceil(Math.random() * 10000);
              checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000);
              checkoutDetails.orderstatus = 'placed';
              checkoutDetails.amount = 0;
              if (data.orderType === 'subscriptionPackage') {
                  const transactionOrder = await orderPackageService.saveOrderPackage(checkoutDetails);
                  const updatedOrder = await orderPackageService.updateOrderPackage(transactionOrder);
                resolve({checkoutDetails:updatedOrder,jusPaySessionObj,jusPayPaymentLink});
              } else {
                const transactionOrder = await orderService.saveFoodOrder(checkoutDetails);
                const updatedOrder = await orderService.updateFoodOrder(transactionOrder);
                resolve({checkoutDetails:updatedOrder,jusPaySessionObj,jusPayPaymentLink});
              }
            }         
        } else {
            reject({ msg: msg ? msg : 'Invalid order' });
        }
  
      } catch (err) {
        console.log('error while fetching checkout page startJusPayPaymentProcess', err);
        reject({ msg: 'error while fetching checkout page' });
      }
    });
}

const startBulkJusPayPaymentProcess = (data) => {
    return new Promise(async (resolve, reject) => {
        const checkoutDetails = {
            ...data
        }
        try {
            const { status, msg } = await bulkFoodordervalidation(data);
            if (status) {
                let jusPaySessionObj = {};
                let jusPayPaymentLink = '';
                if (data.amount > 0) {
                    const jusPayParams = getJusPayPaymentParams(checkoutDetails);
                    const {payment_links,sdk_payload} = await startJusPaySession(jusPayParams);
                    checkoutDetails.order_id = jusPayParams.order_id;
                    checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000);;
                    checkoutDetails.orderstatus = 'paymentInprogress';  
                    checkoutDetails.pgName = 'jusPay'
                    jusPaySessionObj = sdk_payload;
                    jusPayPaymentLink = payment_links.web;                    
                    const transactionOrder = await bulkOrderService.saveBulkFoodOrder(checkoutDetails);
                    resolve({checkoutDetails:transactionOrder,jusPaySessionObj,jusPayPaymentLink});
                } else {
                    // console.log('les than 0')
                    // check for wallet ballance                        
                    checkoutDetails.order_id = 'order_' + Math.ceil(Math.random() * 10000000);
                    checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000000);
                    checkoutDetails.orderstatus = 'placed';
                    checkoutDetails.amount = 0;
                    const transactionOrder = await bulkOrderService.saveBulkFoodOrder(checkoutDetails);
                    const updatedOrder = await bulkOrderService.updateBulkFoodOrder(transactionOrder);
                    resolve({checkoutDetails:updatedOrder,jusPaySessionObj,jusPayPaymentLink});
                }
            } else {
                reject({ msg: msg ? msg : 'Invalid order' });
            }
        } catch (err) {
            // console.log('error while fetching checkout page or raxerpay id', err);
            reject({ msg: 'error while fetching checkout page' });
        }
    });
}

const startMarketPlaceJusPayPaymentProcess = (data) => {
    return new Promise(async (resolve, reject) => {
        const checkoutDetails = {
            ...data
        }
        try {
            const { status, msg } = await marketPlaceOrderValidation(data);
            if (status) {
                let jusPaySessionObj = {};
                let jusPayPaymentLink = '';
                if (data.amount > 0) {
                    const jusPayParams = getJusPayPaymentParams(checkoutDetails,true);
                    const {payment_links,sdk_payload} = await startJusPaySession(jusPayParams);
                    checkoutDetails.order_id = jusPayParams.order_id;
                    checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000);;
                    checkoutDetails.orderstatus = 'paymentInprogress';  
                    checkoutDetails.pgName = 'jusPay'
                    jusPaySessionObj = sdk_payload;
                    jusPayPaymentLink = payment_links.web;
                    const transactionOrder = await saveMarketPlaceMainOrder(checkoutDetails);
                    resolve({checkoutDetails:transactionOrder,jusPaySessionObj,jusPayPaymentLink});
                } else {
                    checkoutDetails.order_id = 'order_' + Math.ceil(Math.random() * 10000000);
                    checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000000);
                    checkoutDetails.orderstatus = 'placed';
                    checkoutDetails.amount = 0;
                    const transactionOrder = await saveMarketPlaceMainOrder(checkoutDetails);
                    const updatedOrder = await updateMarketPlaceMainAndItemOrder(transactionOrder);
                    resolve({checkoutDetails:updatedOrder,jusPaySessionObj,jusPayPaymentLink});
                }
            } else {
                reject({ msg: msg ? msg : 'Invalid order' });
            }
        } catch (err) {
            // console.log('error while fetching checkout page or raxerpay id', err);
            reject({ msg: 'error while fetching checkout page' });
        }
    });
}

const validateJusPayPaymentTransaction = async (data) => {
    let checkoutDetails;
    if (data.orderType === 'subscriptionParent') {
        checkoutDetails = await orderSubscriptionService.getOrderSubscription(data.foodOrderId);
    } else if (data.orderType === 'subscriptionPackage') {
        checkoutDetails = await orderPackageService.getOrderPackage(data.foodOrderId);
    }
    else if (data.orderType === 'bulkMeals' || data.orderType === 'individualMeals'
        || data.orderType === 'bulkSnacks' || data.orderType === 'individualSnacks'
        || data.orderType === 'predefinedSnackbox' || data.orderType === 'customSnackbox'|| data.orderType === 'apartmentBulk') {
        checkoutDetails = await bulkOrderService.getBulkFoodOrder(data.foodOrderId);
    } else if (data.orderType === 'marketPlaceMain') {
        checkoutDetails = await getMarketPlaceMainOrderById(data.foodOrderId);
    } else {
        checkoutDetails = await orderService.getFoodOrder(data.foodOrderId);
    }

    const successObj = {
        status: false,
        payment_id: data.TXNID,
        order_id: data.ORDERID,
        error: false
    }
    if (checkoutDetails && (checkoutDetails.orderstatus === 'paymentInprogress' || checkoutDetails.orderstatus === 'paymentFailed')) {
      const order_id = checkoutDetails.order_id;     
      const jusPayResponse = await getJusPayOrderStatus(order_id);
      console.log('validateJusPayPaymentTransaction jusPayResponse',jusPayResponse);
      let updateToDB = false;
      if(jusPayResponse && jusPayResponse.status === 'success'){
          const payment_id = jusPayResponse.txn_id;
          checkoutDetails.orderstatus = 'placed';
          checkoutDetails.payment_id = payment_id;
          successObj.status = true;
          successObj.payment_id = payment_id;
          successObj.order_id = order_id;
          updateToDB = true;
          console.log('validateJusPayPaymentTransaction success1');
          // execute split payment
      }else if(jusPayResponse && jusPayResponse.status === 'failed'){
        updateToDB = true;
        checkoutDetails.orderstatus = 'paymentFailed';
        console.log('validateJusPayPaymentTransaction failed 3');
      } 
      if(updateToDB){
        if (data.orderType === 'subscriptionParent') {
            await orderSubscriptionService.updateOrderSubscription(checkoutDetails);
        } else if (data.orderType === 'subscriptionPackage') {
            await orderPackageService.updateOrderPackage(checkoutDetails);
        } else if (data.orderType === 'bulkMeals' || data.orderType === 'individualMeals'
            || data.orderType === 'bulkSnacks' || data.orderType === 'individualSnacks'
            || data.orderType === 'predefinedSnackbox' || data.orderType === 'customSnackbox'|| data.orderType === 'apartmentBulk') {
            checkoutDetails = await bulkOrderService.updateBulkFoodOrder(checkoutDetails);
        } else if (data.orderType === 'marketPlaceMain') {
            checkoutDetails = await updateMarketPlaceMainAndItemOrder(checkoutDetails);
        } else {
            await orderService.updateFoodOrder(checkoutDetails);
        }
      } 
      return successObj
    } else {
        // console.log('validatePaytmPaymentTransaction failed 4')  
        successObj.error = true;
        return successObj
    }
}

const validateCroneJusPayPaymentTransaction = async (checkoutDetails, failOrder) => {

    const successObj = {
        status: false,
        error: false
    }
    serverLog('validateCroneJusPayPaymentTransaction started',new Date());
    if (checkoutDetails && (checkoutDetails.orderstatus === 'paymentInprogress' || checkoutDetails.orderstatus === 'paymentFailed')) {
      const order_id = checkoutDetails.order_id;     
      const jusPayResponse = await getJusPayOrderStatus(order_id);
      serverLog('validateJusPayPaymentTransaction jusPayResponse',jusPayResponse)
      console.log('validateJusPayPaymentTransaction jusPayResponse',jusPayResponse);
      let updateToDB = false;
      if(jusPayResponse && jusPayResponse.status === 'success'){
          const payment_id = jusPayResponse.txn_id;
          checkoutDetails.orderstatus = 'placed';
          checkoutDetails.payment_id = payment_id;
          successObj.status = true;
          successObj.payment_id = payment_id;
          successObj.order_id = order_id;
          updateToDB = true;
          serverLog('validateJusPayPaymentTransaction success1');
          console.log('validateJusPayPaymentTransaction success1');
          // execute split payment
      }else if(jusPayResponse && jusPayResponse.status === 'failed' && failOrder){
        updateToDB = true;
        checkoutDetails.orderstatus = 'paymentFailed';
        checkoutDetails.stopPaymentValidation = true;
        serverLog('validateJusPayPaymentTransaction failed 3');
        console.log('validateJusPayPaymentTransaction failed 3');
      }else if(jusPayResponse && (jusPayResponse.status === 'new' || jusPayResponse.status === 'pending') && failOrder){
        updateToDB = true;
        checkoutDetails.orderstatus = 'paymentFailed';
        checkoutDetails.stopPaymentValidation = true;
        serverLog('validateJusPayPaymentTransaction failed 4',checkoutDetails.orderType);
        console.log('validateJusPayPaymentTransaction failed 4',checkoutDetails.orderType);
      } 
      if (updateToDB) {
          if (checkoutDetails.orderType === 'subscriptionParent') {
              await orderSubscriptionService.updateOrderSubscription(checkoutDetails);
          } else if (checkoutDetails.orderType === 'subscriptionPackage') {
             serverLog('validateJusPayPaymentTransaction failed 5',checkoutDetails.orderType);
             console.log('validateJusPayPaymentTransaction failed 5',checkoutDetails.orderType);
              await orderPackageService.updateOrderPackage(checkoutDetails);
          }
          else if (checkoutDetails.orderType === 'bulkMeals' || checkoutDetails.orderType === 'individualMeals'
              || checkoutDetails.orderType === 'bulkSnacks' || checkoutDetails.orderType === 'individualSnacks'
              || checkoutDetails.orderType === 'predefinedSnackbox' || checkoutDetails.orderType === 'customSnackbox'|| checkoutDetails.orderType === 'apartmentBulk') {
              await bulkOrderService.updateBulkFoodOrder(checkoutDetails);
          } else if (checkoutDetails.orderType === 'marketPlaceMain') {
              await updateMarketPlaceMainAndItemOrder(checkoutDetails);
          } else {
              await orderService.updateFoodOrder(checkoutDetails);
          }
      }
        return successObj
    } else {
        successObj.error = true;
        return successObj
    }
}


const kitchenPayouts = async (beneficiaryDetial,walletObj) => {
    try {
        const withdrawalAmount = Number(walletObj.wallet_balance);

        if (withdrawalAmount <= 0) {
            throw new Error('Insufficient balance');
        }

        const data = {
            fund_account_id: walletObj.fund_id,
            amount: Math.round(withdrawalAmount * 100), // INR → paise
            mode: "NEFT",
        };

        // Call payout API
            const payOutresponse = await payoutJusPay(
                beneficiaryDetial,data.amount
            );
            console.log("payOutresponse=>",payOutresponse)

        const walletHistoryObj = {
            payout_id: payOutresponse.transactionId,
            fund_id: data.fund_account_id,
            status: payOutresponse.status,
            mode: data.mode,
            transaction_amount: data.amount / 100,
            created_at: new Date(),
            kitchenId: walletObj.kitchenId,
            kitchenName: walletObj.kitchenName,
            walletPreviousBalance: walletObj.wallet_balance,
            transactionType: 'Debit',
            remark: 'withdrawal from wallet'
        };
        return walletHistoryObj;

    } catch (error) {
        console.error('kitchenPayouts error:', error);
        throw error;
    }
};
const checkJusPayPayoutStatusloc= async (orderId) => {
 const res = await checkJusPayPayoutStatus(orderId);
 return res
}

const createKitchenWalletJusPay = async (walletObj) => {
    const beneficiaryPayload = {
        beneficiaryName: walletObj.account_name,
        beneficiaryIfscCode: walletObj.ifsc,
        beneficiaryAccountNumber: walletObj.account_number,
        beneficiaryEmail: walletObj.email,
        beneficiaryMobile: walletObj.phoneNo,
        customerId: `${walletObj.kitchenId}` // unique per kitchen
    };
    const res = await validateBeneficiary(beneficiaryPayload);
    return res
}



module.exports = {
    startJusPayPaymentProcess,
    startBulkJusPayPaymentProcess,
    startMarketPlaceJusPayPaymentProcess,
    validateJusPayPaymentTransaction,
    validateCroneJusPayPaymentTransaction,
    kitchenPayouts,
    checkJusPayPayoutStatusloc,
    createKitchenWalletJusPay
}