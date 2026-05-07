const MarketPlaceItemOrder = require('../model/marketPlaceItemOrder.model');
const MarketPlaceItem = require('../model/marketPlaceItem.model');
const { getTodayStartTime, getLocalMidDate } = require('../util/date-util');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const getMarketPlaceItemOrderList = async () => {
  const list = await MarketPlaceItemOrder.find({});
  return list;
};

const getMarketPlaceItemOrderById = async (id) => {
  return await MarketPlaceItemOrder.findById(id);
}

const getMarketPlaceItemOrderByOrderNo = async (orderNo) => {
  return await MarketPlaceItemOrder.findOne({ orderNo });
}

const saveMarketPlaceItemOrder = async (marketPlaceItemOrder) => {
  try {
    const nMarketPlaceItemOrder = new MarketPlaceItemOrder();
    nMarketPlaceItemOrder.orderNo = marketPlaceItemOrder.orderNo;
    nMarketPlaceItemOrder.orderType = marketPlaceItemOrder.orderType;
    nMarketPlaceItemOrder.customerId = marketPlaceItemOrder.customerId;
    nMarketPlaceItemOrder.customerName = marketPlaceItemOrder.customerName;
    nMarketPlaceItemOrder.customerLocation = marketPlaceItemOrder.customerLocation;
    nMarketPlaceItemOrder.customerPhoneNo = marketPlaceItemOrder.customerPhoneNo;
    nMarketPlaceItemOrder.customerEmail = marketPlaceItemOrder.customerEmail;
    nMarketPlaceItemOrder.orderCreatedBy = marketPlaceItemOrder.orderCreatedBy;
    nMarketPlaceItemOrder.orderDate = getLocalMidDate(new Date());
    nMarketPlaceItemOrder.discount = marketPlaceItemOrder.discount;
    nMarketPlaceItemOrder.orderstatus = marketPlaceItemOrder.orderstatus;
    nMarketPlaceItemOrder.itemId = marketPlaceItemOrder.itemId;
    nMarketPlaceItemOrder.length = marketPlaceItemOrder.length;
    nMarketPlaceItemOrder.breadth = marketPlaceItemOrder.breadth;
    nMarketPlaceItemOrder.height = marketPlaceItemOrder.height;
    nMarketPlaceItemOrder.weight = marketPlaceItemOrder.weight;
    nMarketPlaceItemOrder.itemName = marketPlaceItemOrder.itemName;
    nMarketPlaceItemOrder.itemActualName = marketPlaceItemOrder.itemActualName;
    nMarketPlaceItemOrder.itemDescription = marketPlaceItemOrder.itemDescription;
    nMarketPlaceItemOrder.itemServingUnit = marketPlaceItemOrder.itemServingUnit;
    nMarketPlaceItemOrder.searchCategory = marketPlaceItemOrder.searchCategory;
    nMarketPlaceItemOrder.searchKeywords = marketPlaceItemOrder.searchKeywords;
    nMarketPlaceItemOrder.itemLabel = marketPlaceItemOrder.itemLabel;
    if (marketPlaceItemOrder.groupCategory && marketPlaceItemOrder.groupCategoryId) {
      nMarketPlaceItemOrder.groupCategory = marketPlaceItemOrder.groupCategory;
      nMarketPlaceItemOrder.groupCategoryId = marketPlaceItemOrder.groupCategoryId;
    }
    nMarketPlaceItemOrder.itemServingText = marketPlaceItemOrder.itemServingText;
    nMarketPlaceItemOrder.itemServingValue = marketPlaceItemOrder.itemServingValue;
    nMarketPlaceItemOrder.itemServingUnit = marketPlaceItemOrder.itemServingUnit;
    nMarketPlaceMainOrder.statusHistory = [{ orderstatus: marketPlaceMainOrder.orderstatus, updatedOn: new Date() }];
    nMarketPlaceItemOrder.mainOrderNo = marketPlaceItemOrder.mainOrderNo;
    const saved = await nMarketPlaceItemOrder.save();
    return saved;
  } catch (err) {
    console.log(err);
  }
};

