const KitchenTransactionHistory = require('../model/kitchenTransactionHistory.model');

const getKitchenTransactionHistory = async (kitchenId, page, limit) => {
    const history = await KitchenTransactionHistory.find({ kitchenId }).sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
    return history;
};

const saveKitchenTransactionHistory = async (transactionObj) => {
    const historyObj = new KitchenTransactionHistory();
    historyObj.payout_id = transactionObj.payout_id;
    historyObj.fund_id = transactionObj.fund_id;
    historyObj.ledgerId = transactionObj.ledgerId;    
    historyObj.status = transactionObj.status;
    historyObj.mode = transactionObj.mode;
    historyObj.transaction_amount = transactionObj.transaction_amount;
    historyObj.created_at = transactionObj.created_at;
    historyObj.kitchenId = transactionObj.kitchenId;
    historyObj.kitchenName = transactionObj.kitchenName;
    historyObj.walletPreviousBalance = transactionObj.walletPreviousBalance;
    historyObj.remark = transactionObj.remark;
    historyObj.transactionType = transactionObj.transactionType;
    historyObj.category = transactionObj.category;
    const savedObj = await historyObj.save();
    return savedObj;
};
const updatedKitchenTransactionHistory = async (id, transactionObj) => {
    const updated = await KitchenTransactionHistory.findOneAndUpdate({ _id: id }, { $set:  transactionObj },
        { new: true });
    return updated;
};

const getKitchenTotalIncome = async (kitchenId) => {
    const result = await KitchenTransactionHistory.find({ kitchenId, 'transactionType': 'Debit', 'mode': 'NEFT' })
    return result;
};

const getKitchenBankPendingTransactionList = async () => {
    const result = await KitchenTransactionHistory.find({ status: { $in: ['Pending'] } })
    return result;
};
const getTransactionById= async (id) => {
    const result = await KitchenTransactionHistory.findOne({ _id: id })
    return result;
};


// const getTransactionStatusCounts = async (fromDate, toDate, kitchenId = null) => {
//     try {
//         const startDate = new Date(fromDate);
//         const endDate = new Date(toDate);
//         endDate.setHours(23, 59, 59, 999);

//         // Validate dates
//         if (isNaN(startDate) || isNaN(endDate)) {
//             throw new Error('Invalid date format');
//         }

//         if (startDate > endDate) {
//             throw new Error('fromDate cannot be after toDate');
//         }

//         // Build match condition
//         const matchCondition = {
//             created_at: {
//                 $gte: startDate,
//                 $lte: endDate
//             },
//             transactionType: 'Credit'  // Only Credit transactions
//         };

//         // Add kitchen filter if provided
//         if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
//             matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
//         }

