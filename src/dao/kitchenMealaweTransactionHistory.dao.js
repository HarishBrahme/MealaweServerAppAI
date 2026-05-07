const KitchenMealaweTransactionHistory = require('../model/kitchenMealaweTransactionHistory.model');

const getKitchenMealaweTransactionHistory = async (kitchenId, page, limit) => {
    const history = await KitchenMealaweTransactionHistory.find({ kitchenId })
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
    return history;
};
const saveKitchenMealaweTransactionHistory = async (transactionObj) => {
    const historyObj = new KitchenMealaweTransactionHistory();
    historyObj.status = transactionObj.status;
    historyObj.transaction_points = transactionObj.transaction_points;
    historyObj.created_at = transactionObj.created_at;
    historyObj.kitchenId = transactionObj.kitchenId;
    historyObj.kitchenName = transactionObj.kitchenName;
    historyObj.wallet_balance = transactionObj.wallet_balance;
    historyObj.remark = transactionObj.remark;
    historyObj.transactionType = transactionObj.transactionType;
    const savedObj = await historyObj.save();
    // console.log('saveKitchenMealaweTransactionHistory ',savedObj);
    return savedObj;
};
const updateKitchenMealaweTransactionHistory = async (id, status) => {
    const updated = await KitchenMealaweTransactionHistory.findOneAndUpdate({ _id: id }, { $set: { status } },
        { new: true });
    return updated;
};


module.exports = {
    getKitchenMealaweTransactionHistory,
    saveKitchenMealaweTransactionHistory,
    updateKitchenMealaweTransactionHistory
}