const FoodOrder = require('../model/foodOrder.model'); // Adjust path as needed
const BulkFoodOrder = require('../model/bulkFoodOrder.model'); // Adjust path as needed

const KitchenLedger = require('../model/kitchenLedger.model');
const { getTodayStartTime, getTodayEndTime } = require('../util/date-util');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const saveKitchenLedger = async (ledgerObj) => {
    const nKitchenLedger = new KitchenLedger();
    nKitchenLedger.status = ledgerObj?.status;
    nKitchenLedger.remark = ledgerObj.remark;
    nKitchenLedger.createdOn = ledgerObj?.createdOn;
    nKitchenLedger.transferOn = ledgerObj?.transferOn;
    nKitchenLedger.totalItemAmount = ledgerObj.totalItemAmount;
    nKitchenLedger.kitchenCommissionPercentage = ledgerObj.kitchenCommissionPercentage;
    nKitchenLedger.kitchenCommissionAmount = ledgerObj.kitchenCommissionAmount;
    nKitchenLedger.kitchenLedgerAmt = ledgerObj.kitchenLedgerAmt;
    nKitchenLedger.orderNo = ledgerObj.orderNo;
    nKitchenLedger.kitchenName = ledgerObj.kitchenName;
    nKitchenLedger.kitchenPhoneNo = ledgerObj.kitchenPhoneNo;
    nKitchenLedger.kitchenEmail = ledgerObj.kitchenEmail;
    nKitchenLedger.kitchenUniqueId = ledgerObj.kitchenUniqueId;
    nKitchenLedger.kitchenId = ledgerObj.kitchenId;
    nKitchenLedger.orderType = ledgerObj.orderType;
    nKitchenLedger.updateHistory = ledgerObj.updateHistory;
    const isInserted = await nKitchenLedger.save();
    return isInserted;
};

const updateKitchenLedger = async (id,status,remark,updatedBy,updateByType) => {
    const updateObj = {};
    updateObj.status = status;  
    const updateHistory = {
        currentStatus: status,
        updatedOn: new Date(),
        updateRemark: remark,
        updatedBy,
        updateByType
    };
    const update = await KitchenLedger.findOneAndUpdate({ _id: id },{ $set: updateObj ,$push: { updateHistory }},{ new: true });
    return update;
}


const getKitchenLedgerBalance = async(kitchenId) => {
    const condition = {
        kitchenId: ObjectId(kitchenId),
        status: {$in: ['New', 'InProgress']}
    };
    const result = await KitchenLedger.aggregate(
        [
            {
                $match : condition
            },
            {
                $group :
                  {
                    '_id' : '$kitchenId',
                    totalLedgerBalance: { $sum: '$kitchenLedgerAmt' },
                    count: { $sum: 1 }
                  }
            }
        ]
    );
    return result;
}

const getKitchenLedgerList = async (kitchenId, pageNumber) => {
    const limit = 40; 
    return await KitchenLedger.find({kitchenId})  
        .sort({createdOn:-1})       
        .skip((pageNumber - 1) * limit)
        .limit(limit * 1)
        .exec();
};

const getstatusWiseLedgerList = async (status, dayPrior = 0) => {
  const condition = { status };
  if (dayPrior > 0) {
    const todayStart = getTodayStartTime();
    const priorDate = new Date(todayStart);
    priorDate.setDate(priorDate.getDate() - dayPrior);

    condition.createdOn = {
      $gte: priorDate,
      $lte: todayStart,
    };
  }

  return KitchenLedger.find(condition);
};

const getLedgerList = async (status) => {
  const condition = { status };

  const todayEnd = getTodayEndTime();

  condition.transferOn = { $lte: todayEnd };

  return KitchenLedger.find(condition);
};
const getKitchenLedgerByTypeAndDate = async (kitchenId, fromDate, toDate,page = 1,limit = 40) => {
  if (!ObjectId.isValid(kitchenId)) {
    throw new Error('Invalid kitchenId');
  }
  const firmIdObj = new ObjectId(kitchenId);

  const gte = new Date(fromDate);
  const lte = new Date(toDate);
  
  if (isNaN(gte) || isNaN(lte)) {
    throw new Error('Invalid fromDate or toDate');
  }

  const match = {
    kitchenId: firmIdObj,
    // createdOn: { $gte: gte, $lte: lte },
  };

  return KitchenLedger.find(match).sort({ createdOn: -1 }).skip((page - 1) * limit).limit(limit).exec();
};

