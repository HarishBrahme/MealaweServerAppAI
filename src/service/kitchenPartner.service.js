const dao = require('../dao/kitchenPartner.dao');
const kitchenMenu = require('./kitchenMenu.service');
const todaysMenu = require('./todaysMenu.service');
const { kitchenLoginIdsms } = require('../util/sms-provider-util');
const { checkKitchenEnrollReward } = require('../util/reward-points-util');
const { sendGenericFcmMessage } = require('../util/fcm-message-handler');
const authKitchen = require('./authKitchen.service')
const { saveKitchenTransactionHistory, updatedKitchenTransactionHistory } = require('./kitchenTransactionHistory.service');
const { withdrawWalletBalance, depositeWalletBalance, getKitchenWallet } = require('../dao/kitchenWallet.dao');

const saveNewKitchenPatner = async (kitchenPartner, imageName) => {
    return new Promise(async (resolve, reject) => {
        if (kitchenPartner.phoneNo) {
            try {
                const kitchenAuthObj = await authKitchen.registerKitchen(kitchenPartner.phoneNo);
                // console.log(kitchenAuthObj);
                kitchenPartner.loginId = kitchenAuthObj.kitchenId;
                const kitchenProfile = await dao.saveNewKitchenPatner(kitchenPartner, imageName);
                kitchenLoginIdsms(kitchenProfile.loginId, kitchenProfile.kitchenPartnerName, kitchenProfile.phoneNo);
                if (kitchenProfile.installReferrer) {
                    checkKitchenEnrollReward(kitchenProfile.installReferrer)
                }
                resolve(kitchenProfile);
            } catch (e) {
                reject();
            }
        } else {
            reject('Phone no. is not provided')
        }
    });
};
const updateApartmentInfo = async (id, apartmentInfo) => {
    const updatedKitchen = await dao.updateApartmentInfo(id, apartmentInfo);
    // You might want to update kitchen menu or today's menu if needed
    return updatedKitchen;
};

const deleteKitchenPartner = async (id) => {
    return dao.deleteKitchenPartner
}

const getKitchenPartner = async (id) => {
    return dao.getKitchenPartner(id)
}

const validateKitchenPartner = async (body) => {
    return dao.validateKitchenPartner(body)
}

const getKitchenPartnerProfile = async (id) => {
    return dao.getKitchenPartnerProfile(id)
}

const getKitchenPartnerList = async (clusterList, pageNumber, nPerPage) => {
    return dao.getKitchenPartnerList(clusterList, pageNumber, nPerPage)
}

const KitchenOpenedStatus = async (id, status) => {
    return dao.setKitchenOpenedStatus(id, status);
}

const updateMealTimig = async (id, mealtiming) => {
    return dao.updateMealTimig(id, mealtiming)
}
const getKitchenPartnerListByIds = async (ids) => {
    return dao.getKitchenPartnerListByIds(ids)
}
const searchKitchenWithFilter = async (filterObj, page) => {
    return dao.searchKitchenWithFilter(filterObj, page)
}
const updateKitchenPatner = async (id, kitchenPartner, imageName) => {
    const updatedKitchen = await dao.updateKitchenPatner(id, kitchenPartner, imageName);
    kitchenMenu.updateKitchenInfo(updatedKitchen);
    todaysMenu.updateKitchenInfo(updatedKitchen);
    return updatedKitchen;
}

const getKitchenPatnerCount = async () => {
    return dao.getKitchenPatnerCount()
}
const updateKitchenCompliance = async (id, complianceObj, filenames) => {
    return dao.updateKitchenCompliance(id, complianceObj, filenames);
}

const updateProfileApproval = async (id, status, comment) => {
    return dao.updateProfileApproval(id, status, comment);
}
const updateDiscountOffer = async (id, discountOffer) => {
    return dao.updateDiscountOffer(id, discountOffer);
}
const updatePreparationTime = async (id, preparationTime) => {
    return dao.updatePreparationTime(id, preparationTime);
}
const getNearestKitchen = async (clusterList, page, lng, lat) => {
    return dao.getNearestKitchen(clusterList, page, lng, lat);
}

const getNearestKitchensOfType = async (clusterList, page, lng, lat, kitchenType) => {
    return dao.getNearestKitchensOfType(clusterList, page, lng, lat, kitchenType);
}

const validateKitchenReferralCode = async (referralCode) => {
    const result = await dao.validateKitchenReferralCode(referralCode);
    return result;
}
const getClusterKitchenPartnerList = async (clusterList) => {
    return dao.getClusterKitchenPartnerList(clusterList);
}
const sendTestNotification = async (kithenId, msg) => {
    const result = await dao.getKitchenPartnerProfile(kithenId);
    if (result && result._id) {
        sendGenericFcmMessage(msg, result._id, 'KITCHEN');
        return { status: true };
    } else {
        return { status: false };
    }
}

