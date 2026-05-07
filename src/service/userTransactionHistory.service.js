const userTransactionHistory = require('../dao/userTransactionHistory.dao');

const getUserTransactionHistory = async (payee_id, pageNumber, nPerPage) => {
    return await userTransactionHistory.getUserTransactionHistory(payee_id, pageNumber, nPerPage);
};
const saveUserTransactionHistory = async (withdrawalObj) => {
    return await userTransactionHistory.saveUserTransactionHistory(withdrawalObj);
};
const updateUserTransactionHistory = async (id, status) => {
    return await userTransactionHistory.updateUserTransactionHistory(id, status);
};


const exportMoneyWalletList = async (searchObj) => {
    return await userTransactionHistory.exportMoneyWalletList(searchObj);
};

module.exports = {
    getUserTransactionHistory,
    saveUserTransactionHistory,
    updateUserTransactionHistory,
    exportMoneyWalletList
}