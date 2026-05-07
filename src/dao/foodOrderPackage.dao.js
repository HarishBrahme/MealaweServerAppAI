const FoodOrderPackage = require('../model/foodOrderPackage.model');
const FoodOrder = require('../model/foodOrder.model');
const { performMultiOrderTransfer } = require('./foodorder.dao');
const { getTodayStartTime, getLocalMidDate } = require('../util/date-util');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const saveOrderPackage = async (orderPackage) => {
    const nOrderPackage = new FoodOrderPackage();
    nOrderPackage.orderNo = orderPackage.orderNo;
    nOrderPackage.orderType = orderPackage.orderType;
    nOrderPackage.customerId = orderPackage.customerId;
    nOrderPackage.customerName = orderPackage.customerName;
    nOrderPackage.customerLocation = orderPackage.customerLocation;
    nOrderPackage.customerPhoneNo = orderPackage.customerPhoneNo;
    nOrderPackage.customerEmail = orderPackage.customerEmail;
    nOrderPackage.orderCreatedBy = orderPackage.orderCreatedBy;
    nOrderPackage.deliveryVendor = orderPackage.deliveryVendor;
    nOrderPackage.orderDate = getLocalMidDate(new Date());
    nOrderPackage.amount = orderPackage.amount;
    nOrderPackage.mealaweTotalAmt = orderPackage.mealaweTotalAmt;
    nOrderPackage.discount = orderPackage.discount;
    nOrderPackage.orderstatus = orderPackage.orderstatus;
    nOrderPackage.mealPackage = orderPackage.mealPackage;
    nOrderPackage.specialRequest = orderPackage.specialRequest;
    nOrderPackage.payment_id = orderPackage.payment_id;
    nOrderPackage.order_id = orderPackage.order_id;
    nOrderPackage.receipt = orderPackage.receipt;
    nOrderPackage.moneyWalletPointsUsed = orderPackage.moneyWalletPointsUsed;
    nOrderPackage.mealaweWalletPointsUsed = orderPackage.mealaweWalletPointsUsed;
    nOrderPackage.statusHistory = [{ orderstatus: orderPackage.orderstatus, updatedOn: new Date() }];
    if (orderPackage.subscriptionStartDate) {
        nOrderPackage.subscriptionStartDate = getLocalMidDate(orderPackage.subscriptionStartDate);
    }
    nOrderPackage.subscriptionDays = orderPackage.subscriptionDays;
    nOrderPackage.mealTimeLunch = orderPackage.mealTimeLunch;
    nOrderPackage.mealTimeDinner = orderPackage.mealTimeDinner;
    nOrderPackage.mealTimeBreakfast = orderPackage.mealTimeBreakfast;
    nOrderPackage.stopPaymentValidation = false;
    nOrderPackage.multiDateAllowed = orderPackage.multiDateAllowed;
    nOrderPackage.subscriptionDeliveryChargesDiscount = orderPackage.subscriptionDeliveryChargesDiscount ? orderPackage.subscriptionDeliveryChargesDiscount : 0;
    nOrderPackage.subscriptionDeliveryCharges = orderPackage.subscriptionDeliveryCharges ? orderPackage.subscriptionDeliveryCharges : 0;
    nOrderPackage.subscriptionDeleveryChargeGST = orderPackage.deleveryChargeGST ? orderPackage.deleveryChargeGST : 0;

    nOrderPackage.ecoFriendlyPackagingCharges = orderPackage.ecoFriendlyPackagingCharges ? orderPackage.ecoFriendlyPackagingCharges : 0;
    nOrderPackage.ecoFriendlyPackagingChargesDiscount = orderPackage.ecoFriendlyPackagingChargesDiscount ? orderPackage.ecoFriendlyPackagingChargesDiscount : 0;
    nOrderPackage.subscriptionPackagingChargeGST = orderPackage.packagingChargeGST ? orderPackage.packagingChargeGST : 0;

    nOrderPackage.platformCharges = orderPackage.platformCharges ? orderPackage.platformCharges : 0;
    nOrderPackage.platformChargesDiscount = orderPackage.platformChargesDiscount ? orderPackage.platformChargesDiscount : 0;
    nOrderPackage.subscriptionPlatformChargeGST = orderPackage.platformChargeGST ? orderPackage.platformChargeGST : 0;

    nOrderPackage.platformChargesGSTPer = orderPackage.platformChargesGSTPer ? orderPackage.platformChargesGSTPer : 0;
    nOrderPackage.subscriptionPackagingChargeGSTPer = orderPackage.subscriptionPackagingChargeGSTPer ? orderPackage.subscriptionPackagingChargeGSTPer : 0;
    nOrderPackage.subscriptionDeleveryChargeGSTPer = orderPackage.subscriptionDeleveryChargeGSTPer ? orderPackage.subscriptionDeleveryChargeGSTPer : 0;

    nOrderPackage.cutleryDiscount = orderPackage.cutleryDiscount ? orderPackage.cutleryDiscount : 0;
    nOrderPackage.dontSendCutlery = orderPackage.dontSendCutlery ? orderPackage.dontSendCutlery : false;
    nOrderPackage.subscriptionType = orderPackage.subscriptionType;
    nOrderPackage.couponDiscount = orderPackage.couponDiscount;
    nOrderPackage.couponCode = orderPackage.couponCode;
    // // console.log('multiDateAllowed ',orderPackage.multiDateAllowed);
    if (orderPackage.multiDateAllowed) {
        nOrderPackage.userSelectedDates = orderPackage.userSelectedDates;
    } else {
        nOrderPackage.userSelectedDates = [];
    }
    nOrderPackage.voucherCode = orderPackage.voucherCode;
    nOrderPackage.voucherDiscount = orderPackage.voucherDiscount;
    nOrderPackage.taxes = orderPackage.taxes;
    nOrderPackage.wooCommerceId = orderPackage.wooCommerceId;
    nOrderPackage.subscriptionLunchSlot = orderPackage.subscriptionLunchSlot;
    nOrderPackage.subscriptionDinnerSlot = orderPackage.subscriptionDinnerSlot;
    nOrderPackage.subscriptionBreakfastSlot = orderPackage.subscriptionBreakfastSlot;
    nOrderPackage.cgst = orderPackage.cgst;
    nOrderPackage.sgst = orderPackage.sgst;
    nOrderPackage.treePlantationOpted = orderPackage.treePlantationOpted;
    nOrderPackage.treePlantationDone = orderPackage.treePlantationDone;
    nOrderPackage.treePlantationAmount = orderPackage.treePlantationAmount ? orderPackage.treePlantationAmount : 0;
    nOrderPackage.treePlantationDiscount = orderPackage.treePlantationDiscount;
    nOrderPackage.treeReceiverName = orderPackage.treeReceiverName;
    nOrderPackage.clusterId = orderPackage.clusterId;
    nOrderPackage.clusterName = orderPackage.clusterName;
    nOrderPackage.deliveryPartnerInstruction = orderPackage.deliveryPartnerInstruction;
    nOrderPackage.specialInstruction = orderPackage.specialInstruction;
    nOrderPackage.pgName = orderPackage.pgName;
    nOrderPackage.transactionTime = new Date();
    nOrderPackage.rmInfo = orderPackage.rmInfo;
    const orderdetail = await nOrderPackage.save();
    return orderdetail;
}

