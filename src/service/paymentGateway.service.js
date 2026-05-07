const razorpay = require('razorpay');
const crypto = require('crypto');
const orderService = require('./foodorder.service');
const bulkOrderService = require('./bulkFoodOrder.service');
const orderSubscriptionService = require('./foodOrderSubscription.service');
const orderPackageService = require('./foodOrderPackage.service');
const { foodordervalidation, bulkFoodordervalidation, marketPlaceOrderValidation } = require('../util/order-validation-util');
const { setRedisCache, getRedisCache, deleteRedisCache } = require('../util/redis-util');
const { addMoneyPointsInWallet, createCashBack,deductMoneyPointsFromWallet } = require('../util/user-wallet-util');
const { saveKitchenTransactionHistory } = require('./kitchenTransactionHistory.service');
const { getPaytmCheckSum, verifyPaytmTransaction } = require('../util/paytm-util');
const { saveMarketPlaceMainOrder, getMarketPlaceMainOrderById, updateMarketPlaceMainAndItemOrder } = require('./marketPlaceMainOrder.service');
const uuid4 = require("uuid").v4;

const instance = new razorpay({
    key_id: process.env.RAZOR_PAY_KEY,
    key_secret: process.env.RAZOR_PAY_SECRET
});

const getRazorpayOrderId = async (amount, offer, discount) => {
    return new Promise((resolve, reject) => {
        // const instance = getInstance();
        // console.log('getRazorpayOrderId ',amount,offer, discount);
        const options = {
            currency: 'INR',
            receipt: Math.ceil(Math.random() * 100000000)
        };
        if (offer) {
            // options.offers= [offer];
            options.amount = parseInt((amount + (discount ? discount : 0)) * 100);
        } else {
            options.amount = parseInt(amount * 100);
        }
        // console.log('getRazorpayOrderId ',options)
        instance.orders.create(options, (err, order) => {
            if (order) {
                resolve(order);
            } else {
                // console.log('getRazorpayOrderId intance error ',err);
                reject(err)
            }
        }).catch(err => {
            // console.log('getRazorpayOrderId ',err);
            reject(err)
        });
    });
}
const createFoodOrder = async (data) => {
    if (data._id) {
        return Promise.resolve(data);
    } else {
        const checkoutDetails = {
            firstname: data.customerName,
            email: data.customerEmail,
            phone: data.customerPhoneNo,
            address: `${data.customerLocation.address}, ${data.customerLocation.location}, LandMark: ${data.customerLocation.landmark}`,
            itemAmount: data.itemAmount,
            amount: data.amount,
            orderstatus: 'paymentInitiated',
            ...data
        }

        transactionOrder = await orderService.saveFoodOrder(checkoutDetails);
        return transactionOrder;
    }

}
const getCheckOutDetails = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const savedOrder = await orderService.getFoodOrder(data.orderDbId);
            if (savedOrder && savedOrder._id &&
                (savedOrder.orderstatus === 'paymentInitiated' || savedOrder.orderstatus === 'paymentInprogress')) {
                const transactionIdentifier = 'pay' + Math.random().toString(36).slice(2);
                const checkoutDetails = {
                    key: process.env.RAZOR_PAY_KEY,
                    order_id: '',
                    serverurl: process.env.SERVER_URL,
                    firstname: data.customerName,
                    email: data.customerEmail,
                    phone: data.customerPhoneNo,
                    address: `${data.customerLocation.address}, ${data.customerLocation.location}, LandMark: ${data.customerLocation.landmark}`,
                    amount_due: 0,
                    transactionIdentifier,
                    _id: data.orderDbId,
                    ...data
                }
                try {
                    if (data.amount > 0) {
                        const order = await getRazorpayOrderId(data.amount, data.offer);
                        // console.log('getRazorpayOrderId created');
                        checkoutDetails.order_id = order.id;
                        checkoutDetails.receipt = order.receipt;
                        checkoutDetails.amount_due = order.amount_due / 100;
                        checkoutDetails.orderstatus = 'paymentInprogress';
                        checkoutDetails.amount = checkoutDetails.amount_due;
                    } else {
                        checkoutDetails.order_id = 'order_' + Math.ceil(Math.random() * 10000);
                        checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000);
                        checkoutDetails.orderstatus = 'paymentInprogress';
                        checkoutDetails.amount = data.amount;
                    }
                    // console.log('updating food order');             
                    const transactionOrder = await orderService.updateFoodOrder(checkoutDetails);
                    if (transactionOrder && transactionOrder._id) {
                        setRedisCache(transactionIdentifier, transactionOrder, 60 * 10);
                        // console.log('checkout Detail is ready');
                        resolve(checkoutDetails)
                    } else {
                        // console.log('error while fetching checkout page ');
                        reject('error while fetching checkout page');
                    }
                } catch (err) {
                    // console.log('error while fetching checkout page or raxerpay id',err);
                    reject('error while fetching checkout page');
                }
            } else {
                reject('transaction currupted');
            }
        } catch (error) {
            // console.log('eror while fetching saved order details ==> ',error);
            reject('transaction currupted');
        }

    });
}