const updateMarketPlaceItemOrder = async (marketPlaceItemOrder) => {
  const updatedBy = marketPlaceItemOrder.updatedBy;
  const updateByType = marketPlaceItemOrder.updateByType;
  if (marketPlaceItemOrder.statusHistory) {
    marketPlaceItemOrder.statusHistory.push({ orderstatus: marketPlaceItemOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
  } else {
    marketPlaceItemOrder.statusHistory = [];
    marketPlaceItemOrder.statusHistory.push({ orderstatus: marketPlaceItemOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
  }
  return MarketPlaceItemOrder.findOneAndUpdate({ _id: ObjectId(marketPlaceItemOrder._id) }, { $set: marketPlaceItemOrder }, { new: true });
}

const updateOrderStatus = async (ids, status, body) => {
  const statusCondition = { orderstatus: status, updatedOn: new Date() }
  if (body) {
    statusCondition.updatedBy = body.updatedBy;
    statusCondition.updateByType = body.updateByType;
  }
  return await MarketPlaceItemOrder.updateMany(
    { _id: { $in: [...ids] } },
    { $set: { orderstatus: status }, $push: { statusHistory: statusCondition } },
    { new: true });
}

const getCustomerPastOrders = async (payload) => {
  const { customerId, pageNumber = 1, pageSize = 15, status = '' } = payload;
  const condition = { customerId };
  const statusMap = {
    ongoing: ['placed', 'accepted', 'readyToDelivery', 'packagingInProgess', 'inTransit', 'outForDelivery'],
    cancelled: ['cancelledByUser', 'cancelledBySeller', 'rejectedBySeller'],
    completed: ['delivered', 'completed'],
    paymentFailed: ['paymentFailed']
  };
  if (status && statusMap[status]) {
    condition.orderstatus = { $in: statusMap[status] };
  }
  const orderList = await MarketPlaceItemOrder.find(condition).sort({ orderDate: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).exec();
  return orderList;
};

const saveMultipleMarketPlaceItemOrders = async (orderList) => {
  const orderdetail = await MarketPlaceItemOrder.insertMany(orderList);
  return orderdetail;
};

const updateAllItemOrdersStatus = async (mainOrderNo, status, body) => {
  let updatedBy;
  let updateByType;
  if (body) {
    updatedBy = body.updatedBy;
    updateByType = body.updateByType;
  }
  return await MarketPlaceItemOrder.updateMany(
    { mainOrderNo },
    { $set: { orderstatus: status }, $push: { statusHistory: { orderstatus: status, updatedOn: new Date(), updatedBy, updateByType } } },
    { new: true });
};

const getMarketPlaceItemOrdersCount = async () => {
  const fullResult = {
    'cancelledBySeller': 0,
    'accepted': 0,
    'packagingInProgess': 0,
    'readyToDelivery': 0,
    'delivered': 0,
    'inTransit': 0,
    'outForDelivery': 0
  };
  let today = getTodayStartTime();
  let tomorrow = getTodayStartTime();
  tomorrow.setDate(tomorrow.getDate() + 1);
  let past7Days = getTodayStartTime();
  past7Days.setDate(past7Days.getDate() - 15);
  const condition = { orderDate: { $gte: today, $lt: tomorrow } };
  const condition1 = {};
  const condition2 = { orderDate: { $gte: past7Days } };
  const result = await MarketPlaceItemOrder.aggregate(
    [
      {
        '$facet': {
          // 'paymentInprogress': [{ $match: {orderstatus : 'paymentInprogress',...condition1}},{ $count: 'paymentInprogress' }],
          // 'paymentFailed': [{ $match: {orderstatus : 'paymentFailed',...condition1}},{ $count: 'paymentFailed' }],
          'cancelledBySeller': [{ $match: { orderstatus: 'cancelledBySeller', ...condition } }, { $count: 'cancelledBySeller' }],
          'accepted': [{ $match: { orderstatus: 'accepted', ...condition1 } }, { $count: 'accepted' }],
          'packagingInProgess': [{ $match: { orderstatus: 'packagingInProgess', ...condition1 } }, { $count: 'packagingInProgess' }],
          'readyToDelivery': [{ $match: { orderstatus: 'readyToDelivery', ...condition1 } }, { $count: 'readyToDelivery' }],
          'inTransit': [{ $match: { orderstatus: 'inTransit', ...condition1 } }, { $count: 'inTransit' }],
          'outForDelivery': [{ $match: { orderstatus: 'outForDelivery', ...condition1 } }, { $count: 'outForDelivery' }],
          'delivered': [{ $match: { orderstatus: 'delivered', ...condition2 } }, { $count: 'delivered' }]
        }
      },
      {
        '$project': {
          // 'paymentInprogress': {'$arrayElemAt': ['$paymentInprogress.paymentInprogress', 0]},
          // 'paymentFailed': {'$arrayElemAt': ['$paymentFailed.paymentFailed', 0]},
          'cancelledBySeller': { '$arrayElemAt': ['$cancelledBySeller.cancelledBySeller', 0] },
          'accepted': { '$arrayElemAt': ['$accepted.accepted', 0] },
          'packagingInProgess': { '$arrayElemAt': ['$packagingInProgess.packagingInProgess', 0] },
          'readyToDelivery': { '$arrayElemAt': ['$readyToDelivery.readyToDelivery', 0] },
          'inTransit': { '$arrayElemAt': ['$inTransit.inTransit', 0] },
          'outForDelivery': { '$arrayElemAt': ['$outForDelivery.outForDelivery', 0] },
          'delivered': { '$arrayElemAt': ['$delivered.delivered', 0] }
        }
      }
    ]

  );
  return (result && result.length > 0) ? { ...fullResult, ...result[0] } : { ...fullResult };
}

const getMarketPlaceItemOrdersList = async (status, page, limit) => {
  let today = getTodayStartTime();
  let tomorrow = getTodayStartTime();
  tomorrow.setDate(tomorrow.getDate() + 1);
  let past7Days = getTodayStartTime();
  past7Days.setDate(past7Days.getDate() - 15);
  let condition = { orderstatus: status, };

  if (status === 'delivered') {
    condition = { orderstatus: status, orderDate: { $gte: past7Days } };
  }
  return await MarketPlaceItemOrder.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const getMarketPlaceItemOrdersListByInventoryId = async (status, page, limit, id) => {
  const inventoryId = ObjectId(id);
  let today = getTodayStartTime();
  let tomorrow = getTodayStartTime();
  tomorrow.setDate(tomorrow.getDate() + 1);
  let condition = { orderstatus: status, "inventoryInfo.inventoryId": inventoryId };

  if (status === 'delivered') {
    condition = { orderstatus: status, orderDate: { $gte: today, $lt: tomorrow }, "inventoryInfo.inventoryId": inventoryId };
  }
  return await MarketPlaceItemOrder.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

// const getrecentOrders = async (userId) => {
//     let recentOrders = await MarketPlaceItemOrder.aggregate([
//         { 
//         $match: {  customerId: new mongoose.Types.ObjectId(userId) }
//         },
//         { 
//         $group: { 
//             _id: null,
//             uniqueItems: { $addToSet: { itemId: "$itemId", itemName: "$itemName",imageUrls:"$imageUrls" } }
//         } 
//         },
//         { 
//         $project: { 
//             _id: 0,
//             uniqueItems: 1 
//         } 
//         }
//     ]);
//     return recentOrders[0].uniqueItems;
// };


const getrecentOrders = async (userId) => {
  try {
    const recentOrders = await MarketPlaceItemOrder.aggregate([
      {
        $match: { customerId: new mongoose.Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: null,
          items: { $push: "$itemId" },
        },
      },
      {
        $project: {
          _id: 0,
          itemIds: "$items",
        },
      },
    ]);

    if (!recentOrders || recentOrders.length === 0 || !recentOrders[0].itemIds) {
      return [];
    }

    const itemIds = recentOrders[0].itemIds;
    const productIdCounts = itemIds.reduce((counts, id) => {
      counts[id] = (counts[id] || 0) + 1;
      return counts;
    }, {});

    const sortedProductIds = Object.entries(productIdCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([productId]) => productId);

    const productDetails = await MarketPlaceItem.find({
      _id: { $in: sortedProductIds.map(id => new mongoose.Types.ObjectId(id)) },
    });

    const result = sortedProductIds.map((productId) => {
      const product = productDetails.find((p) => p._id.toString() === productId);
      if (product) {
        return product;
      }
      return null;
    }).filter(product => product !== null);
    return result;
  } catch (error) {
    console.error("Error fetching recent orders with product details:", error);
    throw error;
  }
};



const updateMarketPlaceItemOrdersProps = async (orderNoList, updateCondtion) => {
  return await MarketPlaceItemOrder.updateMany({ orderNo: { $in: [...orderNoList] } },
    { $set: updateCondtion }
  );
};

const updateAllItemOrdersInfo = async (mainOrderNo, msg, condition) => {
  const updatedBy = condition.updatedBy;
  const updateByType = condition.updateByType;
  return await MarketPlaceItemOrder.updateMany(
    { mainOrderNo },
    { $set: condition, $push: { statusHistory: { orderstatus: msg, updatedOn: new Date(), updatedBy, updateByType } } },
    { new: true });
};

const getMarketPlaceItemOrderListByOrderNo = async (orderNos) => {
  return await MarketPlaceItemOrder.find({ orderNo: { $in: [...orderNos] } });
}

const getLastUnratedNavmoolDeliveredOrderList = async (customerId, fromDate, toDate) => {
  const condition = {
    customerId, orderstatus: 'delivered', feedbackProvided: { $not: { $in: [true] } }

  };
  const order = await MarketPlaceItemOrder.find(condition);
  return order;
}

const getAllStatusOrders = async (orderstatus) => {
  const condition = {
    orderstatus
  };
  const result = await MarketPlaceItemOrder.find(condition);
  return result;
}

const getAllStatusAndInventoryIdOrders = async (orderstatus, Id) => {
  const inventoryId = ObjectId(Id);
  const condition = {
    orderstatus: orderstatus,
    "inventoryInfo.inventoryId": inventoryId
  };
  const result = await MarketPlaceItemOrder.find(condition);
  return result;
}

const getCustomerMarketPlaceItemOpenOrders = async (customerId, page) => {
  let limit = 50;
  let condition = {
    customerId,
    orderstatus: {
      $in: [
        'placed',
        'accepted',
        'packagingInProgess',
        'readyToDelivery',
        'inTransit',
        'outForDelivery', ,
      ],
    },
  };
  const orderList = await MarketPlaceItemOrder.find(condition)
    .sort({ orderDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit * 1)
    .exec();
  return orderList;
};
const updateNavmoolFeedbackstatus = async (id) => {
  return await MarketPlaceItemOrder.findOneAndUpdate(
    { _id: id },
    { $set: { feedbackProvided: true } },
    { new: true });
}

const updateStandAloneShipment = async (payload) => {
  const updatedBy = payload.updatedBy;
  const updateByType = payload.updateByType;
  const orderNo = payload.orderNo;
  const standAloneShipment = payload.standAloneShipment;
  const order = await MarketPlaceItemOrder.findOneAndUpdate(
    { orderNo },
    { $set: { standAloneShipment }, $push: { statusHistory: { orderstatus: 'StandAloneShipment', updatedOn: new Date(), updatedBy, updateByType } } },
    { new: true });
  return order;
};

const searchMarketPlaceItemOrderList = async (searchObj, page) => {
  const limit = 50;
  const condition = {};
  if (searchObj.orderStatus && searchObj.orderStatus.length > 0) {
    condition.orderstatus = { $in: [...searchObj.orderStatus] }
  }
  if (searchObj.orderNo) {
    const regexText = new RegExp(searchObj.orderNo, 'i');
    condition.orderNo = regexText;
  }
  if (searchObj.customerName) {
    const regexText = new RegExp(searchObj.customerName, 'i');
    condition.customerName = regexText;
  }
  if (searchObj.fromDate && searchObj.toDate) {
    condition.orderDate = { $gte: new Date(searchObj.fromDate), $lte: new Date(searchObj.toDate) }
  }
  return await MarketPlaceItemOrder.find(condition).sort({ orderDate: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const getMarketPlaceItemOrdersCountByInventory = async (Id) => {
  const inventoryId = ObjectId(Id);
  const fullResult = {
    'packagingInProgess': 0,
    'readyToDelivery': 0,
    'delivered': 0,
    'inTransit': 0,
    'outForDelivery': 0
  };

  const today = getTodayStartTime();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateCondition = { orderDate: { $gte: today, $lt: tomorrow } };
  const inventoryCondition = { "inventoryInfo.inventoryId": inventoryId };
  const dateAndInventoryCondition = { ...dateCondition, ...inventoryCondition };

  const result = await MarketPlaceItemOrder.aggregate([
    {
      $facet: {
        packagingInProgess: [
          { $match: { orderstatus: 'packagingInProgess', ...inventoryCondition } },
          { $count: 'count' }
        ],
        readyToDelivery: [
          { $match: { orderstatus: 'readyToDelivery', ...inventoryCondition } },
          { $count: 'count' }
        ],
        inTransit: [
          { $match: { orderstatus: 'inTransit', ...inventoryCondition } },
          { $count: 'count' }
        ],
        outForDelivery: [
          { $match: { orderstatus: 'outForDelivery', ...inventoryCondition } },
          { $count: 'count' }
        ],
        delivered: [
          { $match: { orderstatus: 'delivered', ...dateAndInventoryCondition } },
          { $count: 'count' }
        ]
      }
    },
    {
      $project: {
        packagingInProgess: { $ifNull: [{ $arrayElemAt: ['$packagingInProgess.count', 0] }, 0] },
        readyToDelivery: { $ifNull: [{ $arrayElemAt: ['$readyToDelivery.count', 0] }, 0] },
        inTransit: { $ifNull: [{ $arrayElemAt: ['$inTransit.count', 0] }, 0] },
        outForDelivery: { $ifNull: [{ $arrayElemAt: ['$outForDelivery.count', 0] }, 0] },
        delivered: { $ifNull: [{ $arrayElemAt: ['$delivered.count', 0] }, 0] }
      }
    }
  ]);

  return (result && result.length > 0) ? { ...fullResult, ...result[0] } : { ...fullResult };
};

const getMarketPlaceItemOrdersByDeliveryTaskId = async (deliveryTaskId) => {
  const list = await MarketPlaceItemOrder.find({ deliveryTaskId });
  return list;
};

module.exports = {
  getMarketPlaceItemOrderList,
  getMarketPlaceItemOrderById,
  getMarketPlaceItemOrderByOrderNo,
  saveMarketPlaceItemOrder,
  updateMarketPlaceItemOrder,
  updateOrderStatus,
  getCustomerPastOrders,
  saveMultipleMarketPlaceItemOrders,
  updateAllItemOrdersStatus,
  getMarketPlaceItemOrdersCount,
  getMarketPlaceItemOrdersList,
  getrecentOrders,
  updateMarketPlaceItemOrdersProps,
  updateAllItemOrdersInfo,
  getMarketPlaceItemOrderListByOrderNo,
  getAllStatusOrders,
  getCustomerMarketPlaceItemOpenOrders,
  updateStandAloneShipment,
  getLastUnratedNavmoolDeliveredOrderList,
  updateNavmoolFeedbackstatus,
  searchMarketPlaceItemOrderList,
  getMarketPlaceItemOrdersCountByInventory,
  getAllStatusAndInventoryIdOrders,
  getMarketPlaceItemOrdersListByInventoryId,
  getMarketPlaceItemOrdersByDeliveryTaskId
};