const CustomerProfile = require('../model/customerProfile.model');
const { deleteImage } = require('../service/images.service');
const { validLoginCredential } = require('./authUser.dao');
const { get24HoursStartTime, get48HoursStartTime, getLocalDate } = require('../util/date-util');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const saveNewCustomerProfile = async (customerProfile, imageName) => {
  const loginObj = await validLoginCredential(customerProfile.phoneNo, customerProfile.loginId);
  if (loginObj && loginObj._id) {
    let customer = await CustomerProfile.findOne({ phoneNo: customerProfile.phoneNo });
    if (customer && customer._id) {
      customer = await updateLastLogin(customerProfile.phoneNo)
      return customer;
    } {
      const nCustomerProfile = new CustomerProfile();
      nCustomerProfile.userName = customerProfile.userName;
      nCustomerProfile.imageUrl = imageName;
      nCustomerProfile.addressList = customerProfile.addressList;
      nCustomerProfile.phoneNo = customerProfile.phoneNo;
      nCustomerProfile.email = customerProfile.email;
      nCustomerProfile.preferences = customerProfile.preferences;
      nCustomerProfile.loginId = customerProfile.loginId;
      nCustomerProfile.referralCode = customerProfile.referralCode;
      nCustomerProfile.installReferrer = customerProfile.installReferrer;
      nCustomerProfile.registeredPlatform = customerProfile.registeredPlatform;
      nCustomerProfile.createdOn = getLocalDate();
      nCustomerProfile.lastLogin = getLocalDate();
      const isInserted = await nCustomerProfile.save();
      return isInserted;
    }
  } else {
    return {};
  }
}

const assignCashbackToReferral = async (installReferrer) => {
  try {
    if (installReferrer) {
      const referrer = await validateReferralCode(installReferrer);
      if (referrer && referrer.referrerId) {
      }
    }
  } catch (error) {
    console.log('error while assignCashbackToReferral ', error);
  }
}

const updateCustomerProfile = async (id, customerProfile, imageName) => {
  const condition = { _id: id };
  if (customerProfile.phoneNo) {
    condition.phoneNo = customerProfile.phoneNo
  }
  if (customerProfile.loginId) {
    condition.loginId = customerProfile.loginId
  }
  const profile = await CustomerProfile.findOne(condition);
  if (profile && profile._id) {
    if (!profile.registeredPlatform) {
      nCustomerProfile.registeredPlatform = customerProfile.registeredPlatform || profile.registeredPlatform;
    }
    const nCustomerProfile = {};
    nCustomerProfile.userName = customerProfile.userName || profile.userName;
    nCustomerProfile.currentLocation = customerProfile.currentLocation || profile.currentLocation;
    nCustomerProfile.imageUrl = imageName || profile.imageUrl;
    nCustomerProfile.addressList = customerProfile.addressList || profile.addressList;
    nCustomerProfile.email = customerProfile.email || profile.email;
    nCustomerProfile.preferences = customerProfile.preferences || profile.preferences;
    nCustomerProfile.referralCode = customerProfile.referralCode || profile.referralCode;
    nCustomerProfile.installReferrer = customerProfile.installReferrer || profile.installReferrer;
    const update = await CustomerProfile.findOneAndUpdate({ _id: id }, { $set: nCustomerProfile }, { new: true });
    if (imageName) {
      deleteImage(profile.imageUrl);
    }
    if (customerProfile.userName && !profile.userName) {
      update.newUser=true;
      try {
        assignCashbackToReferral(profile.installReferrer);
      } catch (error) {
        console.log('save customer profile gupshup error', error);
      }
    }
    return update;
  }
  else {
    return profile;
  }
}

const updatecustomerCurrLocation = async (id, location) => {
  try {
    const finalLocation = {
      tagLocation: location?.tagLocation,
      geolocation: { lat: location?.geolocation?.lat, lng: location?.geolocation?.lng },
      address: location?.address,
      location: location?.location,
      landmark: location?.landmark,
      pincode: location?.pincode,
      city: location?.city,
      state: location?.state
    }
    if (finalLocation) {
      const customerprofile = await CustomerProfile.findOneAndUpdate({ _id: id }, { currentLocation: finalLocation }, { new: true });
      return customerprofile;
    }
    return {};
  } catch (error) {
    console.log('updatecustomerCurrLocation', error)
    return {};
  }
};

const getCustomerProfileList = async () => {
  const customerprofile = await CustomerProfile.find({});
  return customerprofile;
};

const getCustomerProfile = async (id) => {
  const getcustomerprofile = await CustomerProfile.findById(id)
  return getcustomerprofile;
}

const getUserCount = async () => {
  const result = await CustomerProfile.countDocuments();
  return result;
}

const validateReferralCode = async (referralCode) => {
  const result = await CustomerProfile.findOne({ referralCode });
  if (result && result._id) {
    return { referrerId: result._id, referrerName: result.userName, referrerEmail: result.email, referrerPhone: result.phoneNo, referralCodeValid: true };
  } else {
    return { referralCodeValid: false };
  }
}

const searchUserWithFilter = async (searchObj, page) => {
  const limit = 50;
  const condition = {};
  if (searchObj.userName) {
    const regexText = new RegExp(searchObj.userName, 'i');
    condition.userName = regexText;
  }
  if (searchObj.phoneNo) {
    const regexText = new RegExp(searchObj.phoneNo, 'i');
    condition.phoneNo = regexText;
  }
  if (searchObj.email) {
    const regexText = new RegExp(searchObj.email, 'i');
    condition.email = regexText;
  }
  return await CustomerProfile.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
};