const paymentSuccess = async (data, transactionIdentifier) => {
    const checkoutDetails = await getRedisCache(transactionIdentifier);
    const successObj = {
        status: false,
        payment_id: data.razorpay_payment_id,
        order_id: data.razorpay_order_id,
        error: false
    }
    // console.log('paymentSuccess before check 1');
    if (checkoutDetails && checkoutDetails.orderstatus === 'paymentInprogress') {
        if (checkoutDetails.amount > 0) {
            if (data && data.razorpay_payment_id && transactionIdentifier) {
                const generated_signature = crypto.createHmac('sha256', process.env.RAZOR_PAY_SECRET)
                    .update(checkoutDetails.order_id + "|" + data.razorpay_payment_id).digest('hex');
                checkoutDetails.order_id = data.razorpay_order_id;
                checkoutDetails.payment_id = data.razorpay_payment_id
                if (generated_signature === data.razorpay_signature) {
                    checkoutDetails.orderstatus = 'placed';
                    successObj.status = true;
                    // console.log('paymentSuccess 1');           
                } else {
                    checkoutDetails.orderstatus = 'paymentFailed';
                    // console.log('paymentSuccess 2')  
                }
            } else {
                checkoutDetails.orderstatus = 'paymentFailed';
                // console.log('paymentSuccess 3')   
            }
        } else {
            checkoutDetails.orderstatus = 'placed';
            successObj.status = true;
            // console.log('paymentSuccess zero payment') 
        }
        await orderService.updateFoodOrder(checkoutDetails);
        deleteRedisCache(transactionIdentifier);
        return successObj
    } else {
        // console.log('paymentSuccess failed 4')  
        successObj.error = true;
        return successObj
    }
}

const refundPayment = (payment_id, receipt, amount) => {
    const data = {
        "amount": amount,
        "speed": "optimum",
        "receipt": `${receipt}`,
        "notes": {
            "notes_key_1": "payment fund"
        }
    }
    return new Promise((resolve, reject) => {
        // const instance = getInstance();        
        instance.payments.refund(payment_id, data, (err, refundorder) => {
            if (refundorder) {
                resolve(refundorder);
            } else {
                // console.log('inside refund payment api failure error',err);
                reject(err)
            }
        }).catch(err => {
            // console.log('inside refund payment error',err);
            reject(err)
        });
    });

}
const cancelFoodOrder = async (foodOrderId, comment, walletDeduction = 0) => {
    return new Promise(async (resolve, reject) => {
        try {
                        const { cancelEligibleObj, foodOrder } = await orderService.checkCancelEligibility(foodOrderId, walletDeduction);

            if (cancelEligibleObj.cancelEligible) {
                // const refundResponse = await refundPayment(foodOrder.payment_id,foodOrder.receipt,cancelEligibleObj.refund_amount);
                // foodOrder.refund_id = refundResponse.id,
                // foodOrder.refund_amount = refundResponse.amount/100;
                 if (walletDeduction > 0) {
                    // Deduct from user's wallet
                    await deductMoneyPointsFromWallet(
                        foodOrder.customerId, 
                        foodOrder.customerName, 
                        walletDeduction,
                        `Cancellation processing fee for order no. ${foodOrder.orderNo}`
                    );
                    
                    console.log(`₹${walletDeduction} deducted from wallet for order ${foodOrder.orderNo}`);
                }
                foodOrder.refund_id = Math.ceil(Math.random() * 100000);
                foodOrder.refund_status = 'completed';
                let refund_amount = cancelEligibleObj.refund_amount;
                if ((foodOrder.orderType === 'daily' || foodOrder.orderType === 'allDay') && foodOrder.orderstatus === 'placed') {
                    foodOrder.orderstatus = 'cancelledByUser';
                }
                if (foodOrder.orderType === 'advance' && (foodOrder.orderstatus === 'placed' || foodOrder.orderstatus === 'accepted')) {
                    foodOrder.orderstatus = 'cancelledByUser';
                }
                if ((foodOrder.orderType === 'apartment_today' || foodOrder.orderType === 'apartment_advance' || foodOrder.orderType === 'apartmentBulk') && (foodOrder.orderstatus === 'placed' || foodOrder.orderstatus === 'accepted')) {
                    foodOrder.orderstatus = 'cancelledByUser';
                }
                
                foodOrder.cancel_comment = comment;
                foodOrder.refund_amount = refund_amount;
                let updatedFoodOrder = null
                if(foodOrder.orderType === 'apartmentBulk'){
                    updatedFoodOrder = await bulkOrderService.updateBulkFoodOrder(foodOrder);
                }else{
                updatedFoodOrder = await orderService.updateFoodOrder(foodOrder);
                }
                //need to change here
                let mealawePoinstUsed = 0;
                if (foodOrder.mealaweWalletPointsUsed) {
                    mealawePoinstUsed = foodOrder.mealaweWalletPointsUsed;
                    // addMealawePointsInWallet(foodOrder.customerId,foodOrder.customerName,mealawePoinstUsed,
                    //     `Mealawe points added on cancellation of order no. ${foodOrder.orderNo}`);
                    createCashBack(foodOrder.customerId, foodOrder.customerName, foodOrder.customerPhoneNo, foodOrder.customerEmail,
                        mealawePoinstUsed, `Cashback on refund of order no. ${foodOrder.orderNo}`);
                    // console.log('cancelFoodOrder mealawe points added',foodOrder.orderNo);
                }
                refund_amount = refund_amount - mealawePoinstUsed;
                addMoneyPointsInWallet(foodOrder.customerId, foodOrder.customerName, refund_amount,
                    `Points added on cancellation of order no. ${foodOrder.orderNo}`);
                resolve({ status: true, data: updatedFoodOrder });
            } else {
                resolve({ status: false, code: 100 });
            }
        }
        catch (e) {
            // console.log('cancel food order',e)
            reject(e);
        }
    });
}

