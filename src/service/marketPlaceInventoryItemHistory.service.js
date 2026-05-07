const dao = require('../dao/marketPlaceInventoryItemHistory.dao');

const getInventoryItemHistory = async (inventoryId, page) => {
    return await dao.getInventoryItemHistory(inventoryId, page);
};
const saveInventoryItemHistory = async (transactionObj) => {
    return await dao.saveInventoryItemHistory(transactionObj);
};
const updateInventoryItemHistory = async (id, status) => {
    return await dao.updateInventoryItemHistory(id, status);
};


module.exports = {
    getInventoryItemHistory,
    saveInventoryItemHistory,
    updateInventoryItemHistory
}