const updateCouponList = async (phoneNo, couponCode) => {
  const customerprofile = await CustomerProfile.findOne({ phoneNo });
  if (customerprofile && customerprofile._id) {
    let couponList = [];
    let couponAlreadyPresent = false;
    if (customerprofile.couponList) {
      couponList = customerprofile.couponList;
      if (couponList.indexOf(couponCode) >= 0) {
        couponAlreadyPresent = true;
      }
    }
    if (!couponAlreadyPresent) {
      couponList.push(couponCode);
      await CustomerProfile.findOneAndUpdate({ _id: customerprofile._id },
        { $set: { couponList } }, { new: true });
      return { status: 'valid' };
    } else {
      return { status: 'valid' };
    }
  } else {
    return { status: 'invalid' };
  }
}

const getCustomerProfileByMobile = async (phoneNo) => {
  const customerprofile = await CustomerProfile.findOne({ phoneNo });
  if (customerprofile && customerprofile._id) {
    return customerprofile;
  } else {
    return {};
  }
};

const getCustomerListDateRange = async (startDate) => {
  const timestamp = new Date(startDate);
  timestamp.setHours(0, 0, 0, 0);
  var hexSeconds = Math.floor(timestamp / 1000).toString(16);
  var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");
  return await CustomerProfile.find({ _id: { $gt: constructedObjectId } }, { phoneNo: 1, email: 1, userName: 1, _id: 0 });
}

const setCustomerCreatedOn = async () => {
  const customerprofileList = await CustomerProfile.find({ createdOn: { $exists: false } });
  if (customerprofileList && customerprofileList.length > 0) {
    const promiseArr = [];
    customerprofileList.forEach(async (customer) => {
      const createdOn = new Date(parseInt(customer._id.toString().substring(0, 8), 16) * 1000);
      promiseArr.push(await CustomerProfile.findOneAndUpdate({ _id: customer._id },
        { createdOn }, { new: true }));
    });
    return promiseArr;
  } else {
    return [];
  }
};

const exportCustomerList = async (searchObj) => {
  const condition = {};
  if (searchObj.fromDate) {
    condition.createdOn = { $gte: new Date(searchObj.fromDate) };
    if (searchObj.toDate) {
      condition.createdOn.$lte = new Date(searchObj.toDate);
    }
  }
  return await CustomerProfile.find(condition).sort({ createdOn: -1 });
}

const updateInstallReferrer = async (loginId, installReferrer) => {
  const savedProfile = await CustomerProfile.findOneAndUpdate({ loginId: ObjectId(loginId) }, { $set: { installReferrer } }, { new: true });
  return savedProfile;
}

const updateAddressList = async (id, addressList) => {
  const update = await CustomerProfile.findOneAndUpdate({ _id: id }, { $set: { addressList } }, { new: true });
  return update;
}

const updateRMInfo = async (id, rmInfo) => {
  const update = await CustomerProfile.findOneAndUpdate({ _id: id }, { $set: { rmInfo } }, { new: true });
  return update;
}

const updateOrderPlaced = async (customerId, platform) => {
  try {
    const customer = await CustomerProfile.findById(customerId);
    if (!customer) {
      return { status: "not_found" };
    }
    if (platform === "navmool") {
      customer.navmoolOrderPlaced = true;
    } else if (platform === "mealawe") {
      customer.mealaweOrderPlaced = true;
    }
    const update = await customer.save();
    return { status: "updated", data: update };
  } catch (error) {
    return { status: "error", error };
  }
};

const updateLastLogin = async (phoneNo) => {
  const phone = phoneNo.toString();
  const customer = await CustomerProfile.findOneAndUpdate(
    { phoneNo: phone },
    { $set: { lastLogin: getLocalDate() } },
    { new: true }
  );
  return customer;
};

const userNotPurchaseOrPurchase = async () => {
  try {
    const last24Hours = get24HoursStartTime();
    const last48Hours = get48HoursStartTime();
    const commonFilter = {
      registeredPlatform: { $ne: 'navmool_web' },
      mealaweOrderPlaced: { $ne: true }
    };
    const [usersLast24h, users24to48h] = await Promise.all([
      // Users created in last 24 hours
      CustomerProfile.find({
        ...commonFilter,
        createdOn: { $gte: last24Hours }
      }),
      // Users created between 24–48 hours
      CustomerProfile.find({
        ...commonFilter,
        createdOn: {
          $gte: last48Hours,
          $lt: last24Hours
        }
      })
    ]);

    return {
      last24HoursNotPurchasedMealawe: usersLast24h,
      last48HoursNotPurchasedMealawe: users24to48h
    };
  } catch (e) {
    console.error("Error while userNotPurchase:", e);
    return {};
  }
};

module.exports = {
  saveNewCustomerProfile,
  updateCustomerProfile,
  updatecustomerCurrLocation,
  getCustomerProfileList,
  getCustomerProfile,
  getUserCount,
  validateReferralCode,
  searchUserWithFilter,
  updateCouponList,
  getCustomerProfileByMobile,
  getCustomerListDateRange,
  setCustomerCreatedOn,
  exportCustomerList,
  updateInstallReferrer,
  updateAddressList,
  updateRMInfo,
  updateOrderPlaced,
  updateLastLogin,
  userNotPurchaseOrPurchase
}