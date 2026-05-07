const dao = require('../dao/kitchenLedger.dao');


const saveKitchenLedger = async (kitchenLedger) => { 
    return await dao.saveKitchenLedger(kitchenLedger);
};

const updateKitchenLedger = async (id,status,remark,updatedBy,updateByType) => { 
    return await dao.updateKitchenLedger(id,status,remark,updatedBy,updateByType);
};

const getstatusWiseLedgerList = async(status,dayPrior) => {    
    return await dao.getstatusWiseLedgerList(status,dayPrior);
}

const getKitchenLedgerByTypeAndDate = async(kitchenFirmId, fromDate, toDate,page,limit) => {    
    return await dao.getKitchenLedgerByTypeAndDate(kitchenFirmId, fromDate, toDate,page,limit);
}
const getKitchenLedgerBalance = async (id) => { 
    return await dao.getKitchenLedgerBalance(id);
};
const getLedgerList = async(status) => {    
    return await dao.getLedgerList(status);
}
const getLedgerStatusCounts = async (fromDate, toDate, kitchenId = null) => {    
    return await dao.getLedgerStatusCounts(fromDate, toDate, kitchenId);
}

const getOverallLedgerStatusCounts = async (kitchenId = null) => {    
    return await dao.getOverallLedgerStatusCounts(kitchenId);
}


const getKitchenWiseSummary = async (fromDate, toDate, page, limit) => {    
    return await dao.getKitchenWiseSummary(fromDate, toDate, page, limit);
}

const getKitchenDetailedSummary = async (kitchenId, fromDate, toDate) => {    
    return await dao.getKitchenDetailedSummary(kitchenId, fromDate, toDate);
}

const getTodayLedgersData = async (startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    return await dao.getTodayLedgersData(startDate, endDate, kitchenId, page, limit);
};

const getOverallLedgersData = async (kitchenId = null, page = 1, limit = 10) => {
    return await dao.getOverallLedgersData(kitchenId, page, limit);
};

const getLedgersDataByDateRange = async (startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    return await dao.getLedgersDataByDateRange(startDate, endDate, kitchenId, page, limit);
};

const getTodayLedgersDataByStatus = async (status, startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    return await dao.getTodayLedgersDataByStatus(status, startDate, endDate, kitchenId, page, limit);
};

const getOverallLedgersDataByStatus = async (status, kitchenId = null, page = 1, limit = 10) => {
    return await dao.getOverallLedgersDataByStatus(status, kitchenId, page, limit);
};

const getLedgersDataByStatusAndDate = async (status, startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    return await dao.getLedgersDataByStatusAndDate(status, startDate, endDate, kitchenId, page, limit);
};
const findOrdersWithoutLedgers = async (fromDate = null, toDate = null) => {
    // Use the optimized version for better performance
    return await dao.findOrdersWithoutLedgersOptimized(fromDate, toDate);
};
const getOrdersWithoutLedgersStats = async (fromDate = null, toDate = null) => {
    const orders = await dao.findOrdersWithoutLedgersOptimized(fromDate, toDate);
    
    const stats = {
        totalCount: orders.length,
        totalAmount: orders.reduce((sum, order) => sum + (order.amount || 0), 0),
        totalCommissionAmount: orders.reduce((sum, order) => {
            const itemAmount = order.itemAmount || 0;
            const paidAmount = order.amtAfterCommisionPaidToKitchen || 0;
            return sum + (itemAmount - paidAmount);
        }, 0),
        totalPayableToKitchen: orders.reduce((sum, order) => sum + (order.amtAfterCommisionPaidToKitchen || 0), 0),
        breakdownBySource: {
            FoodOrder: orders.filter(order => order.source === 'FoodOrder').length,
            BulkFoodOrder: orders.filter(order => order.source === 'BulkFoodOrder').length
        }
    };

    return { orders, stats };
};

module.exports = {
    saveKitchenLedger,
    updateKitchenLedger,
    getstatusWiseLedgerList,
    getKitchenLedgerByTypeAndDate,
    getKitchenLedgerBalance,
    getLedgerList,
    getLedgerStatusCounts,
    getKitchenWiseSummary,
    getKitchenDetailedSummary,
    getOverallLedgerStatusCounts,
    getTodayLedgersData,
    getOverallLedgersData,
    getLedgersDataByDateRange,
    getTodayLedgersDataByStatus,
    getOverallLedgersDataByStatus,
    getLedgersDataByStatusAndDate,
    findOrdersWithoutLedgers,
    getOrdersWithoutLedgersStats

}