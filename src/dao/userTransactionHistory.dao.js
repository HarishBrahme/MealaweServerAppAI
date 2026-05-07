const UserTransactionHistory = require('../model/userTransactionHistory.model');

const getUserTransactionHistory = async (customerId, page, limit) => {
    // console.log('getUserTransactionHistory ',customerId, page, limit)
    const history = await UserTransactionHistory.find({ customerId })
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
    return history;
};
const saveUserTransactionHistory = async (transactionObj) => {
    const historyObj = new UserTransactionHistory();
    historyObj.status = transactionObj.status;
    historyObj.transaction_points = transactionObj.transaction_points;
    historyObj.created_at = transactionObj.created_at;
    historyObj.customerId = transactionObj.customerId;
    historyObj.customerName = transactionObj.customerName;
    historyObj.wallet_balance = transactionObj.wallet_balance;
    historyObj.remark = transactionObj.remark;
    historyObj.transactionType = transactionObj.transactionType;
    historyObj.category = transactionObj.category;
    const savedObj = await historyObj.save();
    // console.log('saveUserTransactionHistory ',savedObj);
    return savedObj;
};
const updateUserTransactionHistory = async (id, status) => {
    const updated = await UserTransactionHistory.findOneAndUpdate({ _id: id }, { $set: { status } },
        { new: true });
    return updated;
};


const exportMoneyWalletList = async (searchObj) => {
    const condition = {};
    if (searchObj.fromDate) {
        condition.created_at = { $gte: new Date(searchObj.fromDate) };
        if (searchObj.toDate) {
            condition.created_at.$lte = new Date(searchObj.toDate);
        }
    }
    return await UserTransactionHistory.find(condition).sort({ created_at: -1 });
};

module.exports = {
    getUserTransactionHistory,
    saveUserTransactionHistory,
    updateUserTransactionHistory,
    exportMoneyWalletList
}