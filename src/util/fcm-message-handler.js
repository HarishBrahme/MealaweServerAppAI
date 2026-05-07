const fcmService = require('../service/fcmCloudMessage.service')
const { httpFcmMessage } = require('./http-api-handler');

const mealawekey = require("../config/serviceAccountKey-mealawe.json");
const kitchenkey = require("../config/serviceAccountKey-mealawekitchen.json");
const { google } = require('googleapis');

const orderStatusMapper = (orderNo) => {
    return {
        'paymentFailed': `Payment transaction of your order no. ${orderNo} is failed`,
        'placed': `A new order no. ${orderNo} has been placed`,
        'accepted': `Your order no. ${orderNo} has been accepted`,
        'inprogress': `Your order no. ${orderNo} is in progress`,
        'completed': `Your order no. ${orderNo} has been completed`,
        'cancelled': `Your order no. ${orderNo} has been cancelled`,
        'preparing': `Your order no. ${orderNo} is being prepared`,
        'readyToDelivery': `Your order no. ${orderNo} is ready for delivery`,
        'deliveryBoyAssigned': `Delivery boy has been assinged to your order no. ${orderNo}`,
        'handedOverToDeliveryBoy': `Your order no. ${orderNo} is handed over to delivery boy`,
        'onTheWay': `Your order no. ${orderNo} is on the way`,
        'delivered': `Your order no. ${orderNo} has been delivered`,
        'cancelledByKitchen': `Your order no. ${orderNo} has been cancelled by Kitchen`,
        'rejectedByKitchen': `Your order no. ${orderNo} has been cancelled by Kitchen`,
        'cancelledByUser': `Your order no. ${orderNo} has been cancelled`,
        'autoCancelled': `Your order no. ${orderNo} has been auto cancelled, as kitchen has not accepted within mealawe's standard timeframe`,
        'refundCompleted': `Payment of order no. ${orderNo} has been refunded to your bank account`,
    }
}
const deliveryOrderStatusMapper = (orderNos) => {
    return {
        'runner_cancelled': `Previous delivery process for order no. ${orderNos} has been cancelled, kindly process a new delivery process`,
        'reached_for_pickup': `Delivery boy has reached to your address for order no. ${orderNos}, kindly coordinate to handover your orders`,
        'pickup_complete': `Order pickup for order no. ${orderNos} is completed, order amount will be credit in your wallet soon`,
        'delivered': `Order delivery for order no. ${orderNos} is completed`
    }
}
const transactionStatusMapper = (amount) => {
    return {
        'kitchen_credit': `Amount Rs. ${amount} has been credited in your Ledger`,
        'kitchen_debit': `Amount Rs. ${amount} has been transferred in your account from your money wallet`,
        'kitchen_mealawe_credit': `${amount} mealawe points have been credited in your mealawe wallet`,
        'kitchen_mealawe_debit': `You have redeemed ${amount} mealawe points from your mealawe wallet`,
        'user_credit': `${amount} mealawe points have been credited in your money wallet`,
        'user_debit': `You have redeemed ${amount} mealawe points from your money wallet`,
        'user_mealawe_credit': `${amount} cashback points have been credited`,
        'user_mealawe_debit': `You have redeemed ${amount} cashback points`,
    }
}

const sendFcmMessage = (status, orderNo, customerId, type) => {
    const fcmMessage = orderStatusMapper(orderNo)[status];
    getfcmToken(customerId, fcmMessage, 'Order Status', type);
}

const sendDeliveryFcmMessage = (status, orderNo, customerId, type) => {
    const fcmMessage = deliveryOrderStatusMapper(orderNo)[status];
    getfcmToken(customerId, fcmMessage, 'Delivery Update', type);
}

const sendTransactionFcmMessage = (status, amount, customerId, type) => {
    const fcmMessage = transactionStatusMapper(amount)[status];
    getfcmToken(customerId, fcmMessage, 'Wallet Update', type);
}
const sendGenericFcmMessage = (msg, customerId, type) => {
    if (type === 'USER') {
        getfcmToken(customerId, msg, 'Mealawe', type);
    } else if (type === 'KITCHEN') {
        getfcmToken(customerId, msg, 'Mealawe Chef', type);
    }
}

const getfcmAuthorizationToken = async (type) => {
    const key = {};
    if (type === 'USER') {
        key.client_email = mealawekey.client_email;
        key.private_key = mealawekey.private_key;
    } else if (type === 'KITCHEN') {
        key.client_email = kitchenkey.client_email;
        key.private_key = kitchenkey.private_key;
    }
    return new Promise(function (resolve, reject) {
        const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
        const SCOPES = [MESSAGING_SCOPE];
        const jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key,
            SCOPES,
            null
        );
        jwtClient.authorize(function (err, tokens) {
            if (err) {
                reject(err);
                return;
            }
            resolve(tokens.access_token);
        });
    });
}

const getfcmToken = async (profileId, fcmMessage, title, type) => {
    try {
        const authToken = await getfcmAuthorizationToken(type);
        if (authToken) {
            const fcmTokenObj = await fcmService.getToken(profileId);
            if (fcmTokenObj && fcmTokenObj.fcmToken) {
                httpFcmMessage(fcmTokenObj.fcmToken, authToken, fcmMessage, title, type)
            }
        }
    } catch (error) {
        console.log('error while sending FCM', error);
    }
}



module.exports = { sendFcmMessage, sendDeliveryFcmMessage, sendTransactionFcmMessage, sendGenericFcmMessage }