//         // Aggregation pipeline for transaction status counts
//         const result = await KitchenTransactionHistory.aggregate([
//             {
//                 $match: matchCondition
//             },
//             {
//                 $facet: {
//                     // Count by ALL statuses
//                     statusCounts: [
//                         {
//                             $group: {
//                                 _id: '$status',
//                                 count: { $sum: 1 }
//                             }
//                         }
//                     ],
//                     // Get total count
//                     total: [
//                         { $count: 'totalCount' }
//                     ],
//                     // Get total amount by status
//                     amountByStatus: [
//                         {
//                             $group: {
//                                 _id: '$status',
//                                 totalAmount: { $sum: '$transaction_amount' }
//                             }
//                         }
//                     ]
//                 }
//             },
//             {
//                 $project: {
//                     // Status counts - mapping each status
//                     Pending: {
//                         $ifNull: [{
//                             $let: {
//                                 vars: {
//                                     count: {
//                                         $arrayElemAt: [
//                                             {
//                                                 $filter: {
//                                                     input: '$statusCounts',
//                                                     as: 'status',
//                                                     cond: { $eq: ['$$status._id', 'Pending'] }
//                                                 }
//                                             },
//                                             0
//                                         ]
//                                     }
//                                 },
//                                 in: '$$count.count'
//                             }
//                         }, 0]
//                     },
//                     Failed: {
//                         $ifNull: [{
//                             $let: {
//                                 vars: {
//                                     count: {
//                                         $arrayElemAt: [
//                                             {
//                                                 $filter: {
//                                                     input: '$statusCounts',
//                                                     as: 'status',
//                                                     cond: { $eq: ['$$status._id', 'Failed'] }
//                                                 }
//                                             },
//                                             0
//                                         ]
//                                     }
//                                 },
//                                 in: '$$count.count'
//                             }
//                         }, 0]
//                     },
//                     Success: {
//                         $ifNull: [{
//                             $let: {
//                                 vars: {
//                                     count: {
//                                         $arrayElemAt: [
//                                             {
//                                                 $filter: {
//                                                     input: '$statusCounts',
//                                                     as: 'status',
//                                                     cond: { $eq: ['$$status._id', 'Success'] }
//                                                 }
//                                             },
//                                             0
//                                         ]
//                                     }
//                                 },
//                                 in: '$$count.count'
//                             }
//                         }, 0]
//                     },
//                     InProgress: {
//                         $ifNull: [{
//                             $let: {
//                                 vars: {
//                                     count: {
//                                         $arrayElemAt: [
//                                             {
//                                                 $filter: {
//                                                     input: '$statusCounts',
//                                                     as: 'status',
//                                                     cond: { $eq: ['$$status._id', 'inprogress'] }
//                                                 }
//                                             },
//                                             0
//                                         ]
//                                     }
//                                 },
//                                 in: '$$count.count'
//                             }
//                         }, 0]
//                     },
//                     // ADDED: completed status (for offline orders)
//                     Completed: {
//                         $ifNull: [{
//                             $let: {
//                                 vars: {
//                                     count: {
//                                         $arrayElemAt: [
//                                             {
//                                                 $filter: {
//                                                     input: '$statusCounts',
//                                                     as: 'status',
//                                                     cond: { $eq: ['$$status._id', 'completed'] }
//                                                 }
//                                             },
//                                             0
//                                         ]
//                                     }
//                                 },
//                                 in: '$$count.count'
//                             }
//                         }, 0]
//                     },
//                     // Also include other statuses for completeness
//                     Initiated: {
//                         $ifNull: [{
//                             $let: {
//                                 vars: {
//                                     count: {
//                                         $arrayElemAt: [
//                                             {
//                                                 $filter: {
//                                                     input: '$statusCounts',
//                                                     as: 'status',
//                                                     cond: { $eq: ['$$status._id', 'Initiated'] }
//                                                 }
//                                             },
//                                             0
//                                         ]
//                                     }
//                                 },
//                                 in: '$$count.count'
//                             }
//                         }, 0]
//                     },
//                     Refund: {
//                         $ifNull: [{
//                             $let: {
//                                 vars: {
//                                     count: {
//                                         $arrayElemAt: [
//                                             {
//                                                 $filter: {
//                                                     input: '$statusCounts',
//                                                     as: 'status',
//                                                     cond: { $eq: ['$$status._id', 'Refund'] }
//                                                 }
//                                             },
//                                             0
//                                         ]
//                                     }
//                                 },
//                                 in: '$$count.count'
//                             }
//                         }, 0]
//                     },
//                     Review_With_Bank: {
//                         $ifNull: [{
//                             $let: {
//                                 vars: {
//                                     count: {
//                                         $arrayElemAt: [
//                                             {
//                                                 $filter: {
//                                                     input: '$statusCounts',
//                                                     as: 'status',
//                                                     cond: { $eq: ['$$status._id', 'Review_With_Bank'] }
//                                                 }
//                                             },
//                                             0
//                                         ]
//                                     }
//                                 },
//                                 in: '$$count.count'
//                             }
//                         }, 0]
//                     },
//                     // Total transactions count
//                     TotalTransactions: {
//                         $ifNull: [{ $arrayElemAt: ['$total.totalCount', 0] }, 0]
//                     },
//                     // Amount calculations
//                     TotalCreditAmount: {
//                         $ifNull: [{
//                             $reduce: {
//                                 input: '$amountByStatus',
//                                 initialValue: 0,
//                                 in: { $add: ['$$value', '$$this.totalAmount'] }
//                             }
//                         }, 0]
//                     },
//                     // Completed amount (offline orders amount)
//                     CompletedAmount: {
//                         $ifNull: [{
//                             $let: {
//                                 vars: {
//                                     amount: {
//                                         $arrayElemAt: [
//                                             {
//                                                 $filter: {
//                                                     input: '$amountByStatus',
//                                                     as: 'item',
//                                                     cond: { $eq: ['$$item._id', 'completed'] }
//                                                 }
//                                             },
//                                             0
//                                         ]
//                                     }
//                                 },
//                                 in: '$$amount.totalAmount'
//                             }
//                         }, 0]
//                     },
//                     // Success amount (online orders amount)
//                     SuccessAmount: {
//                         $ifNull: [{
//                             $let: {
//                                 vars: {
//                                     amount: {
//                                         $arrayElemAt: [
//                                             {
//                                                 $filter: {
//                                                     input: '$amountByStatus',
//                                                     as: 'item',
//                                                     cond: { $eq: ['$$item._id', 'Success'] }
//                                                 }
//                                             },
//                                             0
//                                         ]
//                                     }
//                                 },
//                                 in: '$$amount.totalAmount'
//                             }
//                         }, 0]
//                     }
//                 }
//             }
//         ]);

