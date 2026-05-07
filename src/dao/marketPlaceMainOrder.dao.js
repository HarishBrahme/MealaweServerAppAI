const MarketPlaceMainOrder = require('../model/marketPlaceMainOrder.model');
const { getTodayStartTime } = require('../util/date-util');

const getMarketPlaceMainOrderList = async () => {
    const list = await MarketPlaceMainOrder.find({});
    return list;
};
const getMarketPlaceMainOrderById = async (id) => {
    return await MarketPlaceMainOrder.findById(id);
}
const getMarketPlaceMainOrderByOrderNo = async (orderNo) => {
    return await MarketPlaceMainOrder.findOne({ orderNo });
}

const saveMarketPlaceMainOrder = async (marketPlaceMainOrder) => {
    try {
        const nMarketPlaceMainOrder = new MarketPlaceMainOrder();
        nMarketPlaceMainOrder.orderNo = marketPlaceMainOrder.orderNo;
        nMarketPlaceMainOrder.orderType = 'marketPlaceMain'
        nMarketPlaceMainOrder.customerId = marketPlaceMainOrder.customerId;
        nMarketPlaceMainOrder.customerName = marketPlaceMainOrder.customerName;
        nMarketPlaceMainOrder.customerLocation = marketPlaceMainOrder.customerLocation;
        nMarketPlaceMainOrder.customerPhoneNo = marketPlaceMainOrder.customerPhoneNo;
        nMarketPlaceMainOrder.customerEmail = marketPlaceMainOrder.customerEmail;
        nMarketPlaceMainOrder.orderCreatedBy = marketPlaceMainOrder.orderCreatedBy;
        nMarketPlaceMainOrder.orderDate = new Date();
        nMarketPlaceMainOrder.amount = marketPlaceMainOrder.amount;
        nMarketPlaceMainOrder.totalItemAmount = marketPlaceMainOrder.totalItemAmount;
        nMarketPlaceMainOrder.totalItemDiscount = marketPlaceMainOrder.totalItemDiscount;
        nMarketPlaceMainOrder.finalDiscount = marketPlaceMainOrder.finalDiscount;
        nMarketPlaceMainOrder.orderstatus = marketPlaceMainOrder.orderstatus;
        nMarketPlaceMainOrder.payment_id = marketPlaceMainOrder.payment_id;
        nMarketPlaceMainOrder.order_id = marketPlaceMainOrder.order_id;
        nMarketPlaceMainOrder.receipt = marketPlaceMainOrder.receipt;
        nMarketPlaceMainOrder.moneyWalletPointsUsed = marketPlaceMainOrder.moneyWalletPointsUsed;
        nMarketPlaceMainOrder.mealaweWalletPointsUsed = marketPlaceMainOrder.mealaweWalletPointsUsed;
        nMarketPlaceMainOrder.statusHistory = [{ orderstatus: marketPlaceMainOrder.orderstatus, updatedOn: new Date() }];
        nMarketPlaceMainOrder.voucherCode = marketPlaceMainOrder.voucherCode;
        nMarketPlaceMainOrder.voucherDiscount = marketPlaceMainOrder.voucherDiscount;
        nMarketPlaceMainOrder.taxes = marketPlaceMainOrder.taxes;
        nMarketPlaceMainOrder.platformCharges = marketPlaceMainOrder.platformCharges ? marketPlaceMainOrder.platformCharges : 0;
        nMarketPlaceMainOrder.couponDiscount = marketPlaceMainOrder.couponDiscount;
        nMarketPlaceMainOrder.couponCode = marketPlaceMainOrder.couponCode;
        nMarketPlaceMainOrder.cgst = marketPlaceMainOrder.cgst;
        nMarketPlaceMainOrder.sgst = marketPlaceMainOrder.sgst;
        nMarketPlaceMainOrder.itemList = marketPlaceMainOrder.itemList;
        nMarketPlaceMainOrder.deliveryCharges = marketPlaceMainOrder.deliveryCharges;
        nMarketPlaceMainOrder.deliveryDiscount = marketPlaceMainOrder.deliveryDiscount;
        nMarketPlaceMainOrder.stopPaymentValidation = false;
        nMarketPlaceMainOrder.pgName = marketPlaceMainOrder.pgName;
        nMarketPlaceMainOrder.transactionTime = new Date(); 
        nMarketPlaceMainOrder.searchKeywords = marketPlaceMainOrder.searchKeywords;
        nMarketPlaceMainOrder.itemLabel = marketPlaceMainOrder.itemLabel;
        const saved = await nMarketPlaceMainOrder.save();
        return saved;
    } catch (err) {
        console.log(err);
    }
};

