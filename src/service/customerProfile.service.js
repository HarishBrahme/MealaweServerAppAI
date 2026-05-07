const dao = require('../dao/customerProfile.dao');
const { autoUpdateLead } = require('../util/telecrm-util');

const saveNewCustomerProfile = async (CustomerProfile, imageName) => {
    const newCustomerProfile = await dao.saveNewCustomerProfile(CustomerProfile, imageName);
    return newCustomerProfile;
};

const getCustomerProfileList = async (req, res) => {
    const getCustomerProfileList = await dao.getCustomerProfileList();
    return getCustomerProfileList;
};

const getCustomerProfile = async (id) => {
    const getcustomerprofile = await dao.getCustomerProfile(id)
    return getcustomerprofile;
}

const updateCustomerProfile = async (id, CustomerProfile, imageName) => {
    const updatecustomerprofile = await dao.updateCustomerProfile(id, CustomerProfile, imageName)
    if (updatecustomerprofile && updatecustomerprofile.newUser) {
        setTimeout(() => {
            autoUpdateLead(
                {
                    phone: updatecustomerprofile.phoneNo,
                    name: updatecustomerprofile.name ? updatecustomerprofile.name : updatecustomerprofile.userName,
                    email: updatecustomerprofile.email,
                    installReferrer: updatecustomerprofile.installReferrer,
                    registeredPlatform: updatecustomerprofile.registeredPlatform,
                    lead_source: updatecustomerprofile.registeredPlatform,
                    is_new_customer: 'true',
                },
                [{ type: 'SYSTEM_NOTE', text: 'App Data: ' }]
            ).catch(err => console.error('TeleCRM autoUpdateLead failed:', err));
        }, 110000);
    }
    return updatecustomerprofile
}

const updatecustomerCurrLocation = async (id, location) => {
    let customerProfile = await getCustomerProfile(id);
    if (customerProfile && location.city && !customerProfile.currentLocation?.geolocation?.lat) {
        setTimeout(async () => {
            autoUpdateLead(
                {
                    phone: customerProfile.phoneNo,
                    pincode: location.pincode,
                    is_new_customer: 'true',
                },
                [{ type: 'SYSTEM_NOTE', text: 'App Data: ' }]
            ).catch(err => console.error('TeleCRM autoUpdateLead failed:', err));
        }, 1500000);
    }
    const updatecustomerprofile = await dao.updatecustomerCurrLocation(id, location)
    return updatecustomerprofile
}

const getUserCount = async () => {
    const updatecustomerprofile = await dao.getUserCount();
    return updatecustomerprofile
}

const validateReferralCode = async (referralCode) => {
    const result = await dao.validateReferralCode(referralCode);
    return result;
}

const searchUserWithFilter = async (filterObj, page) => {
    return await dao.searchUserWithFilter(filterObj, page);
};

const updateCouponList = async (phoneNo, couponCode) => {
    return await dao.updateCouponList(phoneNo, couponCode);
};

const getCustomerProfileByMobile = async (phoneNo) => {
    return await dao.getCustomerProfileByMobile(phoneNo);
};

const exportCustomerList = async (searchObj) => {
    return await dao.exportCustomerList(searchObj);
};

const updateInstallReferrer = async (loginId, installReferrer) => {
    return await dao.updateInstallReferrer(loginId, installReferrer);
};

const updateRMInfo = async (id, rmInfo) => {
    return await dao.updateRMInfo(id, rmInfo);
};

const updateOrderPlaced = async (customerId, platform) => {
    return await dao.updateOrderPlaced(customerId, platform);
};

const updateLastLogin = async (phoneNo) => {
    return await dao.updateLastLogin(phoneNo);
};

const userNotPurchaseOrPurchase = async () => {
    return await dao.userNotPurchaseOrPurchase();
};

module.exports = {
    saveNewCustomerProfile,
    getCustomerProfileList,
    getCustomerProfile,
    updateCustomerProfile,
    updatecustomerCurrLocation,
    getUserCount,
    validateReferralCode,
    searchUserWithFilter,
    updateCouponList,
    getCustomerProfileByMobile,
    exportCustomerList,
    updateInstallReferrer,
    updateRMInfo,
    updateOrderPlaced,
    updateLastLogin,
    userNotPurchaseOrPurchase
};