const updateOrderPackage = async (foodOrder , skipStatusHistory = false) => {
    if (!skipStatusHistory) {
    const updatedBy = foodOrder.updatedBy;
    const updateByType = foodOrder.updateByType;
    const isOrderDateChanged = foodOrder.isOrderDateChanged || false;
    const statusForHistory = isOrderDateChanged ? 'orderDateChanged' : foodOrder.orderstatus;
    if (foodOrder.statusHistory) {
        foodOrder.statusHistory.push({ orderstatus: statusForHistory, updatedOn: new Date(), updatedBy, updateByType })
    } else {
        foodOrder.statusHistory = [];
        foodOrder.statusHistory.push({ orderstatus: statusForHistory, updatedOn: new Date(), updatedBy, updateByType })
    }
}
    delete foodOrder.isOrderDateChanged;

    return FoodOrderPackage.findOneAndUpdate({ _id: foodOrder._id }, { $set: foodOrder }, { new: true })
}
const updateOrderAfterDailyOrderCreated = async (foodOrder) => {
    const updatedBy = foodOrder.updatedBy;
    const updateByType = foodOrder.updateByType;
    if (foodOrder.statusHistory) {
        foodOrder.statusHistory.push({ orderstatus: 'dailyOrderCreated', updatedOn: new Date(), updatedBy, updateByType })
    } else {
        foodOrder.statusHistory = [];
        foodOrder.statusHistory.push({ orderstatus: 'dailyOrderCreated', updatedOn: new Date(), updatedBy, updateByType })
    }
    return FoodOrderPackage.findOneAndUpdate({ _id: foodOrder._id }, { $set: foodOrder }, { new: true })
}

const getOrderPackage = async (id) => {
    return await FoodOrderPackage.findById(id);
}