const updateMarketPlaceMainOrder = async (marketPlaceMainOrder) => {
    const updatedBy = marketPlaceMainOrder.updatedBy;
    const updateByType = marketPlaceMainOrder.updateByType;
    if (marketPlaceMainOrder.statusHistory) {
        marketPlaceMainOrder.statusHistory.push({ orderstatus: marketPlaceMainOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
    } else {
        marketPlaceMainOrder.statusHistory = [];
        marketPlaceMainOrder.statusHistory.push({ orderstatus: marketPlaceMainOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
    }
    return MarketPlaceMainOrder.findOneAndUpdate({ _id: marketPlaceMainOrder._id }, { $set: marketPlaceMainOrder }, { new: true })
}

const getMarketPlaceMainOrdersCount = async () => {
    const fullResult = {
        'paymentInprogress': 0,
        'paymentFailed': 0,
        'placed': 0,
        'rejectedBySeller': 0,
        // 'packagingInProgess': 0,
        // 'readyToDelivery':0, 
        // 'delivered': 0
    };
    let today = getTodayStartTime();
    let tomorrow = getTodayStartTime()
    tomorrow.setDate(tomorrow.getDate() + 1);
    const condition = { orderDate: { $gte: today, $lt: tomorrow } };
    const condition1 = {
        $or: [
            { orderDate: { $gte: today } },
            { stopPaymentValidation: false }
        ]
    };
    const condition2 = {};
    const result = await MarketPlaceMainOrder.aggregate(
        [
            {
                '$facet': {
                    'paymentInprogress': [{ $match: { orderstatus: 'paymentInprogress', ...condition1 } }, { $count: 'paymentInprogress' }],
                    'paymentFailed': [{ $match: { orderstatus: 'paymentFailed', ...condition1 } }, { $count: 'paymentFailed' }],
                    'placed': [{ $match: { orderstatus: 'placed', ...condition2 } }, { $count: 'placed' }],
                    'rejectedBySeller': [{ $match: { orderstatus: 'rejectedBySeller', ...condition } }, { $count: 'rejectedBySeller' }],
                    // 'packagingInProgess': [{ $match: {orderstatus : 'packagingInProgess',...condition}},{ $count: 'packagingInProgess'}],
                    // 'readyToDelivery': [{ $match: {orderstatus : 'readyToDelivery', ...condition2}},{ $count: 'readyToDelivery' }],
                    // 'delivered': [{ $match: {orderstatus : 'delivered',...condition}},{ $count: 'delivered' }]
                }
            },
            {
                '$project': {
                    'paymentInprogress': { '$arrayElemAt': ['$paymentInprogress.paymentInprogress', 0] },
                    'paymentFailed': { '$arrayElemAt': ['$paymentFailed.paymentFailed', 0] },
                    'placed': { '$arrayElemAt': ['$placed.placed', 0] },
                    'rejectedBySeller': { '$arrayElemAt': ['$rejectedBySeller.rejectedBySeller', 0] },
                    // 'packagingInProgess': {'$arrayElemAt': ['$packagingInProgess.packagingInProgess', 0]},
                    // 'readyToDelivery': {'$arrayElemAt': ['$readyToDelivery.readyToDelivery', 0]},                
                    // 'delivered': {'$arrayElemAt': ['$delivered.delivered', 0]}               
                }
            }
        ]

    );
    return (result && result.length > 0) ? { ...fullResult, ...result[0] } : { ...fullResult };
}

const getMarketPlaceMainOrdersList = async (status, page, limit) => {
    let today = getTodayStartTime();
    let tomorrow = getTodayStartTime();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let condition = { orderstatus: status, orderDate: { $gte: today, $lt: tomorrow } };
    if (status === 'placed') {
        condition = { orderstatus: status };
    }
    return await MarketPlaceMainOrder.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const updateMarketPlaceMainOrderInfo = async (orderNo, msg, condition) => {
    const updatedBy = condition.updatedBy;
    const updateByType = condition.updateByType;
    return MarketPlaceMainOrder.findOneAndUpdate(
        { orderNo },
        { $set: condition, $push: { statusHistory: { orderstatus: msg, updatedOn: new Date(), updatedBy, updateByType } } },
        { new: true })
}

const searchMarketPlaceMainOrderList = async (searchObj, page) => {
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
    if (searchObj.fromDate && searchObj.toDate) {
        condition.orderDate = { $gte: new Date(searchObj.fromDate), $lte: new Date(searchObj.toDate) }
    }
    return await MarketPlaceMainOrder.find(condition).sort({ orderDate: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const getPaymentMarketPlaceMainValidationOrder = async () => {
    let condition = {
        orderstatus: { $in: ['paymentInprogress', 'paymentFailed'] },
        stopPaymentValidation: false,
    };
    const orderList = await MarketPlaceMainOrder.find(condition);
    return orderList;
}


const getMarketPlaceMainOrdersByDateRange = async (fromDate, toDate) => {
    const condition = {
        orderDate: {
            $gte: new Date(fromDate),
            $lte: new Date(toDate)
        },
        orderstatus:'accepted'
    };

    return await MarketPlaceMainOrder.find(condition)
        .sort({ orderDate: -1 })
        .exec();
};

module.exports = {
    getMarketPlaceMainOrderList,
    getMarketPlaceMainOrderById,
    getMarketPlaceMainOrderByOrderNo,
    saveMarketPlaceMainOrder,
    updateMarketPlaceMainOrder,
    getMarketPlaceMainOrdersCount,
    getMarketPlaceMainOrdersList,
    updateMarketPlaceMainOrderInfo,
    searchMarketPlaceMainOrderList,
    getPaymentMarketPlaceMainValidationOrder,
    getMarketPlaceMainOrdersByDateRange
};