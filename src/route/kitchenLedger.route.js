const express = require('express');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const service = require('./../service/kitchenLedger.service')

router.post('/getKitchenLedgerByTypeAndDate', async (req, res)=>{
    try{
        const kitchenId = req.body.kitchenId;
        const fromDate = req.body.fromDate;
        const toDate = req.body.toDate;
        const page = req.body.page;
        const limit = req.body.limit;
        if(kitchenId && fromDate && toDate){
            const result = await service.getKitchenLedgerByTypeAndDate(kitchenId,fromDate,toDate,page,limit);   
            responsehanlder.success200(req,res, [...result])
        } else {
            responsehanlder.hasError500(res, 'invalid request')
        }       
    }catch(error){
        console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getKitchenLedgerBalance/:id', async (req, res)=>{
    try{
        const kitchenId = req.params.id;
        if(kitchenId){
            const result = await service.getKitchenLedgerBalance(kitchenId);   
            responsehanlder.success200(req,res,result)
        } else {
            responsehanlder.hasError500(res, 'invalid request')
        }       
    }catch(error){
        console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.get('/status-counts', async (req, res) => {
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
            
            // Get counts and optionally data
            const [todayResult, overallResult, todayData, overallData] = await Promise.all([
                // Get today's counts for NewLedgerCreation and TotalTransactions
                service.getLedgerStatusCounts(todayStart.toISOString(), todayEnd.toISOString(), kitchenId),
                
                // Get overall counts for InProgress, Duplicate, and Closed
                service.getOverallLedgerStatusCounts(kitchenId),
                
                // Get today's data if requested
                includeData ? service.getTodayLedgersData(todayStart, todayEnd, kitchenId, dataPage, dataLimit) : Promise.resolve(null),
                
                // Get overall data if requested
                includeData ? service.getOverallLedgersData(kitchenId, dataPage, dataLimit) : Promise.resolve(null)
            ]);
            
            // Build result with counts
            result = {
                counts: {
                    NewLedgerCreation: todayResult.NewLedgerCreation || 0,
                    InProgress: overallResult.InProgress || 0,
                    Duplicate: overallResult.Duplicate || 0,
                    Closed: overallResult.Closed || 0,
                    TotalTransactions: todayResult.TotalTransactions || 0
                },
                dateInfo: {
                    fromDate: todayStart.toISOString(),
                    toDate: todayEnd.toISOString(),
                    isDefaultDate: true,
                    note: 'NewLedgerCreation and TotalTransactions show today counts. Other fields show overall counts.'
                }
            };
            
            // Add data if requested
            if (includeData && todayData && overallData) {
                result.data = {
                    NewLedgerCreation: todayData.newLedgers || [],
                    InProgress: overallData.inProgressLedgers || [],
                    Duplicate: overallData.duplicateLedgers || [],
                    Closed: overallData.closedLedgers || [],
                    TotalTransactions: todayData.allTransactions || []
                };
                
                result.dataPagination = {
                    page: dataPage,
                    limit: dataLimit,
                    note: `Showing ${dataLimit} records per status`
                };
            }
            
        } else {
            // Original logic when dates are provided
            const startDate = new Date(fromDate);
            const endDate = new Date(toDate);
            
            if (isNaN(startDate) || isNaN(endDate)) {
                return responsehanlder.hasError500(res, 'Invalid date format');
            }

            if (startDate > endDate) {
                return responsehanlder.hasError500(res, 'fromDate cannot be after toDate');
            }

            // Get status counts
            const countsResult = await service.getLedgerStatusCounts(fromDate, toDate, kitchenId);
            
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
                const dateData = await service.getLedgersDataByDateRange(startDate, endDate, kitchenId, dataPage, dataLimit);
                result.data = dateData;
                result.dataPagination = {
                    page: dataPage,
                    limit: dataLimit,
                    note: `Showing ${dataLimit} records per status`
                };
            }
        }
        
        responsehanlder.success200(req, res, result);
        
    } catch (error) {
        console.error('Error in /status-counts:', error);
        responsehanlder.hasError500(res, error.message || 'Internal server error');
    }
});


router.get('/kitchen-summary', async (req, res) => {
    try {
        const fromDate = req.query.fromDate;
        const toDate = req.query.toDate;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        // Validate required parameters
        if (!fromDate || !toDate) {
            return responsehanlder.hasError500(res, 'Please provide both fromDate and toDate parameters');
        }

        // Validate date format
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        
        if (isNaN(startDate) || isNaN(endDate)) {
            return responsehanlder.hasError500(res, 'Invalid date format');
        }

        if (startDate > endDate) {
            return responsehanlder.hasError500(res, 'fromDate cannot be after toDate');
        }

        // Get kitchen-wise summary
        const result = await service.getKitchenWiseSummary(fromDate, toDate, page, limit);
        
        responsehanlder.success200(req, res, result);
        
    } catch (error) {
        console.error('Error in /kitchen-summary:', error);
        responsehanlder.hasError500(res, error.message || 'Internal server error');
    }
});

router.get('/orders-without-ledgers', async (req, res) => {
    try {
        const fromDate = req.query.fromDate;
        const toDate = req.query.toDate;
        const includeStats = req.query.includeStats === 'true';

        // Validate dates if provided
        if (fromDate && toDate) {
            const startDate = new Date(fromDate);
            const endDate = new Date(toDate);
            
            if (isNaN(startDate) || isNaN(endDate)) {
                return responsehanlder.hasError500(res, 'Invalid date format. Use YYYY-MM-DD format.');
            }

            if (startDate > endDate) {
                return responsehanlder.hasError500(res, 'fromDate cannot be after toDate');
            }
        }

        let result;
        
        if (includeStats) {
            // Get orders with statistics
            result = await service.getOrdersWithoutLedgersStats(fromDate, toDate);
        } else {
            // Get only orders list
            const orders = await service.findOrdersWithoutLedgers(fromDate, toDate);
            result = { orders };
        }

        // Add date range info to response
        result.queryInfo = {
            fromDate: fromDate || 'Not specified (all records)',
            toDate: toDate || 'Not specified (all records)',
            criteria: {
                orderstatus: 'delivered',
                amtPaidToKitchen: false,
                ledgerExists: false
            },
            timestamp: new Date().toISOString(),
            totalOrders: result.orders.length
        };

        responsehanlder.success200(req, res, result);
        
    } catch (error) {
        console.error('Error in /orders-without-ledgers:', error);
        responsehanlder.hasError500(res, error.message || 'Internal server error');
    }
});
router.get('/orders-without-ledgers-summary', async (req, res) => {
    try {
        const fromDate = req.query.fromDate;
        const toDate = req.query.toDate;

        // Validate dates if provided
        if (fromDate && toDate) {
            const startDate = new Date(fromDate);
            const endDate = new Date(toDate);
            
            if (isNaN(startDate) || isNaN(endDate)) {
                return responsehanlder.hasError500(res, 'Invalid date format');
            }

            if (startDate > endDate) {
                return responsehanlder.hasError500(res, 'fromDate cannot be after toDate');
            }
        }

        const stats = await service.getOrdersWithoutLedgersStats(fromDate, toDate);
        
        // Return only summary without order details
        const summary = {
            stats: stats.stats,
            queryInfo: {
                fromDate: fromDate || 'Not specified (all records)',
                toDate: toDate || 'Not specified (all records)',
                timestamp: new Date().toISOString()
            }
        };

        responsehanlder.success200(req, res, summary);
        
    } catch (error) {
        console.error('Error in /orders-without-ledgers-summary:', error);
        responsehanlder.hasError500(res, error.message || 'Internal server error');
    }
});

module.exports = router;