const createKitchenWallet = (walletObj) => {
    return new Promise((resolve, reject) => {
        instance.api.post({
            url: '/contacts',
            data: {
                "name": walletObj.account_name,
                "email": walletObj.email,
                "contact": walletObj.phoneNo,
                "type": "vendor",
                "reference_id": `${walletObj.kitchenId}`,
                "notes": {
                    "random_key_1": walletObj.kitchenName
                }
            }
        }, (error, response) => {
            if (response) {
                instance.api.post({
                    url: '/fund_accounts',
                    data: {
                        "contact_id": response.id,
                        "account_type": "bank_account",
                        "bank_account": {
                            "name": walletObj.account_name,
                            "ifsc": walletObj.ifsc,
                            "account_number": walletObj.account_number
                        }
                    }
                }, (err, res) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(res)
                    }
                });
            } else {
                reject(error)
            }
        });
    });
}
const kitchenPayouts = (walletObj) => {
    return new Promise((resolve, reject) => {
        const withDrawalAmount = walletObj.wallet_balance;
        if (withDrawalAmount > 0) {
            // console.log('process.env.RAZOR_PAY_ACCOUNT ', process.env.RAZOR_PAY_ACCOUNT);
            // console.log('walletObj ', walletObj);
            const data = {
                account_number: `${process.env.RAZOR_PAY_ACCOUNT}`,
                fund_account_id: walletObj.fund_id,
                amount: parseInt(withDrawalAmount * 100),
                currency: "INR",
                mode: "NEFT",
                purpose: "Wallet Withdrawal",
                reference_id: `${walletObj.kitchenId}`,
                notes: {
                    "random_key_1": walletObj.kitchenName
                }
            }
            const idempotency = uuid4();
            console.log('idempotency ', idempotency);
            instance.api.post({
                url: '/payouts',
                data,
                headers: {
                    'X-Payout-Idempotency': idempotency
                }
            }, async (error, withdrawalObj) => {
                if (withdrawalObj) {
                    const walletHistoryObj = {
                        payout_id: withdrawalObj.id,
                        fund_id: withdrawalObj.fund_account_id,
                        status: withdrawalObj.status,
                        mode: withdrawalObj.mode,
                        transaction_amount: withdrawalObj.amount / 100,
                        created_at: new Date(),
                        kitchenId: walletObj.kitchenId,
                        kitchenName: walletObj.account_name,
                        wallet_balance: walletObj.wallet_balance,
                        transactionType: 'Debit',
                        remark: 'withdrawal from wallet'
                    };
                    // console.log('walletHistoryObj',walletHistoryObj);
                    try {
                        await saveKitchenTransactionHistory(walletHistoryObj);
                    } catch (error) {
                        console.log('error while saving kitchen transaction withdrawal history ', error);
                    }
                    resolve(withdrawalObj);
                } else {
                    console.log(' paymentGateway.service.js kitchenPayout ==>  ', error)
                    reject(error);
                }
            });
        } else {
            reject({ message: 'insufficient balance' })
        }
    });
}

