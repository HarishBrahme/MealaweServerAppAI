const FoodOrder = require('../model/foodOrder.model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { getLocalDate, getTodayStartTime, getTodayEndTime, getLocalMidDate } = require('../util/date-util');
const { deleteImage } = require('../service/images.service');
const { getLocalStartTime, getLocalEndTime } = require('../util/date-util');
const OyoHotel = require('../model/oyoHotels.model');
const Apartment = require('../model/apartment.model'); // Assuming you have an Apartment model

const getKitchenOrderDetail = async (kitchenId, orderType, clientDate) => {
    let today = getTodayStartTime();
    // today.setHours(0,0,0,0);
    let tomorrow = getTodayStartTime();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (orderType === 'daily' || orderType === 'allDay' || orderType === 'oyo' || orderType === 'apartment_today' || orderType === 'apartment_advance') {
        const orderdetail = await FoodOrder.find({
            kitchenId,
            orderType,
            orderDate: { $gte: today }
        });
        return orderdetail;
    } else if (orderType === 'subscription') {
        const orderdetail = await FoodOrder.find({
            kitchenId,
            orderType,
            orderDate: { $gte: today, $lt: tomorrow }
        });
        return orderdetail;
    } else {
        const orderdetail = await FoodOrder.find({
            kitchenId,
            orderType,
            orderComplitionDate: { $gte: today }
        });
        return orderdetail;
    }
}
const getKitchenSubOrderDetail = async (kitchenId, orderType, mealType, clientDate) => {
    let today = getTodayStartTime();
    let tomorrow = getTodayStartTime();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const orderdetail = await FoodOrder.find({
        kitchenId,
        orderType,
        mealType,
        orderDate: { $gte: today, $lt: tomorrow }
    });
    return orderdetail;
}
const getCustomerOrderDetail = async (customerId, onlyCount) => {
    if (onlyCount) {
        const count = await FoodOrder.count({ customerId });
        return { count };
    } else {
        const orderdetail = await FoodOrder.find({ customerId }).sort({ _id: -1 });
        return orderdetail;
    }
}

const getKitchenPastOrders = async (kitchenId, fromDate, toDate) => {
    fromDate = (new Date(fromDate));
    // fromDate.setHours(0,0,0,0);
    toDate = (new Date(toDate));
    // toDate.setHours(23,59,59,999);
    return await FoodOrder.find({
        kitchenId,
        orderstatus: { $in: ['cancelledByKitchen', 'rejectedByKitchen', 'handedOverToDeliveryBoy', 'onTheWay', 'delivered'] },
        $or: [
            { orderDate: { $gte: fromDate, $lte: toDate }, orderType: 'allDay' },
            { orderDate: { $gte: fromDate, $lte: toDate }, orderType: 'daily' },
            { orderDate: { $gte: fromDate, $lte: toDate }, orderType: 'subscription' },
            { orderComplitionDate: { $gte: fromDate, $lte: toDate }, orderType: 'advance' },
        ]
    });
}
const getKitchenPastOrdersReport = async (kitchenId, fromDate, toDate) => {
    fromDate = (new Date(fromDate));
    // fromDate.setHours(0,0,0,0);
    toDate = (new Date(toDate));
    // toDate.setHours(23,59,59,999);
    const fullResult = {
        dailyNewOrder: 0,
        orderAccepted: 0,
        orderRejected: 0,
        orderCancelled: 0,
        orderDelivered: 0
    };
    const condition = {
        kitchenId: ObjectId(kitchenId),
        $or: [
            { orderType: 'allDay', orderDate: { $gte: fromDate, $lte: toDate } },
            { orderType: 'daily', orderDate: { $gte: fromDate, $lte: toDate } },
            { orderType: 'subscription', orderDate: { $gte: fromDate, $lte: toDate } },
            { orderType: 'advance', orderComplitionDate: { $gte: fromDate, $lte: toDate } },
        ]
    };
    const result = await FoodOrder.aggregate([
        {
            '$facet': {
                'dailyNewOrder': [{ $match: { orderstatus: 'placed', ...condition } }, { $count: 'dailyNewOrder' }],
                'orderAccepted': [{ $match: { orderstatus: { $in: ['readyToDelivery', 'preparing', 'accepted', 'deliveryBoyAssigned'] }, ...condition } }, { $count: 'orderAccepted' }],
                'orderRejected': [{ $match: { orderstatus: 'rejectedByKitchen', ...condition } }, { $count: 'orderRejected' }],
                'orderCancelled': [{ $match: { orderstatus: 'cancelledByKitchen', ...condition } }, { $count: 'orderCancelled' }],
                'orderDelivered': [{ $match: { orderstatus: { $in: ['handedOverToDeliveryBoy', 'onTheWay', 'delivered'] }, ...condition } },
                { $count: 'orderDelivered' }],
            }
        },
        {
            '$project': {
                'dailyNewOrder': { '$arrayElemAt': ['$dailyNewOrder.dailyNewOrder', 0] },
                'orderAccepted': { '$arrayElemAt': ['$orderAccepted.orderAccepted', 0] },
                'orderRejected': { '$arrayElemAt': ['$orderRejected.orderRejected', 0] },
                'orderCancelled': { '$arrayElemAt': ['$orderCancelled.orderCancelled', 0] },
                'orderDelivered': { '$arrayElemAt': ['$orderDelivered.orderDelivered', 0] },
            }
        }]);
    return (result && result.length > 0) ? { ...fullResult, ...result[0] } : { ...fullResult };
}
const saveFoodOrder = async (foodOrder) => {
    const nFoodOrder = new FoodOrder();
    nFoodOrder.orderNo = foodOrder.orderNo;
    nFoodOrder.customerId = foodOrder.customerId;
    nFoodOrder.customerName = foodOrder.customerName;
    nFoodOrder.customerLocation = foodOrder.customerLocation;
    nFoodOrder.customerPhoneNo = foodOrder.customerPhoneNo;
    nFoodOrder.customerEmail = foodOrder.customerEmail;
    nFoodOrder.kitchenId = foodOrder.kitchenId;
    nFoodOrder.firstKitchenName = foodOrder.kitchenName;
    nFoodOrder.kitchenName = foodOrder.kitchenName;
    nFoodOrder.kitchenPhoneNo = foodOrder.kitchenPhoneNo;
    nFoodOrder.kitchenmapTelNo = foodOrder.kitchenMapTelNo||'';
    nFoodOrder.kitchenAddress = foodOrder.kitchenAddress;
    nFoodOrder.kitchenGeolocation = foodOrder.kitchenGeolocation;
    nFoodOrder.deliveryByMealaweBoy = foodOrder.deliveryByMealaweBoy;
    nFoodOrder.skipWalletPayment = foodOrder.skipWalletPayment;
    nFoodOrder.orderCreatedBy = foodOrder.orderCreatedBy;
    nFoodOrder.deliveryVendor = foodOrder.deliveryVendor;
    nFoodOrder.orderType = foodOrder.orderType;
    nFoodOrder.mealType = foodOrder.mealType;
    nFoodOrder.platformCharges = foodOrder.platformCharges ? foodOrder.platformCharges : 0;
    nFoodOrder.ecoFriendlyPackagingCharges = foodOrder.ecoFriendlyPackagingCharges;
    nFoodOrder.platformChargesDiscount = foodOrder.platformChargesDiscount ? foodOrder.platformChargesDiscount : 0;
    nFoodOrder.stopPaymentValidation = false;
    nFoodOrder.foodOrderType = foodOrder.foodOrderType;
    nFoodOrder.orderDate = getLocalMidDate(new Date());
    nFoodOrder.cgst = foodOrder.cgst;
    nFoodOrder.sgst = foodOrder.sgst;
    nFoodOrder.deliveryChargesGST = foodOrder.deliveryChargesGST;
    nFoodOrder.packagingChargesGST = foodOrder.packagingChargesGST;
    nFoodOrder.platformChargesGST = foodOrder.platformChargesGST;
    nFoodOrder.enableSelfPickup = foodOrder.enableSelfPickup !== undefined ? foodOrder.enableSelfPickup : true;
    
    if (foodOrder.orderType === 'apartment_today' || foodOrder.orderType === 'apartment_advance') {
        nFoodOrder.specialInstruction = foodOrder.specialInstruction || [];  // ← THIS IS MISSING!
        nFoodOrder.apartmentOtp = generateOtp(); // Generate 4 digit OTP
    }
    if (foodOrder.orderComplitionDate) {
        nFoodOrder.orderComplitionDate = getLocalMidDate(foodOrder.orderComplitionDate);

    }
    if (foodOrder.orderComplitionTime) {
        nFoodOrder.orderComplitionTime = new Date(foodOrder.orderComplitionTime);
    }
    if (foodOrder.dailyOrderDeliveryTime) {
        nFoodOrder.dailyOrderDeliveryTime = new Date(foodOrder.dailyOrderDeliveryTime);
    }
    nFoodOrder.amount = foodOrder.amount;
    nFoodOrder.itemAmount = foodOrder.itemAmount;
    nFoodOrder.deliveryCharges = foodOrder.deliveryCharges;
    nFoodOrder.taxes = foodOrder.taxes;
    nFoodOrder.orderstatus = foodOrder.orderstatus;
    nFoodOrder.feedbackProvided = false
    nFoodOrder.itemList = foodOrder.itemList;
    nFoodOrder.addOns = foodOrder.addOns;
    nFoodOrder.specialRequest = foodOrder.specialRequest;
    nFoodOrder.nonContactDelivery = foodOrder.nonContactDelivery;
    nFoodOrder.payment_id = foodOrder.payment_id;
    nFoodOrder.order_id = foodOrder.order_id;
    nFoodOrder.receipt = foodOrder.receipt;
    nFoodOrder.discount = foodOrder.discount;
    nFoodOrder.kitchenDiscount = foodOrder.kitchenDiscount;
    nFoodOrder.skipCommission = foodOrder.skipCommission;
    nFoodOrder.amtPaidToKitchen = foodOrder.amtPaidToKitchen;
    nFoodOrder.amtAfterCommisionPaidToKitchen = foodOrder.amtAfterCommisionPaidToKitchen;
    nFoodOrder.orderCommission = foodOrder.orderCommission;
    nFoodOrder.moneyWalletPointsUsed = foodOrder.moneyWalletPointsUsed;
    nFoodOrder.mealaweWalletPointsUsed = foodOrder.mealaweWalletPointsUsed;
    nFoodOrder.mealaweDeliveryDiscount = foodOrder.mealaweDeliveryDiscount;
    nFoodOrder.mealaweItemDiscount = foodOrder.mealaweItemDiscount;
    nFoodOrder.mealaweTotalAmt = foodOrder.mealaweTotalAmt;
    nFoodOrder.mealaweKitchenDiscount = foodOrder.mealaweKitchenDiscount;
    nFoodOrder.distance = foodOrder.distance;
    nFoodOrder.statusHistory = [{ orderstatus: foodOrder.orderstatus, updatedOn: new Date() }];

    nFoodOrder.couponCode = foodOrder.couponCode;
    nFoodOrder.voucherCode = foodOrder.voucherCode;
    nFoodOrder.voucherDiscount = foodOrder.voucherDiscount;
    nFoodOrder.extraDiscount = foodOrder.extraDiscount;
    nFoodOrder.slotStartTime = foodOrder.slotStartTime;
    nFoodOrder.slotEndTime = foodOrder.slotEndTime;
    nFoodOrder.transferExtraAmt = 0;
    nFoodOrder.reduceExtraAmt = 0;
    nFoodOrder.orderTransferred = false;
    nFoodOrder.orderIsTrialMeal = foodOrder.orderIsTrialMeal;
    nFoodOrder.transferHistory = [];
    nFoodOrder.treePlantationOpted = foodOrder.treePlantationOpted;
    nFoodOrder.treePlantationDone = foodOrder.treePlantationDone;
    nFoodOrder.treePlantationAmount = foodOrder.treePlantationAmount ? foodOrder.treePlantationAmount : 0;
    nFoodOrder.treePlantationDiscount = foodOrder.treePlantationDiscount;
    nFoodOrder.treeReceiverName = foodOrder.treeReceiverName;
    nFoodOrder.clusterId = foodOrder.clusterId;
    nFoodOrder.clusterName = foodOrder.clusterName;
    nFoodOrder.pgName = foodOrder.pgName;
    nFoodOrder.transactionTime = new Date();
    nFoodOrder.startManualDelivery = true;
    const orderdetail = await nFoodOrder.save();
    return orderdetail;
}
const updateFoodOrder = async (foodOrder) => {
    const updatedBy = foodOrder.updatedBy;
    const updateByType = foodOrder.updateByType;
    if (foodOrder.statusHistory) {
        foodOrder.statusHistory.push({ orderstatus: foodOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
    } else {
        foodOrder.statusHistory = [];
        foodOrder.statusHistory.push({ orderstatus: foodOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
    }
    // console.log('foodOrder#####',foodOrder);
    return FoodOrder.findOneAndUpdate({ _id: ObjectId(foodOrder._id) }, { $set: foodOrder }, { new: true });
}

const updateRunnerLocation = async (orderId, location) => {
    return FoodOrder.findOneAndUpdate(
        { _id: ObjectId(orderId) },
        { $set: { 'runner.location': location } },
        { new: true, select: '_id runner.location' }
    );
}

const getKitchenOrdersCount = async (kitchenId, clientDate) => {
    const fullResult = {
        'dailyNewOrder': 0,
        'advanceNewOrder': 0,
        'dailyAcceptedOrder': 0,
        'advanceAcceptedOrder': 0,
        'dailyPreparingOrder': 0,
        'advancePreparingOrder': 0,
        'dailyCancelledOrder': 0,
        'advanceCancelledOrder': 0,
        'dailyReadyToDeliveryOrder': 0,
        'advanceReadyToDeliveryOrder': 0,
        'dailyDeliveredOrder': 0,
        'advanceDeliveredOrder': 0,

        // Add apartment counts
        'apartmentNewOrder': 0,
        'apartmentAcceptedOrder': 0,
        'apartmentPreparingOrder': 0,
        'apartmentReadyToDeliveryOrder': 0,
        'apartmentCancelledOrder': 0,
        'apartmentDeliveredOrder': 0,
        'apartmentTodayNewOrder': 0,
        'apartmentTodayAcceptedOrder': 0,
        'apartmentTodayPreparingOrder': 0,
        'apartmentTodayReadyToDeliveryOrder': 0,
        'apartmentTodayCancelledOrder': 0,
        'apartmentTodayDeliveredOrder': 0,
        'apartmentAdvanceNewOrder': 0,
        'apartmentAdvanceAcceptedOrder': 0,
        'apartmentAdvancePreparingOrder': 0,
        'apartmentAdvanceReadyToDeliveryOrder': 0,
        'apartmentAdvanceCancelledOrder': 0,
        'apartmentAdvanceDeliveredOrder': 0,
    };

    let today = getTodayStartTime();
    // today.setHours(0,0,0,0);

    // Define conditions
    const dailyCondition = { orderType: 'daily', orderDate: { $gte: today }, kitchenId: ObjectId(kitchenId) };
    const advanceCondition = { orderType: 'advance', orderComplitionDate: { $gte: today }, kitchenId: ObjectId(kitchenId) };
    const apartmentCondition = { orderType: { $in: ['apartment_today', 'apartment_advance'] }, kitchenId: ObjectId(kitchenId) };

    // Get ALL apartment orders for this kitchen
    const allApartmentOrders = await FoodOrder.find(apartmentCondition);

    // Helper function to check if an apartment order is for today or advance
    const isApartmentOrderForToday = (order) => {
        return order.itemList.some(item => {
            let itemDate;
            if (item.itemServingDate) {
                itemDate = new Date(item.itemServingDate);
            } else {
                itemDate = new Date(order.orderDate);
            }
            itemDate.setHours(0, 0, 0, 0);
            return itemDate.getTime() === today.getTime();
        });
    };

    const isApartmentOrderForAdvance = (order) => {
        return order.itemList.some(item => {
            let itemDate;
            if (item.itemServingDate) {
                itemDate = new Date(item.itemServingDate);
            } else {
                itemDate = new Date(order.orderDate);
            }
            itemDate.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return itemDate >= tomorrow;
        });
    };

    // Process apartment orders
    allApartmentOrders.forEach(order => {
        const isToday = isApartmentOrderForToday(order);
        const isAdvance = isApartmentOrderForAdvance(order);

        if (isToday || isAdvance) {
            // Total apartment counts (both today and advance)
            switch (order.orderstatus) {
                case 'placed':
                    fullResult.apartmentNewOrder++;
                    break;
                case 'accepted':
                    fullResult.apartmentAcceptedOrder++;
                    break;
                case 'preparing':
                    fullResult.apartmentPreparingOrder++;
                    break;
                case 'readyToDelivery':
                case 'deliveryBoyAssigned':
                    fullResult.apartmentReadyToDeliveryOrder++;
                    break;
                case 'handedOverToDeliveryBoy':
                case 'onTheWay':
                case 'delivered':
                    fullResult.apartmentDeliveredOrder++;
                    break;
                case 'cancelledByKitchen':
                case 'rejectedByKitchen':
                    fullResult.apartmentCancelledOrder++;
                    break;
            }

            // Today-specific counts
            if (isToday) {
                switch (order.orderstatus) {
                    case 'placed':
                        fullResult.apartmentTodayNewOrder++;
                        break;
                    case 'accepted':
                        fullResult.apartmentTodayAcceptedOrder++;
                        break;
                    case 'preparing':
                        fullResult.apartmentTodayPreparingOrder++;
                        break;
                    case 'readyToDelivery':
                    case 'deliveryBoyAssigned':
                        fullResult.apartmentTodayReadyToDeliveryOrder++;
                        break;
                    case 'handedOverToDeliveryBoy':
                    case 'onTheWay':
                    case 'delivered':
                        fullResult.apartmentTodayDeliveredOrder++;
                        break;
                    case 'cancelledByKitchen':
                    case 'rejectedByKitchen':
                        fullResult.apartmentTodayCancelledOrder++;
                        break;
                }
            }

            // Advance-specific counts
            if (isAdvance) {
                switch (order.orderstatus) {
                    case 'placed':
                        fullResult.apartmentAdvanceNewOrder++;
                        break;
                    case 'accepted':
                        fullResult.apartmentAdvanceAcceptedOrder++;
                        break;
                    case 'preparing':
                        fullResult.apartmentAdvancePreparingOrder++;
                        break;
                    case 'readyToDelivery':
                    case 'deliveryBoyAssigned':
                        fullResult.apartmentAdvanceReadyToDeliveryOrder++;
                        break;
                    case 'handedOverToDeliveryBoy':
                    case 'onTheWay':
                    case 'delivered':
                        fullResult.apartmentAdvanceDeliveredOrder++;
                        break;
                    case 'cancelledByKitchen':
                    case 'rejectedByKitchen':
                        fullResult.apartmentAdvanceCancelledOrder++;
                        break;
                }
            }
        }
    });

    // Get counts for other order types using aggregation
    const result = await FoodOrder.aggregate(
        [
            {
                '$facet': {
                    'dailyNewOrder': [{ $match: { orderstatus: 'placed', ...dailyCondition } },
                    { $count: 'dailyNewOrder' }],
                    'advanceNewOrder': [{ $match: { orderstatus: 'placed', ...advanceCondition } },
                    { $count: 'advanceNewOrder' }],
                    'dailyAcceptedOrder': [{ $match: { orderstatus: 'accepted', ...dailyCondition } },
                    { $count: 'dailyAcceptedOrder' }],
                    'advanceAcceptedOrder': [{ $match: { orderstatus: 'accepted', ...advanceCondition } },
                    { $count: 'advanceAcceptedOrder' }],
                    'dailyPreparingOrder': [{ $match: { orderstatus: 'preparing', ...dailyCondition } },
                    { $count: 'dailyPreparingOrder' }],
                    'advancePreparingOrder': [{ $match: { orderstatus: 'preparing', ...advanceCondition } },
                    { $count: 'advancePreparingOrder' }],
                    'dailyCancelledOrder': [{
                        $match: {
                            orderstatus: { $in: ['cancelledByKitchen', 'rejectedByKitchen'] },
                            ...dailyCondition
                        }
                    }, { $count: 'dailyCancelledOrder' }],
                    'advanceCancelledOrder': [{ $match: { orderstatus: { $in: ['cancelledByKitchen', 'rejectedByKitchen'] }, ...advanceCondition } },
                    { $count: 'advanceCancelledOrder' }],
                    'dailyReadyToDeliveryOrder': [{
                        $match: {
                            orderstatus: { $in: ['readyToDelivery', 'deliveryBoyAssigned'] },
                            ...dailyCondition
                        }
                    }, { $count: 'dailyReadyToDeliveryOrder' }],
                    'advanceReadyToDeliveryOrder': [{
                        $match: {
                            orderstatus: { $in: ['readyToDelivery', 'deliveryBoyAssigned'] },
                            ...advanceCondition
                        }
                    }, { $count: 'advanceReadyToDeliveryOrder' }],
                    'dailyDeliveredOrder': [{
                        $match: {
                            orderstatus: { $in: ['handedOverToDeliveryBoy', 'onTheWay', 'delivered'] },
                            ...dailyCondition
                        }
                    }, { $count: 'dailyDeliveredOrder' }],
                    'advanceDeliveredOrder': [{
                        $match: {
                            orderstatus: { $in: ['handedOverToDeliveryBoy', 'onTheWay', 'delivered'] },
                            ...advanceCondition
                        }
                    }, { $count: 'advanceDeliveredOrder' }]
                }
            },
            {
                '$project': {
                    'dailyNewOrder': { '$arrayElemAt': ['$dailyNewOrder.dailyNewOrder', 0] },
                    'advanceNewOrder': { '$arrayElemAt': ['$advanceNewOrder.advanceNewOrder', 0] },
                    'dailyAcceptedOrder': { '$arrayElemAt': ['$dailyAcceptedOrder.dailyAcceptedOrder', 0] },
                    'advanceAcceptedOrder': { '$arrayElemAt': ['$advanceAcceptedOrder.advanceAcceptedOrder', 0] },
                    'dailyPreparingOrder': { '$arrayElemAt': ['$dailyPreparingOrder.dailyPreparingOrder', 0] },
                    'advancePreparingOrder': { '$arrayElemAt': ['$advancePreparingOrder.advancePreparingOrder', 0] },
                    'dailyCancelledOrder': { '$arrayElemAt': ['$dailyCancelledOrder.dailyCancelledOrder', 0] },
                    'advanceCancelledOrder': { '$arrayElemAt': ['$advanceCancelledOrder.advanceCancelledOrder', 0] },
                    'dailyReadyToDeliveryOrder': { '$arrayElemAt': ['$dailyReadyToDeliveryOrder.dailyReadyToDeliveryOrder', 0] },
                    'advanceReadyToDeliveryOrder': { '$arrayElemAt': ['$advanceReadyToDeliveryOrder.advanceReadyToDeliveryOrder', 0] },
                    'dailyDeliveredOrder': { '$arrayElemAt': ['$dailyDeliveredOrder.dailyDeliveredOrder', 0] },
                    'advanceDeliveredOrder': { '$arrayElemAt': ['$advanceDeliveredOrder.advanceDeliveredOrder', 0] }
                }
            }
        ]
    );

    // Merge the aggregation results with our manually calculated apartment counts
    const finalResult = (result && result.length > 0) ? { ...fullResult, ...result[0] } : { ...fullResult };

    // Calculate totals for frontend
    finalResult.totalApartmentTodayOrders =
        (finalResult.apartmentTodayNewOrder || 0) +
        (finalResult.apartmentTodayAcceptedOrder || 0) +
        (finalResult.apartmentTodayPreparingOrder || 0) +
        (finalResult.apartmentTodayReadyToDeliveryOrder || 0) +
        (finalResult.apartmentTodayCancelledOrder || 0) +
        (finalResult.apartmentTodayDeliveredOrder || 0);

    finalResult.totalApartmentAdvanceOrders =
        (finalResult.apartmentAdvanceNewOrder || 0) +
        (finalResult.apartmentAdvanceAcceptedOrder || 0) +
        (finalResult.apartmentAdvancePreparingOrder || 0) +
        (finalResult.apartmentAdvanceReadyToDeliveryOrder || 0) +
        (finalResult.apartmentAdvanceCancelledOrder || 0) +
        (finalResult.apartmentAdvanceDeliveredOrder || 0);

    finalResult.totalApartmentOrders =
        (finalResult.apartmentNewOrder || 0) +
        (finalResult.apartmentAcceptedOrder || 0) +
        (finalResult.apartmentPreparingOrder || 0) +
        (finalResult.apartmentReadyToDeliveryOrder || 0) +
        (finalResult.apartmentCancelledOrder || 0) +
        (finalResult.apartmentDeliveredOrder || 0);

    return finalResult;
}
const updateOrderStatus = async (ids, status, body) => {
    // console.log('updateOrderStatus ',status)
    const statusCondition = { orderstatus: status, updatedOn: new Date() }
    if (body) {
        statusCondition.updatedBy = body.updatedBy;
        statusCondition.updateByType = body.updateByType;
    }
    await FoodOrder.updateMany(
        { _id: { $in: [...ids] } },
        { $set: { orderstatus: status }, $push: { statusHistory: statusCondition } },
        { new: true });

    const updatedOrders = await FoodOrder.find({ _id: { $in: ids } });

    return ids.length === 1 ? updatedOrders[0] : updatedOrders;
}

const updatePendingOrdersProps = async (orderIds, updateProp, updateInfo) => {
    const orderstatus = updateProp.orderTransferred ? 'orderTransferred' : (updateProp.orderstatus);
    const updateCondtion = { orderstatus, updatedOn: new Date() }
    if (updateInfo) {
        updateCondtion.updatedBy = updateInfo.updatedBy;
        updateCondtion.updateByType = updateInfo.updateByType;
    }

    return await FoodOrder.updateMany(
        { _id: { $in: [...orderIds] },orderstatus: { $ne: 'delivered' } },
        { $set: { ...updateProp }, $push: { statusHistory: updateCondtion } },
        { new: true });
}

const updateFeedbackstatus = async (id) => {
    return await FoodOrder.findOneAndUpdate(
        { _id: id },
        { $set: { feedbackProvided: true } },
        { new: true });
}
const getFoodOrderList = async (ids) => {
    return await FoodOrder.find({ _id: { $in: [...ids] } },
        { orderstatus: 1, orderDate: 1, customerId: 1, orderNo: 1, kitchenId: 1, amount: 1, itemList: 1, addOns: 1, _id: 1 });
}
const getFoodOrderbyOrderNoThinkOwl = async (id) => {
    return await FoodOrder.findOne({ orderNo: id });
}
const getFoodOrderbyCustomerEmailThinkOwl = async (email) => {
    return await FoodOrder.findOne({ customerEmail: email });
}
const getFoodOrder = async (id) => {
    return await FoodOrder.findById(id);
}
const getFoodOrderByorderNo = async (orderNo) => {
    return await FoodOrder.findOne({ orderNo: orderNo });
}
const getfcmFoodOrder = async () => {
    return await FoodOrder.find({
        orderstatus: 'placed',
        orderType: { $ne: ['apartment_today', 'apartment_advance'] } // Exclude apartment orders
    });
}
// const getfcmFoodOrder = async () => {
//     return await FoodOrder.find({ 
//         orderstatus: 'placed',
//         orderType: { $ne: ['apartment_today','apartment_advance'] } // Exclude apartment orders
//     });
// }
const searchFoodOrderList = async (searchObj, page) => {
    const limit = 50;
    const condition = {};
    if (searchObj.orderStatus && searchObj.orderStatus.length > 0) {
        condition.orderstatus = { $in: [...searchObj.orderStatus] }
    }
    if (searchObj.orderNo) {
        if (isNaN(searchObj.orderNo)) {
            condition.orderNo = 0;
        } else {
            condition.orderNo = parseInt(searchObj.orderNo);
        }
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
        const dateRange = { $gte: new Date(searchObj.fromDate), $lte: new Date(searchObj.toDate) };
        condition.$or = [
            { orderDate: dateRange },
            { orderComplitionDate: dateRange }
        ];
    }
    if (searchObj.routeNo) {
        condition.routeNo = parseInt(searchObj.routeNo);
    }
    if (searchObj.routeRank) {
        condition.routeRank = parseInt(searchObj.routeRank);
    }
    if (searchObj.clusterList) {
        condition.clusterId = { $in: searchObj.clusterList };
    }
    return await FoodOrder.find(condition).sort({ orderDate: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const getCurrentOrdersCount = async (clusterList) => {
    const fullResult = {
        'paymentInprogress': 0,
        'paymentFailed': 0,
        'newOrder': 0,
        'acceptedOrder': 0,
        'preparingOrder': 0,
        'readyToDeliveryOrder': 0,
        'deliveryBoyAssigned': 0,
        'handedOverToDeliveryBoy': 0,
        'onTheWay': 0,
        'deliveredOrder': 0,
        'autoCancelled': 0,
        'rejectedByKitchen': 0,
        'cancelledByKitchen': 0,
        'cancelledByUser': 0
    };
    let today = getTodayStartTime();
    let tomorrow = getTodayStartTime()
    tomorrow.setDate(tomorrow.getDate() + 1);
    const condition = {
        $or: [
            { orderDate: { $gte: today, $lt: tomorrow } },
            { orderComplitionDate: { $gte: today } }
        ],
        orderType: { $nin: ['apartment_today', 'apartment_advance'] }
    };
    const condition1 = {
        $or: [
            { orderDate: { $gte: today } },
            { stopPaymentValidation: false }
        ],
        orderType: { $nin: ['apartment_today', 'apartment_advance'] }
    };
    const condition2 = { orderType: { $nin: ['apartment_today', 'apartment_advance'] } };
    if (clusterList && clusterList.length > 0) {
        condition.clusterId = { $in: clusterList };
        condition1.clusterId = { $in: clusterList };
        condition2.clusterId = { $in: clusterList };
    }
    const result = await FoodOrder.aggregate(
        [
            {
                '$facet': {
                    'paymentInprogress': [{ $match: { orderstatus: 'paymentInprogress', ...condition1 } }, { $count: 'paymentInprogress' }],
                    'paymentFailed': [{ $match: { orderstatus: 'paymentFailed', ...condition1 } }, { $count: 'paymentFailed' }],
                    'newOrder': [{ $match: { orderstatus: 'placed', ...condition2 } }, { $count: 'newOrder' }],
                    'acceptedOrder': [{ $match: { orderstatus: 'accepted', ...condition } }, { $count: 'acceptedOrder' }],
                    'preparingOrder': [{ $match: { orderstatus: 'preparing', ...condition } }, { $count: 'preparingOrder' }],
                    'readyToDeliveryOrder': [{ $match: { orderstatus: 'readyToDelivery', ...condition2 } }, { $count: 'readyToDeliveryOrder' }],
                    'deliveryBoyAssigned': [{ $match: { orderstatus: 'deliveryBoyAssigned', ...condition2 } }, { $count: 'deliveryBoyAssigned' }],
                    'handedOverToDeliveryBoy': [{ $match: { orderstatus: 'handedOverToDeliveryBoy', ...condition2 } }, { $count: 'handedOverToDeliveryBoy' }],
                    'onTheWay': [{ $match: { orderstatus: 'onTheWay', ...condition2 } }, { $count: 'onTheWay' }],
                    'deliveredOrder': [{ $match: { orderstatus: 'delivered', ...condition } }, { $count: 'deliveredOrder' }],
                    'autoCancelled': [{ $match: { orderstatus: 'autoCancelled', ...condition } }, { $count: 'autoCancelled' }],
                    'rejectedByKitchen': [{ $match: { orderstatus: 'rejectedByKitchen', ...condition } }, { $count: 'rejectedByKitchen' }],
                    'cancelledByKitchen': [{ $match: { orderstatus: 'cancelledByKitchen', ...condition } }, { $count: 'cancelledByKitchen' }],
                    'cancelledByUser': [{ $match: { orderstatus: 'cancelledByUser', ...condition } }, { $count: 'cancelledByUser' }]
                }
            },
            {
                '$project': {
                    'paymentInprogress': { '$arrayElemAt': ['$paymentInprogress.paymentInprogress', 0] },
                    'paymentFailed': { '$arrayElemAt': ['$paymentFailed.paymentFailed', 0] },
                    'newOrder': { '$arrayElemAt': ['$newOrder.newOrder', 0] },
                    'acceptedOrder': { '$arrayElemAt': ['$acceptedOrder.acceptedOrder', 0] },
                    'preparingOrder': { '$arrayElemAt': ['$preparingOrder.preparingOrder', 0] },
                    'readyToDeliveryOrder': { '$arrayElemAt': ['$readyToDeliveryOrder.readyToDeliveryOrder', 0] },
                    'deliveryBoyAssigned': { '$arrayElemAt': ['$deliveryBoyAssigned.deliveryBoyAssigned', 0] },
                    'handedOverToDeliveryBoy': { '$arrayElemAt': ['$handedOverToDeliveryBoy.handedOverToDeliveryBoy', 0] },
                    'onTheWay': { '$arrayElemAt': ['$onTheWay.onTheWay', 0] },
                    'deliveredOrder': { '$arrayElemAt': ['$deliveredOrder.deliveredOrder', 0] },
                    'autoCancelled': { '$arrayElemAt': ['$autoCancelled.autoCancelled', 0] },
                    'rejectedByKitchen': { '$arrayElemAt': ['$rejectedByKitchen.rejectedByKitchen', 0] },
                    'cancelledByKitchen': { '$arrayElemAt': ['$cancelledByKitchen.cancelledByKitchen', 0] },
                    'cancelledByUser': { '$arrayElemAt': ['$cancelledByUser.cancelledByUser', 0] }
                }
            }
        ]

    );
    return (result && result.length > 0) ? { ...fullResult, ...result[0] } : { ...fullResult };
}

const getCurrentOrdersList = async (status, clusterList, page, limit) => {
    let today = getTodayStartTime();
    let tomorrow = getTodayStartTime();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let condition = {
        orderstatus: status,
        $or: [{ orderDate: { $gte: today, $lt: tomorrow } },
        { orderComplitionDate: { $gte: today } }]
    };
    if (status === 'placed') {
        condition = { orderstatus: status };
    }
    if (clusterList && clusterList.length > 0) {
        condition.clusterId = { $in: clusterList };
    }
    // const condition = {};
    return await FoodOrder.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const getdashboardCount = async () => {
    const orderdetail = await FoodOrder.find({}, { orderType: 1, orderDate: 1, itemAmount: 1, refund_amount: 1, orderstatus: 1 });
    return orderdetail;
};

const getListForReward = async (searchObj) => {
    const condition = { orderstatus: 'delivered' };
    const condition1 = {}
    if (searchObj.fromDate && searchObj.toDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate), $lte: new Date(searchObj.toDate) }
    }
    if (searchObj.lowerLimit) {
        // condition1.$gte = searchObj.lowerLimit
        condition1.$gte = 1;
    }
    if (searchObj.upperLimit) {
        // condition1.$lte = searchObj.upperLimit
        condition1.$lte = 15;
    }
    // console.log('getListForReward === ',condition, condition1)
    const result = await FoodOrder.aggregate(
        [
            {
                $match: condition
            },
            {
                $group:
                {
                    _id: '$kitchenName',
                    kitchenId: { $last: '$kitchenId' },
                    totalOrderAmount: { $sum: '$itemAmount' },
                    count: { $sum: 1 }
                }
            },
            {
                $match: { 'count': condition1 }
            }
        ]
    );
    return result;
}

const updateDeliveryOrder = async (deliveryTaskId, orderNoList, deliveryVendor, deliveryAmtPaidByMealawe, pickup_otp, drop_otp) => {
    // console.log('updateDeliveryOrder###')
    const setCondition = { deliveryTaskId, orderstatus: 'readyToDelivery', deliveryVendor };
    if (deliveryAmtPaidByMealawe) {
        setCondition.deliveryAmtPaidByMealawe = deliveryAmtPaidByMealawe
    }
    if (pickup_otp) {
        setCondition.pickup_otp = pickup_otp
    }
    if (drop_otp) {
        setCondition.drop_otp = drop_otp
    }
    return await FoodOrder.updateMany({ orderNo: { $in: [...orderNoList] } },
        { $set: setCondition }
    );
};

const updateFoodOrderProps = async (orderNoList, updateCondtion) => {
    // console.log('updateFoodOrderProps###',updateCondtion);  
    return await FoodOrder.updateMany({ orderNo: { $in: [...orderNoList] } },
        { $set: updateCondtion }
    );
};

const getFoodOrderListByOrderNo = async (orderNos) => {
    // return await FoodOrder.find({orderNo: orderNos.ids[0] });
    return await FoodOrder.find({ orderNo: { $in: [...orderNos] } });
}

const getFoodOrderByOrderNo = async (orderNo) => {
    return await FoodOrder.findOne({ orderNo });
}
const updateOrderWhilePayingKitchen = async (orderList) => {
    let bulkArr = [];
    for (const order of orderList) {
        bulkArr.push({
            updateOne: {
                "filter": { _id: order.id },
                "update": {
                    $set: {
                        amtPaidToKitchen: order.amtPaidToKitchen, amtAfterCommisionPaidToKitchen: order.amtAfterCommisionPaidToKitchen,
                        orderCommission: order.orderCommission
                    }
                }
            }
        })
    }
    return await FoodOrder.bulkWrite(bulkArr);
};

const getCustomerOpenOrders = async (customerId) => {
    const orderStatusList = ['placed', 'accepted', 'preparing', 'readyToDelivery',
        'deliveryBoyAssigned', 'handedOverToDeliveryBoy', 'onTheWay'];
    const orderList = await FoodOrder.find({ customerId, orderstatus: { $in: [...orderStatusList] } })
        .sort({ _id: -1 });
    return orderList;
}
const getCustomerSpecificOrders = async (customerId, page, getNonCompletedOrder) => {
    let orderStatusList = [];
    let limit = 10;
    if (getNonCompletedOrder === 'yes') {
        orderStatusList = ['paymentInprogress', 'paymentFailed', 'cancelledByUser',
            'cancelledByKitchen', 'rejectedByKitchen', 'autoCancelled'];
    } else {
        orderStatusList = ['placed', 'accepted', 'preparing', 'readyToDelivery', 'deliveryBoyAssigned', 'handedOverToDeliveryBoy',
            'onTheWay', 'delivered'];
    }
    const orderList = await FoodOrder.find({ customerId, orderstatus: { $in: [...orderStatusList] } })
        .sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
    return orderList;
}

const getKitchenDashboardCount = async (kitchenId, clientDate, orderType) => {
    let today = getTodayStartTime();
    let tomorrow = getTodayStartTime();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let condition = {
        kitchenId,
        $or: [
            { orderDate: { $gte: today, $lt: tomorrow } },
            { orderComplitionDate: { $gte: today } },
        ]
    };
    if (orderType !== 'all') {
        condition.orderType = orderType;
    }
    const orderdetail = await FoodOrder.find(condition, { orderstatus: 1, orderType: 1, mealType: 1 });
    return orderdetail;
}

const getCustomerCurrentOpenOrders = async (customerId, clientDate) => {
    const orderStatusList = ['placed', 'accepted', 'preparing', 'readyToDelivery',
        'deliveryBoyAssigned', 'handedOverToDeliveryBoy', 'onTheWay'];
    let today = getTodayStartTime();
    let tomorrow = getTodayStartTime();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let condition = {
        customerId,
        orderstatus: { $in: [...orderStatusList] },
        $or: [
            { orderDate: { $gte: today, $lt: tomorrow } },
            { orderComplitionDate: { $gte: today } },
        ]
    };
    const orderList = await FoodOrder.find(condition).sort({ _id: -1 });
    return orderList;
}

const getCustomerPastOrders = async (customerId, page, clientDate) => {
    let limit = 50;
    let tomorrow = new Date(clientDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let condition = {
        customerId,
        orderDate: { $lt: tomorrow }
    };
    const orderList = await FoodOrder.find(condition)
        .sort({ orderDate: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
    return orderList;
};

const performOrderTransfer = async (tranferredOrder) => {
    const order = {};
    order.kitchenId = tranferredOrder.kitchenId;
    order.kitchenName = tranferredOrder.kitchenName;
    order.kitchenPhoneNo = tranferredOrder.kitchenPhoneNo;
    order.kitchenmapTelNo = tranferredOrder.kitchenmapTelNo ? foodOrder.kitchenmapTelNo : '';
    order.kitchenAddress = tranferredOrder.kitchenAddress;
    order.kitchenGeolocation = tranferredOrder.kitchenGeolocation;
    order.deliveryByMealaweBoy = tranferredOrder.deliveryByMealaweBoy;
    order.skipWalletPayment = tranferredOrder.skipWalletPayment;
    order.distance = tranferredOrder.distance;
    order.transferExtraAmt = tranferredOrder.transferExtraAmt;
    order.reduceExtraAmt = tranferredOrder.reduceExtraAmt;
    order.orderTransferred = tranferredOrder.orderTransferred;
    order.transferHistory = tranferredOrder.transferHistory;
    order.transferHistory[order.transferHistory.length - 1].updatedBy = tranferredOrder.updatedBy;
    order.transferHistory[order.transferHistory.length - 1].updateByType = tranferredOrder.updateByType;
    order.firstKitchenName = tranferredOrder.firstKitchenName;
    order.itemAmount = tranferredOrder.itemAmount;
    const statusCondition = { 
        orderstatus: 'orderTransferred', 
        updatedOn: new Date(),
        updatedBy: tranferredOrder.updatedBy,
        updateByType: tranferredOrder.updateByType
    };
    return await FoodOrder.findOneAndUpdate(
            { _id: tranferredOrder._id },
            { 
                $set: order,
                $push: { statusHistory: statusCondition }
            }, 
            { new: true }
        );
    
};

const getRefundOrders = async () => {
    const orderdetail = await FoodOrder.find({ orderstatus: 'paymentInprogress', stopRefundProcess: { $ne: true } }).sort({ _id: -1 });
    return orderdetail;
};
const saveMultipleOrders = async (orderList) => {
    const orderdetail = await FoodOrder.insertMany(orderList);
    return orderdetail;
};

const updateFoodOrderDate = async (id, orderDate, body) => {
    const statusCondition = { orderstatus: 'rescheduled', updatedOn: new Date() }
    
    if (body) {
        statusCondition.updatedBy = body.updatedBy;
        statusCondition.updateByType = body.updateByType;
    }
    try {
        return FoodOrder.findOneAndUpdate({ 
            _id: id, orderType: 'subscription', orderstatus: { $ne: 'delivered' }},
            { $set: { orderDate: orderDate }, $push: { statusHistory: statusCondition } },
            { new: true }
        );
    } catch (err) {
        console.log(err);
    }
};

const updateFoodMealType = async (id, mealType, slot, orderDate, body) => {
    // console.log(id,mealType,'foodorder.dao')
    const statusCondition = { orderstatus: 'orderTypeAndSlotAndDateChanged', updatedOn: new Date() }
    if (body) {
        statusCondition.updatedBy = body.updatedBy;
        statusCondition.updateByType = body.updateByType;
    }
    const condition = {
        mealType: mealType
    }
    if (orderDate) {
        condition.orderDate = getLocalMidDate(orderDate);
    }
    if (mealType === 'Lunch') {
        condition.subscriptionLunchSlot = slot;
        condition.subscriptionDinnerSlot = '';
    } else {
        condition.subscriptionDinnerSlot = slot;
        condition.subscriptionLunchSlot = '';
    }
    return FoodOrder.findOneAndUpdate({ _id: id, orderType: 'subscription' },
        { $set: condition, $push: { statusHistory: statusCondition } },
        { new: true });

};

const performMultiOrderTransfer = async (ids, tranferredOrder) => {
    return await FoodOrder.updateMany(
        { _id: { $in: [...ids] } },
        { $set: { ...tranferredOrder } },
        { new: true });
};

const getAllSubscriptionFoodOrders = async (subscriptionMasterId) => {
    const orderdetail = await FoodOrder.find({ subscriptionMasterId });
    return orderdetail;
};

const getCustomerCouponOrderList = async (customerId, couponCode, clientDate) => {
    const orderStatusList = ['placed', 'accepted', 'preparing', 'readyToDelivery',
        'deliveryBoyAssigned', 'handedOverToDeliveryBoy', 'onTheWay'];
    if (couponCode == 'FIRSTBITE') {
        orderStatusList.push('delivered');
    }
    const condition = { customerId, couponCode, orderstatus: { $in: [...orderStatusList] } };
    if (clientDate) {
        let today = getTodayStartTime();
        condition.orderDate = { $gte: today }
    }
    const order = await FoodOrder.findOne(condition);
    return order;
};

const updateManualDelivery = async (id) => {
    return await FoodOrder.findOneAndUpdate(
        { _id: id },
        { $set: { startManualDelivery: true } },
        { new: true });
}

const updateDeliveryByMealaweBoy = async (id) => {
    return await FoodOrder.findOneAndUpdate(
        { _id: id },
        { $set: { deliveryByMealaweBoy: true } },
        { new: true });
}

const checkPhoneNo = async () => {
    return await FoodOrder.find({ $where: 'this.customerPhoneNo === this.kitchenPhoneNo' }, { orderNo: 1 });
}

const updatePackageImage = async (id, prop, filename) => {
    foodOrder = {};
    foodOrder[prop] = filename;
    const savedOrder = await FoodOrder.findOne({ _id: id });
    const updatedFoodOrder = await FoodOrder.findOneAndUpdate({ _id: id }, { $set: foodOrder }, { new: true });
    if (savedOrder[prop]) {
        deleteImage(savedOrder[prop]);
    }
    return updatedFoodOrder
}

const RIDER_TRIP_IMAGE_PROPS = ['selfieImageUrl', 'odometerImageUrl'];

const setRiderTripImage = async (id, prop, filename) => {
    if (!RIDER_TRIP_IMAGE_PROPS.includes(prop)) {
        throw new Error('invalid rider trip image prop');
    }
    const update = {};
    update[prop] = filename;
    if (prop === 'selfieImageUrl') {
        update.selfieCapturedAt = new Date();
    } else if (prop === 'odometerImageUrl') {
        update.odometerCapturedAt = new Date();
    }
    const previous = await FoodOrder.findOne({ _id: id }, { [prop]: 1 });
    const updatedFoodOrder = await FoodOrder.findOneAndUpdate(
        { _id: id },
        { $set: update },
        { new: true }
    );
    if (previous && previous[prop]) {
        try { deleteImage(previous[prop]); } catch (e) { /* best-effort cleanup */ }
    }
    return updatedFoodOrder;
}

const setOrderProofImage = async (id, filename, gps) => {
    const update = {
        proofImageUrl: filename,
        proofCapturedAt: new Date()
    };
    if (gps && gps.lat != null && gps.lng != null) {
        update.proofGps = { lat: Number(gps.lat), lng: Number(gps.lng) };
    }
    const previous = await FoodOrder.findOne({ _id: id }, { proofImageUrl: 1 });
    const updatedFoodOrder = await FoodOrder.findOneAndUpdate(
        { _id: id },
        { $set: update },
        { new: true }
    );
    if (previous && previous.proofImageUrl) {
        try { deleteImage(previous.proofImageUrl); } catch (e) { /* best-effort cleanup */ }
    }
    return updatedFoodOrder;
}

const startRiderTrip = async (id, payload) => {
    const update = {
        tripId: payload.tripId,
        startKM: payload.startKM,
        selfieImageUrl: payload.selfieImageUrl,
        selfieGps: payload.selfieGps,
        selfieCapturedAt: payload.selfieCapturedAt,
        odometerImageUrl: payload.odometerImageUrl,
        odometerCapturedAt: payload.odometerCapturedAt,
        riderTripStartedAt: new Date()
    };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    return FoodOrder.findOneAndUpdate({ _id: id }, { $set: update }, { new: true });
}

const getPaymentValidationOrder = async () => {
    let today = getTodayStartTime();
    let tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let condition = {
        orderstatus: { $in: ['paymentInprogress', 'paymentFailed'] },
        stopPaymentValidation: false,
        orderType: { $nin: ['apartment_today', 'apartment_advance'] }

        // $or: [
        //     {orderDate: {$gte: today, $lt: tomorrow} }
        // ]
    };
    const orderList = await FoodOrder.find(condition);
    return orderList;
}


const getCustomerVoucherOrderList = async (customerId, voucherCode, checkForToday) => {
    const orderStatusList = ['placed', 'accepted', 'preparing', 'readyToDelivery',
        'deliveryBoyAssigned', 'handedOverToDeliveryBoy', 'onTheWay'];
    const condition = { customerId, voucherCode, orderstatus: { $in: [...orderStatusList] } };
    if (checkForToday) {
        let today = getTodayStartTime();
        condition.orderDate = { $gte: today }
    }
    const order = await FoodOrder.findOne(condition);
    return order;
};

const getVoucherUsedOrderList = async (voucherCode) => {
    const orderStatusList = ['placed', 'accepted', 'preparing', 'readyToDelivery',
        'deliveryBoyAssigned', 'handedOverToDeliveryBoy', 'onTheWay'];
    const condition = { voucherCode, orderstatus: { $in: [...orderStatusList] } };
    const order = await FoodOrder.findOne(condition);
    return order;
};

const getLastUnratedDeliveredOrder = async (customerId, fromDate, toDate) => {
    const condition = {
        customerId, orderstatus: 'delivered', feedbackProvided: { $not: { $in: [true] } }, $or: [
            { orderDate: { $gte: fromDate, $lte: toDate }, orderType: 'allDay' },
            { orderDate: { $gte: fromDate, $lte: toDate }, orderType: 'subscription' },
            { orderComplitionDate: { $gte: fromDate, $lte: toDate }, orderType: 'advance' }
        ]
    };
    const order = await FoodOrder.findOne(condition);
    return order;
}

const getLastUnratedDeliveredOrderList = async (customerId, fromDate, toDate) => {
    const condition = {
        customerId, orderstatus: 'delivered', feedbackProvided: { $not: { $in: [true] } }, $or: [
            { orderDate: { $gte: fromDate, $lte: toDate }, orderType: 'allDay' },
            { orderDate: { $gte: fromDate, $lte: toDate }, orderType: 'subscription' },
            { orderComplitionDate: { $gte: fromDate, $lte: toDate }, orderType: 'advance' }
        ]
    };
    const order = await FoodOrder.find(condition);
    return order;
}

const exportFoodOrderList = async (searchObj) => {
    let condition = {}
    if (searchObj.allStatus != true) {
        condition = { orderstatus: 'delivered' };
    }
    if (searchObj.fromDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate) };
        if (searchObj.toDate) {
            condition.orderDate.$lte = new Date(searchObj.toDate);
        }
    }
    condition.orderType = { $nin: ['apartment_today', 'apartment_advance'] };
    console.log('condition', condition);
    // return await FoodOrder.find(condition).sort({ orderDate: -1 });

    const batchSize = 10000;
    let page = 0;
    let all = [];

    while (true) {
        const data = await FoodOrder
            .find(condition)
            .sort({ orderDate: -1 })
            .skip(page * batchSize)
            .limit(batchSize)
            .lean();

        if (!data.length) break;

        all.push(...data);
        page++;
    }
    return all;
}

const exportApartmentFoodOrderList = async (searchObj) => {
    let condition = {}
    if (searchObj.allStatus != true) {
        condition = { orderstatus: 'delivered' };
    }
    if (searchObj.fromDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate) };
        if (searchObj.toDate) {
            condition.orderDate.$lte = new Date(searchObj.toDate);
        }
    }
    condition.orderType = { $in: ['apartment_today', 'apartment_advance'] };
    // return await FoodOrder.find(condition).sort({ orderDate: -1 });

    const batchSize = 10000;
    let page = 0;
    let all = [];

    while (true) {
        const data = await FoodOrder
            .find(condition)
            .sort({ orderDate: -1 })
            .skip(page * batchSize)
            .limit(batchSize)
            .lean();

        if (!data.length) break;

        all.push(...data);
        page++;
    }
    return all;
}


const getKitchenAssignedOrders = async (kitchenIdList) => {
    const monthFirstDate = getTodayStartTime();
    monthFirstDate.setDate(1);
    const condition = {
        kitchenId: { $in: [...(kitchenIdList.map(ele => ObjectId(ele)))] },
        orderstatus: 'delivered',
        orderType: 'subscription',
        orderDate: { $gte: monthFirstDate }
    };
    // console.log('condition',condition);
    const result = await FoodOrder.aggregate(
        [
            {
                $match: condition
            },
            { $unwind: "$itemList" },
            {
                $group:
                {
                    '_id': '$kitchenId',
                    totalMonthlycompletedOrders: { $sum: '$itemList.count' },
                    count: { $sum: 1 }
                }
            }
        ]
    );
    return result;
}

const getAssignedMontlyOrders = async (kitchenId) => {
    const monthFirstDate = getTodayStartTime();
    monthFirstDate.setDate(1);
    const condition = {
        kitchenId: ObjectId(kitchenId),
        orderstatus: 'delivered',
        orderType: 'subscription',
        orderDate: { $gte: monthFirstDate }
    };
    const result = await FoodOrder.countDocuments(condition);
    return result;

}

const kitchenWiseOrders = async (mealType) => {
    let today = getTodayStartTime();
    let tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const condition = {
        orderstatus: { $in: ['accepted', 'preparing'] },
        orderType: 'subscription',
        orderDate: { $gte: today, $lt: tomorrow },
        $or: [{ selfDeliveryCreated: { $exists: false } }, { selfDeliveryCreated: false }],
        deliveryByMealaweBoy: true
    };
    if (mealType) {
        condition.mealType = mealType;
    }
    const result = await FoodOrder.aggregate(
        [
            {
                $match: condition
            },
            { $limit: 25 },
            {
                $group:
                {
                    '_id': '$kitchenId',
                    'kitchenId': { $first: '$kitchenId' },
                    'kitchenName': { $last: '$kitchenName' },
                    'kitchenPhoneNo': { $last: '$kitchenPhoneNo' },
                    'kitchenAddress': { $last: '$kitchenAddress' },
                    'kitchenGeolocation': { $last: '$kitchenGeolocation' },
                    'orderList': {
                        $push: {
                            'customerId': '$customerId',
                            'orderNo': '$orderNo',
                            'customerName': '$customerName',
                            'customerLocation': '$customerLocation',
                            'customerPhoneNo': '$customerPhoneNo',
                            'customerEmail': '$customerEmail',
                            'orderType': '$orderType',
                            'mealType': '$mealType',
                            'orderDate': '$orderDate',
                        }
                    }
                }
            }
        ]
    );
    return result;
}

const updateDeliveryOrderInfo = async (orderList) => {
    return await FoodOrder.updateMany(
        { orderNo: { $in: [...orderList] } },
        { $set: { selfDeliveryCreated: true, deliveryVendor: 'Pidge', startManualDelivery: true } },
        { new: true });
}

const getCustomerPastFoodOrderInfo = async (customerId) => {
    const allDayCount = await FoodOrder.countDocuments({ customerId, orderType: 'allDay' });
    const advanceCount = await FoodOrder.countDocuments({ customerId, orderType: 'advance' });
    return { allDayCount, advanceCount };
}

const changeFoodOrderAddress = async (id, address) => {
    const order = await FoodOrder.findOneAndUpdate({ _id: id }, { $set: { customerLocation: address } }, { new: true });
    return order
}

const changeChildOrdersAddress = async (ids, address) => {
    const order = await FoodOrder.updateMany({ orderNo: { $in: [...ids] }, orderstatus: 'accepted' }, { $set: { customerLocation: address } });
    return order
}

const getCustomerFirstOrder = async (ids) => {
    ids = ids.map((id) => ObjectId(id));
    const earliestOrders = await FoodOrder.aggregate([
        { $match: { customerId: { $in: ids } } },
        { $sort: { orderDate: 1 } },
        {
            $group: {
                '_id': '$customerId',
                'firstOrderDate': { $first: '$orderDate' },
            }
        }
    ]);
    return earliestOrders;
}

const updateFoodOrderPlantationStatus = async (orderNo) => {
    return FoodOrder.findOneAndUpdate({ orderNo }, { $set: { treePlantationDone: true } }, { new: true })
};

const getFutureOrders = async () => {
    let today = getTodayStartTime();
    const condition = {
        orderDate: { $gte: today }
    };
    return await FoodOrder.find(condition);
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
    return FoodOrder.findOneAndUpdate({ _id: ObjectId(foodOrder._id) }, { $set: foodOrder }, { new: true });
}

const findDailyOrders = async (subscriptionMasterOrderId) => {
    const orderList = await FoodOrder.find({ subscriptionMasterOrderId });
    return orderList
}

const kitchenOrderPhotoDelete = async () => {
    console.log('kitchenOrderPhotoDelete$$$$');
    const today = new Date();
    let fromDate = new Date();
    let toDate = new Date();
    fromDate.setDate(fromDate.getDate() - 60);
    toDate.setDate(toDate.getDate() - 30);
    const condition = { orderDate: { $gt: fromDate, $lte: toDate }, orderstatus: 'delivered' }
    console.log('condition', condition);
    const list = await FoodOrder.find(condition, { beforePackingImageUrl: 1, afterPackingImageUrl: 1, orderDate: 1 });
    return list;

}

const kitchenOrderPhotoDownlaod = async () => {
    console.log('kitchenOrderPhotoDownlaod$$$$');
    const today = new Date();
    let day7before = today;
    day7before.setDate(day7before.getDate() - 1);
    const condition = { orderDate: { $gte: day7before }, orderstatus: 'delivered' }
    console.log('condition', condition);
    const list = await FoodOrder.find(condition);
    return list;

}

const orderListToDeliver = async (searchObj) => {
    const condition = {};
    if (searchObj.fromDate && searchObj.toDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate), $lte: new Date(searchObj.toDate) }
    }
    if (searchObj.clusterList) {
        condition.clusterId = { $in: searchObj.clusterList };
    }
    condition.orderstatus = { $in: ['accepted', 'preparing'] };
    return await FoodOrder.find(condition).sort({ orderDate: -1 }).exec();
}

const removeKotaDeliveryVendor = async (orderList) => {
    return await FoodOrder.updateMany(
        { clusterId: 'cluster11' },
        { $set: { deliveryVendor: '' } },
        { new: true });
}

const updateRMInfo = async (subscriptionMasterOrderId, rmInfo) => {
    const update = await FoodOrder.updateMany({ subscriptionMasterOrderId }, { $set: { rmInfo } }, { new: true });
    return update;
}

const getCustomerPastOrdersByType = async (customerId, page, clientDate, type) => {
    let limit = 50;
    let tomorrow = new Date(clientDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let condition = {
        customerId,
        orderDate: { $lt: tomorrow },
        orderType: type
    };
    const orderList = await FoodOrder.find(condition)
        .sort({ orderDate: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
    return orderList;
};


const getOrdersByOrderTypeAndCustomerId = async (orderType, customerId) => {
    const query = {
        customerId: customerId
    };

    if (orderType === "apartment") {
        query.orderType = { $in: ['apartment_today', 'apartment_advance'] };
    } else {
        query.orderType = orderType;
    }

    return await FoodOrder.find(query);
};


const updateChildRouteInfo = async (subscriptionMasterId, foodOrder) => {
    console.log('updateChildRouteInfo', subscriptionMasterId, foodOrder);
    const updatedBy = foodOrder.updatedBy;
    const updateByType = foodOrder.updateByType;
    const routeNo = foodOrder.routeNo;
    const routeRank = foodOrder.routeRank;
    const mealType = foodOrder.mealType;
    const condition = { subscriptionMasterId, orderstatus: { $nin: ['delivered'] } };
    if (mealType) {
        condition.mealType = mealType;
    }
    const historyEntry = {
        orderstatus: 'routeRankUpdated',
        updatedOn: new Date(),
        updatedBy,
        updateByType
    };

    return FoodOrder.updateMany(
        condition,
        {
            $set: { routeNo, routeRank },
            $push: { statusHistory: historyEntry }
        }
    );

}

const updateLunchDinnerChildRouteInfo = async (subscriptionMasterId, foodOrder) => {
    let {
        updatedBy, updateByType, mealType,
        LunchrouteNo, LunchrouteRank,
        DinnerrouteNo, DinnerrouteRank,
        routeNo, routeRank
    } = foodOrder;

    if (LunchrouteNo && !LunchrouteRank) {
        LunchrouteRank = DinnerrouteRank || routeRank;
    }

    if (DinnerrouteNo && !DinnerrouteRank) {
        DinnerrouteRank = LunchrouteRank || routeRank;
    }

    if (!LunchrouteNo && DinnerrouteNo) {
        LunchrouteNo = DinnerrouteNo;
        LunchrouteRank = DinnerrouteRank;
    }
    if (!DinnerrouteNo && LunchrouteNo) {
        DinnerrouteNo = LunchrouteNo;
        DinnerrouteRank = LunchrouteRank;
    }

    const condition = {
        subscriptionMasterId,
        orderstatus: { $nin: ['delivered'] }
    };
    if (mealType) condition.mealType = mealType;

    const historyEntry = {
        orderstatus: 'routeRankUpdated',
        updatedOn: new Date(),
        updatedBy,
        updateByType
    };

    const operations = [
        {
            updateMany: {
                filter: { ...condition, mealType: 'Lunch' },
                update: {
                    $set: { routeNo: LunchrouteNo, routeRank: LunchrouteRank },
                    $push: { statusHistory: historyEntry }
                }
            }
        },
        {
            updateMany: {
                filter: { ...condition, mealType: 'Dinner' },
                update: {
                    $set: { routeNo: DinnerrouteNo, routeRank: DinnerrouteRank },
                    $push: { statusHistory: historyEntry }
                }
            }
        },
        {
            updateMany: {
                filter: { ...condition, mealType: { $nin: ['Lunch', 'Dinner'] } },
                update: {
                    $set: { routeNo, routeRank },
                    $push: { statusHistory: historyEntry }
                }
            }
        }
    ];

    return await FoodOrder.bulkWrite(operations);
};

const updateManualDeliveryAll = async () => {
    let today = getTodayStartTime();
    return await FoodOrder.updateMany(
        { orderDate: { $gte: today } },
        { $set: { startManualDelivery: true } },
        { new: true });
}


const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
}

const updateApartmentOrderOtp = async (orderId, newOtp) => {
    return await FoodOrder.findOneAndUpdate(
        { _id: orderId },
        {
            $set: { apartmentOtp: newOtp },
            $push: {
                statusHistory: {
                    orderstatus: 'otpRegenerated',
                    updatedOn: new Date(),
                    updatedBy: 'Kitchen',
                    updateByType: 'Kitchen'
                }
            }
        },
        { new: true }
    );
}
const getOyoOrderListByDateRange = async (fromDate, toDate, hotelIds, page, limit) => {
    const condition = {
        orderType: 'oyo',
        orderDate: {
            $gte: fromDate || getLocalStartTime(new Date()),
            $lte: toDate || getLocalEndTime(new Date())
        }
    };

    let kitchenIds = [];
    if (hotelIds && hotelIds.length > 0) {
        const hotels = await OyoHotel.find(
            { _id: { $in: hotelIds } },
            { "kitchenInfo.kitchenId": 1 }
        );

        kitchenIds = hotels
            .map(h => h?.kitchenInfo?.kitchenId)
            .filter(Boolean);

        kitchenIds = [...new Set(kitchenIds.map(id => id.toString()))];
        kitchenIds = kitchenIds.map(id => new mongoose.Types.ObjectId(id));

        if (kitchenIds.length > 0) {
            condition.kitchenId = { $in: kitchenIds };
        }
    }
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
        FoodOrder.find(condition)
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit),
        FoodOrder.countDocuments(condition)
    ]);
    return { orders, totalCount };
}
const getApartmentOrderListByDateRange = async (fromDate, toDate, apartmentIds, page, limit) => {
    const condition = {
        orderType: { $in: ['apartment_today', 'apartment_advance'] },
        orderDate: {
            $gte: fromDate || getLocalStartTime(new Date()),
            $lte: toDate || getLocalEndTime(new Date())
        }
    };

    let kitchenIds = [];

    if (apartmentIds && apartmentIds.length > 0) {
        const validApartmentIds = apartmentIds.filter(id =>
            id && id !== 'undefined' && mongoose.Types.ObjectId.isValid(id)
        );

        if (validApartmentIds.length > 0) {
            const apartments = await Apartment.find(
                { _id: { $in: validApartmentIds } },
                { "kitchenInfo.kitchenId": 1 }
            );

            kitchenIds = apartments
                .map(apartment => apartment?.kitchenInfo?.kitchenId)
                .filter(Boolean);

            kitchenIds = [...new Set(kitchenIds.map(id => id.toString()))];
            kitchenIds = kitchenIds.map(id => new mongoose.Types.ObjectId(id));

            if (kitchenIds.length > 0) {
                condition.kitchenId = { $in: kitchenIds };
            }
        }
    }

    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
        FoodOrder.find(condition)
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit),
        FoodOrder.countDocuments(condition)
    ]);

    return {
        orders,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
    };
}

