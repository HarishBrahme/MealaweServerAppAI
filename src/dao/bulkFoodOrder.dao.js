const bulkFoodOrder = require('../model/bulkFoodOrder.model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { getLocalDate, getTodayStartTime, getTodayEndTime, getLocalMidDate } = require('../util/date-util');
const { deleteImage } = require('../service/images.service');

const saveBulkFoodOrder = async (foodOrder) => {
  const bFoodOrder = new bulkFoodOrder();
  bFoodOrder.orderNo = foodOrder.orderNo;
  bFoodOrder.orderType = foodOrder.orderType;
  bFoodOrder.orderstatus = foodOrder.orderstatus;
  bFoodOrder.customerId = foodOrder.customerId;
  bFoodOrder.customerName = foodOrder.customerName;
  bFoodOrder.customerLocation = foodOrder.customerLocation;
  bFoodOrder.customerPhoneNo = foodOrder.customerPhoneNo;
  bFoodOrder.customerEmail = foodOrder.customerEmail;
  bFoodOrder.taxes = foodOrder.taxes;
  bFoodOrder.order_id = foodOrder.order_id;
  bFoodOrder.receipt = foodOrder.receipt;
  bFoodOrder.stopPaymentValidation = false;
  bFoodOrder.amount = foodOrder.amount;
  bFoodOrder.skipCommission = true;
  bFoodOrder.itemAmount = foodOrder.itemAmount;
  bFoodOrder.bulkItemAmount = foodOrder.bulkItemAmount;
  bFoodOrder.itemList = foodOrder.itemList;
  bFoodOrder.addOns = foodOrder.addOns;
  bFoodOrder.statusHistory = [{ orderstatus: foodOrder.orderstatus, updatedOn: new Date() }];
  bFoodOrder.specialRequest = foodOrder.specialRequest;
  bFoodOrder.orderDate = getLocalMidDate(new Date());
  bFoodOrder.deliveryDate = getLocalMidDate(foodOrder.deliveryDate);
  bFoodOrder.slotStartTime = new Date(foodOrder.slotStartTime);
  bFoodOrder.slotEndTime = new Date(foodOrder.slotEndTime);
  bFoodOrder.packagingCost = foodOrder.packagingCost;
  bFoodOrder.deliveryAmtPaidByMealawe = foodOrder.deliveryAmtPaidByMealawe ? foodOrder.deliveryAmtPaidByMealawe : 0;
  bFoodOrder.voucherCode = foodOrder.voucherCode;
  bFoodOrder.couponCode = foodOrder.couponCode;
  bFoodOrder.voucherDiscount = foodOrder.voucherDiscount;
  bFoodOrder.discount = foodOrder.discount;
  bFoodOrder.packagingCostByUser = foodOrder.packagingCostByUser;
  bFoodOrder.clusterId = foodOrder.clusterId;
  bFoodOrder.clusterName = foodOrder.clusterName;
  bFoodOrder.moneyWalletPointsUsed = foodOrder.moneyWalletPointsUsed;
  bFoodOrder.mealaweWalletPointsUsed = foodOrder.clusterName;
  bFoodOrder.pgName = foodOrder.pgName; 
  bFoodOrder.totalEcoFriendlyPackagingCharges = foodOrder.totalEcoFriendlyPackagingCharges; 
  bFoodOrder.totalEcoFriendlyPackagingChargesDiscount = foodOrder.totalEcoFriendlyPackagingChargesDiscount; 
  bFoodOrder.finalBulkDelCharges = foodOrder.finalBulkDelCharges; 
  bFoodOrder.finalBulkDelDiscount = foodOrder.finalBulkDelDiscount; 
  bFoodOrder.finalBulkPlatformCharges = foodOrder.finalBulkPlatformCharges; 
  bFoodOrder.finalBulkPlatformDiscount = foodOrder.finalBulkPlatformDiscount;
  bFoodOrder.orderCreatedBy = foodOrder.orderCreatedBy;
  bFoodOrder.transactionTime = new Date(); 
  if (foodOrder.orderType === 'apartmentBulk' ) {
    bFoodOrder.kitchenId = foodOrder.kitchenId?foodOrder.kitchenId:'';
    bFoodOrder.kitchenName = foodOrder.kitchenName?foodOrder.kitchenName:'';
    bFoodOrder.kitchenPhoneNo = foodOrder.kitchenPhoneNo?foodOrder.kitchenPhoneNo:'';
    bFoodOrder.kitchenmapTelNo = foodOrder.kitchenmapTelNo?foodOrder.kitchenmapTelNo:'';
    bFoodOrder.kitchenAddress = foodOrder.kitchenAddress?foodOrder.kitchenAddress:'';
    bFoodOrder.kitchenGeolocation = foodOrder.kitchenGeolocation?foodOrder.kitchenGeolocation:'';  
    bFoodOrder.apartmentName= foodOrder.apartmentName;
    bFoodOrder.wingName= foodOrder.wingName,
    bFoodOrder.roomNumber= foodOrder.roomNumber;
    bFoodOrder.specialInstruction = foodOrder.specialInstruction || [];  // ← THIS IS MISSING!
    bFoodOrder.platformChargesTax = foodOrder.platformChargesTax?foodOrder.platformChargesTax:0;
    bFoodOrder.deliveryChargesTax = foodOrder.deliveryChargesTax?foodOrder.deliveryChargesTax:0;
    bFoodOrder.deliveryCharges = foodOrder.deliveryCharges?foodOrder.deliveryCharges:0;
    bFoodOrder.itemTotalTax = foodOrder.itemTotalTax?foodOrder.itemTotalTax:0;
    bFoodOrder.enableDelivery = foodOrder.enableDelivery;
    bFoodOrder.enableSelfPickup = foodOrder.enableSelfPickup;
    bFoodOrder.packagingChargesTax = foodOrder.packagingChargesTax?foodOrder.packagingChargesTax:0;
    bFoodOrder.apartmentOtp = generateOtp(); // Generate 4 digit OTP
}
  const orderdetail = await bFoodOrder.save();
  return orderdetail;
}
const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
}
const updateApartmentBulkOrderOtp = async (orderId, newOtp) => {
    return await bulkFoodOrder.findOneAndUpdate(
        { _id: orderId },
        { 
            $set: { apartmentOtp: newOtp },
            $push: { 
                statusHistory: { 
                    orderstatus: 'otpRegenerated', 
                    updatedOn: new Date(),
                    updatedBy: 'Kitchen',
                    updateByType: 'Kitchen'
                } 
            }
        },
        { new: true }
    );
}
const getFoodOrderList = async (ids) => {
    return await bulkFoodOrder.find({ _id: { $in: [...ids] } },
        { orderstatus: 1, orderDate: 1, customerId: 1, orderNo: 1, kitchenId: 1, amount: 1, itemList: 1, addOns: 1, _id: 1 });
}
const updateOrderStatus = async (ids, status, body) => {
    // console.log('updateOrderStatus ',status)
    const statusCondition = { orderstatus: status, updatedOn: new Date() }
    if (body) {
        statusCondition.updatedBy = body.updatedBy;
        statusCondition.updateByType = body.updateByType;
    }
    return await bulkFoodOrder.updateMany(
        { _id: { $in: [...ids] } },
        { $set: { orderstatus: status }, $push: { statusHistory: statusCondition } },
        { new: true });
}
const getBulkFoodOrder = async (id) => {
  return await bulkFoodOrder.findById(id);
}