const startPaymentProcess = (data) => {
    return new Promise(async (resolve, reject) => {
        const checkoutDetails = {
            ...data
        }
        try {
            // const { status, msg } = await foodordervalidation(data);
            if (true) {
                if (data.amount > 0) {
                    const order = await getRazorpayOrderId(data.amount, data.offer);
                    checkoutDetails.order_id = order.id;
                    checkoutDetails.receipt = order.receipt;
                    checkoutDetails.amount_due = order.amount_due / 100;
                    checkoutDetails.orderstatus = 'paymentInprogress';
                    checkoutDetails.amount = checkoutDetails.amount_due;
                    if (data.orderType === 'subscriptionParent') {
                        const transactionOrder = await orderSubscriptionService.saveOrderSubscription(checkoutDetails);
                        resolve(transactionOrder);
                    } else if (data.orderType === 'subscriptionPackage') {
                        const transactionOrder = await orderPackageService.saveOrderPackage(checkoutDetails);
                        resolve(transactionOrder);
                    } else {
                        const transactionOrder = await orderService.saveFoodOrder(checkoutDetails);
                        resolve(transactionOrder);
                    }
                } else {
                    // check for wallet ballance                        
                    checkoutDetails.order_id = 'order_' + Math.ceil(Math.random() * 10000);
                    checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000);
                    checkoutDetails.orderstatus = 'placed';
                    checkoutDetails.amount = 0;
                    if (data.orderType === 'subscriptionParent') {
                        const transactionOrder = await orderSubscriptionService.saveOrderSubscription(checkoutDetails);
                        const updatedOrder = await orderSubscriptionService.updateOrderSubscription(transactionOrder);
                        resolve(updatedOrder);
                    } else if (data.orderType === 'subscriptionPackage') {
                        const transactionOrder = await orderPackageService.saveOrderPackage(checkoutDetails);
                        const updatedOrder = await orderPackageService.updateOrderPackage(transactionOrder);
                        resolve(updatedOrder);
                    } else {
                        const transactionOrder = await orderService.saveFoodOrder(checkoutDetails);
                        const updatedOrder = await orderService.updateFoodOrder(transactionOrder);
                        resolve(updatedOrder);
                    }

                }
            } else {
                reject({ msg: msg ? msg : 'Invalid order' });
            }
        } catch (err) {
            // console.log('error while fetching checkout page or raxerpay id',err);
            reject({ msg: 'error while fetching checkout page' });
        }
    });
}

const validatePaymentTransaction = async (data) => {
    let checkoutDetails;
    if (data.orderType === 'subscriptionParent') {
        checkoutDetails = await orderSubscriptionService.getOrderSubscription(data.foodOrderId);
    } else if (data.orderType === 'subscriptionPackage') {
        checkoutDetails = await orderPackageService.getOrderPackage(data.foodOrderId);
    } else {
        checkoutDetails = await orderService.getFoodOrder(data.foodOrderId);
    }

    const successObj = {
        status: false,
        payment_id: data.razorpay_payment_id,
        order_id: data.razorpay_order_id,
        error: false
    }
    // console.log('paymentSuccess before check 2');
    if (checkoutDetails && checkoutDetails.orderstatus === 'paymentInprogress') {
        if (data && data.razorpay_payment_id) {
            const generated_signature = crypto.createHmac('sha256', process.env.RAZOR_PAY_SECRET)
                .update(checkoutDetails.order_id + "|" + data.razorpay_payment_id).digest('hex');
            checkoutDetails.order_id = data.razorpay_order_id;
            checkoutDetails.payment_id = data.razorpay_payment_id
            if (generated_signature === data.razorpay_signature) {
                checkoutDetails.orderstatus = 'placed';
                successObj.status = true;
                // console.log('validatePaymentTransaction success1');           
            } else {
                checkoutDetails.orderstatus = 'paymentFailed';
                // console.log('validatePaymentTransaction failed 2')  
            }
        } else {
            checkoutDetails.orderstatus = 'paymentFailed';
            // console.log('validatePaymentTransaction failed 3')   
        }
        if (data.orderType === 'subscriptionParent') {
            await orderSubscriptionService.updateOrderSubscription(checkoutDetails);
        } else if (data.orderType === 'subscriptionPackage') {
            await orderPackageService.updateOrderPackage(checkoutDetails);
        } else {
            await orderService.updateFoodOrder(checkoutDetails);
        }

        return successObj
    } else {
        // console.log('validatePaymentTransaction failed 4')  
        successObj.error = true;
        return successObj
    }
}