const getCustomerPackageList = async (customerId, page) => {
    let limit = 30;
    const orderList = await FoodOrderPackage.find({ customerId })
        .sort({ orderDate: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
    return orderList;
}
const getKitchenSubDashboardCount = async (kitchenId, onlyCount) => {
    let condition = {
        kitchenId,
        orderstatus: 'placed'
    };
    // const orderdetail = await FoodOrderPackage.find(condition);
    // return orderdetail;

    if (onlyCount === 'yes') {
        const count = await FoodOrderPackage.count(condition);
        return { count };
    } else {
        const orderdetail = await FoodOrderPackage.find(condition).sort({ _id: -1 });
        return orderdetail;
    }
}

const getCustomerCurrentSubOrders = async (customerId) => {
    const orderStatusList = ['placed', 'accepted'];
    let today = getTodayStartTime();
    let tomorrow = getTodayStartTime();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let condition = {
        customerId,
        orderstatus: { $in: [...orderStatusList] },
        orderDate: { $gte: today, $lt: tomorrow }
    };
    const orderList = await FoodOrderPackage.find(condition).sort({ _id: -1 });
    return orderList;
}

const getKitchenPastPackageOrders = async (kitchenId, page) => {
    const limit = 20;
    const orderStatusList = ['placed', 'accepted'];
    let condition = {
        kitchenId,
        orderstatus: { $in: [...orderStatusList] }
    };
    return await FoodOrderPackage.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const updateFoodOrderPackageProps = async (packageId, orderList, prop) => {
    const foodOrderPackage = await getOrderPackage(packageId);
    orderList.forEach(childOrder => {
        let orderToUpdate = foodOrderPackage.dailyOrderList.find(order => String(order.foodOrderId) === String(childOrder._id));
        if (orderToUpdate) {
            orderToUpdate[prop] = childOrder[prop];
        } else {
            // console.log('no order to update found')
            let orderToUpdate = foodOrderPackage.dailyOrderList.find(order => order.orderNo === childOrder.orderNo);
            if (orderToUpdate) {
                orderToUpdate[prop] = childOrder[prop];
            } else {
                console.log('no order to update found')
            }
        }
    });
    return await FoodOrderPackage.findOneAndUpdate({ _id: packageId }, { $set: foodOrderPackage }, { new: true })
}

const getCurrentPackageCount = async (clusterList) => {
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
        $or: [{ orderDate: { $gte: today } },]
    };
    const condition1 = {
        $or: [{ orderDate: { $gte: today } }, { stopPaymentValidation: false }]
    };
    const condition2 = {
        $or: [{ orderDate: { $gte: today } }, { 'dailyOrderList.0': { $exists: false } }]
    };
    const condition3 = {}
    if (clusterList && clusterList.length > 0) {
        condition.clusterId = { $in: clusterList };
        condition1.clusterId = { $in: clusterList };
        condition2.clusterId = { $in: clusterList };
        condition3.clusterId = { $in: clusterList };
    }
    const result = await FoodOrderPackage.aggregate(
        [
            {
                '$facet': {
                    'paymentInprogress': [{ $match: { orderstatus: 'paymentInprogress', ...condition1 } }, { $count: 'paymentInprogress' }],
                    'paymentFailed': [{ $match: { orderstatus: 'paymentFailed', ...condition1 } }, { $count: 'paymentFailed' }],
                    'newOrder': [{ $match: { orderstatus: 'placed', ...condition3 } }, { $count: 'newOrder' }],
                    'acceptedOrder': [{ $match: { orderstatus: 'accepted', ...condition2 } }, { $count: 'acceptedOrder' }],
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

const getCurrentPackageOrdersList = async (status, page, limit, clusterList) => {
    let today = getTodayStartTime();
    let condition = {
        orderstatus: status,
        // $or : [{orderDate : {$gte: today}}]
    };
    if (status === 'placed') {
        condition = { orderstatus: status };
    } else if (status === 'accepted') {
        condition = {
            orderstatus: status,
            $or: [{ orderDate: { $gte: today } }, { 'dailyOrderList.0': { $exists: false } }]
        };
    }
    if (clusterList && clusterList.length > 0) {
        condition.clusterId = { $in: clusterList };
    }
    // const condition = {};
    return await FoodOrderPackage.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const updatePackageFoodOrderDate = async (id, foodOrderId, orderDate, body) => {
   const statusCondition = { orderstatus: 'rescheduled', updatedOn: new Date() }
    if (body) {
        statusCondition.updatedBy = body.updatedBy;
        statusCondition.updateByType = body.updateByType;
    }
   // return FoodOrderPackage.findOneAndUpdate({ _id: id, 'dailyOrderList.foodOrderId': foodOrderId },
    //     { $set: { 'dailyOrderList.$.orderDate': orderDate }, $push: { statusHistory: statusCondition } },
    //     { new: true });
    const packageDoc = await FoodOrderPackage.findById(id);

    if (!packageDoc) {
        throw new Error('FoodOrderPackage not found');
    }

    let found = false;

    for (let item of packageDoc.dailyOrderList) {
         if(!item){
            console.log(item);
        }
        if (item._id.toString() === foodOrderId.toString()) {
            item.orderDate = orderDate;
            if (!item.statusHistory) item.statusHistory = [];
            item.statusHistory.push(statusCondition);

            found = true;
            break;
        }
    }

    if (!found) {
        if (body?.orderNo) {
            for (let item of packageDoc.dailyOrderList) {
                if (!item) {
                    console.log(item);
                }
                if (item.orderNo === body.orderNo) {
                    item.orderDate = orderDate;
                    if (!item.statusHistory) item.statusHistory = [];
                    item.statusHistory.push(statusCondition);
                    found = true;
                    break;
                }
            }
        }
        
        if (!found) {
            throw new Error('FoodOrder not found in dailyOrderList');
        }
    }


    packageDoc.markModified('dailyOrderList');

    await packageDoc.save();

    return packageDoc;
};

const updatePackageFoodMealType = async (id, foodOrderId, mealType, body) => {
    const statusCondition = { 
        orderstatus: 'orderTypeChanged', 
        updatedOn: new Date() 
    };
    
    if (body) {
        statusCondition.updatedBy = body.updatedBy;
        statusCondition.updateByType = body.updateByType;
    }

    const packageDoc = await FoodOrderPackage.findById(id);

    if (!packageDoc) {
        throw new Error('FoodOrderPackage not found');
    }

    let found = false;

    // First try to find by foodOrderId
    for (let item of packageDoc.dailyOrderList) {
        if (!item) continue;
        
        if (item.foodOrderId && item.foodOrderId.toString() === foodOrderId.toString()) {
            item.mealType = mealType;
            if (!item.statusHistory) item.statusHistory = [];
            item.statusHistory.push(statusCondition);
            found = true;
            break;
        }
    }

    // If not found by foodOrderId, try by orderNo
    if (!found && body?.orderNo) {
        for (let item of packageDoc.dailyOrderList) {
            if (!item) continue;
            
            if (item.orderNo === body.orderNo || item.orderNo === parseInt(body.orderNo)) {
                item.mealType = mealType;
                if (!item.statusHistory) item.statusHistory = [];
                item.statusHistory.push(statusCondition);
                found = true;
                break;
            }
        }
    }

    if (!found) {
        console.log('FoodOrder not found in dailyOrderList for mealType update');
        // Don't throw error, just log - the child order is already updated
    }

    packageDoc.markModified('dailyOrderList');
    await packageDoc.save();

    return packageDoc;
};

const changeMealTypeAndDatePackageOrder = async (id, foodOrderId, mealType, orderDate, body) => {
    const statusCondition = { 
        orderstatus: 'orderTypeAndDateChanged', 
        updatedOn: new Date() 
    };
    
    if (body) {
        statusCondition.updatedBy = body.updatedBy;
        statusCondition.updateByType = body.updateByType;
    }

    const packageDoc = await FoodOrderPackage.findById(id);

    if (!packageDoc) {
        throw new Error('FoodOrderPackage not found');
    }

    let found = false;

    // First try to find by foodOrderId
    for (let item of packageDoc.dailyOrderList) {
        if (!item) continue;
        
        if (item.foodOrderId && item.foodOrderId.toString() === foodOrderId.toString()) {
            item.mealType = mealType;
            item.orderDate = orderDate;
            if (!item.statusHistory) item.statusHistory = [];
            item.statusHistory.push(statusCondition);
            found = true;
            break;
        }
    }

    // If not found by foodOrderId, try by orderNo
    if (!found && body?.orderNo) {
        for (let item of packageDoc.dailyOrderList) {
            if (!item) continue;
            
            if (item.orderNo === body.orderNo || item.orderNo === parseInt(body.orderNo)) {
                item.mealType = mealType;
                item.orderDate = orderDate;
                if (!item.statusHistory) item.statusHistory = [];
                item.statusHistory.push(statusCondition);
                found = true;
                break;
            }
        }
    }

    if (!found) {
        console.log('FoodOrder not found in dailyOrderList for mealType and date update');
    }

    packageDoc.markModified('dailyOrderList');
    await packageDoc.save();

    return packageDoc;
};

const performPackageOrderTransfer = async (tranferredOrder) => {
    const order = {};
    order.kitchenId = tranferredOrder.kitchenId;
    order.kitchenName = tranferredOrder.kitchenName;
    order.kitchenPhoneNo = tranferredOrder.kitchenPhoneNo;
    order.kitchenmapTelNo = tranferredOrder.kitchenmapTelNo;
    order.kitchenAddress = tranferredOrder.kitchenAddress;
    order.kitchenGeolocation = tranferredOrder.kitchenGeolocation;
    order.deliveryByMealaweBoy = tranferredOrder.deliveryByMealaweBoy;
    order.skipWalletPayment = tranferredOrder.skipWalletPayment;
    order.distance = tranferredOrder.distance;
    order.orderTransferred = tranferredOrder.orderTransferred;
    order.transferHistory = tranferredOrder.transferHistory;
    order.transferHistory[order.transferHistory.length - 1].updatedBy = tranferredOrder.updatedBy;
    order.transferHistory[order.transferHistory.length - 1].updateByType = tranferredOrder.updateByType;
    const ids = [];
    const tranferredFoodOrderObj = {};
    tranferredFoodOrderObj.kitchenId = tranferredOrder.kitchenId;
    tranferredFoodOrderObj.kitchenName = tranferredOrder.kitchenName;
    tranferredFoodOrderObj.kitchenPhoneNo = tranferredOrder.kitchenPhoneNo;
    tranferredFoodOrderObj.kitchenmapTelNo = tranferredOrder.kitchenmapTelNo;
    tranferredFoodOrderObj.kitchenAddress = tranferredOrder.kitchenAddress;
    tranferredFoodOrderObj.kitchenGeolocation = tranferredOrder.kitchenGeolocation;
    tranferredFoodOrderObj.deliveryByMealaweBoy = tranferredOrder.deliveryByMealaweBoy;
    tranferredFoodOrderObj.skipWalletPayment = tranferredOrder.skipWalletPayment;
    tranferredFoodOrderObj.distance = tranferredOrder.distance;
    tranferredFoodOrderObj.transferExtraAmt = tranferredOrder.transferExtraAmt;
    tranferredFoodOrderObj.reduceExtraAmt = tranferredOrder.reduceExtraAmt;
    tranferredFoodOrderObj.orderTransferred = tranferredOrder.orderTransferred;
    tranferredFoodOrderObj.transferHistory = tranferredOrder.transferHistory;

    const allFoodOrderIds = tranferredOrder.dailyOrderList
        .filter(foodOrder => foodOrder.orderTransferred && foodOrder.foodOrderId)
        .map(foodOrder => foodOrder.foodOrderId);
    
    if (allFoodOrderIds.length > 0) {
        
        const actualOrders = await FoodOrder.find(
            { _id: { $in: allFoodOrderIds } },
            { _id: 1, orderstatus: 1 }
        );
        
        actualOrders.forEach(actualOrder => {
            if (actualOrder.orderstatus !== 'delivered') {
                ids.push(actualOrder._id);
            }
        });
    }

    if (ids.length > 0) {
        await performMultiOrderTransfer(ids, tranferredFoodOrderObj);
    }
    const statusCondition = { 
        orderstatus: 'orderTransferred', 
        updatedOn: new Date(),
        updatedBy: tranferredOrder.updatedBy,
        updateByType: tranferredOrder.updateByType
    };
    
    return await FoodOrderPackage.findOneAndUpdate(
        { _id: tranferredOrder._id },
        { 
            $set: order,
            $push: { statusHistory: statusCondition }
        }, 
        { new: true }
    );
}

const getPackageRefundOrders = async () => {
    const orderdetail = await FoodOrderPackage.find({ orderstatus: 'paymentInprogress', stopRefundProcess: { $ne: true } }).sort({ _id: -1 });
    return orderdetail;
};

const searchPackageFoodOrderList = async (searchObj, page) => {
    const limit = 50;
    const condition = {};
    if (searchObj.orderStatus && searchObj.orderStatus.length > 0) {
        condition.orderstatus = { $in: [...searchObj.orderStatus] }
    }
    if (searchObj.orderNo) {
        const regexText = new RegExp(searchObj.orderNo, 'i');
        condition.orderNo = regexText;
    }
    if (searchObj.customerName) {
        const regexText = new RegExp(searchObj.customerName, 'i');
        condition.customerName = regexText;
    }
    if (searchObj.couponCode) {
        const regexText = new RegExp(searchObj.couponCode, 'i');
        condition.couponCode = regexText;
    }
    if (searchObj.voucherCode) {
        const regexText = new RegExp(searchObj.voucherCode, 'i');
        condition.voucherCode = regexText;
    }
    if (searchObj.kitchenName) {
        const regexText = new RegExp(searchObj.kitchenName, 'i');
        condition.kitchenName = regexText;
    }
    if (searchObj.fromDate && searchObj.toDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate), $lte: new Date(searchObj.toDate) }
    }
    return await FoodOrderPackage.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const getPaymentValidationOrder = async () => {
    let today = getTodayStartTime();
    let tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let condition = {
        orderstatus: { $in: ['paymentInprogress', 'paymentFailed'] },
        stopPaymentValidation: false,
        // $or: [
        //     {orderDate: {$gte: today, $lt: tomorrow} }
        // ]
    };
    const orderList = await FoodOrderPackage.find(condition);
    return orderList;
}


const getWooCoomerceOrder = async (wooCommerceId) => {
    return await FoodOrderPackage.findOne({ wooCommerceId })
}

const getSubscriptionEndDetails = async () => {
    let today = getTodayStartTime();
    let back60days = new Date(today);
    back60days.setDate(back60days.getDate() - 30 * 2);
    let condition = {
        orderstatus: 'accepted',
        // orderDate: {$gte: back60days},
        'dailyOrderList.0': { $exists: true }
    };
    // const orderList = await FoodOrderPackage.find(condition,
    //     {dailyOrderList:1,orderNo:1,customerId:1,customerName:1,customerPhoneNo:1,customerEmail:1}); 

    const orderList = await FoodOrderPackage.aggregate(
        [
            {
                $match: condition
            },
            {
                $group:
                {
                    "_id": "$customerPhoneNo",
                    "customerId": { $last: "$customerId" },
                    "orderNo": { $last: "$orderNo" },
                    "customerId": { $last: "$customerId" },
                    "customerName": { $last: "$customerName" },
                    "customerPhoneNo": { $last: "$customerPhoneNo" },
                    "customerEmail": { $last: "$customerEmail" },
                    "orderNo": { $last: "$orderNo" },
                    "dailyOrderList": { $last: "$dailyOrderList" },
                    "mealPackage": { $last: "$mealPackage" },
                    "subscriptionType": { $last: "$subscriptionType" },
                    "rmInfo": { $last: "$rmInfo" },
                    "clusterName": { $last: "$clusterName" },
                    "mealTimeLunch": { $last: "$mealTimeLunch" },
                    "mealTimeDinner": { $last: "$mealTimeDinner" },
                    "mealTimeBreakfast": { $last: "$mealTimeBreakfast" },
                    "registeredPlatform": { $last: "$orderCreatedBy" },
                    "city": { $last: "$customerLocation.city" },
                    "pincode": { $last: "$customerLocation.pincode" },
                    "orderDate": { $last: "$orderDate" },
                }
            }
        ]
    );
    // console.log(orderList)
    return orderList;
}

const getOrderPackageByOrderNo = async (orderNo) => {
    return await FoodOrderPackage.findOne({ orderNo });
}

const getCustomerPastOrderInfo = async (customerId) => {
    let condition = {
        customerId,
        orderstatus: 'accepted'
    };
    return await FoodOrderPackage.countDocuments(condition).sort({ _id: -1 });
}

const getCustomerPastSubscriptionInfo = async (customerId) => {
    let condition = {
        customerId,
        orderstatus: 'accepted',
        'mealPackage.packageSubCategory': { $ne: 'Trial' }
    };
    return await FoodOrderPackage.countDocuments(condition).sort({ _id: -1 });
}
const getFoodOrdersPackageByCustomerEmailThinkowl = async (email) => {
    return await FoodOrderPackage.findOne({ customerEmail: email });
}

const getCustomerPastTrialOrderCount = async (customerId) => {
    let condition = {
        customerId,
        orderstatus: { $in: ['accepted', 'placed'] },
        $or: [{ 'mealPackage.packageCategory': 'Trial' }, { 'mealPackage.packageSubCategory': 'Trial' }]
    };
    return await FoodOrderPackage.countDocuments(condition).sort({ _id: -1 });
}

const exportFoodOrderPackageList = async (searchObj) => {
    const condition = { orderstatus: 'accepted' };
    if (searchObj.fromDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate) };
        if (searchObj.toDate) {
            condition.orderDate.$lte = new Date(searchObj.toDate);
        }
    }
    // console.log('condition',condition);
    return await FoodOrderPackage.find(condition).sort({ orderDate: -1 });
}

const exportActiveUserActiveOrders = async (searchObj) => {
    const condition = { orderstatus: 'accepted' };
    if (searchObj.fromDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate) };
        if (searchObj.toDate) {
            condition.orderDate.$lte = new Date(searchObj.toDate);
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await FoodOrderPackage.aggregate([
        { $match: condition },
        {
            $lookup: {
                from: 'customerprofiles',
                localField: 'customerId',
                foreignField: '_id',
                as: 'customerProfile'
            }
        },
        { $unwind: { path: '$customerProfile', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'foodorderpackages',
                let: { custId: '$customerId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$customerId', '$$custId'] },
                                    { $eq: ['$orderstatus', 'accepted'] }
                                ]
                            }
                        }
                    },
                    { $count: 'total' }
                ],
                as: 'customerOrderCount'
            }
        },
        {
            $addFields: {
                signUpDate: '$customerProfile.createdOn',
                platform: '$orderCreatedBy',
                totalCustomerOrders: { $ifNull: [{ $arrayElemAt: ['$customerOrderCount.total', 0] }, 1] },
                subscriptionTransactionCount: { $size: { $ifNull: ['$dailyOrderList', []] } },
                nextDeliveryDate: {
                    $min: {
                        $map: {
                            input: {
                                $filter: {
                                    input: { $ifNull: ['$dailyOrderList', []] },
                                    as: 'dl',
                                    cond: { $gte: ['$$dl.orderDate', today] }
                                }
                            },
                            as: 'dl',
                            in: '$$dl.orderDate'
                        }
                    }
                },
                orderCount: {
                    $add: [
                        {
                            $size: {
                                $filter: {
                                    input: { $ifNull: ['$dailyOrderList', []] },
                                    as: 'dl',
                                    cond: { $lt: ['$$dl.orderDate', today] }
                                }
                            }
                        },
                        1
                    ]
                }
            }
        },
        { $match: { nextDeliveryDate: { $ne: null } } },
        {
            $addFields: {
                mealType: {
                    $reduce: {
                        input: {
                            $filter: {
                                input: [
                                    { $cond: [{ $eq: ['$mealTimeBreakfast', true] }, 'Breakfast', null] },
                                    { $cond: [{ $eq: ['$mealTimeLunch', true] }, 'Lunch', null] },
                                    { $cond: [{ $eq: ['$mealTimeDinner', true] }, 'Dinner', null] }
                                ],
                                as: 'p',
                                cond: { $ne: ['$$p', null] }
                            }
                        },
                        initialValue: '',
                        in: {
                            $cond: {
                                if: { $eq: ['$$value', ''] },
                                then: '$$this',
                                else: { $concat: ['$$value', ' + ', '$$this'] }
                            }
                        }
                    }
                },
                isFirstOrder: {
                    $cond: {
                        if: { $eq: ['$totalCustomerOrders', 1] },
                        then: 'First Order',
                        else: { $toString: '$totalCustomerOrders' }
                    }
                }
            }
        },
        {
            $project: {
                customerId: 1,
                userName: '$customerName',
                phoneNumber: '$customerPhoneNo',
                city: '$customerLocation.city',
                cluster: '$clusterName',
                pinCode: '$customerLocation.pincode',
                signUpDate: 1,
                platform: 1,
                orderDate: 1,
                orderFrequency: '$subscriptionType',
                packageOrderId: '$orderNo',
                packageName: '$mealPackage.packageName',
                mealType: 1,
                totalNumberOfDays: { $ifNull: ['$mealPackage.days', '$subscriptionDays'] },
                totalAmountPaid: '$amount',
                subscriptionTransactionCount: 1,
                startDate: {
                    $ifNull: [
                        '$subscriptionStartDate',
                        { $min: '$dailyOrderList.orderDate' }
                    ]
                },
                nextDeliveryDate: 1,
                orderCount: 1,
                isFirstOrder: 1
            }
        },
        { $sort: { customerId: 1, orderDate: -1 } }
    ]);
};