//         // Return the result or default counts
//         const counts = result.length > 0 ? result[0] : {
//             Pending: 0,
//             Failed: 0,
//             Success: 0,
//             InProgress: 0,
//             Completed: 0,  // Offline orders count
//             Initiated: 0,
//             Refund: 0,
//             Review_With_Bank: 0,
//             TotalTransactions: 0,
//             TotalCreditAmount: 0,
//             CompletedAmount: 0,
//             SuccessAmount: 0
//         };

//         // Round all amounts to 2 decimal places
//         const amountFields = ['TotalCreditAmount', 'CompletedAmount', 'SuccessAmount'];
//         amountFields.forEach(field => {
//             if (counts[field] !== undefined) {
//                 counts[field] = parseFloat(counts[field].toFixed(2));
//             }
//         });

//         return counts;
//     } catch (error) {
//         console.error('Error in getTransactionStatusCounts DAO:', error);
//         throw error;
//     }
// };


// New function: Get today's TotalTransactions count only
const getTransactionStatusCountsForDateRange = async (fromDate, toDate, kitchenId = null) => {
    try {
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        // Build match condition for date range
        const matchCondition = {
            created_at: {
                $gte: startDate,
                $lte: endDate
            },
            transactionType: 'Credit'
        };

        // Add kitchen filter if provided
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }

        // Just get the count for the date range
        const totalCount = await KitchenTransactionHistory.countDocuments(matchCondition);
        
        return {
            TotalTransactions: totalCount
        };
    } catch (error) {
        console.error('Error in getTransactionStatusCountsForDateRange DAO:', error);
        throw error;
    }
};