const getGatewayPaymentHistory = async (paymentOrderid) => {
    // return new Promise((resolve,reject) => {
    //     instance.api.get({
    //         url: `/orders/${paymentOrderid}/payments`            
    //       }, async (error, reponse) => {
    //            if(reponse){
    //             resolve(reponse);
    //            }else{
    //             reject({error})
    //            }
    //     });        
    // })
    return await verifyPaytmTransaction(paymentOrderid);
}

const refundGatewayPayment = async (id, order_id, amount, foodOrderId, orderType) => {
    return new Promise(async (resolve, reject) => {
        try {
            let foodOrder;
            if (orderType === 'subscriptionParent') {
                foodOrder = await orderSubscriptionService.getOrderSubscription(foodOrderId);
            } else if (orderType === 'subscriptionPackage') {
                foodOrder = await orderPackageService.getOrderPackage(foodOrderId);
            } else {
                foodOrder = await orderService.getFoodOrder(foodOrderId);
            }
            if (foodOrder && foodOrder._id) {
                const refundResponse = await refundPayment(id, order_id, amount);
                foodOrder.refund_id = refundResponse.id,
                    foodOrder.refund_amount = refundResponse.amount / 100;
                foodOrder.refund_status = 'completed';
                foodOrder.cancel_comment = 'Refund on failed Transaction';
                foodOrder.orderstatus = 'refundCompleted';
                if (orderType === 'subscriptionParent') {
                    const updatedFoodOrder = await orderService.updateOrderSubscription(foodOrder);
                    resolve(updatedFoodOrder);
                } else if (orderType === 'subscriptionPackage') {
                    const updatedFoodOrder = await orderService.updateOrderSubscription(foodOrder);
                    resolve(updatedFoodOrder);
                } else {
                    const updatedFoodOrder = await orderService.updateFoodOrder(foodOrder);
                    resolve(updatedFoodOrder);
                }
            } else {
                reject('No Order found')
            }

        } catch (e) {
            // console.log('refundGatewayPayment food order',e)
            reject(e);
        }
    });
}


const refundToUserWallet = async (foodOrderId, orderType) => {
    return new Promise(async (resolve, reject) => {
        try {
            let foodOrder;
            if (orderType === 'subscriptionParent') {
                foodOrder = await orderSubscriptionService.getOrderSubscription(foodOrderId);
            } else if (orderType === 'subscriptionPackage') {
                foodOrder = await orderPackageService.getOrderPackage(foodOrderId);
            } else {
                foodOrder = await orderService.getFoodOrder(foodOrderId);
            }
            if (foodOrder && foodOrder._id && foodOrder.orderstatus === 'paymentInprogress' && foodOrder.refund_status !== 'completed') {
                foodOrder.refund_id = Math.ceil(Math.random() * 100000);
                foodOrder.refund_amount = foodOrder.amount;
                foodOrder.refund_status = 'completed';
                foodOrder.cancel_comment = 'Refund on failed Transaction';
                foodOrder.orderstatus = 'refundCompleted';
                let updatedFoodOrder;
                if (orderType === 'subscriptionParent') {
                    updatedFoodOrder = await orderSubscriptionService.updateOrderSubscription(foodOrder);
                } else if (orderType === 'subscriptionPackage') {
                    updatedFoodOrder = await orderPackageService.updateOrderPackage(foodOrder);
                } else {
                    updatedFoodOrder = await orderService.updateFoodOrder(foodOrder);
                }
                addMoneyPointsInWallet(foodOrder.customerId, foodOrder.customerName, foodOrder.amount,
                    `Points added on refund of order no. ${foodOrder.orderNo}`);
                resolve(updatedFoodOrder);
            } else {
                reject('No Order found')
            }

        } catch (e) {
            // console.log('refundGatewayPayment food order',e)
            reject(e);
        }
    });
}

