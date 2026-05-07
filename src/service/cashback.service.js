const dao = require('../dao/cashback.dao')

const saveCashBack = async (cashbackObj, expiryDay) => {
    return dao.saveCashBack(cashbackObj, expiryDay);
};

const expireCashBack = async (id) => {
    return dao.expireCashBack(id);
}

const getCashbackList = async () => {
    return dao.getCashbackList();
}

const getCashbackListUser = async (customerId, pageNumber) => {
    return dao.getCashbackListUser(customerId, pageNumber);
}

const updateCashbackListUser = async (cashbackObj) => {
    return dao.updateCashbackListUser(cashbackObj);
}

const getCashbackBalance = async (customerId) => {
    return dao.getCashbackBalance(customerId);
}

const getValidCashBackList = async (customerId) => {
    return dao.getValidCashBackList(customerId);
}

const getCashbackListForExpiry = async (expiryDay) => {
    return dao.getCashbackListForExpiry(expiryDay);
}
const expireCashBackList = async () => {
    return dao.expireCashBackList();
}

const exportCashbackList = async (searchObj) => {
    return dao.exportCashbackList(searchObj);
}

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