const getOverallLedgerStatusCounts = async (kitchenId = null) => {
    try {
        // Build match condition for overall data (no date filter)
        const matchCondition = {};
        
        // Add kitchen filter if provided
        if (kitchenId && ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new ObjectId(kitchenId);
        }

        // Get overall counts for InProgress, Duplicate, and Closed
        const result = await KitchenLedger.aggregate([
            { $match: matchCondition },
            {
                $facet: {
                    // Count by status
                    statusCounts: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    // Find duplicate order numbers EXCLUDING Closed status
                    duplicates: [
                        {
                            $match: {
                                status: { $ne: 'Closed' } // Exclude closed status
                            }
                        },
                        {
                            $group: {
                                _id: '$orderNo',
                                count: { $sum: 1 },
                                entries: { $push: '$$ROOT' }
                            }
                        },
                        {
                            $match: {
                                count: { $gt: 1 }
                            }
                        },
                        {
                            $count: 'duplicateCount'
                        }
                    ],
                    // Get total count
                    total: [
                        { $count: 'totalCount' }
                    ]
                }
            },
            {
                $project: {
                    // Extract specific status counts we need for overall
                    InProgress: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    inProgressCount: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'InProgress'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$inProgressCount.count'
                            }
                        }, 0]
                    },
                    Closed: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    closedCount: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Closed'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$closedCount.count'
                            }
                        }, 0]
                    },
                    // Get overall duplicate count EXCLUDING Closed status
                    Duplicate: {
                        $ifNull: [{ $arrayElemAt: ['$duplicates.duplicateCount', 0] }, 0]
                    }
                }
            }
        ]);

        // Return the result or default counts
        return result.length > 0 ? result[0] : {
            InProgress: 0,
            Duplicate: 0,
            Closed: 0
        };
    } catch (error) {
        console.error('Error in getOverallLedgerStatusCounts DAO:', error);
        throw error;
    }
};

// Also update the original getLedgerStatusCounts to be date-specific
const getLedgerStatusCounts = async (fromDate, toDate, kitchenId = null) => {
    try {
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        // Build match condition with date filter
        const matchCondition = {
            createdOn: {
                $gte: startDate,
                $lte: endDate
            }
        };

        // Add kitchen filter if provided
        if (kitchenId && ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new ObjectId(kitchenId);
        }

        // Perform aggregation
        const result = await KitchenLedger.aggregate([
            { $match: matchCondition },
            {
                $facet: {
                    // Count by status
                    statusCounts: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    // Find duplicate order numbers EXCLUDING Closed status
                    duplicates: [
                        {
                            $match: {
                                status: { $ne: 'Closed' } // Exclude closed status
                            }
                        },
                        {
                            $group: {
                                _id: '$orderNo',
                                count: { $sum: 1 },
                                entries: { $push: '$$ROOT' }
                            }
                        },
                        {
                            $match: {
                                count: { $gt: 1 }
                            }
                        },
                        {
                            $count: 'duplicateCount'
                        }
                    ],
                    // Get total count
                    total: [
                        { $count: 'totalCount' }
                    ]
                }
            },
            {
                $project: {
                    // Extract status counts
                    NewLedgerCreation: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    newCount: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'New'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$newCount.count'
                            }
                        }, 0]
                    },
                    InProgress: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    inProgressCount: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'InProgress'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$inProgressCount.count'
                            }
                        }, 0]
                    },
                    Closed: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    closedCount: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Closed'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$closedCount.count'
                            }
                        }, 0]
                    },
                    // Get duplicate count EXCLUDING Closed status
                    Duplicate: {
                        $ifNull: [{ $arrayElemAt: ['$duplicates.duplicateCount', 0] }, 0]
                    },
                    // Get total count
                    TotalTransactions: {
                        $ifNull: [{ $arrayElemAt: ['$total.totalCount', 0] }, 0]
                    }
                }
            }
        ]);

        // Return the result or default counts
        return result.length > 0 ? result[0] : {
            NewLedgerCreation: 0,
            InProgress: 0,
            Duplicate: 0,
            Closed: 0,
            TotalTransactions: 0
        };
    } catch (error) {
        console.error('Error in getLedgerStatusCounts DAO:', error);
        throw error;
    }
};



