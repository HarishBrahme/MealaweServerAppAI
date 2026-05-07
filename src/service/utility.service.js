const kitchendao = require('../dao/kitchenPartner.dao');
const todaysMenuDao = require('../dao/todaysMenu.dao');
const kitchenMenuDao = require('../dao/kitchenMenu.dao');
const customerdao = require('../dao/customerProfile.dao');
const foodOrderDao = require('../dao/foodorder.dao');
const foodOrderPackageDao = require('../dao/foodOrderPackage.dao');
const userMealaweWallet = require('../dao/userMealaweWallet.dao');
const cashbackDao = require('../dao/cashback.dao');
const foodItemDao = require('../dao/foodItem.dao');
const { sendGenericFcmMessage } = require("../util/fcm-message-handler");
const { getWooCommerceMealOrders } = require('../util/woo-commerce.util');
const { sendOTPsms } = require('../util/sms-provider-util');
const { deskdyneAPIUtil } = require('../util/deskdyne-util');
const { performPidgeTask, callTookanAPI } = require('../util/pidge-util');
const { getAllBulkFooditems } = require('../dao/bulkFoodItem.dao');
const { getAllBulkMenu, updateBulkMenu } = require('../dao/bulkMenu.dao');
const { saveProcessLock } = require('../dao/processLock.dao');
const { setfeedbackDate } = require('../dao/feedback.dao');
const imageService = require('../service/images.service');
const { logoutAllAdmin } = require('../dao/authAdmin.dao');
const { checkLatLngInCluster } = require('../util/google-map-api-util');
const { updateKitchenIdAndName } = require('../dao/kitchenWallet.dao');
const { getAdminProfileList } = require('./adminProfile.service');
const { getSubscriptionEndDetails } = require('./foodOrderPackage.service');
const { metaEventHTTPCall } = require('../util/http-api-handler');


const callMetaEventAPI = async (payload, source) => {
  if (process.env.PRODUCTION === 'true') {
    return await metaEventHTTPCall(payload, source)
  } else {
    // const responsetwmp = await metaEventHTTPCall(payload);
    // console.log("responsetwmp",responsetwmp);
    return { status: false }
  }
}

const updateKitchenPartnerLocation = async () => {
  try {
    const allKitchensList = await kitchendao.getAllKitchenPatners();
    const promiseArr = [];
    allKitchensList.forEach((kitchen) => {
      const kitchenObj = {}
      kitchenObj.geolocation = JSON.stringify(kitchen.geolocation);
      promiseArr.push(kitchendao.updateKitchenPatner(kitchen._id, kitchenObj));
    });
    return await Promise.all(promiseArr);
  } catch (error) {
    // console.log('error while updateKitchenPartnerLocation', error)
  }
}

const updateKitchenMenuLocation = async () => {
  try {
    const allKitchensMenu = await kitchenMenuDao.getAllKitchenMenu();
    // console.log(allKitchensMenu.length);
    const promiseArr = [];
    allKitchensMenu.forEach(async (kitchenMenu) => {
      const kitchen = await kitchendao.getKitchenPartner(kitchenMenu.kitchenId)
      const kitchenMenuObj = {};
      kitchenMenuObj.kitchenId = kitchenMenu.kitchenId;
      kitchenMenuObj.clusters = kitchen.clusters;
      kitchenMenuObj.geolocation = JSON.stringify(kitchen.geolocation);
      promiseArr.push(kitchenMenuDao.saveKitchenMenu(kitchenMenuObj));
    });
    return await Promise.all(promiseArr);
  } catch (error) {
    // console.log('error while updateKitchenMenuLocation', error)
  }
}

