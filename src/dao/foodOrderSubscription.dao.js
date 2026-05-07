const FoodOrderSubscription = require('../model/foodOrderSubscription.model');
const { getTodayStartTime } = require('../util/date-util');
const { performMultiOrderTransfer } = require('./foodorder.dao');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const saveOrderSubscription = async (orderSubscription) => {
    const nOrderSubscription = new FoodOrderSubscription();
    nOrderSubscription.orderNo = orderSubscription.orderNo;
    nOrderSubscription.orderType = orderSubscription.orderType;
    nOrderSubscription.customerId = orderSubscription.customerId;
    nOrderSubscription.customerName = orderSubscription.customerName;
    nOrderSubscription.customerLocation = orderSubscription.customerLocation;
    nOrderSubscription.customerPhoneNo = orderSubscription.customerPhoneNo;
    nOrderSubscription.customerEmail = orderSubscription.customerEmail;
    nOrderSubscription.kitchenId = orderSubscription.kitchenId;
    nOrderSubscription.kitchenName = orderSubscription.kitchenName;
    nOrderSubscription.kitchenPhoneNo = orderSubscription.kitchenPhoneNo;
    nOrderSubscription.kitchenAddress = orderSubscription.kitchenAddress;
    nOrderSubscription.kitchenGeolocation = orderSubscription.kitchenGeolocation;
    nOrderSubscription.orderCreatedBy = orderSubscription.orderCreatedBy;
    nOrderSubscription.deliveryVendor = orderSubscription.deliveryVendor;
    nOrderSubscription.orderDate = new Date(orderSubscription.orderDate);
    nOrderSubscription.amount = orderSubscription.amount;
    nOrderSubscription.itemAmount = orderSubscription.itemAmount;
    nOrderSubscription.deliveryCharges = orderSubscription.deliveryCharges;
    nOrderSubscription.taxes = orderSubscription.taxes;
    nOrderSubscription.orderstatus = orderSubscription.orderstatus;
    nOrderSubscription.feedbackProvided = false
    nOrderSubscription.itemList = orderSubscription.itemList;
    nOrderSubscription.addOns = orderSubscription.addOns;
    nOrderSubscription.specialRequest = orderSubscription.specialRequest;
    nOrderSubscription.nonContactDelivery = orderSubscription.nonContactDelivery;
    nOrderSubscription.payment_id = orderSubscription.payment_id;
    nOrderSubscription.order_id = orderSubscription.order_id;
    nOrderSubscription.receipt = orderSubscription.receipt;
    nOrderSubscription.discount = orderSubscription.discount;
    nOrderSubscription.kitchenDiscount = orderSubscription.kitchenDiscount;
    nOrderSubscription.skipCommission = orderSubscription.skipCommission;
    nOrderSubscription.moneyWalletPointsUsed = orderSubscription.moneyWalletPointsUsed;
    nOrderSubscription.mealaweWalletPointsUsed = orderSubscription.mealaweWalletPointsUsed;
    nOrderSubscription.distance = orderSubscription.distance;
    nOrderSubscription.statusHistory = [{ orderstatus: orderSubscription.orderstatus, updatedOn: new Date() }];
    nOrderSubscription.subscriptionDays = orderSubscription.subscriptionDays;
    nOrderSubscription.dailyOrderList = orderSubscription.dailyOrderList;
    nOrderSubscription.subscriptionStartDate = orderSubscription.subscriptionStartDate;
    nOrderSubscription.mealType = orderSubscription.mealTime;
    nOrderSubscription.subscriptionSlot = orderSubscription.subscriptionSlot;
    nOrderSubscription.couponCode = orderSubscription.couponCode;
    nOrderSubscription.mealaweWalletPointsUsed = orderSubscription.mealaweWalletPointsUsed;
    nOrderSubscription.mealaweDeliveryDiscount = orderSubscription.mealaweDeliveryDiscount;
    nOrderSubscription.mealaweItemDiscount = orderSubscription.mealaweItemDiscount;
    nOrderSubscription.mealaweTotalAmt = orderSubscription.mealaweTotalAmt;
    nOrderSubscription.mealaweKitchenDiscount = orderSubscription.mealaweKitchenDiscount;
    nOrderSubscription.voucherCode = orderSubscription.voucherCode;
    nOrderSubscription.voucherDiscount = orderSubscription.voucherDiscount;
    nOrderSubscription.extraDiscount = orderSubscription.extraDiscount;
    nOrderSubscription.clusterId = orderSubscription.clusterId;
    nOrderSubscription.clusterName = orderSubscription.clusterName;
    const orderdetail = await nOrderSubscription.save();
    return orderdetail;
}