const updateBulkFoodOrder = async (foodOrder) => {
  const updatedBy = foodOrder.updatedBy;
  const updateByType = foodOrder.updateByType;
  if (foodOrder.statusHistory) {
    foodOrder.statusHistory.push({ orderstatus: foodOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
  } else {
    foodOrder.statusHistory = [];
    foodOrder.statusHistory.push({ orderstatus: foodOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
  }
  return bulkFoodOrder.findOneAndUpdate({ _id: foodOrder._id }, { $set: foodOrder }, { new: true })
}

const getPastBulkFoodOrders = async (id, page) => {
  let limit = 30;
  const orderList = await bulkFoodOrder.find({ customerId: id ,orderType:{$ne:'apartmentBulk'}})
    .sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
  return orderList;
}

const getCurrentBulkOrdersCount = async (clusterList) => {
  let today = getTodayStartTime();
  let tomorrow = getTodayStartTime();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const condition = {
    $or: [
      { orderDate: { $gte: today, $lt: tomorrow } },
      { deliveryDate: { $gte: today } }
    ]
  };
  if (clusterList && clusterList.length > 0) {
    condition.clusterId = { $in: clusterList };
  }
  condition.orderType={$nin:['apartmentBulk']}
  try {
    const result = await bulkFoodOrder.aggregate([
      {
        $match: condition
      },
      {
        $group: {
          _id: '$orderstatus',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          orderstatus: '$_id',
          count: 1
        }
      }
    ]).exec();

    const formattedResult = result.reduce((acc, item) => {
      acc[item.orderstatus] = item.count;
      return acc;
    }, {});
    console.log(result,"result");
    // Set count to 0 for all order types if not present
    const allOrderTypes = ['placed', 'accepted', 'paymentInprogress', 'paymentFailed', 'deliveryBoyAssigned', 'handedOverToDeliveryBoy',
      'onTheWay', 'readyForDelivery', 'inprogress', 'delivered', 'cancelled', 'preparing', 'rejectedByKitchen', '-'];
    allOrderTypes.forEach(orderType => {
      if (!(orderType in formattedResult)) {
        formattedResult[orderType] = 0;
      }
    });

    return formattedResult;
  } catch (error) {
    // Handle errors, e.g., log or throw
    console.error('Error in getCurrentBulkOrdersCount:', error);
    throw error;
  }
};

const getBulkOrderList = async (status, page, limit, clusterList) => {
  let today = getTodayStartTime();
  let tomorrow = getTodayStartTime();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const condition = {
    orderstatus: status,
    $or: [
      { orderDate: { $gte: today, $lt: tomorrow } },
      { deliveryDate: { $gte: today } }
    ]
  };
  if (clusterList && clusterList.length > 0) {
    condition.clusterId = { $in: clusterList };
  }
  condition.orderType={$nin:['apartmentBulk']}
  return await bulkFoodOrder.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const searchBulkOrderList = async (searchObj, page) => {
  const limit = 50;
  const condition = {};
  if (searchObj.orderStatus && searchObj.orderStatus.length > 0) {
    condition.orderstatus = { $in: [...searchObj.orderStatus] }
  }
  if (searchObj.orderNo) {
    if (isNaN(searchObj.orderNo)) {
      condition.orderNo = 0;
    } else {
      condition.orderNo = parseInt(searchObj.orderNo);
    }
  }
  if (searchObj.customerName) {
    const regexText = new RegExp(searchObj.customerName, 'i');
    condition.customerName = regexText;
  }
  if (searchObj.customerPhoneNo) {
    const regexText = new RegExp(searchObj.customerPhoneNo, 'i');
    condition.customerPhoneNo = regexText;
  }
  if (searchObj.couponCode) {
    const regexText = new RegExp(searchObj.couponCode, 'i');
    condition.couponCode = regexText;
  }
  if (searchObj.voucherCode) {
    const regexText = new RegExp(searchObj.voucherCode, 'i');
    condition.voucherCode = regexText;
  }
  if (searchObj.customerEmail) {
    const regexText = new RegExp(searchObj.customerEmail, 'i');
    condition.customerEmail = regexText;
  }
  if (searchObj.fromDate && searchObj.toDate) {
    condition.orderDate = { $gte: new Date(searchObj.fromDate), $lte: new Date(searchObj.toDate) }
  }
  // console.log('searchBulkOrderList ',condition);
  return await bulkFoodOrder.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
}

const getPaymentBulkValidationOrder = async () => {
  let today = getTodayStartTime();
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let condition = {
    orderstatus: { $in: ['paymentInprogress', 'paymentFailed'] },
    stopPaymentValidation: false,
    // $or: [
    //     {orderDate: {$gte: today, $lt: tomorrow} }
    // ]
  };
  const orderList = await bulkFoodOrder.find(condition);
  return orderList;
}

const performBulkOrderTransfer = async (tranferredOrder) => {
  const order = {};
  order.kitchenId = tranferredOrder.kitchenId;
  order.kitchenName = tranferredOrder.kitchenName;
  order.kitchenPhoneNo = tranferredOrder.kitchenPhoneNo;
  order.kitchenAddress = tranferredOrder.kitchenAddress;
  order.kitchenGeolocation = tranferredOrder.kitchenGeolocation;
  order.distance = tranferredOrder.distance;
  // order.transferExtraAmt = tranferredOrder.transferExtraAmt;
  // order.reduceExtraAmt = tranferredOrder.reduceExtraAmt;
  order.orderTransferred = tranferredOrder.orderTransferred;
  order.transferHistory = tranferredOrder.transferHistory;
  order.firstKitchenName = tranferredOrder.firstKitchenName;
  // order.itemAmount = tranferredOrder.itemAmount;
  return await bulkFoodOrder.findOneAndUpdate({ _id: tranferredOrder._id },
    { $set: order }, { new: true });
};

const getKitchenBulkDashboardCount = async (kitchenId, clientDate, orderType) => {
  let today = getTodayStartTime();
  let tomorrow = getTodayStartTime();
  tomorrow.setDate(tomorrow.getDate() + 1);
  let condition = {
    kitchenId,
    $or: [
      { orderDate: { $gte: today } },
      { deliveryDate: { $gte: today } },
    ]
  };
  if (orderType !== 'all') {
    condition.orderType = orderType;
  }
  const orderdetail = await bulkFoodOrder.find(condition, { orderstatus: 1, orderType: 1, mealType: 1 });
  return orderdetail;
}

const getKitchenBulkOrderDetail = async (kitchenId, clientDate) => {
  let today = getTodayStartTime();
  // today.setHours(0,0,0,0);
  let tomorrow = getTodayStartTime();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const orderdetail = await bulkFoodOrder.find({
    kitchenId,
    deliveryDate: { $gte: today }
  });
  return orderdetail;
}

const updatePackageImage = async (id, prop, filename) => {
  foodOrder = {};
  foodOrder[prop] = filename;
  const savedOrder = await bulkFoodOrder.findOne({ _id: id });
  const updatedFoodOrder = bulkFoodOrder.findOneAndUpdate({ _id: id }, { $set: foodOrder }, { new: true });
  if (savedOrder[prop]) {
    deleteImage(savedOrder[prop]);
  }
  return updatedFoodOrder
}

const updateBulkManualDelivery = async (id) => {
  return await bulkFoodOrder.findOneAndUpdate(
    { _id: id },
    { $set: { startManualDelivery: true } },
    { new: true });
}

const getFoodOrderListByOrderNo = async (orderNos) => {
  // return await FoodOrder.find({orderNo: orderNos.ids[0] });
  return await bulkFoodOrder.find({ orderNo: { $in: [...orderNos] } });
}

const getFoodOrderByOrderNo = async (orderNo) => {
  return await bulkFoodOrder.findOne({ orderNo });
}

const updateOrderWhilePayingKitchen = async (orderList) => {
  let bulkArr = [];
  for (const order of orderList) {
    bulkArr.push({
      updateOne: {
        "filter": { _id: order.id },
        "update": {
          $set: {
            amtPaidToKitchen: order.amtPaidToKitchen, amtAfterCommisionPaidToKitchen: order.amtAfterCommisionPaidToKitchen,
            orderCommission: order.orderCommission
          }
        }
      }
    })
  }
  return await bulkFoodOrder.bulkWrite(bulkArr);
};

const updateDeliveryOrder = async (deliveryTaskId, orderNoList, deliveryVendor, deliveryAmtPaidByMealawe, pickup_otp, drop_otp) => {
  const setCondition = { deliveryTaskId, orderstatus: 'readyForDelivery', deliveryVendor };
  if (deliveryAmtPaidByMealawe) {
    setCondition.deliveryAmtPaidByMealawe = deliveryAmtPaidByMealawe
  }
  if (pickup_otp) {
    setCondition.pickup_otp = pickup_otp
  }
  if (drop_otp) {
    setCondition.drop_otp = drop_otp
  }
  return await bulkFoodOrder.updateMany({ orderNo: { $in: [...orderNoList] } },
    { $set: setCondition }
  );
};

const getCustomerVoucherOrderList = async (customerId, voucherCode, checkForToday) => {
  const orderStatusList = ['deliveryBoyAssigned', 'handedOverToDeliveryBoy',
    'onTheWay', 'placed', 'readyForDelivery', 'accepted', 'inprogress', 'delivered', 'preparing'];
  const condition = { customerId, voucherCode, orderstatus: { $in: [...orderStatusList] } };
  if (checkForToday) {
    let today = getTodayStartTime();
    condition.orderDate = { $gte: today }
  }
  const order = await bulkFoodOrder.findOne(condition);
  return order;
};

const getVoucherUsedOrderList = async (voucherCode) => {
  const orderStatusList = ['deliveryBoyAssigned', 'handedOverToDeliveryBoy',
    'onTheWay', 'placed', 'readyForDelivery', 'accepted', 'inprogress', 'delivered', 'preparing'];
  const condition = { voucherCode, orderstatus: { $in: [...orderStatusList] } };
  const order = await bulkFoodOrder.findOne(condition);
  return order;
};

const getCustomerCouponOrderList = async (customerId, couponCode, clientDate) => {
  const orderStatusList = ['deliveryBoyAssigned', 'handedOverToDeliveryBoy',
    'onTheWay', 'placed', 'readyForDelivery', 'accepted', 'inprogress', 'delivered', 'preparing'];
  const condition = { customerId, couponCode, orderstatus: { $in: [...orderStatusList] } };
  if (clientDate) {
    let today = getTodayStartTime();
    condition.orderDate = { $gte: today }
  }
  const order = await bulkFoodOrder.findOne(condition);
  return order;
};

const updateFoodOrder = async (foodOrder) => {
  const updatedBy = foodOrder.updatedBy;
  const updateByType = foodOrder.updateByType;
  if (foodOrder.statusHistory) {
    foodOrder.statusHistory.push({ orderstatus: foodOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
  } else {
    foodOrder.statusHistory = [];
    foodOrder.statusHistory.push({ orderstatus: foodOrder.orderstatus, updatedOn: new Date(), updatedBy, updateByType })
  }
  return bulkFoodOrder.findOneAndUpdate({ _id: foodOrder._id }, { $set: foodOrder }, { new: true });
}

const updateBulkFoodOrderProps = async (orderNoList, updateCondtion) => {
  return await bulkFoodOrder.updateMany({ orderNo: { $in: [...orderNoList] } },
    { $set: updateCondtion }
  );
};

const getCustomerBulkOrderList = async (customerId, page) => {
  let limit = 30;
  const orderList = await bulkFoodOrder.find({ customerId })
    .sort({ orderDate: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
  return orderList;
}
const exportBulkOrderList = async (searchObj) => {
  const condition = { orderstatus: 'delivered' };
  if (searchObj.fromDate) {
      condition.orderDate = { $gte: new Date(searchObj.fromDate) };
      if (searchObj.toDate) {
          condition.orderDate.$lte = new Date(searchObj.toDate);
      }
  }
  // console.log('condition',condition);
  return await bulkFoodOrder.find(condition).sort({ orderDate: -1 });
}
const getApartmentPastBulkFoodOrders = async (id, page) => {
  let limit = 30;
  const orderList = await bulkFoodOrder.find({ customerId: id, orderType: 'apartmentBulk' })
    .sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
  return orderList;
}

const getBulkFoodOrdersByCustomerEmailThinkowl = async (email) => {
    return await bulkFoodOrder.findOne({ customerEmail: email });
}

const getApartmentBulkOrderListByDateRange = async (fromDate, toDate, apartmentIds, page, limit) => {
    const condition = {
        orderType: 'apartmentBulk',
        orderDate: {
            $gte: fromDate || getLocalStartTime(new Date()),
            $lte: toDate || getLocalEndTime(new Date())
        }
    };

    let kitchenIds = [];
    
    // If apartmentIds are provided and valid, filter by associated kitchens
    if (apartmentIds && apartmentIds.length > 0) {
        // Filter out any undefined or invalid IDs
        const validApartmentIds = apartmentIds.filter(id => 
            id && id !== 'undefined' && mongoose.Types.ObjectId.isValid(id)
        );

        if (validApartmentIds.length > 0) {
            const apartments = await Apartment.find(
                { _id: { $in: validApartmentIds } },
                { "kitchenInfo.kitchenId": 1 }
            );

            kitchenIds = apartments
                .map(apartment => apartment?.kitchenInfo?.kitchenId)
                .filter(Boolean);

            kitchenIds = [...new Set(kitchenIds.map(id => id.toString()))];
            kitchenIds = kitchenIds.map(id => new mongoose.Types.ObjectId(id));

            if (kitchenIds.length > 0) {
                condition.kitchenId = { $in: kitchenIds };
            }
        }
    }

    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      bulkFoodOrder.find(condition)
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit),
            bulkFoodOrder.countDocuments(condition)
    ]);

    return { 
        orders, 
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
    };
}

module.exports = {
  saveBulkFoodOrder,
  updateDeliveryOrder,
  updateOrderWhilePayingKitchen,
  getFoodOrderListByOrderNo,
  getFoodOrderByOrderNo,
  updatePackageImage,
  getBulkFoodOrder,
  updateBulkManualDelivery,
  updateBulkFoodOrder,
  performBulkOrderTransfer,
  getPastBulkFoodOrders,
  getKitchenBulkOrderDetail,
  getCurrentBulkOrdersCount,
  getBulkOrderList,
  getKitchenBulkDashboardCount,
  searchBulkOrderList,
  getPaymentBulkValidationOrder,
  getCustomerVoucherOrderList,
  getVoucherUsedOrderList,
  getCustomerCouponOrderList,
  updateFoodOrder,
  updateBulkFoodOrderProps,
  getCustomerBulkOrderList,
  exportBulkOrderList,
  getApartmentPastBulkFoodOrders,
  updateApartmentBulkOrderOtp,
  updateOrderStatus,
  getFoodOrderList,
  getApartmentBulkOrderListByDateRange,
  getBulkFoodOrdersByCustomerEmailThinkowl
}