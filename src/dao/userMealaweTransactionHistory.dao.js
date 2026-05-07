const UserMealaweTransactionHistory = require('../model/userMealaweTransactionHistory.model');

const getUserMealaweTransactionHistory = async (customerId, page, limit) => {
    // console.log('getUserMealaweTransactionHistory ',customerId, page, limit)
    const history = await UserMealaweTransactionHistory.find({ customerId })
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
    return history;
};
const saveUserMealaweTransactionHistory = async (transactionObj) => {
    const historyObj = new UserMealaweTransactionHistory();
    historyObj.status = transactionObj.status;
    historyObj.transaction_points = transactionObj.transaction_points;
    historyObj.created_at = transactionObj.created_at;
    historyObj.customerId = transactionObj.customerId;
    historyObj.customerName = transactionObj.customerName;
    historyObj.wallet_balance = transactionObj.wallet_balance;
    historyObj.remark = transactionObj.remark;
    historyObj.transactionType = transactionObj.transactionType;
    const savedObj = await historyObj.save();
    return savedObj;
};
const updateUserMealaweTransactionHistory = async (id, status) => {
    const updated = await UserMealaweTransactionHistory.findOneAndUpdate({ _id: id }, { $set: { status } },
        { new: true });
    return updated;
};


module.exports = {
    getUserMealaweTransactionHistory,
    saveUserMealaweTransactionHistory,
    updateUserMealaweTransactionHistory,
}