const exportPaymentFailedOrderList = async (searchObj) => {
    const condition = { orderstatus: 'paymentFailed' };
    if (searchObj.fromDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate) };
        if (searchObj.toDate) {
            condition.orderDate.$lte = new Date(searchObj.toDate);
        }
    }
    return await FoodOrderPackage.find(condition).sort({ orderDate: -1 });
}

const updatePlantationStatus = async (orderNo) => {
    return FoodOrderPackage.findOneAndUpdate({ orderNo }, { $set: { treePlantationDone: true } }, { new: true })
};

const checkForFreePlantation = async (customerId) => {
    const condition = {
        customerId,
        packageSubCategory: 'Monthly',
        treePlantationOpted: true
    }
    const list = await FoodOrderPackage.find(condition);
    if (list && list.length > 0) {
        return { freePlantation: false }
    } else {
        return { freePlantation: true }
    }
};

const getFutureOrders = async () => {
    let today = getTodayStartTime();
    const condition = {
        // orderDate : {$gte: today }
    };
    return await FoodOrderPackage.find(condition);
};

const updateClusterInfo = async (foodOrder) => {
    const updatedBy = foodOrder.updatedBy;
    const updateByType = foodOrder.updateByType;
    if (foodOrder.statusHistory) {
        foodOrder.statusHistory.push({ orderstatus: 'clusterInfoUpdated', updatedOn: new Date(), updatedBy, updateByType })
    } else {
        foodOrder.statusHistory = [];
        foodOrder.statusHistory.push({ orderstatus: 'clusterInfoUpdated', updatedOn: new Date(), updatedBy, updateByType })
    }
    return FoodOrderPackage.findOneAndUpdate({ _id: foodOrder._id }, { $set: foodOrder }, { new: true })
}