const getCurrentDateForFiltering = () => {
    const today = new Date();

    const todayStr = today.toISOString().split('T')[0]; // "2025-11-27"
    const todayDate = new Date(todayStr + 'T00:00:00.000Z');

    return {
        date: todayDate,
        dateString: todayStr
    };
};

const getApartmentTodayOrderCount = async (kitchenId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeCondition = {
            kitchenId: ObjectId(kitchenId),
            orderType: { $in: ['apartment_today', 'apartment_advance'] },
            orderstatus: {
                $in: ['placed', 'accepted', 'preparing', 'readyToDelivery', 'deliveryBoyAssigned', 'delivered', 'cancelledByKitchen', 'rejectedByKitchen']
            }
        };

        const placedCondition = {
            kitchenId: ObjectId(kitchenId),
            orderType: { $in: ['apartment_today', 'apartment_advance'] },
            orderstatus: 'placed'
        };


        const [activeOrders, placedOrders] = await Promise.all([
            FoodOrder.find(activeCondition),
            FoodOrder.find(placedCondition)
        ]);

        const todayActiveOrders = activeOrders.filter(order => {
            return order.itemList.some(item => {
                let itemDate;

                if (item.itemServingDate) {
                    itemDate = new Date(item.itemServingDate);
                    itemDate.setHours(0, 0, 0, 0);
                } else {
                    itemDate = new Date(order.orderDate);
                    itemDate.setHours(0, 0, 0, 0);
                }

                return itemDate.getTime() === today.getTime();
            });
        });

        const todayPlacedOrders = placedOrders.filter(order => {
            return order.itemList.some(item => {
                let itemDate;

                if (item.itemServingDate) {
                    itemDate = new Date(item.itemServingDate);
                    itemDate.setHours(0, 0, 0, 0);
                } else {
                    itemDate = new Date(order.orderDate);
                    itemDate.setHours(0, 0, 0, 0);
                }

                return itemDate.getTime() === today.getTime();
            });
        });

        return {
            todayCount: todayActiveOrders.length,
            todayPlacedCount: todayPlacedOrders.length,
            todayActiveCount: todayActiveOrders.length
        };
    } catch (error) {
        console.error('❌ Error in getApartmentTodayOrderCount:', error);
        return {
            todayCount: 0,
            todayPlacedCount: 0,
            todayActiveCount: 0
        };
    }
}


