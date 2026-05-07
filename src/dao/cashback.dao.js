const Cashback = require('../model/cashback.model');
const { getTodayStartTime, getTodayEndTime } = require('../util/date-util');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const saveCashBack = async (cashbackObj, expiryDay) => {
    let expiryDayLimit = expiryDay ? expiryDay : 30;
    let expiryOn = getTodayEndTime();
    expiryOn.setDate(expiryOn.getDate() + expiryDayLimit);
    // expiryOn.setHours(23,59,59,999);
    const nCashback = new Cashback();
    nCashback.title = cashbackObj.title ? cashbackObj.title : 'CASHBACK' + cashbackObj.cashbackPoints;
    nCashback.status = 'New';
    nCashback.remark = cashbackObj.remark;
    nCashback.cashbackPoints = cashbackObj.cashbackPoints;
    nCashback.createdOn = new Date();
    nCashback.expiryOn = expiryOn;
    nCashback.lastUpdatedOn = new Date();
    nCashback.customerId = cashbackObj.customerId;
    nCashback.customerName = cashbackObj.customerName;
    nCashback.customerPhoneNo = cashbackObj.customerPhoneNo;
    nCashback.customerEmail = cashbackObj.customerEmail;
    nCashback.updateHistory = [];
    const isInserted = await nCashback.save();
    return isInserted;
};
const expireCashBack = async (id) => {
    const nCashback = {};
    nCashback.status = 'Expired';
    nCashback.lastUpdatedOn = new Date();
    const update = await Banner.findOneAndUpdate({ _id: id }, { $set: nCashback }, { new: true });
    return update;
}

const getCashbackList = async () => {
    const list = await Cashback.find({});
    return list;
};

const getCashbackListUser = async (customerId, pageNumber) => {
    const limit = 40;
    return await Cashback.find({ customerId })
        .sort({ lastUpdatedOn: -1 })
        .skip((pageNumber - 1) * limit)
        .limit(limit * 1)
        .exec();
};

const updateCashbackListUser = async (cashbackObj) => {
    const nCashback = {};
    nCashback.status = cashbackObj.status;
    nCashback.lastUpdatedOn = new Date();
    nCashback.remark = cashbackObj.remark;
    nCashback.cashbackPoints = cashbackObj.cashbackPoints;
    const updateHistory = {
        previousAmount: cashbackObj.previousAmount,
        previousRemark: cashbackObj.previousRemark,
        usedAmount: cashbackObj.usedAmount,
        updatedOn: new Date(),
        updateRemark: cashbackObj.updateRemark,
    }
    const update = await Cashback.findOneAndUpdate({ _id: cashbackObj._id },
        { $set: nCashback, $push: { updateHistory } },
        { new: true });
    return update;
};

const getCashbackBalance = async (customerId) => {
    // // console.log('getCashbackBalance ',customerId);
    const condition = {
        customerId: ObjectId(customerId),
        status: { $in: ['New', 'Updated'] }
    };
    const result = await Cashback.aggregate(
        [
            {
                $match: condition
            },
            {
                $group:
                {
                    '_id': '$customerId',
                    totalCashbackBalance: { $sum: '$cashbackPoints' },
                    count: { $sum: 1 }
                }
            }
        ]
    );
    return result;
}
const getValidCashBackList = async (customerId) => {
    const condition = {
        customerId,
        status: { $in: ['New', 'Updated'] }
    };
    return await Cashback.find(condition).sort({ expiryOn: -1 })
}

const getCashbackListForExpiry = async (expiryDay) => {
    let startDate = getTodayStartTime();
    startDate.setDate(startDate.getDate() + expiryDay);
    expiryDay++;
    let expiryOnDate = getTodayStartTime();
    expiryOnDate.setDate(expiryOnDate.getDate() + expiryDay);
    const condition = {
        status: { $in: ['New', 'Updated'] },
        expiryOn: { $gte: startDate, $lt: expiryOnDate }
    };
    const result = await Cashback.aggregate(
        [
            {
                $match: condition
            },
            {
                $group:
                {
                    '_id': '$customerId',
                    'customerId': { $first: '$customerId' },
                    'customerName': { $last: '$customerName' },
                    'customerEmail': { $last: '$customerEmail' },
                    'totalCashbackBalance': { $sum: '$cashbackPoints' }
                }
            }
        ]
    );
    return result;
}

const expireCashBackList = async () => {
    let today = getTodayStartTime();
    const condition = {
        status: { $in: ['New', 'Updated', 'Used'] },
        expiryOn: { $lt: today }
    };
    const cashback = {};
    cashback.status = 'Expired';
    cashback.lastUpdatedOn = new Date();
    const update = await Cashback.updateMany(condition,
        { $set: cashback },
        { new: true });
    return update;
}

const exportCashbackList = async (searchObj) => {
    const condition = {};
    if (searchObj.fromDate) {
        condition.createdOn = { $gte: new Date(searchObj.fromDate) };
        if (searchObj.toDate) {
            condition.createdOn.$lte = new Date(searchObj.toDate);
        }
    }
    condition.status = { $in: ['New', 'Updated'] };
    return await Cashback.find(condition).sort({ createdOn: -1 });
};

module.exports = {
    saveCashBack,
    expireCashBack,
    getCashbackList,
    getCashbackListUser,
    updateCashbackListUser,
    getCashbackBalance,
    getValidCashBackList,
    getCashbackListForExpiry,
    expireCashBackList,
    exportCashbackList
};