const updateRouteInfo = async (foodOrderId, foodOrder) => {
    const updatedBy = foodOrder.updatedBy;
    const updateByType = foodOrder.updateByType;
    const mealType = foodOrder.mealType;
    let updateObj = {};

    if (!mealType) {
        let packageOrder = await FoodOrderPackage.findOne({ _id: foodOrderId });

        if (packageOrder.mealTimeLunch || foodOrder.LunchrouteNo) {
            updateObj.LunchrouteNo = foodOrder.LunchrouteNo || foodOrder.routeNo;
            updateObj.LunchrouteRank = foodOrder.LunchrouteRank || foodOrder.LunchrouteNo
                ? (foodOrder.LunchrouteRank || foodOrder.DinnerrouteRank || foodOrder.routeRank)
                : foodOrder.routeRank;
        }
        if (packageOrder.mealTimeDinner || foodOrder.DinnerrouteNo) {
            updateObj.DinnerrouteNo = foodOrder.DinnerrouteNo || foodOrder.routeNo;
            updateObj.DinnerrouteRank = foodOrder.DinnerrouteRank || foodOrder.LunchrouteRank || foodOrder.routeRank;
        }
        if (packageOrder.mealTimeBreakfast) {
            updateObj.routeNo = foodOrder.routeNo;
            updateObj.routeRank = foodOrder.routeRank;
        }
    } else {
        if (mealType === 'Lunch') {
            updateObj.LunchrouteNo = foodOrder.LunchrouteNo || foodOrder.routeNo;
            updateObj.LunchrouteRank = foodOrder.LunchrouteRank || foodOrder.routeRank;
        } else if (mealType === 'Dinner') {
            updateObj.DinnerrouteNo = foodOrder.DinnerrouteNo || foodOrder.routeNo;
            updateObj.DinnerrouteRank = foodOrder.DinnerrouteRank || foodOrder.routeRank;
        } else {
            updateObj.routeNo = foodOrder.routeNo;
            updateObj.routeRank = foodOrder.routeRank;
        }
    }

    const historyEntry = {
        orderstatus: 'routeRankUpdated',
        updatedOn: new Date(),
        updatedBy,
        updateByType
    };

    return FoodOrderPackage.findOneAndUpdate(
        { _id: foodOrderId },
        {
            $set: updateObj,
            $push: { statusHistory: historyEntry }  
        },
        { new: true }
    );
};

