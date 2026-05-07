const express = require('express');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const service = require('./../service/kitchenTransactionHistory.service')
const { kitchenAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/withdrawalHistory/:kitchenId/:pageNumber/:nPerPage', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        const pageNumber = req.params.pageNumber;
        const nPerPage = req.params.nPerPage;
        if (kitchenId && pageNumber && nPerPage) {
            const result = await service.getKitchenTransactionHistory(kitchenId, pageNumber, nPerPage);
            responsehanlder.success200(req, res, [...result])
        } else {
            responsehanlder.hasError500(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getKitchenTotalIncome/:kitchenId', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        if (kitchenId) {
            const result = await service.getKitchenTotalIncome(kitchenId);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError500(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.get('/transaction-status-counts', async (req, res) => {
    try {
        const fromDate = req.query.fromDate;
        const toDate = req.query.toDate;
        const kitchenId = req.query.kitchenId; // Optional
        const includeData = req.query.includeData === 'true'; // New parameter
        const dataPage = parseInt(req.query.dataPage) || 1; // For paginating data
        const dataLimit = parseInt(req.query.dataLimit) || 10000000000; // Default 10 records per status
        
        let result = {};
        
        // If dates are not provided, use today's date for specific calculations
        if (!fromDate || !toDate) {
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
            
            // Get three sets of data:
            // 1. Today's counts for TotalTransactions, Success, and Completed
            // 2. Overall counts for Pending, Failed, InProgress, Initiated, Refund, Review_With_Bank
            // 3. Overall amounts for TotalCreditAmount, CompletedAmount, SuccessAmount (these remain overall)
            
            const [todayResult, overallResult, todayData, overallData, todaySuccessCompleted] = await Promise.all([
                // Get today's data for TotalTransactions, Success, and Completed
                service.getTodayTransactionCounts(todayStart.toISOString(), todayEnd.toISOString(), kitchenId),
                
                // Get overall counts for other statuses
                service.getOverallOtherStatusCounts(kitchenId),
                
                // Get today's TotalTransactions data if requested
                includeData ? service.getTodayTransactionsData(todayStart, todayEnd, kitchenId, dataPage, dataLimit) : Promise.resolve(null),
                
                // Get overall other statuses data if requested
                includeData ? service.getOverallOtherStatusesData(kitchenId, dataPage, dataLimit) : Promise.resolve(null),
                
                // Get today's Success and Completed amounts
                service.getTodaySuccessCompletedAmounts(todayStart.toISOString(), todayEnd.toISOString(), kitchenId)
            ]);
            
            // Build result with counts
            result = {
                counts: {
                    Pending: overallResult.Pending || 0,
                    Failed: overallResult.Failed || 0,
                    Success: todayResult.Success || 0,  // Today only (CHANGED)
                    InProgress: overallResult.InProgress || 0,
                    Completed: todayResult.Completed || 0,  // Today only (CHANGED)
                    Initiated: overallResult.Initiated || 0,
                    Refund: overallResult.Refund || 0,
                    Review_With_Bank: overallResult.Review_With_Bank || 0,
                    TotalTransactions: todayResult.TotalTransactions || 0,  // Today's count only
                    TotalCreditAmount: overallResult.TotalCreditAmount || 0,  // Still overall
                    CompletedAmount: todaySuccessCompleted.CompletedAmount || 0,  // Today only (CHANGED)
                    SuccessAmount: todaySuccessCompleted.SuccessAmount || 0  // Today only (CHANGED)
                },
                dateInfo: {
                    fromDate: todayStart.toISOString(),
                    toDate: todayEnd.toISOString(),
                    isDefaultDate: true,
                    note: 'TotalTransactions, Success, and Completed show today counts. Other fields show overall counts.'
                }
            };
            
            // Add data if requested
            if (includeData && todayData && overallData) {
                result.data = {
                    TotalTransactions: todayData.transactions || [],
                    Success: todayData.successTransactions || [],  // Today only (CHANGED)
                    Completed: todayData.completedTransactions || [],  // Today only (CHANGED)
                    Pending: overallData.pendingTransactions || [],
                    Failed: overallData.failedTransactions || [],
                    InProgress: overallData.inProgressTransactions || [],
                    Initiated: overallData.initiatedTransactions || [],
                    Refund: overallData.refundTransactions || [],
                    Review_With_Bank: overallData.reviewWithBankTransactions || []
                };
                
                result.dataPagination = {
                    page: dataPage,
                    limit: dataLimit,
                    note: `Showing ${dataLimit} records per status`
                };
            }
            
            return responsehanlder.success200(req, res, result);
        }
        
        // Original logic when dates are provided (no changes here)
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        
        if (isNaN(startDate) || isNaN(endDate)) {
            return responsehanlder.hasError500(res, 'Invalid date format');
        }

        if (startDate > endDate) {
            return responsehanlder.hasError500(res, 'fromDate cannot be after toDate');
        }

        // Get transaction status counts for the date range
        const countsResult = await service.getTransactionStatusCounts(fromDate, toDate, kitchenId);
        
        // Build result with counts
        result = {
            counts: countsResult,
            dateInfo: {
                fromDate: startDate.toISOString(),
                toDate: endDate.toISOString(),
                isDefaultDate: false
            }
        };
        
        // Get data if requested
        if (includeData) {
            const dateData = await service.getTransactionsDataByDateRange(startDate, endDate, kitchenId, dataPage, dataLimit);
            result.data = dateData;
            result.dataPagination = {
                page: dataPage,
                limit: dataLimit,
                note: `Showing ${dataLimit} records per status`
            };
        }
        
        responsehanlder.success200(req, res, result);
        
    } catch (error) {
        console.error('Error in /transaction-status-counts:', error);
        responsehanlder.hasError500(res, error.message || 'Internal server error');
    }
});

// Alternative: Separate endpoint for getting transaction data (if you prefer cleaner separation)
router.get('/transaction-status-data', async (req, res) => {
    try {
        const fromDate = req.query.fromDate;
        const toDate = req.query.toDate;
        const kitchenId = req.query.kitchenId;
        const status = req.query.status; // Optional: specific status to get data for
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        
        let result = {};
        
        if (!fromDate || !toDate) {
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
            
            // Get data based on status parameter
            if (status) {
                // Get specific status data
                if (status === 'TotalTransactions') {
                    result = await service.getTodayTransactionsDataByStatus(status, todayStart, todayEnd, kitchenId, page, limit);
                } else {
                    result = await service.getOverallTransactionsDataByStatus(status, kitchenId, page, limit);
                }
            } else {
                // Get all status data
                const [todayData, overallData] = await Promise.all([
                    service.getTodayTransactionsData(todayStart, todayEnd, kitchenId, page, limit),
                    service.getOverallTransactionsData(kitchenId, page, limit)
                ]);
                
                result = {
                    TotalTransactions: todayData.transactions || [],
                    Pending: overallData.pendingTransactions || [],
                    Failed: overallData.failedTransactions || [],
                    Success: overallData.successTransactions || [],
                    InProgress: overallData.inProgressTransactions || [],
                    Completed: overallData.completedTransactions || [],
                    Initiated: overallData.initiatedTransactions || [],
                    Refund: overallData.refundTransactions || [],
                    Review_With_Bank: overallData.reviewWithBankTransactions || []
                };
            }
        } else {
            const startDate = new Date(fromDate);
            const endDate = new Date(toDate);
            
            if (isNaN(startDate) || isNaN(endDate)) {
                return responsehanlder.hasError500(res, 'Invalid date format');
            }

            if (startDate > endDate) {
                return responsehanlder.hasError500(res, 'fromDate cannot be after toDate');
            }
            
            // Get data for date range
            if (status) {
                result = await service.getTransactionsDataByStatusAndDate(status, startDate, endDate, kitchenId, page, limit);
            } else {
                result = await service.getTransactionsDataByDateRange(startDate, endDate, kitchenId, page, limit);
            }
        }
        
        responsehanlder.success200(req, res, {
            data: result,
            pagination: {
                page,
                limit,
                total: Array.isArray(result) ? result.length : Object.keys(result).length
            }
        });
        
    } catch (error) {
        console.error('Error in /transaction-status-data:', error);
        responsehanlder.hasError500(res, error.message || 'Internal server error');
    }
});

router.post('/exportKitchenTransactionHistory', async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const list = await service.exportKitchenTransactionHistory(searchObj);
            responsehanlder.success200(req, res, list);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

module.exports = router;