const getApartmentAdvanceOrderCount = async (kitchenId) => {
    try {
        const { date: today, dateString: todayStr } = getCurrentDateForFiltering();

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const activeCondition = {
            kitchenId: ObjectId(kitchenId),
            orderType: { $in: ['apartment_today', 'apartment_advance'] },
            orderstatus: {
                $in: ['placed', 'accepted', 'preparing', 'readyToDelivery', 'deliveryBoyAssigned', 'delivered', 'cancelledByKitchen', 'rejectedByKitchen']
            }
        };

        const placedCondition = {
            kitchenId: ObjectId(kitchenId),
            orderType: { $in: ['apartment_today', 'apartment_advance'] },
            orderstatus: 'placed'
        };

        const [activeOrders, placedOrders] = await Promise.all([
            FoodOrder.find(activeCondition),
            FoodOrder.find(placedCondition)
        ]);

        const advanceActiveOrders = activeOrders.filter(order => {
            return order.itemList.some(item => {
                if (!item.itemServingDate) {
                    return false;
                }

                const servingDate = new Date(item.itemServingDate);
                const servingDateStr = servingDate.toISOString().split('T')[0];

                return servingDateStr >= tomorrowStr;
            });
        });

        const advancePlacedOrders = placedOrders.filter(order => {
            return order.itemList.some(item => {
                if (!item.itemServingDate) {
                    return false;
                }

                const servingDate = new Date(item.itemServingDate);
                const servingDateStr = servingDate.toISOString().split('T')[0];

                return servingDateStr >= tomorrowStr;
            });
        });

        return {
            advanceCount: advanceActiveOrders.length,
            advancePlacedCount: advancePlacedOrders.length,
            advanceActiveCount: advanceActiveOrders.length
        };
    } catch (error) {
        console.error('Error in getApartmentAdvanceOrderCount:', error);
        return {
            advanceCount: 0,
            advancePlacedCount: 0,
            advanceActiveCount: 0
        };
    }
}


