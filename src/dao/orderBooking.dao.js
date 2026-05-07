const OrderBooking = require('../model/orderBooking.model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const saveOrderBooking = async (orderBooking) => {
    const nOrderBooking = new OrderBooking();
    nOrderBooking.bookingOrderNo = orderBooking.bookingOrderNo;
    nOrderBooking.orderNo = orderBooking.orderNo;
    nOrderBooking.customerId = orderBooking.customerId;
    nOrderBooking.customerName = orderBooking.customerName;
    nOrderBooking.customerLocation = orderBooking.customerLocation;
    nOrderBooking.customerPhoneNo = orderBooking.customerPhoneNo;
    nOrderBooking.customerEmail = orderBooking.customerEmail;
    nOrderBooking.kitchenId = orderBooking.kitchenId;
    nOrderBooking.kitchenName = orderBooking.kitchenName;
    nOrderBooking.kitchenPhoneNo = orderBooking.kitchenPhoneNo;
    nOrderBooking.kitchenAddress = orderBooking.kitchenAddress;
    nOrderBooking.kitchenGeolocation = orderBooking.kitchenGeolocation;
    nOrderBooking.orderType = orderBooking.orderType;
    nOrderBooking.mealType = orderBooking.mealType;
    nOrderBooking.orderDate = new Date(orderBooking.orderDate);
    if (orderBooking.orderType === 'advance') {
        nOrderBooking.orderComplitionDate = new Date(orderBooking.orderComplitionDate);
        nOrderBooking.orderComplitionTime = new Date(orderBooking.orderComplitionTime);
    }
    nOrderBooking.amount = orderBooking.amount;
    nOrderBooking.itemAmount = orderBooking.itemAmount;
    nOrderBooking.deliveryCharges = orderBooking.deliveryCharges;
    nOrderBooking.taxes = orderBooking.taxes;
    nOrderBooking.bookingstatus = 'booked';

    nOrderBooking.itemList = orderBooking.itemList;
    nOrderBooking.addOns = orderBooking.addOns;
    nOrderBooking.specialRequest = orderBooking.specialRequest;
    nOrderBooking.nonContactDelivery = orderBooking.nonContactDelivery;

    nOrderBooking.discount = orderBooking.discount;
    nOrderBooking.kitchenDiscount = orderBooking.kitchenDiscount;
    nOrderBooking.moneyWalletPointsUsed = orderBooking.moneyWalletPointsUsed;
    nOrderBooking.mealaweWalletPointsUsed = orderBooking.mealaweWalletPointsUsed;
    nOrderBooking.mealaweDeliveryDiscount = orderBooking.mealaweDeliveryDiscount;
    nOrderBooking.mealaweItemDiscount = orderBooking.mealaweItemDiscount;
    nOrderBooking.mealaweTotalAmt = orderBooking.mealaweTotalAmt;
    nOrderBooking.mealaweKitchenDiscount = orderBooking.mealaweKitchenDiscount;
    nOrderBooking.distance = orderBooking.distance;
    nOrderBooking.slotStartTime = orderBooking.slotStartTime;
    nOrderBooking.slotEndTime = orderBooking.slotEndTime;
    nOrderBooking.specialMenuId = orderBooking.specialMenuId;

    const orderdetail = await nOrderBooking.save();
    return orderdetail;
}
const updateOrderBooking = async (orderBooking) => {
    return OrderBooking.findOneAndUpdate({ _id: orderBooking._id }, { $set: orderBooking }, { new: true });
}

const searchOrderBookingList = async (searchObj, page) => {
    const limit = 50;
    const condition = {};
    if (searchObj.orderStatus && searchObj.orderStatus.length > 0) {
        condition.bookingstatus = { $in: [...searchObj.orderStatus] }
    }
    if (searchObj.bookingOrderNo) {
        condition.bookingOrderNo = searchObj.bookingOrderNo;
    }
    if (searchObj.customerName) {
        const regexText = new RegExp(searchObj.customerName, 'i');
        condition.customerName = regexText;
    }
    if (searchObj.kitchenName) {
        const regexText = new RegExp(searchObj.kitchenName, 'i');
        condition.kitchenName = regexText;
    }
    if (searchObj.bookingstatus) {
        const regexText = new RegExp(searchObj.bookingstatus, 'i');
        condition.bookingstatus = regexText;
    }
    if (searchObj.fromDate && searchObj.toDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate), $lte: new Date(searchObj.toDate) }
    }
    return await OrderBooking.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const isSpecialOrderBooked = async (customerId, specialMenuId) => {
    let orderBooked = false;
    const bookingOrder = await OrderBooking.findOne({ customerId, specialMenuId });
    if (bookingOrder && bookingOrder._id) {
        orderBooked = true;
    }
    return { orderBooked }
}

module.exports = {
    saveOrderBooking,
    updateOrderBooking,
    searchOrderBookingList,
    isSpecialOrderBooked
}
