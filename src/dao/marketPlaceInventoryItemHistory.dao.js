const MarketPlaceInventoryItemHistory = require('../model/marketPlaceInventoryItemHistory.model');


const getInventoryItemHistory = async (inventoryId, page) => {
    const limit = 50;
    const history = await MarketPlaceInventoryItemHistory.find({ inventoryId })
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
    return history;
};
const saveInventoryItemHistory = async (transactionObj) => {
    const historyObj = new MarketPlaceInventoryItemHistory();
    historyObj.inventoryId = transactionObj.inventoryId;
    historyObj.inventoryName = transactionObj.inventoryName;
    historyObj.itemId = transactionObj.itemId;
    historyObj.itemName = transactionObj.itemName;
    historyObj.itemServingUnit = transactionObj.itemServingUnit;
    historyObj.previousQuantity = transactionObj.previousQuantity;
    historyObj.transactionQuantity = transactionObj.transactionQuantity;
    historyObj.finalQuantity = transactionObj.finalQuantity;
    historyObj.transactionType = transactionObj.transactionType;
    historyObj.orderNo = transactionObj.orderNo;
    historyObj.created_at = new Date();
    const savedObj = await historyObj.save();
    return savedObj;
};
const updateInventoryItemHistory = async (id, status) => {
    const updated = await MarketPlaceInventoryItemHistory.findOneAndUpdate({ _id: id }, { $set: { status } },
        { new: true });
    return updated;
};

module.exports = {
    getInventoryItemHistory,
    saveInventoryItemHistory,
    updateInventoryItemHistory
}