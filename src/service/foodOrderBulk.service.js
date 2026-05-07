const dao = require('../dao/foodOrderBulk.dao');
const counterDao = require('../dao/counters.dao');

const saveFoodOrderBulk = async (foodOrderBulk) => {
    return new Promise(async (resolve, reject) => {
        try {
            const foodOrderNo = await counterDao.getNextSequenceValue('Food_Order_Bulk_No');
            foodOrderBulk.orderNo = 'BULK' + parseInt(foodOrderNo)
            const newFoodOrder = await dao.saveFoodOrderBulk(foodOrderBulk);
            resolve(newFoodOrder);
        }
        catch (e) {
            reject(e);
        }
    });
}

const updateBulkOrderStatus = async (id, bulkOrder) => {
    return dao.updateBulkOrderStatus(id, bulkOrder);
}
const searchBulkOrderList = async (searchObj, page) => {
    return dao.searchBulkOrderList(searchObj, page);
}
const getCustomerPastBulkOrders = async (customerId, page) => {
    return dao.getCustomerPastBulkOrders(customerId, page);
}
const getCurrentBulkOrdersList = async (page, limit) => {
    return dao.getCurrentBulkOrdersList(page, limit);
}
const getCurrentBulkOrdersCount = async () => {
    return dao.getCurrentBulkOrdersCount();
}

module.exports = {
    saveFoodOrderBulk,
    updateBulkOrderStatus,
    searchBulkOrderList,
    getCustomerPastBulkOrders,
    getCurrentBulkOrdersList,
    getCurrentBulkOrdersCount
}