const updateOrderSubscription = async (foodOrder) => {
    const updatedBy = foodOrder.updatedBy;
    const updateByType = foodOrder.updateByType;
    if (foodOrder.statusHistory) {
        foodOrder.statusHistory.push({ orderstatus: foodOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
    } else {
        foodOrder.statusHistory = [];
        foodOrder.statusHistory.push({ orderstatus: foodOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
    }
    return FoodOrderSubscription.findOneAndUpdate({ _id: foodOrder._id }, { $set: foodOrder }, { new: true })
}

const getOrderSubscription = async (id) => {
    return await FoodOrderSubscription.findById(id);
}

const getCustomerSubscriptionList = async (customerId, page) => {
    let limit = 30;
    const orderList = await FoodOrderSubscription.find({ customerId })
        .sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
    return orderList;
}
const getKitchenSubDashboardCount = async (kitchenId, clientDate, onlyCount) => {
    let today = getTodayStartTime();
    let condition = {
        kitchenId,
        orderstatus: 'placed'
    };
    // const orderdetail = await FoodOrderSubscription.find(condition);
    // return orderdetail;

    if (onlyCount === 'yes') {
        const count = await FoodOrderSubscription.count(condition);
        return { count };
    } else {
        const orderdetail = await FoodOrderSubscription.find(condition).sort({ _id: -1 });
        return orderdetail;
    }
}

const getCustomerCurrentSubOrders = async (customerId, clientDate) => {
    const orderStatusList = ['placed', 'accepted'];
    let today = getTodayStartTime();
    let tomorrow = getTodayStartTime();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let condition = {
        customerId,
        orderstatus: { $in: [...orderStatusList] },
        orderDate: { $gte: today, $lt: tomorrow }
    };
    const orderList = await FoodOrderSubscription.find(condition).sort({ _id: -1 });
    return orderList;
}

const getKitchenPastSubscriptionOrders = async (kitchenId, page) => {
    const limit = 20;
    const orderStatusList = ['placed', 'accepted'];
    let condition = {
        kitchenId,
        orderstatus: { $in: [...orderStatusList] }
    };
    return await FoodOrderSubscription.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const getCurrentSubscriptionCount = async (clusterList) => {
    const fullResult = {
        'paymentInprogress': 0,
        'paymentFailed': 0,
        'newOrder': 0,
        'acceptedOrder': 0,
        'autoCancelled': 0,
        'rejectedByKitchen': 0,
        'cancelledByUser': 0
    };
    let today = getTodayStartTime();
    const condition = {
        $or: [{ orderDate: { $gte: today } }]
    };
    if (clusterList && clusterList.length > 0) {
        condition.clusterId = { $in: clusterList };
    }
    const result = await FoodOrderSubscription.aggregate(
        [
            {
                '$facet': {
                    'paymentInprogress': [{ $match: { orderstatus: 'paymentInprogress', ...condition } }, { $count: 'paymentInprogress' }],
                    'paymentFailed': [{ $match: { orderstatus: 'paymentFailed', ...condition } }, { $count: 'paymentFailed' }],
                    'newOrder': [{ $match: { orderstatus: 'placed', ...condition } }, { $count: 'newOrder' }],
                    'acceptedOrder': [{ $match: { orderstatus: 'accepted', ...condition } }, { $count: 'acceptedOrder' }],
                    'autoCancelled': [{ $match: { orderstatus: { $in: ['autoCancelled'] }, ...condition } }, { $count: 'autoCancelled' }],
                    'rejectedByKitchen': [{ $match: { orderstatus: { $in: ['rejectedByKitchen'] }, ...condition } }, { $count: 'rejectedByKitchen' }],
                    'cancelledByUser': [{ $match: { orderstatus: { $in: ['cancelledByUser'] }, ...condition } }, { $count: 'cancelledByUser' }]
                }
            },
            {
                '$project': {
                    'paymentInprogress': { '$arrayElemAt': ['$paymentInprogress.paymentInprogress', 0] },
                    'paymentFailed': { '$arrayElemAt': ['$paymentFailed.paymentFailed', 0] },
                    'newOrder': { '$arrayElemAt': ['$newOrder.newOrder', 0] },
                    'acceptedOrder': { '$arrayElemAt': ['$acceptedOrder.acceptedOrder', 0] },
                    'autoCancelled': { '$arrayElemAt': ['$autoCancelled.autoCancelled', 0] },
                    'rejectedByKitchen': { '$arrayElemAt': ['$rejectedByKitchen.rejectedByKitchen', 0] },
                    'cancelledByUser': { '$arrayElemAt': ['$cancelledByUser.cancelledByUser', 0] }
                }
            }
        ]

    );
    return (result && result.length > 0) ? { ...fullResult, ...result[0] } : { ...fullResult };
}

const getCurrentSubOrdersList = async (status, clientDate, page, limit) => {
    let today = getTodayStartTime();
    const condition = {
        orderstatus: status,
        $or: [{ orderDate: { $gte: today } }]
    };
    // const condition = {};
    return await FoodOrderSubscription.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const updateSubscriptionFoodOrderDate = async (id, foodOrderId, orderDate) => {
    return FoodOrderSubscription.findOneAndUpdate({ _id: id, 'dailyOrderList.foodOrderId': foodOrderId },
        { $set: { 'dailyOrderList.$.orderDate': orderDate }, $push: { statusHistory: { orderstatus: 'rescheduled', updatedOn: new Date() } } },
        { new: true });
}

const performSubscriptionOrderTransfer = async (tranferredOrder) => {
    const order = {};
    order.kitchenId = tranferredOrder.kitchenId;
    order.kitchenName = tranferredOrder.kitchenName;
    order.kitchenPhoneNo = tranferredOrder.kitchenPhoneNo;
    order.kitchenAddress = tranferredOrder.kitchenAddress;
    order.kitchenGeolocation = tranferredOrder.kitchenGeolocation;
    order.distance = tranferredOrder.distance;
    order.orderTransferred = tranferredOrder.orderTransferred;
    order.transferHistory = tranferredOrder.transferHistory;
    const ids = [];
    const tranferredFoodOrderObj = {};
    tranferredFoodOrderObj.kitchenId = tranferredOrder.kitchenId;
    tranferredFoodOrderObj.kitchenName = tranferredOrder.kitchenName;
    tranferredFoodOrderObj.kitchenPhoneNo = tranferredOrder.kitchenPhoneNo;
    tranferredFoodOrderObj.kitchenAddress = tranferredOrder.kitchenAddress;
    tranferredFoodOrderObj.kitchenGeolocation = tranferredOrder.kitchenGeolocation;
    tranferredFoodOrderObj.distance = tranferredOrder.distance;
    tranferredFoodOrderObj.transferExtraAmt = tranferredOrder.transferExtraAmt;
    tranferredFoodOrderObj.reduceExtraAmt = tranferredOrder.reduceExtraAmt;
    tranferredFoodOrderObj.orderTransferred = tranferredOrder.orderTransferred;
    tranferredFoodOrderObj.transferHistory = tranferredOrder.transferHistory;
    tranferredOrder.dailyOrderList.forEach(foodOrder => {
        if (foodOrder.orderTransferred) {
            ids.push(foodOrder.foodOrderId);
        }
    });
    // console.log('performMultiOrderTransfer',ids,tranferredFoodOrderObj);
    if (ids.length > 0) {
        await performMultiOrderTransfer(ids, tranferredFoodOrderObj);
    }
    return await FoodOrderSubscription.findOneAndUpdate({ _id: tranferredOrder._id },
        { $set: order }, { new: true });
}

const getSubscriptionRefundOrders = async () => {
    const orderdetail = await FoodOrderSubscription.find({ orderstatus: 'paymentInprogress', stopRefundProcess: { $ne: true } }).sort({ _id: -1 });
    return orderdetail;
};

const searchSubscriptionFoodOrderList = async (searchObj, page) => {
    const limit = 50;
    const condition = {};
    if (searchObj.orderStatus && searchObj.orderStatus.length > 0) {
        condition.orderstatus = { $in: [...searchObj.orderStatus] }
    }
    if (searchObj.orderNo) {
        condition.orderNo = searchObj.orderNo;
    }
    if (searchObj.customerName) {
        const regexText = new RegExp(searchObj.customerName, 'i');
        condition.customerName = regexText;
    }
    if (searchObj.kitchenName) {
        const regexText = new RegExp(searchObj.kitchenName, 'i');
        condition.kitchenName = regexText;
    }
    if (searchObj.fromDate && searchObj.toDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate), $lte: new Date(searchObj.toDate) }
    }
    return await FoodOrderSubscription.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}


const updateRMInfo = async (orderNo, rmInfo) => {
    const update = await FoodOrderSubscription.findOneAndUpdate({ orderNo }, { $set: { rmInfo } }, { new: true });
    return update;
}

module.exports = {
    saveOrderSubscription,
    updateOrderSubscription,
    getOrderSubscription,
    getCustomerSubscriptionList,
    getKitchenSubDashboardCount,
    getCustomerCurrentSubOrders,
    getKitchenPastSubscriptionOrders,
    getCurrentSubscriptionCount,
    getCurrentSubOrdersList,
    updateSubscriptionFoodOrderDate,
    performSubscriptionOrderTransfer,
    getSubscriptionRefundOrders,
    searchSubscriptionFoodOrderList,
    updateRMInfo
}