// New function: Get overall counts for all statuses and amounts
const getOverallTransactionStatusCounts = async (kitchenId = null) => {
    try {
        // Build match condition for overall data
        const matchCondition = {
            transactionType: 'Credit'  // Only Credit transactions
        };

        // Add kitchen filter if provided
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }

        // Aggregation pipeline for overall counts
        const result = await KitchenTransactionHistory.aggregate([
            {
                $match: matchCondition
            },
            {
                $facet: {
                    // Count by ALL statuses
                    statusCounts: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    // Get total amount by status
                    amountByStatus: [
                        {
                            $group: {
                                _id: '$status',
                                totalAmount: { $sum: '$transaction_amount' }
                            }
                        }
                    ],
                    // Get total overall amount
                    totalAmount: [
                        {
                            $group: {
                                _id: null,
                                totalCreditAmount: { $sum: '$transaction_amount' }
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    // Status counts
                    Pending: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Pending'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Failed: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Failed'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Success: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Success'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    InProgress: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'inprogress'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Completed: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'completed'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Initiated: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Initiated'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Refund: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Refund'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Review_With_Bank: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Review_With_Bank'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    // Amount calculations
                    TotalCreditAmount: {
                        $ifNull: [{ $arrayElemAt: ['$totalAmount.totalCreditAmount', 0] }, 0]
                    },
                    // Completed amount (offline orders amount)
                    CompletedAmount: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    amount: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$amountByStatus',
                                                    as: 'item',
                                                    cond: { $eq: ['$$item._id', 'completed'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$amount.totalAmount'
                            }
                        }, 0]
                    },
                    // Success amount (online orders amount)
                    SuccessAmount: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    amount: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$amountByStatus',
                                                    as: 'item',
                                                    cond: { $eq: ['$$item._id', 'Success'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$amount.totalAmount'
                            }
                        }, 0]
                    }
                }
            }
        ]);

        // Return the result or default counts
        const counts = result.length > 0 ? result[0] : {
            Pending: 0,
            Failed: 0,
            Success: 0,
            InProgress: 0,
            Completed: 0,
            Initiated: 0,
            Refund: 0,
            Review_With_Bank: 0,
            TotalCreditAmount: 0,
            CompletedAmount: 0,
            SuccessAmount: 0
        };

        // Round all amounts to 2 decimal places
        const amountFields = ['TotalCreditAmount', 'CompletedAmount', 'SuccessAmount'];
        amountFields.forEach(field => {
            if (counts[field] !== undefined) {
                counts[field] = parseFloat(counts[field].toFixed(2));
            }
        });

        return counts;
    } catch (error) {
        console.error('Error in getOverallTransactionStatusCounts DAO:', error);
        throw error;
    }
};

// Rename original function for clarity
const getTransactionStatusCounts = async (fromDate, toDate, kitchenId = null) => {
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

        // Build match condition
        const matchCondition = {
            created_at: {
                $gte: startDate,
                $lte: endDate
            },
            transactionType: 'Credit'
        };

        // Add kitchen filter if provided
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }

        // Original aggregation pipeline (same as before)
        const result = await KitchenTransactionHistory.aggregate([
            {
                $match: matchCondition
            },
            {
                $facet: {
                    statusCounts: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    total: [
                        { $count: 'totalCount' }
                    ],
                    amountByStatus: [
                        {
                            $group: {
                                _id: '$status',
                                totalAmount: { $sum: '$transaction_amount' }
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    Pending: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Pending'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Failed: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Failed'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Success: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Success'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    InProgress: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'inprogress'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Completed: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'completed'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Initiated: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Initiated'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Refund: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Refund'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Review_With_Bank: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Review_With_Bank'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    TotalTransactions: {
                        $ifNull: [{ $arrayElemAt: ['$total.totalCount', 0] }, 0]
                    },
                    TotalCreditAmount: {
                        $ifNull: [{
                            $reduce: {
                                input: '$amountByStatus',
                                initialValue: 0,
                                in: { $add: ['$$value', '$$this.totalAmount'] }
                            }
                        }, 0]
                    },
                    CompletedAmount: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    amount: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$amountByStatus',
                                                    as: 'item',
                                                    cond: { $eq: ['$$item._id', 'completed'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$amount.totalAmount'
                            }
                        }, 0]
                    },
                    SuccessAmount: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    amount: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$amountByStatus',
                                                    as: 'item',
                                                    cond: { $eq: ['$$item._id', 'Success'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$amount.totalAmount'
                            }
                        }, 0]
                    }
                }
            }
        ]);

        // Return the result or default counts
        const counts = result.length > 0 ? result[0] : {
            Pending: 0,
            Failed: 0,
            Success: 0,
            InProgress: 0,
            Completed: 0,
            Initiated: 0,
            Refund: 0,
            Review_With_Bank: 0,
            TotalTransactions: 0,
            TotalCreditAmount: 0,
            CompletedAmount: 0,
            SuccessAmount: 0
        };

        // Round all amounts to 2 decimal places
        const amountFields = ['TotalCreditAmount', 'CompletedAmount', 'SuccessAmount'];
        amountFields.forEach(field => {
            if (counts[field] !== undefined) {
                counts[field] = parseFloat(counts[field].toFixed(2));
            }
        });

        return counts;
    } catch (error) {
        console.error('Error in getTransactionStatusCounts DAO:', error);
        throw error;
    }
};