const updateComplianceByAdmin = async (id, complianceObj, filenames) => {
    return dao.updateComplianceByAdmin(id, complianceObj, filenames);
}

const updateSubscriptionDetails = async (id, subscriptionObj) => {
    return dao.updateSubscriptionDetails(id, subscriptionObj);
}

const getKitchenbyMobile = async (phoneNo) => {
    return dao.getKitchenbyMobile(phoneNo);
}

const getKitchenActualNobymapTelNo = async (mapTelNo) => {
    return dao.getKitchenActualNobymapTelNo(mapTelNo);
}

const exportKitchenPartners = async (searchObj) => {
    return dao.exportKitchenPartners(searchObj);
}


const deductkitchenWallet = async (kitchenId, kitchenName, amountToDeduct, remark, category) => {
    return new Promise(async (resolve, reject) => {
        try {
            const wallet = await getKitchenWallet(kitchenId);
            const balance = wallet.wallet_balance ? wallet.wallet_balance : 0;
            if (amountToDeduct <= balance) {
                const transactionHistoryObj = {
                    status: 'inprogress',
                    mode: 'wallet',
                    transaction_amount: amountToDeduct,
                    created_at: new Date(),
                    kitchenId: kitchenId,
                    kitchenName: kitchenName,
                    walletPreviousBalance: wallet.wallet_balance,
                    transactionType: 'Debit',
                    remark: remark,
                    category: category
                };
                // console.log('deductkitchenWallet transactionHistoryObj ',transactionHistoryObj);
                const kitchenTransactionHistory = await saveKitchenTransactionHistory(transactionHistoryObj);
                await withdrawWalletBalance(kitchenId, amountToDeduct);
                await updatedKitchenTransactionHistory(kitchenTransactionHistory._id, {status:'completed'});
                resolve({ status: true });
            } else {
                reject('Amount to deduct is more than wallet balance');
            }
        } catch (error) {
            reject('Error while updating kitchen wallet');
        }
    });
}

const addkitchenWallet = async (kitchenId, kitchenName, amountToAdd, remark, category) => {
    return new Promise(async (resolve, reject) => {
        try {
            const wallet = await getKitchenWallet(kitchenId);
            const transactionHistoryObj = {
                status: 'inprogress',
                mode: 'wallet',
                transaction_amount: amountToAdd,
                created_at: new Date(),
                kitchenId: kitchenId,
                kitchenName: kitchenName,
                walletPreviousBalance: wallet.wallet_balance ? wallet.wallet_balance : 0,
                transactionType: 'Credit',
                remark: remark,
                category: category
            };
            console.log('addkitchenWallet transactionHistoryObj ',transactionHistoryObj);
            const kitchenTransactionHistory = await saveKitchenTransactionHistory(transactionHistoryObj);
            await depositeWalletBalance(kitchenId, parseFloat(amountToAdd));
            await updatedKitchenTransactionHistory(kitchenTransactionHistory._id, {status:'completed'});
            resolve({ status: true });
        } catch (error) {
            // console.log('Error while addkitchenWallet',error)
            reject('Error while updating kitchen wallet', error);
        }
    });
}
const getAllKitchenPatners = async () => {
    return await dao.getAllKitchenPatners()
}

const getNearestKitchensOfApartment = async (page, lng, lat, filters = {}) => {
    return dao.getNearestKitchensOfApartment(page, lng, lat, filters);
};

module.exports = {
    saveNewKitchenPatner,
    getKitchenPartner,
    validateKitchenPartner,
    getKitchenPartnerProfile,
    deleteKitchenPartner,
    KitchenOpenedStatus,
    updateMealTimig,
    getKitchenPartnerList,
    getKitchenPartnerListByIds,
    searchKitchenWithFilter,
    updateKitchenPatner,
    getKitchenPatnerCount,
    updateKitchenCompliance,
    updateProfileApproval,
    updateDiscountOffer,
    updatePreparationTime,
    getNearestKitchen,
    getNearestKitchensOfType,
    validateKitchenReferralCode,
    getClusterKitchenPartnerList,
    sendTestNotification,
    updateComplianceByAdmin,
    updateSubscriptionDetails,
    getKitchenbyMobile,
    deductkitchenWallet,
    addkitchenWallet,
    exportKitchenPartners,
    getAllKitchenPatners,
    updateApartmentInfo, // Add this
    getNearestKitchensOfApartment,
    getKitchenActualNobymapTelNo

}
