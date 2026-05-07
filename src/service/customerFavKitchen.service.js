const dao = require('../dao/customerFavKitchen.dao');

const setFavKitchenList = async (payload) => {
    return dao.setFavKitchenList(payload);
};

const getFavKitchenList = async (customerId) => {
    return dao.getFavKitchenList(customerId);
};

module.exports = {
    getFavKitchenList,
    setFavKitchenList
}