const getTodayTransactionsData = async (startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        
        // Build match condition for today's transactions
        const todayMatch = {
            created_at: {
                $gte: startDate,
                $lte: endDate
            },
            transactionType: 'Credit'
        };
        
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            todayMatch.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }
        
        // Get today's all transactions
        const transactions = await KitchenTransactionHistory.find(todayMatch)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        // Get today's Success transactions
        const successTransactions = await KitchenTransactionHistory.find({
            ...todayMatch,
            status: 'Success'
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
        // Get today's Completed transactions
        const completedTransactions = await KitchenTransactionHistory.find({
            ...todayMatch,
            status: 'completed'
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
        
        return {
            transactions,
            successTransactions,
            completedTransactions
        };
    } catch (error) {
        console.error('Error in getTodayTransactionsData DAO:', error);
        throw error;
    }
};


const getOverallTransactionsData = async (kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        
        // Build match condition for overall data
        const matchCondition = {
            transactionType: 'Credit'
        };
        
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }
        
        // Get transactions by status
        const [pendingTransactions, failedTransactions, successTransactions, 
               inProgressTransactions, completedTransactions, initiatedTransactions,
               refundTransactions, reviewWithBankTransactions] = await Promise.all([
            // Pending transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Pending' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Failed transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Failed' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Success transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Success' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // InProgress transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'inprogress' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Completed transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'completed' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Initiated transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Initiated' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Refund transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Refund' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Review_With_Bank transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Review_With_Bank' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);
        
        return {
            pendingTransactions,
            failedTransactions,
            successTransactions,
            inProgressTransactions,
            completedTransactions,
            initiatedTransactions,
            refundTransactions,
            reviewWithBankTransactions
        };
    } catch (error) {
        console.error('Error in getOverallTransactionsData DAO:', error);
        throw error;
    }
};

const getTransactionsDataByDateRange = async (startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        
        // Build match condition for date range
        const matchCondition = {
            created_at: {
                $gte: startDate,
                $lte: endDate
            },
            transactionType: 'Credit'
        };
        
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }
        
        // Get all statuses data
        const [allTransactions, pendingTransactions, failedTransactions, successTransactions,
               inProgressTransactions, completedTransactions, initiatedTransactions,
               refundTransactions, reviewWithBankTransactions] = await Promise.all([
            // All transactions
            KitchenTransactionHistory.find(matchCondition)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Pending transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Pending' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Failed transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Failed' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Success transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Success' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // InProgress transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'inprogress' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Completed transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'completed' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Initiated transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Initiated' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Refund transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Refund' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Review_With_Bank transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Review_With_Bank' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);
        
        return {
            TotalTransactions: allTransactions,
            Pending: pendingTransactions,
            Failed: failedTransactions,
            Success: successTransactions,
            InProgress: inProgressTransactions,
            Completed: completedTransactions,
            Initiated: initiatedTransactions,
            Refund: refundTransactions,
            Review_With_Bank: reviewWithBankTransactions
        };
    } catch (error) {
        console.error('Error in getTransactionsDataByDateRange DAO:', error);
        throw error;
    }
};

// Individual status data functions
const getTodayTransactionsDataByStatus = async (status, startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        const matchCondition = {
            created_at: {
                $gte: startDate,
                $lte: endDate
            },
            transactionType: 'Credit'
        };
        
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }
        
        let query;
        if (status === 'TotalTransactions') {
            query = matchCondition;
        } else {
            throw new Error('Invalid status for today data');
        }
        
        return await KitchenTransactionHistory.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    } catch (error) {
        console.error('Error in getTodayTransactionsDataByStatus DAO:', error);
        throw error;
    }
};