const placePaymentFailedOrder = async (foodOrderId, orderType, paymentId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let foodOrder;
            if (orderType === 'subscriptionParent') {
                foodOrder = await orderSubscriptionService.getOrderSubscription(foodOrderId);
            } else if (orderType === 'subscriptionPackage') {
                foodOrder = await orderPackageService.getOrderPackage(foodOrderId);
            } else {
                foodOrder = await orderService.getFoodOrder(foodOrderId);
            }
            if (foodOrder && foodOrder._id && foodOrder.orderstatus === 'paymentInprogress' && foodOrder.refund_status !== 'completed') {

                foodOrder.payment_id = paymentId;
                foodOrder.orderstatus = 'placed';
                let updatedFoodOrder;
                if (orderType === 'subscriptionParent') {
                    updatedFoodOrder = await orderSubscriptionService.updateOrderSubscription(foodOrder);
                } else if (orderType === 'subscriptionPackage') {
                    updatedFoodOrder = await orderPackageService.updateOrderPackage(foodOrder);
                } else {
                    updatedFoodOrder = await orderService.updateFoodOrder(foodOrder);
                }
                resolve(updatedFoodOrder);
            } else {
                reject('No Order found')
            }

        } catch (e) {
            // console.log('refundGatewayPayment food order',e)
            reject(e);
        }
    });
}

const createFoodOrderByAdmin = async (data) => {
    return new Promise(async (resolve, reject) => {
        const checkoutDetails = { ...data }
        try {
            checkoutDetails.order_id = 'order_' + Math.ceil(Math.random() * 10000);
            checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000);
            checkoutDetails.orderstatus = 'placed';
            checkoutDetails.amount = 0;
            if (data.orderType === 'subscriptionParent') {
                const transactionOrder = await orderSubscriptionService.saveOrderSubscription(checkoutDetails);
                const updatedOrder = await orderSubscriptionService.updateOrderSubscription(transactionOrder);
                resolve(updatedOrder);
            } else if (data.orderType === 'subscriptionPackage') {
                const transactionOrder = await orderPackageService.saveOrderPackage(checkoutDetails);
                const updatedOrder = await orderPackageService.updateOrderPackage(transactionOrder);
                resolve(updatedOrder);
            } else {
                const transactionOrder = await orderService.saveFoodOrder(checkoutDetails);
                const updatedOrder = await orderService.updateFoodOrder(transactionOrder);
                resolve(updatedOrder);
            }
        } catch (err) {
            // console.log('error while createFoodOrderByAdmin',err);
            reject('error while createFoodOrderByAdmin');
        }
    });
}

const startPaytmPaymentProcess = (data) => {
    return new Promise(async (resolve, reject) => {
        const checkoutDetails = {
            ...data
        }
        try {
            const { status, msg } = await foodordervalidation(data);
            if (status) {
                if (data.amount > 0) {
                    const orderId = 'orderid_' + Math.ceil(Math.random() * 10000000);
                    const { txnToken } = await getPaytmCheckSum(orderId, data.amount, data.customerPhoneNo);
                    checkoutDetails.order_id = orderId;
                    checkoutDetails.receipt = txnToken;
                    checkoutDetails.amount_due = data.amount;
                    checkoutDetails.orderstatus = 'paymentInprogress';
                    checkoutDetails.amount = data.amount;
                    if (data.orderType === 'subscriptionParent') {
                        const transactionOrder = await orderSubscriptionService.saveOrderSubscription(checkoutDetails);
                        resolve(transactionOrder);
                    } else if (data.orderType === 'subscriptionPackage') {
                        const transactionOrder = await orderPackageService.saveOrderPackage(checkoutDetails);
                        resolve(transactionOrder);
                    } else {
                        const transactionOrder = await orderService.saveFoodOrder(checkoutDetails);
                        resolve(transactionOrder);
                    }
                } else {
                    // check for wallet ballance                        
                    checkoutDetails.order_id = 'order_' + Math.ceil(Math.random() * 10000000);
                    checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000000);
                    checkoutDetails.orderstatus = 'placed';
                    checkoutDetails.amount = 0;
                    if (data.orderType === 'subscriptionParent') {
                        const transactionOrder = await orderSubscriptionService.saveOrderSubscription(checkoutDetails);
                        const updatedOrder = await orderSubscriptionService.updateOrderSubscription(transactionOrder);
                        resolve(updatedOrder);
                    } else if (data.orderType === 'subscriptionPackage') {
                        const transactionOrder = await orderPackageService.saveOrderPackage(checkoutDetails);
                        const updatedOrder = await orderPackageService.updateOrderPackage(transactionOrder);
                        resolve(updatedOrder);
                    } else {
                        const transactionOrder = await orderService.saveFoodOrder(checkoutDetails);
                        const updatedOrder = await orderService.updateFoodOrder(transactionOrder);
                        resolve(updatedOrder);
                    }

                }
            } else {
                reject({ msg: msg ? msg : 'Invalid order' });
            }
        } catch (err) {
            // console.log('error while fetching checkout page or raxerpay id',err);
            reject({ msg: 'error while fetching checkout page' });
        }
    });
}