const getKitchenWiseSummary = async (fromDate, toDate, page = 1, limit = 20) => {
    try {
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        // Validate dates
        if (isNaN(startDate) || isNaN(endDate)) {
            throw new Error('Invalid date format');
        }

        if (startDate > endDate) {
            throw new Error('fromDate cannot be after toDate');
        }

        const skip = (page - 1) * limit;

        // FIXED Aggregation Pipeline
        const result = await KitchenLedger.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    // Group by kitchenId only to avoid duplicate kitchen names issue
                    _id: "$kitchenId",
                    
                    // Get the most recent kitchen name for consistency
                    kitchenName: { $last: "$kitchenName" },
                    
                    // Count total orders for this kitchen
                    totalOrderCount: { $sum: 1 },
                    
                    // Sum of all order amounts before commission (ensure positive values)
                    totalOrderAmount: { 
                        $sum: { 
                            $cond: [
                                { $lt: ["$totalItemAmount", 0] },
                                0,  // If negative, treat as 0
                                "$totalItemAmount"
                            ]
                        } 
                    },
                    
                    // Sum of commission amounts (ensure positive values)
                    totalCommissionAmount: { 
                        $sum: { 
                            $cond: [
                                { $lt: ["$kitchenCommissionAmount", 0] },
                                0,  // If negative, treat as 0
                                "$kitchenCommissionAmount"
                            ]
                        } 
                    },
                    
                    // Sum of ledger amounts (amount after commission deduction)
                    totalAmountAfterDeduction: { 
                        $sum: { 
                            $cond: [
                                { $lt: ["$kitchenLedgerAmt", 0] },
                                0,  // If negative, treat as 0
                                "$kitchenLedgerAmt"
                            ]
                        } 
                    },
                    
                    // Status breakdown counts
                    newCount: { $sum: { $cond: [{ $eq: ["$status", "New"] }, 1, 0] } },
                    inProgressCount: { $sum: { $cond: [{ $eq: ["$status", "InProgress"] }, 1, 0] } },
                    closedCount: { $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] } },
                    
                    // Get kitchen email and phone for reference
                    kitchenEmail: { $last: "$kitchenEmail" },
                    kitchenPhoneNo: { $last: "$kitchenPhoneNo" },
                    
                    // Get most recent order date
                    latestOrderDate: { $max: "$createdOn" },
                    
                    // Get first order date
                    firstOrderDate: { $min: "$createdOn" },
                    
                    // Calculate average commission properly
                    validCommissionSum: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $gt: ["$kitchenCommissionPercentage", 0] },
                                    { $lte: ["$kitchenCommissionPercentage", 100] }
                                ]},
                                "$kitchenCommissionPercentage",
                                0
                            ]
                        }
                    },
                    validCommissionCount: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $gt: ["$kitchenCommissionPercentage", 0] },
                                    { $lte: ["$kitchenCommissionPercentage", 100] }
                                ]},
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    kitchenId: "$_id",
                    kitchenName: 1,
                    totalOrderCount: 1,
                    totalOrderAmount: 1,
                    totalCommissionAmount: 1,
                    totalAmountAfterDeduction: 1,
                    
                    // Calculate commission rate safely
                    commissionRate: {
                        $cond: [
                            { $eq: ["$totalOrderAmount", 0] },
                            0,
                            {
                                $min: [
                                    100,  // Cap at 100%
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    "$totalCommissionAmount",
                                                    "$totalOrderAmount"
                                                ]
                                            },
                                            100
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    
                    // Calculate average commission percentage safely
                    avgCommissionPercentage: {
                        $cond: [
                            { $eq: ["$validCommissionCount", 0] },
                            0,
                            { $divide: ["$validCommissionSum", "$validCommissionCount"] }
                        ]
                    },
                    
                    // Status breakdown
                    statusBreakdown: {
                        new: "$newCount",
                        inProgress: "$inProgressCount",
                        closed: "$closedCount"
                    },
                    
                    // Contact info
                    contactInfo: {
                        email: "$kitchenEmail",
                        phone: "$kitchenPhoneNo"
                    },
                    
                    // Date range
                    dateRange: {
                        firstOrder: "$firstOrderDate",
                        latestOrder: "$latestOrderDate"
                    },
                    
                    // Calculations
                    netPayableAmount: "$totalAmountAfterDeduction",
                    
                    // Data quality flags
                    dataQuality: {
                        hasInconsistencies: {
                            $or: [
                                { $lt: ["$totalOrderAmount", 0] },
                                { $lt: ["$totalCommissionAmount", 0] },
                                { $lt: ["$totalAmountAfterDeduction", 0] },
                                { $gt: ["$commissionRate", 100] }
                            ]
                        },
                        commissionValid: {
                            $and: [
                                { $gte: ["$commissionRate", 0] },
                                { $lte: ["$commissionRate", 100] }
                            ]
                        }
                    }
                }
            },
            {
                $addFields: {
                    // Round numeric values
                    totalOrderAmount: { $round: ["$totalOrderAmount", 2] },
                    totalCommissionAmount: { $round: ["$totalCommissionAmount", 2] },
                    totalAmountAfterDeduction: { $round: ["$totalAmountAfterDeduction", 2] },
                    commissionRate: { $round: ["$commissionRate", 2] },
                    avgCommissionPercentage: { $round: ["$avgCommissionPercentage", 2] }
                }
            },
            {
                $sort: { totalAmountAfterDeduction: -1 } // Sort by highest payable amount
            },
            {
                $facet: {
                    metadata: [
                        { $count: "totalKitchens" },
                        { $addFields: { page: page, limit: limit } }
                    ],
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ]
                }
            }
        ]);

        // Process and format the result
        if (result.length === 0) {
            return {
                summary: [],
                pagination: {
                    page: page,
                    limit: limit,
                    totalKitchens: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            };
        }

        const metadata = result[0].metadata[0] || { totalKitchens: 0 };
        const summaryData = result[0].data || [];

        // Additional validation and cleanup
        const cleanedData = summaryData.map(item => {
            // Fix any remaining data inconsistencies
            const cleanedItem = { ...item };
            
            // Ensure commission rate is between 0-100
            if (cleanedItem.commissionRate > 100) {
                cleanedItem.commissionRate = 100;
            } else if (cleanedItem.commissionRate < 0) {
                cleanedItem.commissionRate = 0;
            }
            
            // Ensure amounts are not negative
            if (cleanedItem.totalOrderAmount < 0) cleanedItem.totalOrderAmount = 0;
            if (cleanedItem.totalCommissionAmount < 0) cleanedItem.totalCommissionAmount = 0;
            if (cleanedItem.totalAmountAfterDeduction < 0) cleanedItem.totalAmountAfterDeduction = 0;
            
            // Remove _id field from response
            delete cleanedItem._id;
            
            return cleanedItem;
        });

        return {
            summary: cleanedData,
            pagination: {
                page: page,
                limit: limit,
                totalKitchens: metadata.totalKitchens || 0,
                totalPages: Math.ceil((metadata.totalKitchens || 0) / limit),
                hasNextPage: (page * limit) < (metadata.totalKitchens || 0),
                hasPrevPage: page > 1
            },
            summaryTotals: {
                totalKitchens: metadata.totalKitchens || 0,
                totalOrders: cleanedData.reduce((sum, item) => sum + item.totalOrderCount, 0),
                totalAmount: cleanedData.reduce((sum, item) => sum + item.totalOrderAmount, 0),
                totalCommission: cleanedData.reduce((sum, item) => sum + item.totalCommissionAmount, 0),
                totalPayable: cleanedData.reduce((sum, item) => sum + item.totalAmountAfterDeduction, 0)
            }
        };
    } catch (error) {
        console.error('Error in getKitchenWiseSummary DAO:', error);
        throw error;
    }
};

