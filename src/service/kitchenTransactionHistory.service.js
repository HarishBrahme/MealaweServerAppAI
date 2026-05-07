const kitchenTransactionHistory = require('../dao/kitchenTransactionHistory.dao');

const getKitchenTransactionHistory = async (payee_id, pageNumber, nPerPage) => {
    return await kitchenTransactionHistory.getKitchenTransactionHistory(payee_id, pageNumber, nPerPage);
};
const saveKitchenTransactionHistory = async (withdrawalObj) => {
    return await kitchenTransactionHistory.saveKitchenTransactionHistory(withdrawalObj);
};
const updatedKitchenTransactionHistory = async (id, transactionObj) => {
    return await kitchenTransactionHistory.updatedKitchenTransactionHistory(id, transactionObj);
};
const getKitchenTotalIncome = async (id) => {
    return await kitchenTransactionHistory.getKitchenTotalIncome(id);
};

const getKitchenBankPendingTransactionList = async () => { 
    return await kitchenTransactionHistory.getKitchenBankPendingTransactionList();
};
const getTransactionById = async (id) => { 
    return await kitchenTransactionHistory.getTransactionById(id);
};

// const getTransactionStatusCounts = async (fromDate, toDate, kitchenId = null) => {    
//     return await kitchenTransactionHistory.getTransactionStatusCounts(fromDate, toDate, kitchenId);
// }
const getTransactionStatusCountsForDateRange = async (fromDate, toDate, kitchenId = null) => {    
    return await kitchenTransactionHistory.getTransactionStatusCountsForDateRange(fromDate, toDate, kitchenId);
};

const getOverallTransactionStatusCounts = async (kitchenId = null) => {    
    return await kitchenTransactionHistory.getOverallTransactionStatusCounts(kitchenId);
};

// Original function (renamed for clarity)
const getTransactionStatusCounts = async (fromDate, toDate, kitchenId = null) => {    
    return await kitchenTransactionHistory.getTransactionStatusCounts(fromDate, toDate, kitchenId);
};


// const getTodayTransactionsData = async (startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
//     return await kitchenTransactionHistory.getTodayTransactionsData(startDate, endDate, kitchenId, page, limit);
// };

const getOverallTransactionsData = async (kitchenId = null, page = 1, limit = 10) => {
    return await kitchenTransactionHistory.getOverallTransactionsData(kitchenId, page, limit);
};

const getTransactionsDataByDateRange = async (startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    return await kitchenTransactionHistory.getTransactionsDataByDateRange(startDate, endDate, kitchenId, page, limit);
};

const getTodayTransactionsDataByStatus = async (status, startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    return await kitchenTransactionHistory.getTodayTransactionsDataByStatus(status, startDate, endDate, kitchenId, page, limit);
};

const getOverallTransactionsDataByStatus = async (status, kitchenId = null, page = 1, limit = 10) => {
    return await kitchenTransactionHistory.getOverallTransactionsDataByStatus(status, kitchenId, page, limit);
};

const getTransactionsDataByStatusAndDate = async (status, startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    return await kitchenTransactionHistory.getTransactionsDataByStatusAndDate(status, startDate, endDate, kitchenId, page, limit);
};

const getTodayTransactionCounts = async (fromDate, toDate, kitchenId = null) => {
    return await kitchenTransactionHistory.getTodayTransactionCounts(fromDate, toDate, kitchenId);
};

const getOverallOtherStatusCounts = async (kitchenId = null) => {
    return await kitchenTransactionHistory.getOverallOtherStatusCounts(kitchenId);
};

const getTodaySuccessCompletedAmounts = async (fromDate, toDate, kitchenId = null) => {
    return await kitchenTransactionHistory.getTodaySuccessCompletedAmounts(fromDate, toDate, kitchenId);
};

const getTodayTransactionsData = async (startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    return await kitchenTransactionHistory.getTodayTransactionsData(startDate, endDate, kitchenId, page, limit);
};

const getOverallOtherStatusesData = async (kitchenId = null, page = 1, limit = 10) => {
    return await kitchenTransactionHistory.getOverallOtherStatusesData(kitchenId, page, limit);
};

const exportKitchenTransactionHistory = async (searchObj) => {
    return await kitchenTransactionHistory.exportKitchenTransactionHistory(searchObj);
};

module.exports = {
    getKitchenTransactionHistory,
    saveKitchenTransactionHistory,
    updatedKitchenTransactionHistory,
    getKitchenTotalIncome,
    getKitchenBankPendingTransactionList,
    getTransactionStatusCounts,
    getTransactionStatusCountsForDateRange,
    getOverallTransactionStatusCounts,
     // New data functions
    getTodayTransactionsData,
    getOverallTransactionsData,
    getTransactionsDataByDateRange,
    getTodayTransactionsDataByStatus,
    getOverallTransactionsDataByStatus,
    getTransactionsDataByStatusAndDate,

    getTodayTransactionCounts,
    getOverallOtherStatusCounts,
    getTodaySuccessCompletedAmounts,
    getOverallOtherStatusesData,
    getTransactionById,
    exportKitchenTransactionHistory
}