const getApartmentMealTypeCounts = async (kitchenId, apartmentType) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate, endDate;

        if (apartmentType === 'today') {
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 1);
        } else if (apartmentType === 'advance') {
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() + 1);
            endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 3); 
        } else {
            return {
                breakfastOrder: 0,
                lunchOrder: 0,
                HighTeaOrder: 0,
                dinnerOrder: 0,
                breakfastPlacedOrder: 0,
                lunchPlacedOrder: 0,
                HighTeaPlacedOrder: 0,
                dinnerPlacedOrder: 0
            };
        }

        const activeCondition = {
            kitchenId: ObjectId(kitchenId),
            orderType: { $in: ['apartment_today', 'apartment_advance'] },
            orderstatus: {
                $in: ['placed', 'accepted', 'preparing', 'readyToDelivery', 'deliveryBoyAssigned', 'delivered', 'cancelledByKitchen', 'rejectedByKitchen']
            }
        };

        const placedCondition = {
            kitchenId: ObjectId(kitchenId),
            orderType: { $in: ['apartment_today', 'apartment_advance'] },
            orderstatus: 'placed'
        };

        const [activeOrders, placedOrders] = await Promise.all([
            FoodOrder.find(activeCondition),
            FoodOrder.find(placedCondition)
        ]);

        const mealTypeCounts = {
            breakfastOrder: 0,
            lunchOrder: 0,
            HighTeaOrder: 0,
            dinnerOrder: 0,
            breakfastPlacedOrder: 0,
            lunchPlacedOrder: 0,
            HighTeaPlacedOrder: 0,
            dinnerPlacedOrder: 0
        };

        const countOrders = (orders, isPlaced = false) => {
            const counts = {
                breakfast: 0,
                lunch: 0,
                HighTea: 0,
                dinner: 0
            };

            orders.forEach(order => {
                const hasMatchingItem = order.itemList.some(item => {
                    let itemDate;

                    if (item.itemServingDate) {
                        itemDate = new Date(item.itemServingDate);
                    } else {
                        itemDate = new Date(order.orderDate);
                    }

                    itemDate.setHours(0, 0, 0, 0);

                    const matchesDate = itemDate >= startDate && itemDate < endDate;

                    if (matchesDate) {
                        console.log(`Order ${order.orderNo} - Meal: ${order.mealType}, Status: ${order.orderstatus}, Item Date: ${itemDate}, Matches: ${matchesDate}`);
                    }

                    return matchesDate;
                });

                if (hasMatchingItem) {

                    if (order.mealType === 'Breakfast') {
                        counts.breakfast++;
                    } else if (order.mealType === 'Lunch') {
                        counts.lunch++;
                    } else if (order.mealType === 'HighTea') {
                        counts.HighTea++;
                    } else if (order.mealType === 'Dinner') {
                        counts.dinner++;
                    }
                }
            });

            return counts;
        };

        const activeCounts = countOrders(activeOrders, false);
        mealTypeCounts.breakfastOrder = activeCounts.breakfast;
        mealTypeCounts.lunchOrder = activeCounts.lunch;
        mealTypeCounts.HighTeaOrder = activeCounts.HighTea;
        mealTypeCounts.dinnerOrder = activeCounts.dinner;

        const placedCounts = countOrders(placedOrders, true);
        mealTypeCounts.breakfastPlacedOrder = placedCounts.breakfast;
        mealTypeCounts.lunchPlacedOrder = placedCounts.lunch;
        mealTypeCounts.HighTeaPlacedOrder = placedCounts.HighTea;
        mealTypeCounts.dinnerPlacedOrder = placedCounts.dinner;

        return mealTypeCounts;

    } catch (error) {
        console.error('Error in getApartmentMealTypeCounts:', error);
        return {
            breakfastOrder: 0,
            lunchOrder: 0,
            HighTeaOrder: 0,
            dinnerOrder: 0,
            breakfastPlacedOrder: 0,
            lunchPlacedOrder: 0,
            HighTeaPlacedOrder: 0,
            dinnerPlacedOrder: 0
        };
    }
}

