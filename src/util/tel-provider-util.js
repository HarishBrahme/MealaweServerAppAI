const { exotelApisHttpCall } = require('./http-api-handler');
const { getKitchenPartner } = require('./../dao/kitchenPartner.dao');
const { getFoodOrder } = require('./../dao/foodorder.dao');
const callCounterList = {};

const callKitchen = (orderId) => {
    try {
        // console.log('callExotelApi outside ',orderId);
        callExotelApi(orderId);
    } catch (error) {
        // console.log('Error while calling kitchen ', error);
    }
}

const callExotelApi = (orderId) => {
    setTimeout(async () => {
        const order = await getFoodOrder(orderId);
        // console.log('callExotelApi inside ',orderId,order.orderstatus);
        if (order && order._id && order.orderstatus === 'placed' && order.kitchenPhoneNo) {
            // console.log('exotelApisHttpCall ',order.kitchenPhoneNo);
            exotelApisHttpCall(order.kitchenPhoneNo);
            callExotelApi(orderId);
        }
    }, 1000 * 60 * 5);
}

module.exports = { callKitchen }