// Optional: Get detailed breakdown for a specific kitchen
const getKitchenDetailedSummary = async (kitchenId, fromDate, toDate) => {
    try {
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        if (!ObjectId.isValid(kitchenId)) {
            throw new Error('Invalid kitchenId');
        }

        const kitchenObjectId = new ObjectId(kitchenId);

        const result = await KitchenLedger.aggregate([
            {
                $match: {
                    kitchenId: kitchenObjectId,
                    createdOn: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: {
                        kitchenId: "$kitchenId",
                        kitchenName: "$kitchenName"
                    },
                    // Overall totals
                    totalOrderCount: { $sum: 1 },
                    totalOrderAmount: { $sum: "$totalItemAmount" },
                    totalCommissionAmount: { $sum: "$kitchenCommissionAmount" },
                    totalLedgerAmount: { $sum: "$kitchenLedgerAmt" },
                    
                    // Order type breakdown
                    orderTypeBreakdown: {
                        $push: {
                            orderType: "$orderType",
                            amount: "$kitchenLedgerAmt",
                            commission: "$kitchenCommissionAmount"
                        }
                    },
                    
                    // Status breakdown
                    statusBreakdown: {
                        $push: {
                            status: "$status",
                            count: 1,
                            amount: "$kitchenLedgerAmt"
                        }
                    }
                }
            },
            {
                $project: {
                    kitchenId: "$_id.kitchenId",
                    kitchenName: "$_id.kitchenName",
                    summary: {
                        totalOrderCount: 1,
                        totalOrderAmount: 1,
                        totalCommissionAmount: 1,
                        totalLedgerAmount: 1,
                        netPayableAmount: "$totalLedgerAmount"
                    },
                    // Aggregate order types
                    orderTypeSummary: {
                        $reduce: {
                            input: "$orderTypeBreakdown",
                            initialValue: [],
                            in: {
                                $let: {
                                    vars: {
                                        existingType: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$$value",
                                                        as: "item",
                                                        cond: { $eq: ["$$item.orderType", "$$this.orderType"] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    },
                                    in: {
                                        $cond: [
                                            { $eq: ["$$existingType", null] },
                                            {
                                                $concatArrays: [
                                                    "$$value",
                                                    [{
                                                        orderType: "$$this.orderType",
                                                        orderCount: 1,
                                                        totalAmount: "$$this.amount",
                                                        totalCommission: "$$this.commission"
                                                    }]
                                                ]
                                            },
                                            {
                                                $map: {
                                                    input: "$$value",
                                                    as: "item",
                                                    in: {
                                                        $cond: [
                                                            { $eq: ["$$item.orderType", "$$this.orderType"] },
                                                            {
                                                                orderType: "$$item.orderType",
                                                                orderCount: { $add: ["$$item.orderCount", 1] },
                                                                totalAmount: { $add: ["$$item.totalAmount", "$$this.amount"] },
                                                                totalCommission: { $add: ["$$item.totalCommission", "$$this.commission"] }
                                                            },
                                                            "$$item"
                                                        ]
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    // Aggregate status counts
                    statusSummary: {
                        $reduce: {
                            input: "$statusBreakdown",
                            initialValue: [],
                            in: {
                                $let: {
                                    vars: {
                                        existingStatus: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$$value",
                                                        as: "item",
                                                        cond: { $eq: ["$$item.status", "$$this.status"] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    },
                                    in: {
                                        $cond: [
                                            { $eq: ["$$existingStatus", null] },
                                            {
                                                $concatArrays: [
                                                    "$$value",
                                                    [{
                                                        status: "$$this.status",
                                                        count: 1,
                                                        totalAmount: "$$this.amount"
                                                    }]
                                                ]
                                            },
                                            {
                                                $map: {
                                                    input: "$$value",
                                                    as: "item",
                                                    in: {
                                                        $cond: [
                                                            { $eq: ["$$item.status", "$$this.status"] },
                                                            {
                                                                status: "$$item.status",
                                                                count: { $add: ["$$item.count", 1] },
                                                                totalAmount: { $add: ["$$item.totalAmount", "$$this.amount"] }
                                                            },
                                                            "$$item"
                                                        ]
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]);

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error in getKitchenDetailedSummary DAO:', error);
        throw error;
    }
};

const getTodayLedgersData = async (startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        
        // Build match conditions
        const todayMatch = {
            createdOn: {
                $gte: startDate,
                $lte: endDate
            }
        };
        
        if (kitchenId && ObjectId.isValid(kitchenId)) {
            todayMatch.kitchenId = new ObjectId(kitchenId);
        }
        
        // Get today's new ledgers
        const newLedgers = await KitchenLedger.find({
            ...todayMatch,
            status: 'New'
        })
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
        // Get all today's transactions
        const allTransactions = await KitchenLedger.find(todayMatch)
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        return {
            newLedgers,
            allTransactions
        };
    } catch (error) {
        console.error('Error in getTodayLedgersData DAO:', error);
        throw error;
    }
};

const getOverallLedgersData = async (kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        
        // Build match condition
        const matchCondition = {};
        if (kitchenId && ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new ObjectId(kitchenId);
        }
        
        // Get in-progress ledgers
        const inProgressLedgers = await KitchenLedger.find({
            ...matchCondition,
            status: 'InProgress'
        })
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
        // Get closed ledgers
        const closedLedgers = await KitchenLedger.find({
            ...matchCondition,
            status: 'Closed'
        })
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
        // Get duplicate ledgers EXCLUDING Closed status
        const duplicateLedgers = await KitchenLedger.aggregate([
            { 
                $match: {
                    ...matchCondition,
                    status: { $ne: 'Closed' } // Exclude closed status
                }
            },
            {
                $group: {
                    _id: "$orderNo",
                    count: { $sum: 1 },
                    entries: { $push: "$$ROOT" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            },
            {
                $unwind: "$entries"
            },
            {
                $replaceRoot: { newRoot: "$entries" }
            },
            { $sort: { createdOn: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);
        
        return {
            inProgressLedgers,
            closedLedgers,
            duplicateLedgers
        };
    } catch (error) {
        console.error('Error in getOverallLedgersData DAO:', error);
        throw error;
    }
};

const getLedgersDataByDateRange = async (startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        const matchCondition = {
            createdOn: {
                $gte: startDate,
                $lte: endDate
            }
        };
        
        if (kitchenId && ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new ObjectId(kitchenId);
        }
        
        // Get all statuses data
        const [newLedgers, inProgressLedgers, closedLedgers, allTransactions, duplicateLedgers] = await Promise.all([
            // New ledgers
            KitchenLedger.find({ ...matchCondition, status: 'New' })
                .sort({ createdOn: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // InProgress ledgers
            KitchenLedger.find({ ...matchCondition, status: 'InProgress' })
                .sort({ createdOn: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Closed ledgers
            KitchenLedger.find({ ...matchCondition, status: 'Closed' })
                .sort({ createdOn: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // All transactions
            KitchenLedger.find(matchCondition)
                .sort({ createdOn: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Duplicate ledgers aggregation EXCLUDING Closed status
            KitchenLedger.aggregate([
                { 
                    $match: {
                        ...matchCondition,
                        status: { $ne: 'Closed' } // Exclude closed status
                    }
                },
                {
                    $group: {
                        _id: "$orderNo",
                        count: { $sum: 1 },
                        entries: { $push: "$$ROOT" }
                    }
                },
                {
                    $match: {
                        count: { $gt: 1 }
                    }
                },
                {
                    $unwind: "$entries"
                },
                {
                    $replaceRoot: { newRoot: "$entries" }
                },
                { $sort: { createdOn: -1 } },
                { $skip: skip },
                { $limit: limit }
            ])
        ]);
        
        return {
            NewLedgerCreation: newLedgers,
            InProgress: inProgressLedgers,
            Closed: closedLedgers,
            TotalTransactions: allTransactions,
            Duplicate: duplicateLedgers
        };
    } catch (error) {
        console.error('Error in getLedgersDataByDateRange DAO:', error);
        throw error;
    }
};

// Individual status data functions
const getTodayLedgersDataByStatus = async (status, startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        const matchCondition = {
            createdOn: {
                $gte: startDate,
                $lte: endDate
            }
        };
        
        if (kitchenId && ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new ObjectId(kitchenId);
        }
        
        let query;
        if (status === 'NewLedgerCreation') {
            query = { ...matchCondition, status: 'New' };
        } else if (status === 'TotalTransactions') {
            query = matchCondition;
        } else {
            throw new Error('Invalid status for today data');
        }
        
        return await KitchenLedger.find(query)
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    } catch (error) {
        console.error('Error in getTodayLedgersDataByStatus DAO:', error);
        throw error;
    }
};

const getOverallLedgersDataByStatus = async (status, kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        const matchCondition = {};
        
        if (kitchenId && ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new ObjectId(kitchenId);
        }
        
        let query;
        if (status === 'InProgress') {
            query = { ...matchCondition, status: 'InProgress' };
        } else if (status === 'Closed') {
            query = { ...matchCondition, status: 'Closed' };
        } else if (status === 'Duplicate') {
            // For duplicates, we need aggregation
             return await KitchenLedger.aggregate([
                { 
                    $match: {
                        ...matchCondition,
                        status: { $ne: 'Closed' } // Exclude closed status
                    }
                },
                {
                    $group: {
                        _id: "$orderNo",
                        count: { $sum: 1 },
                        entries: { $push: "$$ROOT" }
                    }
                },
                {
                    $match: {
                        count: { $gt: 1 }
                    }
                },
                {
                    $unwind: "$entries"
                },
                {
                    $replaceRoot: { newRoot: "$entries" }
                },
                { $sort: { createdOn: -1 } },
                { $skip: skip },
                { $limit: limit }
            ]);
        } else {
            throw new Error('Invalid status for overall data');
        }
        
        return await KitchenLedger.find(query)
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    } catch (error) {
        console.error('Error in getOverallLedgersDataByStatus DAO:', error);
        throw error;
    }
};

const getLedgersDataByStatusAndDate = async (status, startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        const matchCondition = {
            createdOn: {
                $gte: startDate,
                $lte: endDate
            }
        };
        
        if (kitchenId && ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new ObjectId(kitchenId);
        }
        
        let query;
        if (status === 'NewLedgerCreation') {
            query = { ...matchCondition, status: 'New' };
        } else if (status === 'TotalTransactions') {
            query = matchCondition;
        } else if (status === 'InProgress') {
            query = { ...matchCondition, status: 'InProgress' };
        } else if (status === 'Closed') {
            query = { ...matchCondition, status: 'Closed' };
        } else if (status === 'Duplicate') {
            // For duplicates, we need aggregation
             return await KitchenLedger.aggregate([
                { 
                    $match: {
                        ...matchCondition,
                        status: { $ne: 'Closed' } // Exclude closed status
                    }
                },
                {
                    $group: {
                        _id: "$orderNo",
                        count: { $sum: 1 },
                        entries: { $push: "$$ROOT" }
                    }
                },
                {
                    $match: {
                        count: { $gt: 1 }
                    }
                },
                {
                    $unwind: "$entries"
                },
                {
                    $replaceRoot: { newRoot: "$entries" }
                },
                { $sort: { createdOn: -1 } },
                { $skip: skip },
                { $limit: limit }
            ]);
        } else {
            throw new Error('Invalid status');
        }
        
        return await KitchenLedger.find(query)
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    } catch (error) {
        console.error('Error in getLedgersDataByStatusAndDate DAO:', error);
        throw error;
    }
};

const findOrdersWithoutLedgersOptimized = async (fromDate = null, toDate = null) => {
   try {
        console.log('Searching for orders without ledgers...');
        
        // Build date filter condition
        const dateMatch = {};
        if (fromDate && toDate) {
            const startDate = new Date(fromDate);
            const endDate = new Date(toDate);
            endDate.setHours(23, 59, 59, 999);
            
            dateMatch.orderDate = {
                $gte: startDate,
                $lte: endDate
            };
            console.log(`Date range: ${startDate} to ${endDate}`);
        } else {
            console.log('No date range specified - searching all records');
        }

        // Get order numbers from both collections that match criteria
        const [foodOrderResults, bulkFoodOrderResults, allLedgerOrderNos] = await Promise.all([
            // FoodOrder aggregation - BROADER SEARCH
            FoodOrder.aggregate([
                {
                    $match: {
                        $and: [
                            { orderstatus: 'delivered' },
                            {
                                $or: [
                                    { amtPaidToKitchen: false },
                                    { amtPaidToKitchen: { $exists: false } },
                                    { amtPaidToKitchen: null }
                                ]
                            },
                            dateMatch.orderDate ? dateMatch : {}
                        ].filter(cond => Object.keys(cond).length > 0)
                    }
                },
                {
                    $project: {
                        orderNo: 1,
                        kitchenId: 1,
                        kitchenName: 1,
                        customerName: 1,
                        customerPhoneNo: 1,
                        itemAmount: 1,
                        amount: 1,
                        amtAfterCommisionPaidToKitchen: 1,
                        amtPaidToKitchen: 1,
                        orderDate: 1,
                        orderType: 1,
                        orderstatus: 1,
                        source: { $literal: 'FoodOrder' },
                        collectionName: { $literal: 'FoodOrder' }
                    }
                }
            ]),
            
            // BulkFoodOrder aggregation - BROADER SEARCH
            BulkFoodOrder.aggregate([
                {
                    $match: {
                        $and: [
                            { orderstatus: 'delivered' },
                            {
                                $or: [
                                    { amtPaidToKitchen: false },
                                    { amtPaidToKitchen: { $exists: false } },
                                    { amtPaidToKitchen: null }
                                ]
                            },
                            dateMatch.orderDate ? dateMatch : {}
                        ].filter(cond => Object.keys(cond).length > 0)
                    }
                },
                {
                    $project: {
                        orderNo: 1,
                        kitchenId: 1,
                        kitchenName: 1,
                        customerName: 1,
                        customerPhoneNo: 1,
                        itemAmount: 1,
                        amount: 1,
                        amtAfterCommisionPaidToKitchen: 1,
                        amtPaidToKitchen: 1,
                        orderDate: 1,
                        orderType: 1,
                        orderstatus: 1,
                        source: { $literal: 'BulkFoodOrder' },
                        collectionName: { $literal: 'bulkFoodOrder' }
                    }
                }
            ]),
            
            // Get all ledger order numbers
            KitchenLedger.distinct('orderNo')
        ]);

        console.log(`Found ${foodOrderResults.length} food orders matching criteria`);
        console.log(`Found ${bulkFoodOrderResults.length} bulk food orders matching criteria`);
        console.log(`Found ${allLedgerOrderNos.length} existing ledger order numbers`);

        // Combine results
        const allOrders = [...foodOrderResults, ...bulkFoodOrderResults];
        
        if (allOrders.length === 0) {
            console.log('No orders found matching initial criteria');
            return [];
        }

        // Filter out orders that have ledgers
        const ordersWithoutLedgers = allOrders.filter(
            order => !allLedgerOrderNos.includes(order.orderNo)
        );

        console.log(`Found ${ordersWithoutLedgers.length} orders without ledgers`);

        // Log sample data for debugging
        if (ordersWithoutLedgers.length > 0) {
            console.log('Sample order without ledger:', {
                orderNo: ordersWithoutLedgers[0].orderNo,
                kitchenName: ordersWithoutLedgers[0].kitchenName,
                amount: ordersWithoutLedgers[0].amount,
                amtPaidToKitchen: ordersWithoutLedgers[0].amtPaidToKitchen,
                orderDate: ordersWithoutLedgers[0].orderDate
            });
        }

        // Sort by order date (descending)
        ordersWithoutLedgers.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        return ordersWithoutLedgers;

    } catch (error) {
        console.error('Error in findOrdersWithoutLedgersEnhanced DAO:', error);
        throw error;
    }
};




module.exports = {
    saveKitchenLedger,
    updateKitchenLedger,
    getKitchenLedgerBalance,
    getKitchenLedgerList,
    getstatusWiseLedgerList,
    getKitchenLedgerByTypeAndDate,
    getLedgerList,
    getLedgerStatusCounts,
    getKitchenWiseSummary,           // Add this line
    getKitchenDetailedSummary,
    getOverallLedgerStatusCounts,
    getTodayLedgersData,
    getOverallLedgersData,
    getLedgersDataByDateRange,
    getTodayLedgersDataByStatus,
    getOverallLedgersDataByStatus,
    getLedgersDataByStatusAndDate,
    findOrdersWithoutLedgersOptimized
        
};