const getApartmentOrderCounts = async (kitchenId, apartmentType, mealType) => {
    try {
        const { date: today, dateString: todayStr } = getCurrentDateForFiltering();

        let startDate, endDate;

        if (apartmentType === 'today') {
            startDate = new Date(todayStr + 'T00:00:00.000Z');
            endDate = new Date(todayStr + 'T23:59:59.999Z');
        } else if (apartmentType === 'advance') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            startDate = new Date(tomorrowStr + 'T00:00:00.000Z');
            endDate = new Date('2100-01-01T00:00:00.000Z');
        } else {
            return {
                acceptedOrder: 0,
                cancelledOrder: 0,
                deliveredOrder: 0,
                newOrder: 0,
                preparingOrder: 0,
                readyToDeliveryOrder: 0
            };
        }

        const allApartmentOrders = await FoodOrder.find({
            kitchenId: ObjectId(kitchenId),
            orderType: { $in: ['apartment_today', 'apartment_advance'] }
        });


        const orders = await FoodOrder.find({
            kitchenId: ObjectId(kitchenId),
            orderType: { $in: ['apartment_today', 'apartment_advance'] },
            mealType: mealType,
            orderstatus: {
                $in: ['placed', 'accepted', 'preparing', 'readyToDelivery', 'deliveryBoyAssigned',
                    'handedOverToDeliveryBoy', 'onTheWay', 'delivered', 'cancelledByKitchen', 'rejectedByKitchen']
            }
        });

        console.log(`🍽️ Orders found for meal type '${mealType}': ${orders.length}`);

        if (orders.length > 0) {
            console.log(`📝 Sample order structure:`);
            orders.slice(0, 3).forEach((order, index) => {
                console.log(`   Order ${index + 1}:`);
                console.log(`     - Order No: ${order.orderNo}`);
                console.log(`     - Status: ${order.orderstatus}`);
                console.log(`     - Meal Type: ${order.mealType}`);
                console.log(`     - Order Date: ${order.orderDate}`);
                console.log(`     - Item List:`, order.itemList.map(item => ({
                    name: item.itemName,
                    servingDate: item.itemServingDate,
                    count: item.count
                })));
            });
        }

        const orderCounts = {
            acceptedOrder: 0,
            cancelledOrder: 0,
            deliveredOrder: 0,
            newOrder: 0,
            preparingOrder: 0,
            readyToDeliveryOrder: 0
        };

        let matchedOrdersCount = 0;

        orders.forEach(order => {
            let shouldCountOrder = false;

            order.itemList.forEach(item => {
                let itemDate;

                if (item.itemServingDate) {
                    itemDate = new Date(item.itemServingDate);
                } else {
                    itemDate = new Date(order.orderDate);
                }

                const itemDateStr = itemDate.toISOString().split('T')[0];
                const itemDateForCompare = new Date(itemDateStr + 'T00:00:00.000Z');


                if (itemDateForCompare >= startDate && itemDateForCompare <= endDate) {
                    shouldCountOrder = true;
                } else {
                    console.log(`Date NO MATCH for order ${order.orderNo}`);
                }
            });

            if (shouldCountOrder) {
                matchedOrdersCount++;

                switch (order.orderstatus) {
                    case 'placed': {
                        orderCounts.newOrder++;
                        break;
                    }
                    case 'accepted': {
                        orderCounts.acceptedOrder++;
                        break;
                    }
                    case 'preparing': {
                        orderCounts.preparingOrder++;
                        break;
                    }
                    case 'readyToDelivery':
                    case 'deliveryBoyAssigned': {
                        orderCounts.readyToDeliveryOrder++;
                        break;
                    }
                    case 'handedOverToDeliveryBoy':
                    case 'onTheWay':
                    case 'delivered': {
                        orderCounts.deliveredOrder++;
                        break;
                    }
                    case 'cancelledByKitchen':
                    case 'rejectedByKitchen': {
                        orderCounts.cancelledOrder++;
                        break;
                    }
                    default: {
                        console.log(`❓ Unknown status: ${order.orderstatus}`);
                    }
                }
            }
        });

        return orderCounts;

    } catch (error) {
        console.error('❌ Error in getApartmentOrderCounts:', error);
        return {
            acceptedOrder: 0,
            cancelledOrder: 0,
            deliveredOrder: 0,
            newOrder: 0,
            preparingOrder: 0,
            readyToDeliveryOrder: 0
        };
    }
}

