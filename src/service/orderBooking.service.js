const dao = require('../dao/orderBooking.dao');
const counterDao = require('../dao/counters.dao');

const saveOrderBooking = async (orderBooking) => {
    return new Promise(async (resolve, reject) => {
        try {
            const bookingOrderNo = await counterDao.getNextSequenceValue('Order_BOOKING_No');
            orderBooking.bookingOrderNo = bookingOrderNo;
            const newBookingOrder = await dao.saveOrderBooking(orderBooking);
            resolve(newBookingOrder);
        }
        catch (e) {
            reject(e);
        }
    });
};
const updateOrderBooking = async (orderBooking) => {
    return await dao.updateOrderBooking(orderBooking);
};
const searchOrderBookingList = async (searchObj, page) => {
    return await dao.searchOrderBookingList(searchObj, page);
};

const isSpecialOrderBooked = async (customerId, specialMenuId) => {
    return await dao.isSpecialOrderBooked(customerId, specialMenuId);
};

module.exports = {
    saveOrderBooking,
    updateOrderBooking,
    searchOrderBookingList,
    isSpecialOrderBooked
}