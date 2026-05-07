const userMealaweTransactionHistory = require('../dao/userMealaweTransactionHistory.dao');

const getUserMealaweTransactionHistory = async (payee_id, pageNumber, nPerPage) => {
    return await userMealaweTransactionHistory.getUserMealaweTransactionHistory(payee_id, pageNumber, nPerPage);
};
const saveUserMealaweTransactionHistory = async (withdrawalObj) => {
    return await userMealaweTransactionHistory.saveUserMealaweTransactionHistory(withdrawalObj);
};
const updateUserMealaweTransactionHistory = async (id, status) => {
    return await userMealaweTransactionHistory.updateUserMealaweTransactionHistory(id, status);
};


module.exports = {
    getUserMealaweTransactionHistory,
    saveUserMealaweTransactionHistory,
    updateUserMealaweTransactionHistory,
}