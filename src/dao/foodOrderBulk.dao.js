const FoodOrderBulk = require('../model/foodOrderBulk.model');
const { getTodayStartTime, getLocalMidDate } = require('../util/date-util');

const saveFoodOrderBulk = async (foodOrderBulk) => {
    const nFoodOrderBulk = new FoodOrderBulk();
    nFoodOrderBulk.orderNo = foodOrderBulk.orderNo;
    nFoodOrderBulk.customerId = foodOrderBulk.customerId;
    nFoodOrderBulk.customerName = foodOrderBulk.customerName;
    nFoodOrderBulk.customerPhoneNo = foodOrderBulk.customerPhoneNo;
    nFoodOrderBulk.customerEmail = foodOrderBulk.customerEmail;
    nFoodOrderBulk.groupType = foodOrderBulk.groupType;
    nFoodOrderBulk.companyName = foodOrderBulk.companyName;
    nFoodOrderBulk.numberOfPeople = foodOrderBulk.numberOfPeople;
    nFoodOrderBulk.occassion = foodOrderBulk.occassion;
    nFoodOrderBulk.address = foodOrderBulk.address;
    nFoodOrderBulk.mealType = foodOrderBulk.mealType;
    nFoodOrderBulk.orderDate = getLocalMidDate(new Date());
    nFoodOrderBulk.orderComplitionDate = getLocalMidDate(foodOrderBulk.orderComplitionDate);
    nFoodOrderBulk.orderComplitionTime = new Date(foodOrderBulk.orderComplitionTime);
    nFoodOrderBulk.orderStatus = 'placed';
    nFoodOrderBulk.clusterId = foodOrderBulk.clusterId;
    nFoodOrderBulk.clusterName = foodOrderBulk.clusterName;
    const isInserted = await nFoodOrderBulk.save();
    return isInserted;
}
const updateBulkOrderStatus = async (id, bulkOrder) => {
    const order = await FoodOrderBulk.findOne({ _id: id });
    if (order && order._id) {
        const bulkFoodOrder = {};
        bulkFoodOrder.orderStatus = bulkOrder.orderStatus || order.orderStatus;
        bulkFoodOrder.comment = bulkOrder.comment || order.comment;
        const update = await FoodOrderBulk.findOneAndUpdate({ _id: order._id }, { $set: bulkFoodOrder }, { new: true });
        return update;
    } else {
        // console.log('BulkOrderStatus not found ', order);
        return order;
    }
}

const searchBulkOrderList = async (searchObj, page) => {
    const limit = 50;
    const condition = {};
    if (searchObj.orderStatus && searchObj.orderStatus.length > 0) {
        condition.orderStatus = { $in: [...searchObj.orderStatus] }
    }
    if (searchObj.orderNo) {
        condition.orderNo = searchObj.orderNo;
    }
    if (searchObj.customerName) {
        const regexText = new RegExp(searchObj.customerName, 'i');
        condition.customerName = regexText;
    }
    if (searchObj.customerPhoneNo) {
        const regexText = new RegExp(searchObj.customerPhoneNo, 'i');
        condition.customerPhoneNo = regexText;
    }
    if (searchObj.customerEmail) {
        const regexText = new RegExp(searchObj.customerEmail, 'i');
        condition.customerEmail = regexText;
    }
    if (searchObj.fromDate && searchObj.toDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate), $lte: new Date(searchObj.toDate) }
    }
    // console.log('searchBulkOrderList ',condition);
    return await FoodOrderBulk.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const getCustomerPastBulkOrders = async (customerId, page) => {
    let limit = 30;
    let today = getTodayStartTime();
    let tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let condition = {
        customerId,
        orderDate: { $lt: tomorrow }
    };
    const orderList = await FoodOrderBulk.find(condition)
        .sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
    return orderList;
};

const getCurrentBulkOrdersList = async (page, limit) => {
    let today = getTodayStartTime();
    const condition = { orderDate: { $gte: today } };
    return await FoodOrderBulk.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const getCurrentBulkOrdersCount = async () => {
    let today = getTodayStartTime();
    const condition = { orderDate: { $gte: today } };
    const count = await FoodOrderBulk.count(condition).sort({ _id: -1 });
    return { count };
}

module.exports = {
    saveFoodOrderBulk,
    updateBulkOrderStatus,
    searchBulkOrderList,
    getCustomerPastBulkOrders,
    getCurrentBulkOrdersList,
    getCurrentBulkOrdersCount
}