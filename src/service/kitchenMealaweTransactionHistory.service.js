const kitchenMealaweTransactionHistory = require('../dao/kitchenMealaweTransactionHistory.dao');

const getKitchenMealaweTransactionHistory = async (payee_id, pageNumber, nPerPage) => {
    return await kitchenMealaweTransactionHistory.getKitchenMealaweTransactionHistory(payee_id, pageNumber, nPerPage);
};
const saveKitchenMealaweTransactionHistory = async (withdrawalObj) => {
    return await kitchenMealaweTransactionHistory.saveKitchenMealaweTransactionHistory(withdrawalObj);
};
const updateKitchenMealaweTransactionHistory = async (id, status) => {
    return await kitchenMealaweTransactionHistory.updateKitchenMealaweTransactionHistory(id, status);
};


module.exports = {
    getKitchenMealaweTransactionHistory,
    saveKitchenMealaweTransactionHistory,
    updateKitchenMealaweTransactionHistory
}