const updateKitchenTodaysMenuLocation = async () => {
  try {
    const allKitchensTodaysMenu = await todaysMenuDao.getAllKitchenTodaysMenu();
    // console.log(allKitchensTodaysMenu.length);
    const promiseArr = [];
    allKitchensTodaysMenu.forEach(async (kitchenTodaysMenu) => {
      const kitchen = await kitchendao.getKitchenPartner(kitchenTodaysMenu.kitchenId)
      const kitchenTodaysMenuObj = {};
      kitchenTodaysMenuObj._id = kitchenTodaysMenu.kitchenId;
      kitchenTodaysMenuObj.clusters = kitchen.clusters;
      kitchenTodaysMenuObj.kitchenName = kitchen.kitchenName;
      kitchenTodaysMenuObj.kitchenSpeciality = kitchen.kitchenSpeciality;
      kitchenTodaysMenuObj.kitchenOpened = kitchen.kitchenOpened;
      kitchenTodaysMenuObj.clusters = kitchen.clusters;
      kitchenTodaysMenuObj.geolocation = JSON.stringify(kitchen.geolocation);
      promiseArr.push(todaysMenuDao.updateKitchenInfo(kitchenTodaysMenuObj));
    });
    return await Promise.all(promiseArr);
  } catch (error) {
    // console.log('error while updateKitchenTodaysMenuLocation', error)
  }
}

const handleAlldayMenu = async () => {
  try {
    const allKitchensMenu = await kitchenMenuDao.getAllKitchenMenu();
    // console.log(allKitchensMenu.length);
    const promiseArr = [];
    allKitchensMenu.forEach(async (kitchenMenu) => {
      kitchenMenu.itemList.forEach(item => {
        // console.log(item.itemName,item.itemAvailable,item.serveDaily);
        if (!item.itemAvailable && item.serveDaily) {
          // console.log('updaing item',kitchenMenu.kitchenName, item.itemName);          
          promiseArr.push(kitchenMenuDao.updateItemServeDaily(kitchenMenu._id, item._id, false));
        }
      })
    })
    return await Promise.all(promiseArr);
  } catch (error) {
    // console.log('error while updateKitchenPartnerLocation', error)
  }
}