const updateRMInfo = async (orderNo, rmInfo) => {
    const update = await FoodOrderPackage.findOneAndUpdate({ orderNo }, { $set: { rmInfo } }, { new: true });
    return update;
}

const getSubscriptionEndDetailsByUserId = async (customerId) => {
    let condition = {
        orderstatus: 'accepted',
        customerId: ObjectId(customerId),
        'dailyOrderList.0': { $exists: true }
    };

    const orderList = await FoodOrderPackage.aggregate(
        [
            {
                $match: condition
            },
            {
                $group:
                {
                    "_id": "$customerName",
                    "customerId": { $last: "$customerId" },
                    "orderNo": { $last: "$orderNo" },
                    "customerId": { $last: "$customerId" },
                    "customerName": { $last: "$customerName" },
                    "customerPhoneNo": { $last: "$customerPhoneNo" },
                    "customerEmail": { $last: "$customerEmail" },
                    "orderNo": { $last: "$orderNo" },
                    "dailyOrderList": { $last: "$dailyOrderList" },
                    "mealPackage": { $last: "$mealPackage" },
                    "subscriptionType": { $last: "$subscriptionType" },
                    "rmInfo": { $last: "$rmInfo" },
                    "clusterName": { $last: "$clusterName" }
                }
            }
        ]
    );
    return orderList;
}