const getApartmentOrdersByType = async (kitchenId, apartmentType, mealType, status) => {
    try {
        const { date: today, dateString: todayStr } = getCurrentDateForFiltering();

        let startDate, endDate;
        let statusFilter = [];

        if (apartmentType === 'today') {
            startDate = new Date(todayStr + 'T00:00:00.000Z');
            endDate = new Date(todayStr + 'T23:59:59.999Z');
        } else if (apartmentType === 'advance') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            startDate = new Date(tomorrowStr + 'T00:00:00.000Z');
            endDate = new Date('2100-01-01T00:00:00.000Z');
        } else {
            throw new Error('Invalid apartment type');
        }

        switch (status) {
            case 'new':
                statusFilter = ['placed'];
                break;
            case 'accepted':
                statusFilter = ['accepted'];
                break;
            case 'preparing':
                statusFilter = ['preparing'];
                break;
            case 'readyToDelivery':
                statusFilter = ['readyToDelivery', 'deliveryBoyAssigned'];
                break;
            case 'delivery':
                statusFilter = ['handedOverToDeliveryBoy', 'onTheWay', 'delivered'];
                break;
            case 'rejected':
                statusFilter = ['cancelledByKitchen', 'rejectedByKitchen'];
                break;
            default:
                statusFilter = [status];
        }

        const allOrders = await FoodOrder.find({
            kitchenId: ObjectId(kitchenId),
            orderType: { $in: ['apartment_today', 'apartment_advance'] },
            mealType: mealType,
            orderstatus: { $in: statusFilter }
        }).sort({ orderDate: -1 });

        const filteredOrders = allOrders.filter(order => {
            const hasMatchingItem = order.itemList.some(item => {
                let itemDate;

                if (item.itemServingDate) {
                    itemDate = new Date(item.itemServingDate);
                } else {
                    itemDate = new Date(order.orderDate);
                }

                const itemDateForCompare = new Date(itemDate.toISOString().split('T')[0] + 'T00:00:00.000Z');

                return itemDateForCompare >= startDate && itemDateForCompare <= endDate;
            });

            return hasMatchingItem;
        });

        const formattedOrders = filteredOrders.map(order => {
            if (order.slotStartTime) {
                order.deliveryReadyBy = new Date(order.slotStartTime);
            } else {
                const orderDate = new Date(order.orderDate);
                orderDate.setMinutes(orderDate.getMinutes() + 45);
                order.deliveryReadyBy = orderDate;
            }

            return order;
        });

        return formattedOrders;

    } catch (error) {
        console.error('❌ Error in getApartmentOrdersByType:', error);
        throw error;
    }
};