const cleanlatlng = async () => {
  try {
    const allCustomer = await customerdao.getCustomerProfileList();
    // console.log('allCustomer ',allCustomer.length);
    const promiseArr = [];
    let userWithoutLatlng = {};
    let validCount = 0;
    allCustomer.forEach(user => {
      if (user && user.addressList && user.addressList.length > 0) {
        user.addressList.forEach(address => {
          if (address.geolocation && address.geolocation.lat) {
            validCount++;
          } else {
            if (userWithoutLatlng[user.phoneNo]) {
              userWithoutLatlng[user.phoneNo].addressId.push(address._id);
            } else {
              userWithoutLatlng[user.phoneNo] = { phoneNo: user.phoneNo, addressId: [address._id] };
            }
          }
        });
      }
    });
    const finalList = Object.values(userWithoutLatlng);
    // console.log('validCount ',validCount);
    // console.log('finalList ',finalList.length);
    return finalList;
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const cleanAddress = async (customerList) => {
  try {
    const promiseArr = [];
    // console.log('cleanAddress ',customerList.length);
    customerList.forEach(async (addressObj) => {
      promiseArr.push(customerdao.cleanAddress(addressObj));
    });
    return await Promise.all(promiseArr);
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const checkPhoneNo = async () => {
  try {
    return await foodOrderDao.checkPhoneNo()
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const assignCashback = async () => {
  try {
    const customerList = await customerdao.getCustomerProfileList();
    const promiseArr = [];
    // console.log('assignCashback ',customerList.length);
    const notificationList = [];
    customerList.forEach(async (customer) => {
      if (customer.phoneNo) {
        const cashbackObj = {
          title: 'CASHBACK' + 500,
          remark: 'mealawe cashback 500',
          customerId: customer._id,
          customerName: customer.userName ? customer.userName : 'mealawe user',
          customerPhoneNo: customer.phoneNo,
          customerEmail: customer.email,
          cashbackPoints: 500
        };
        notificationList.push(cashbackObj);
        promiseArr.push(cashbackDao.saveCashBack(cashbackObj));
      }
    });
    assignCaskBackAndSendNotification(notificationList, 0);
    return await Promise.all(promiseArr);
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}
const assignCaskBackAndSendNotification = (list, index) => {
  try {
    if (list && list.length > 0) {
      if (index < list.length) {
        const ele = list[index];
        const msg = `Dear ${ele.customerName}, you have got ${ele.cashbackPoints} cashback points. Keep ordering on mealawe.`;
        sendGenericFcmMessage(msg, ele.customerId, 'USER');
        index++;
        setTimeout(() => {
          assignCaskBackAndSendNotification(list, index);
        }, 200);
      }
    }
  } catch (e) {
    // console.log('erroe while getting food order ',e);
  }
}
const getCustomerListDateRange = async (startDate) => {
  try {
    return await customerdao.getCustomerListDateRange(startDate);
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}
const setInflateFlag = async () => {
  try {
    return await foodItemDao.setInflateFlag();
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const setInflateFlagKitchenMenu = async () => {
  try {
    return await kitchenMenuDao.setInflateFlagKitchenMenu();
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const setPreparationTime = async () => {
  try {
    return await foodItemDao.setPreparationTime();
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const getCommerceMealOrders = async () => {
  try {
    return await getWooCommerceMealOrders();
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const checkOTP = async () => {
  try {
    sendOTPsms('125463', 'mealawe', '9970241511');
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const setCustomerCreatedOn = async () => {
  try {
    return await customerdao.setCustomerCreatedOn();
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const assignRandomRating = async () => {
  try {
    return await kitchendao.assignRandomRating();
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const assignKitchenType = async () => {
  try {
    return await kitchendao.assignKitchenType();
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const accessDeskDyneData = (payload) => {
  // try{
  return deskdyneAPIUtil(payload);
  // }catch(error){
  // // console.log('error while cleanlatlng', error)
  // }
}

const createPidgeTaskApi = async () => {
  try {
    return await performPidgeTask();
    // return await createTookanTask();
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}
const updateBulkMainMenuItemId = async () => {
  try {
    const itemList = await getAllBulkFooditems();
    const bullkMenuList = await getAllBulkMenu();

    const promiseArr = [];
    bullkMenuList.forEach(async (menu) => {
      menu.itemList.forEach(item => {
        itemList.forEach(mainItem => {
          if (mainItem.itemName == item.itemName) {
            // console.log('match found',mainItem.itemName);
            item.mainMenuItemId = mainItem._id;
          }
        });
      });
      promiseArr.push(await updateBulkMenu(menu, menu._id))
    });
    return await Promise.all(promiseArr);
  } catch (error) {

  }
}

const testProcessLock = async () => {
  try {
    return await saveProcessLock('TEST');
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const getLocationByIP = async (ip) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = false;
      resolve({ status: true, result })
    } catch (error) {
      // console.log(error)
      resolve({ status: false });
    }
  })
}

const setFeedbackCreatedOn = async () => {
  try {
    return await setfeedbackDate();
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const updateOrderCluster = async () => {
  try {
    const futureOrders = await foodOrderDao.getFutureOrders();
    const promiseArr = [];
    futureOrders.forEach(async (foodOrder) => {
      const clusterObj = await checkLatLngInCluster(foodOrder.customerLocation.geolocation);
      if (clusterObj) {
        foodOrder.clusterId = clusterObj.clusterId;
        foodOrder.clusterName = clusterObj.clusterName;
      }
      // console.log(foodOrder._id,foodOrder.clusterName);
      promiseArr.push(foodOrderDao.updateClusterInfo(foodOrder));
    });
    return await Promise.all(promiseArr);

  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const updateOrderPackageCluster = async () => {
  try {
    const futureOrders = await foodOrderPackageDao.getFutureOrders();
    const promiseArr = [];
    futureOrders.forEach(async (foodOrder) => {
      const clusterObj = await checkLatLngInCluster(foodOrder.customerLocation.geolocation);
      if (clusterObj) {
        foodOrder.clusterId = clusterObj.clusterId;
        foodOrder.clusterName = clusterObj.clusterName;
      }
      // console.log(foodOrder._id,foodOrder.clusterName);
      promiseArr.push(foodOrderPackageDao.updateClusterInfo(foodOrder));
    });
    return await Promise.all(promiseArr);

  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const kitchenWiseOrders = async () => {
  try {
    return await foodOrderDao.kitchenWiseOrders()
  } catch (error) {
    // console.log('error while cleanlatlng', error)
  }
}

const kitchenOrderPhotoDelete = async () => {
  try {
    console.log('kitchenOrderPhotoDelete###^^^')
    const list = await foodOrderDao.kitchenOrderPhotoDelete();
    const promiseArr = [];
    let count = 0;
    console.log('orderCount', list.length);
    list.forEach((order) => {
      if (order.beforePackingImageUrl) {
        promiseArr.push(imageService.deleteImage(order.beforePackingImageUrl));
        count++;
        console.log('count', count, 'orderDate', order.orderDate);
      }
      if (order.afterPackingImageUrl) {
        promiseArr.push(imageService.deleteImage(order.afterPackingImageUrl));
        count++;
        console.log('count', count);
      }
    });
    console.log('total image being deleted', count)
    await Promise.all(promiseArr);
    console.log('total image deleted', count)
    return { count };
  } catch (error) {
    console.log('error while updateKitchenPartnerLocation', error)
  }
}

const kitchenOrderPhotoDownload = async () => {
  try {
    console.log('kitchenOrderPhotoDelete###^^^')
    const list = await foodOrderDao.kitchenOrderPhotoDownlaod();
    console.log('orderCount', list.length);
    const finalList = [];
    if (list && list.length > 0) {
      list.forEach((order) => {
        if (order.beforePackingImageUrl) {
          finalList.push(order.beforePackingImageUrl)
        }
        if (order.afterPackingImageUrl) {
          finalList.push(order.afterPackingImageUrl);
        }
      });
      return finalList;
    } else {
      return finalList;
    }
  } catch (error) {
    // console.log('error while updateKitchenPartnerLocation', error)
  }
}

const assignPincode = async () => {
  try {
    const allCustomer = await customerdao.getCustomerProfileList();
    // console.log('allCustomer ',allCustomer.length);
    const promiseArr = [];
    allCustomer.forEach(user => {
      if (user && user.addressList && user.addressList.length > 0) {
        const upatedAddressList = user.addressList.map(userAddress => {
          let pin;
          if (userAddress.location) {
            const res = userAddress.location.match(/\b\d{6}\b/);
            if (res && res.length > 0) {
              pin = res[0];
            }
          }
          if (!pin && userAddress.address) {
            const res = userAddress.address.match(/\b\d{6}\b/);
            if (res && res.length > 0) {
              pin = res[0];
            }
          }
          if (pin) {
            userAddress.pincode = pin
          }
          return userAddress;
        });
        if (upatedAddressList.length > 0) {
          promiseArr.push(customerdao.updateAddressList(user._id, upatedAddressList));
          // promiseArr.push(upatedAddressList);
        }
      }
    });
    const list = await Promise.all(promiseArr);
    return { count: list.length };
  } catch (error) {
    console.log('error while assignPincode', error)
  }
}

const logoutAllAuthAdmin = async () => {
  try {
    return await logoutAllAdmin();
  } catch (error) {
    console.log('error while logoutAllAdmin', error)
  }
}

const assignClusterToKitchen = async () => {
  try {
    const allKitchensList = await kitchendao.getAllKitchenPatners();
    const promiseArr = [];
    allKitchensList.forEach(async (kitchen) => {
      const clusters = await checkLatLngInCluster(kitchen.geolocation);
      console.log('clusters', clusters);
      if (clusters && clusters.length > 0) {
        const kitchenClusters = clusters.map(cluster => cluster.clusterId);
        console.log('kitchenClusters', kitchenClusters);
        const kitchenObj = {}
        kitchenObj.clusters = JSON.stringify(kitchenClusters);
        promiseArr.push(kitchendao.updateKitchenPatner(kitchen._id, kitchenObj));
        //promiseArr.push(kitchenObj);
      }

    });
    return await Promise.all(promiseArr);
  } catch (error) {
    // console.log('error while updateKitchenPartnerLocation', error)
  }
}

const assignkitchenIdToWallet = async () => {
  try {
    const allKitchensList = await kitchendao.getAllKitchenPatners();
    const promiseArr = [];
    allKitchensList.forEach(async (kitchen) => {
      promiseArr.push(updateKitchenIdAndName(kitchen._id, kitchen.loginId, kitchen.kitchenName))
    });
    return await Promise.all(promiseArr);
  } catch (error) {
    console.log('error while assignkitchenIdToWallet', error)
  }
}

const removeKotaDeliveryVendor = async () => {
  try {
    return await foodOrderDao.removeKotaDeliveryVendor()
  } catch (error) {
    console.log('error while logoutAllAdmin', error)
  }
}

const assignRMToCustNOrder = async () => {
  try {
    const adminList = await getAdminProfileList();
    const salesList = adminList.filter(admin => {
      if (admin.role === 'CUSTOMERSUCCESS' && admin.loginId != 'CX1') {
        console.log(admin.loginId, admin.name)
        return true
      } else {
        return false
      }
    });
    console.log('salesList', salesList.length);
    const subEndDetails = await getSubscriptionEndDetails();
    const acitveOrderList = [
      ...subEndDetails.endingInFuture, ...subEndDetails.ending2DayAfter, ...subEndDetails.ending1DayAfter,
      // ...subEndDetails.ended1DayBefore,...subEndDetails.ended2DayBefore,...subEndDetails.endedLongBack
      ...subEndDetails.endingToday
    ];

    const allusers = acitveOrderList.map(masterId => masterId.customerId);
    const uniqueUsers = [...new Set(allusers)]
    console.log(allusers.length, uniqueUsers.length, acitveOrderList.length);

    if (salesList.length > 0) {
      let rmCount = 0;
      const promiseArr = [];
      uniqueUsers.forEach((customerId, index) => {
        console.log('rmCount', rmCount);
        let rmInfo;
        if (index < 111) {
          rmInfo = {
            rmId: 'CX3',
            rmName: 'Shivam Digraskar'
          }
        } else if (index >= 111 && index < 165) {
          rmInfo = {
            rmId: 'CX4',
            rmName: 'Shrutika Vaidya'
          }

        } else if (index >= 165 && index < 202) {
          rmInfo = {
            rmId: 'CX2',
            rmName: 'Vedang Vijay Gavai'
          }

        } else if (index >= 202 && index < 239) {
          rmInfo = {
            rmId: 'CX5',
            rmName: 'Vaishnavi Dumbre'
          }

        } else if (index >= 239) {
          rmInfo = {
            rmId: 'CX6',
            rmName: 'Varun Nandurkar'
          }

        }
        console.log(index, rmInfo);
        // const rmSelected = salesList[rmCount];
        // const rmInfo = {
        //   rmId: rmSelected.loginId,
        //   rmName: rmSelected.name
        // }
        promiseArr.push(customerdao.updateRMInfo(customerId, rmInfo));
        promiseArr.push(foodOrderPackageDao.updateRMInfo(customerId, rmInfo));
        promiseArr.push(foodOrderDao.updateRMInfo(customerId, rmInfo));
        //promiseArr.push({customerId,rmInfo});
        // rmCount++;
        // if(rmCount === salesList.length){
        //   rmCount = 0;
        // }
      });
      await Promise.all(promiseArr);
      return { salesList, count: promiseArr.length };
    }

    // return salesList;

  } catch (error) {
    console.log('error while logoutAllAdmin', error)
  }
}



module.exports = {
  callMetaEventAPI,
  updateKitchenPartnerLocation,
  updateKitchenMenuLocation,
  updateKitchenTodaysMenuLocation,
  handleAlldayMenu,
  cleanlatlng,
  cleanAddress,
  checkPhoneNo,
  assignCashback,
  getCustomerListDateRange,
  setInflateFlag,
  setInflateFlagKitchenMenu,
  setPreparationTime,
  getCommerceMealOrders,
  checkOTP,
  setCustomerCreatedOn,
  assignRandomRating,
  accessDeskDyneData,
  createPidgeTaskApi,
  updateBulkMainMenuItemId,
  testProcessLock,
  getLocationByIP,
  setFeedbackCreatedOn,
  assignKitchenType,
  updateOrderCluster,
  updateOrderPackageCluster,
  kitchenWiseOrders,
  kitchenOrderPhotoDelete,
  assignPincode,
  logoutAllAuthAdmin,
  assignClusterToKitchen,
  assignkitchenIdToWallet,
  removeKotaDeliveryVendor,
  assignClusterToKitchen,
  assignRMToCustNOrder
}