const firstTrialaftersubscription = async (searchObj = {}) => {
    const condition = { orderstatus: 'accepted' };
    if (searchObj.fromDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate) };
        if (searchObj.toDate) {
            condition.orderDate.$lte = new Date(searchObj.toDate);
        }
    }
    condition.subscriptionType = { $in: ['first_subscription', 'first_trial'] }
    let orderList = await FoodOrderPackage.find(condition).sort({ orderDate: -1 });
    console.log("orderList", orderList);
    return orderList
};
const getAcceptedOrdersByCustomerPhone = async (customerPhoneNo) => {
    const result = await FoodOrderPackage.aggregate([
        { $match: { customerPhoneNo, orderstatus: 'accepted' } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        },
        {
            $project: {
                _id: 0,
                totalOrders: 1,
                totalAmount: 1
            }
        }
    ]);
    if (result && result.length > 0) {
        return result[0];
    }
    return { totalOrders: 0, totalAmount: 0 };
};

const getChildOrdersStatusByPackageId = async (packageId) => {
    const packageOrder = await FoodOrderPackage.findById(packageId, { dailyOrderList: 1 });
    if (!packageOrder || !packageOrder.dailyOrderList?.length) {
        return [];
    }

    const allFoodOrderIds = packageOrder.dailyOrderList
        .filter(fo => fo.foodOrderId)
        .map(fo => fo.foodOrderId);

    if (allFoodOrderIds.length === 0) return [];

    const actualOrders = await FoodOrder.find(
        { _id: { $in: allFoodOrderIds } },
        { _id: 1, orderstatus: 1 }
    );

    return actualOrders.map(o => ({
        foodOrderId: o._id.toString(),
        orderstatus: o.orderstatus
    }));
};