const updateRouteInfo = async (foodOrderId, routeData) => {
    try {
        const { routeNo, routeRank, updatedBy, updateByType, mealType } = routeData;
        
        const updateObj = {
            routeNo,
            routeRank
        };
        
        if (mealType === 'Lunch') {
            updateObj.LunchrouteNo = routeNo;
            updateObj.LunchrouteRank = routeRank;
        } else if (mealType === 'Dinner') {
            updateObj.DinnerrouteNo = routeNo;
            updateObj.DinnerrouteRank = routeRank;
        }
        
        const statusCondition = {
            orderstatus: 'routeRankUpdated',
            updatedOn: new Date(),
            updatedBy,
            updateByType
        };
        
        return await FoodOrder.findOneAndUpdate(
            { _id: ObjectId(foodOrderId) },
            { 
                $set: updateObj,
                $push: { statusHistory: statusCondition }
            },
            { new: true }
        );
    } catch (error) {
        console.error('Error in updateRouteInfo:', error);
        throw error;
    }
};
module.exports = {
    getKitchenOrderDetail,
    getKitchenSubOrderDetail,
    getCustomerOrderDetail,
    saveFoodOrder,
    updateFoodOrder,
    getKitchenOrdersCount,
    updateOrderStatus,
    getKitchenPastOrders,
    getKitchenPastOrdersReport,
    updateFeedbackstatus,
    getFoodOrderList,
    getFoodOrder,
    getfcmFoodOrder,
    searchFoodOrderList,
    getdashboardCount,
    getListForReward,
    updateDeliveryOrder,
    getFoodOrderListByOrderNo,
    updateOrderWhilePayingKitchen,
    getFoodOrderByOrderNo,
    getCustomerOpenOrders,
    getCustomerSpecificOrders,
    getKitchenDashboardCount,
    getCurrentOrdersCount,
    getCurrentOrdersList,
    performOrderTransfer,
    getRefundOrders,
    saveMultipleOrders,
    getCustomerCurrentOpenOrders,
    getCustomerPastOrders,
    updateFoodOrderDate,
    performMultiOrderTransfer,
    getAllSubscriptionFoodOrders,
    getCustomerCouponOrderList,
    updateManualDelivery,
    updateDeliveryByMealaweBoy,
    checkPhoneNo,
    updatePackageImage,
    setRiderTripImage,
    setOrderProofImage,
    startRiderTrip,
    getPaymentValidationOrder,
    getCustomerVoucherOrderList,
    getVoucherUsedOrderList,
    updateFoodMealType,
    getLastUnratedDeliveredOrder,
    getLastUnratedDeliveredOrderList,
    exportFoodOrderList,
    getKitchenAssignedOrders,
    getAssignedMontlyOrders,
    kitchenWiseOrders,
    updateDeliveryOrderInfo,
    getCustomerPastFoodOrderInfo,
    changeFoodOrderAddress,
    changeChildOrdersAddress,
    updatePendingOrdersProps,
    updateFoodOrderProps,
    getCustomerFirstOrder,
    updateFoodOrderPlantationStatus,
    getFutureOrders,
    updateClusterInfo,
    findDailyOrders,
    kitchenOrderPhotoDelete,
    kitchenOrderPhotoDownlaod,
    orderListToDeliver,
    removeKotaDeliveryVendor,
    updateRMInfo,
    getCustomerPastOrdersByType,
    getOrdersByOrderTypeAndCustomerId,
    getFoodOrderbyOrderNoThinkOwl,
    getFoodOrderbyCustomerEmailThinkOwl,
    updateChildRouteInfo,
    updateManualDeliveryAll,
    updateApartmentOrderOtp,
    getOyoOrderListByDateRange,
    getApartmentOrderListByDateRange,
    getApartmentTodayOrderCount,
    getApartmentAdvanceOrderCount,
    getApartmentMealTypeCounts,
    getApartmentOrderCounts,
    getApartmentOrdersByType,
    getFoodOrderByorderNo,
    exportApartmentFoodOrderList,
    updateLunchDinnerChildRouteInfo,
    updateRouteInfo,
    updateRunnerLocation

}