const startBulkPaytmPaymentProcess = (data) => {
    return new Promise(async (resolve, reject) => {
        const checkoutDetails = {
            ...data
        }
        try {
            const { status, msg } = await bulkFoodordervalidation(data);
            if (status) {
                if (data.amount > 0) {
                    // console.log('more than 0')
                    const orderId = 'orderid_' + Math.ceil(Math.random() * 10000000);
                    const { txnToken } = await getPaytmCheckSum(orderId, parseFloat(parseFloat(data.amount).toFixed(2)), data.customerPhoneNo);
                    checkoutDetails.order_id = orderId;
                    checkoutDetails.receipt = txnToken;
                    checkoutDetails.orderstatus = 'paymentInprogress';
                    checkoutDetails.amount = data.amount;
                    const transactionOrder = await bulkOrderService.saveBulkFoodOrder(checkoutDetails);
                    resolve(transactionOrder);
                } else {
                    // console.log('les than 0')
                    // check for wallet ballance                        
                    checkoutDetails.order_id = 'order_' + Math.ceil(Math.random() * 10000000);
                    checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000000);
                    checkoutDetails.orderstatus = 'placed';
                    checkoutDetails.amount = 0;
                    const transactionOrder = await bulkOrderService.saveBulkFoodOrder(checkoutDetails);
                    const updatedOrder = await bulkOrderService.updateBulkFoodOrder(transactionOrder);
                    resolve(updatedOrder);
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

const startMarketPlacePaytmPaymentProcess = (data) => {
    return new Promise(async (resolve, reject) => {
        const checkoutDetails = { ...data }
        try {
            const { status, msg } = await marketPlaceOrderValidation(data);
            if (status) {
                if (data.amount > 0) {
                    // console.log('more than 0')
                    const orderId = 'orderid_' + Math.ceil(Math.random() * 10000000);
                    const { txnToken } = await getPaytmCheckSum(orderId, parseFloat(parseFloat(data.amount).toFixed(2)), data.customerPhoneNo);
                    checkoutDetails.order_id = orderId;
                    checkoutDetails.receipt = txnToken;
                    checkoutDetails.orderstatus = 'paymentInprogress';
                    checkoutDetails.amount = data.amount;
                    const transactionOrder = await saveMarketPlaceMainOrder(checkoutDetails);
                    resolve(transactionOrder);
                } else {
                    checkoutDetails.order_id = 'order_' + Math.ceil(Math.random() * 10000000);
                    checkoutDetails.receipt = 'receipt_' + Math.ceil(Math.random() * 10000000);
                    checkoutDetails.orderstatus = 'placed';
                    checkoutDetails.amount = 0;
                    const transactionOrder = await saveMarketPlaceMainOrder(checkoutDetails);
                    const updatedOrder = await updateMarketPlaceMainAndItemOrder(transactionOrder);

                    resolve(updatedOrder);
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

const validatePaytmPaymentTransaction = async (data) => {
    let checkoutDetails;
    if (data.orderType === 'subscriptionParent') {
        checkoutDetails = await orderSubscriptionService.getOrderSubscription(data.foodOrderId);
    } else if (data.orderType === 'subscriptionPackage') {
        checkoutDetails = await orderPackageService.getOrderPackage(data.foodOrderId);
    }
    else if (data.orderType === 'bulkMeals' || data.orderType === 'individualMeals'
        || data.orderType === 'bulkSnacks' || data.orderType === 'individualSnacks'
        || data.orderType === 'predefinedSnackbox' || data.orderType === 'customSnackbox') {
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
    if (checkoutDetails) {
        console.log('validatePaytmPaymentTransaction before check 2', data.orderNo, checkoutDetails.orderstatus);
    }
    if (checkoutDetails && (checkoutDetails.orderstatus === 'paymentInprogress' || checkoutDetails.orderstatus === 'paymentFailed')) {
        const { status, txnId } = await verifyPaytmTransaction(checkoutDetails.order_id);
        if (status) {
            checkoutDetails.payment_id = txnId;
            checkoutDetails.orderstatus = 'placed';
            successObj.status = true;
            successObj.payment_id = txnId;
            successObj.order_id = checkoutDetails.order_id;
            // console.log('validatePaytmPaymentTransaction success1');       
        } else {
            checkoutDetails.orderstatus = 'paymentFailed';
            // console.log('validatePaytmPaymentTransaction failed 3')   
        }
        if (data.orderType === 'subscriptionParent') {
            await orderSubscriptionService.updateOrderSubscription(checkoutDetails);
        } else if (data.orderType === 'subscriptionPackage') {
            await orderPackageService.updateOrderPackage(checkoutDetails);
        } else if (data.orderType === 'bulkMeals' || data.orderType === 'individualMeals'
            || data.orderType === 'bulkSnacks' || data.orderType === 'individualSnacks'
            || data.orderType === 'predefinedSnackbox' || data.orderType === 'customSnackbox') {
            checkoutDetails = await bulkOrderService.updateBulkFoodOrder(checkoutDetails);
        } else if (data.orderType === 'marketPlaceMain') {
            checkoutDetails = await updateMarketPlaceMainAndItemOrder(checkoutDetails);
        } else {
            await orderService.updateFoodOrder(checkoutDetails);
        }
        return successObj
    } else {
        // console.log('validatePaytmPaymentTransaction failed 4')  
        successObj.error = true;
        return successObj
    }
}

const validateCronePaytmPaymentTransaction = async (checkoutDetails, failOrder) => {

    const successObj = {
        status: false,
        error: false
    }
    if (checkoutDetails && (checkoutDetails.orderstatus === 'paymentInprogress' || checkoutDetails.orderstatus === 'paymentFailed')) {
        const { status, txnId } = await verifyPaytmTransaction(checkoutDetails.order_id);
        let update = false;
        if (status) {
            checkoutDetails.payment_id = txnId;
            checkoutDetails.orderstatus = 'placed';
            successObj.status = true;
            successObj.payment_id = txnId;
            successObj.order_id = checkoutDetails.order_id;
            update = true;
            // console.log('validateCronePaytmPaymentTransaction success1');       
        } else {
            if (failOrder) {
                update = true;
                checkoutDetails.orderstatus = 'paymentFailed';
                checkoutDetails.stopPaymentValidation = true;
                // console.log('validateCronePaytmPaymentTransaction failed 3'); 
            }
        }
        if (update) {
            if (checkoutDetails.orderType === 'subscriptionParent') {
                await orderSubscriptionService.updateOrderSubscription(checkoutDetails);
            } else if (checkoutDetails.orderType === 'subscriptionPackage') {
                await orderPackageService.updateOrderPackage(checkoutDetails);
            }
            else if (checkoutDetails.orderType === 'bulkMeals' || checkoutDetails.orderType === 'individualMeals'
                || checkoutDetails.orderType === 'bulkSnacks' || checkoutDetails.orderType === 'individualSnacks'
                || checkoutDetails.orderType === 'predefinedSnackbox' || checkoutDetails.orderType === 'customSnackbox') {
                await bulkOrderService.updateBulkFoodOrder(checkoutDetails);
            } else if (checkoutDetails.orderType === 'marketPlaceMain') {
                await updateMarketPlaceMainAndItemOrder(checkoutDetails);
            } else {
                await orderService.updateFoodOrder(checkoutDetails);
            }
        }
        return successObj
    } else {
        // console.log('validateCronePaytmPaymentTransaction failed 4')  
        successObj.error = true;
        return successObj
    }
}

module.exports = {
    paymentSuccess,
    getCheckOutDetails,
    refundPayment,
    cancelFoodOrder,
    createKitchenWallet,
    kitchenPayouts,
    createFoodOrder,
    startPaymentProcess,
    validatePaymentTransaction,
    getGatewayPaymentHistory,
    refundGatewayPayment,
    refundToUserWallet,
    placePaymentFailedOrder,
    createFoodOrderByAdmin,
    startPaytmPaymentProcess,
    startBulkPaytmPaymentProcess,
    validatePaytmPaymentTransaction,
    validateCronePaytmPaymentTransaction,
    startMarketPlacePaytmPaymentProcess
}