module.exports = {
    saveOrderPackage,
    updateOrderPackage,
    getOrderPackage,
    getCustomerPackageList,
    getKitchenSubDashboardCount,
    getCustomerCurrentSubOrders,
    getKitchenPastPackageOrders,
    getCurrentPackageCount,
    getCurrentPackageOrdersList,
    updatePackageFoodOrderDate,
    performPackageOrderTransfer,
    getPackageRefundOrders,
    searchPackageFoodOrderList,
    getPaymentValidationOrder,
    getWooCoomerceOrder,
    getSubscriptionEndDetails,
    getOrderPackageByOrderNo,
    getCustomerPastOrderInfo,
    getCustomerPastSubscriptionInfo,
    updatePackageFoodMealType,
    getCustomerPastTrialOrderCount,
    exportFoodOrderPackageList,
    exportActiveUserActiveOrders,
    exportPaymentFailedOrderList,
    changeMealTypeAndDatePackageOrder,
    updatePlantationStatus,
    updateFoodOrderPackageProps,
    checkForFreePlantation,
    updateOrderAfterDailyOrderCreated,
    getFutureOrders,
    updateClusterInfo,
    updateRouteInfo,
    updateRMInfo,
    getSubscriptionEndDetailsByUserId,
    firstTrialaftersubscription,
    getFoodOrdersPackageByCustomerEmailThinkowl,
    getChildOrdersStatusByPackageId,
    getAcceptedOrdersByCustomerPhone
}