const getOverallTransactionsDataByStatus = async (status, kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        const matchCondition = {
            transactionType: 'Credit'
        };
        
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }
        
        // Map status names to actual status values in database
        const statusMap = {
            'Pending': 'Pending',
            'Failed': 'Failed',
            'Success': 'Success',
            'InProgress': 'inprogress',
            'Completed': 'completed',
            'Initiated': 'Initiated',
            'Refund': 'Refund',
            'Review_With_Bank': 'Review_With_Bank'
        };
        
        const actualStatus = statusMap[status];
        if (!actualStatus) {
            throw new Error('Invalid status for overall data');
        }
        
        return await KitchenTransactionHistory.find({ 
            ...matchCondition, 
            status: actualStatus 
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (error) {
        console.error('Error in getOverallTransactionsDataByStatus DAO:', error);
        throw error;
    }
};

const getTransactionsDataByStatusAndDate = async (status, startDate, endDate, kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        const matchCondition = {
            created_at: {
                $gte: startDate,
                $lte: endDate
            },
            transactionType: 'Credit'
        };
        
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }
        
        // Map status names
        const statusMap = {
            'TotalTransactions': null,
            'Pending': 'Pending',
            'Failed': 'Failed',
            'Success': 'Success',
            'InProgress': 'inprogress',
            'Completed': 'completed',
            'Initiated': 'Initiated',
            'Refund': 'Refund',
            'Review_With_Bank': 'Review_With_Bank'
        };
        
        const actualStatus = statusMap[status];
        
        if (actualStatus === null) {
            // For TotalTransactions, don't filter by status
            return await KitchenTransactionHistory.find(matchCondition)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
        } else if (actualStatus) {
            // For specific status
            return await KitchenTransactionHistory.find({ 
                ...matchCondition, 
                status: actualStatus 
            })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        } else {
            throw new Error('Invalid status');
        }
    } catch (error) {
        console.error('Error in getTransactionsDataByStatusAndDate DAO:', error);
        throw error;
    }
};
const getTodayTransactionCounts = async (fromDate, toDate, kitchenId = null) => {
    try {
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        // Build match condition for today's data
        const matchCondition = {
            created_at: {
                $gte: startDate,
                $lte: endDate
            },
            transactionType: 'Credit'
        };

        // Add kitchen filter if provided
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }

        // Aggregation for today's counts
        const result = await KitchenTransactionHistory.aggregate([
            {
                $match: matchCondition
            },
            {
                $facet: {
                    // Count by status for today
                    statusCounts: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    // Get total count for today
                    total: [
                        { $count: 'totalCount' }
                    ]
                }
            },
            {
                $project: {
                    // TotalTransactions for today
                    TotalTransactions: {
                        $ifNull: [{ $arrayElemAt: ['$total.totalCount', 0] }, 0]
                    },
                    // Success count for today
                    Success: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Success'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    // Completed count for today
                    Completed: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'completed'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    }
                }
            }
        ]);

        return result.length > 0 ? result[0] : {
            TotalTransactions: 0,
            Success: 0,
            Completed: 0
        };
    } catch (error) {
        console.error('Error in getTodayTransactionCounts DAO:', error);
        throw error;
    }
};
const getOverallOtherStatusCounts = async (kitchenId = null) => {
    try {
        // Build match condition for overall data
        const matchCondition = {
            transactionType: 'Credit'
        };

        // Add kitchen filter if provided
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }

        // Aggregation for overall counts (excluding Success and Completed)
        const result = await KitchenTransactionHistory.aggregate([
            {
                $match: matchCondition
            },
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
                    // Get total overall amount (still needed)
                    totalAmount: [
                        {
                            $group: {
                                _id: null,
                                totalCreditAmount: { $sum: '$transaction_amount' }
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    // Other status counts (overall)
                    Pending: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Pending'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Failed: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Failed'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    InProgress: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'inprogress'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Initiated: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Initiated'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Refund: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Refund'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    Review_With_Bank: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    count: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$statusCounts',
                                                    as: 'status',
                                                    cond: { $eq: ['$$status._id', 'Review_With_Bank'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$count.count'
                            }
                        }, 0]
                    },
                    // Total credit amount (overall)
                    TotalCreditAmount: {
                        $ifNull: [{ $arrayElemAt: ['$totalAmount.totalCreditAmount', 0] }, 0]
                    }
                }
            }
        ]);

        const counts = result.length > 0 ? result[0] : {
            Pending: 0,
            Failed: 0,
            InProgress: 0,
            Initiated: 0,
            Refund: 0,
            Review_With_Bank: 0,
            TotalCreditAmount: 0
        };

        // Round amount
        if (counts.TotalCreditAmount !== undefined) {
            counts.TotalCreditAmount = parseFloat(counts.TotalCreditAmount.toFixed(2));
        }

        return counts;
    } catch (error) {
        console.error('Error in getOverallOtherStatusCounts DAO:', error);
        throw error;
    }
};
const getTodaySuccessCompletedAmounts = async (fromDate, toDate, kitchenId = null) => {
    try {
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        // Build match condition for today's data
        const matchCondition = {
            created_at: {
                $gte: startDate,
                $lte: endDate
            },
            transactionType: 'Credit'
        };

        // Add kitchen filter if provided
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }

        // Aggregation for today's amounts
        const result = await KitchenTransactionHistory.aggregate([
            {
                $match: matchCondition
            },
            {
                $facet: {
                    // Get amount by status for today
                    amountByStatus: [
                        {
                            $group: {
                                _id: '$status',
                                totalAmount: { $sum: '$transaction_amount' }
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    // Completed amount for today
                    CompletedAmount: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    amount: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$amountByStatus',
                                                    as: 'item',
                                                    cond: { $eq: ['$$item._id', 'completed'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$amount.totalAmount'
                            }
                        }, 0]
                    },
                    // Success amount for today
                    SuccessAmount: {
                        $ifNull: [{
                            $let: {
                                vars: {
                                    amount: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$amountByStatus',
                                                    as: 'item',
                                                    cond: { $eq: ['$$item._id', 'Success'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                in: '$$amount.totalAmount'
                            }
                        }, 0]
                    }
                }
            }
        ]);

        const amounts = result.length > 0 ? result[0] : {
            CompletedAmount: 0,
            SuccessAmount: 0
        };

        // Round amounts
        if (amounts.CompletedAmount !== undefined) {
            amounts.CompletedAmount = parseFloat(amounts.CompletedAmount.toFixed(2));
        }
        if (amounts.SuccessAmount !== undefined) {
            amounts.SuccessAmount = parseFloat(amounts.SuccessAmount.toFixed(2));
        }

        return amounts;
    } catch (error) {
        console.error('Error in getTodaySuccessCompletedAmounts DAO:', error);
        throw error;
    }
};
const getOverallOtherStatusesData = async (kitchenId = null, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        
        // Build match condition for overall data
        const matchCondition = {
            transactionType: 'Credit'
        };
        
        if (kitchenId && mongoose.Types.ObjectId.isValid(kitchenId)) {
            matchCondition.kitchenId = new mongoose.Types.ObjectId(kitchenId);
        }
        
        // Get transactions by status (excluding Success and Completed)
        const [pendingTransactions, failedTransactions, 
               inProgressTransactions, initiatedTransactions,
               refundTransactions, reviewWithBankTransactions] = await Promise.all([
            // Pending transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Pending' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Failed transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Failed' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // InProgress transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'inprogress' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Initiated transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Initiated' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Refund transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Refund' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            // Review_With_Bank transactions
            KitchenTransactionHistory.find({ ...matchCondition, status: 'Review_With_Bank' })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);
        
        return {
            pendingTransactions,
            failedTransactions,
            inProgressTransactions,
            initiatedTransactions,
            refundTransactions,
            reviewWithBankTransactions
        };
    } catch (error) {
        console.error('Error in getOverallOtherStatusesData DAO:', error);
        throw error;
    }
};


const exportKitchenTransactionHistory = async (searchObj) => {
    const condition = {};
    if (searchObj.kitchenId) {
        condition.kitchenId = searchObj.kitchenId;
    }
    if (searchObj.fromDate) {
        condition.created_at = { $gte: new Date(searchObj.fromDate) };
        if (searchObj.toDate) {
            condition.created_at.$lte = new Date(searchObj.toDate);
        }
    }
    return await KitchenTransactionHistory.find(condition).sort({ created_at: -1 });
};

module.exports = {
    getKitchenTransactionHistory,
    exportKitchenTransactionHistory,
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
    getTransactionById
}