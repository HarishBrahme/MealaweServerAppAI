const dao = require('../dao/offerCoupon.dao');
const bulkDao = require('./bulkFoodOrder.service');

const { getCustomerCouponOrderList } = require('./foodorder.service');
const { getCustomerProfile } = require('./customerProfile.service')

const getOfferCouponList = async () => {
    return await dao.getOfferCouponList();
};
const getValidOfferCouponList = async () => {
    return await dao.getValidOfferCouponList();
};
const saveOfferCoupon = async (offerCoupon) => {
    return await dao.saveOfferCoupon(offerCoupon);
};
const updateOfferCoupon = async (id, offerCoupon) => {
    return await dao.updateOfferCoupon(id, offerCoupon);
};
const deleteOfferCoupon = async (id) => {
    return await dao.deleteOfferCoupon(id);
};
const validateCouponForUser = async (couponCode, userId, clientDate) => {
    return new Promise(async (resolve) => {
        try {
            const coupon = await dao.getOfferCouponByCode(couponCode);
            if (coupon && coupon._id) {
                // if(couponCode === 'FIRST10'){
                //     const previousOrder = await getCustomerOrderDetail(userId);
                //     if(previousOrder && previousOrder.length === 0){
                //         resolve({status:'VALID_OFFER'}); 
                //     }else{
                //         resolve({status:'INVALID', msg: 'Coupon applicable only on first order.'})
                //     }
                // }
                if (coupon.couponUsage === 'oneTimeOneUser') {
                    if (userId !== 'null') {
                        const order = await getCustomerCouponOrderList(userId, couponCode, null);
                        if (order && order._id) {
                            resolve({ status: 'INVALID', msg: 'This coupon has been used already.' })
                        }
                        else {
                            const order = await bulkDao.getCustomerCouponOrderList(userId, couponCode, null);
                            if (order && order._id) {
                                resolve({ status: 'INVALID', msg: 'This coupon has been used already.' })
                            }
                            else {
                                resolve({ status: 'VALID_OFFER' });
                            }
                        }
                    } else {
                        resolve({ status: 'INVALID', msg: 'Kindly login to use this coupon.' });
                    }
                } else if (coupon.couponUsage === 'oneTimeOneDay') {
                    if (userId !== 'null') {
                        const order = await getCustomerCouponOrderList(userId, couponCode, clientDate);
                        if (order && order._id) {
                            resolve({ status: 'INVALID', msg: 'This coupon can be used once in a day' })
                        } else {
                            const order = await bulkDao.getCustomerCouponOrderList(userId, couponCode, null);
                            if (order && order._id) {
                                resolve({ status: 'INVALID', msg: 'This coupon has been used already.' })
                            }
                            else {
                                resolve({ status: 'VALID_OFFER' });
                            }
                        }
                    } else {
                        resolve({ status: 'INVALID', msg: 'Kindly login to use this coupon.' });
                    }

                } else if (coupon.couponUsage === 'everytime') {
                    resolve({ status: 'VALID_OFFER' });
                }
            } else {
                resolve({ status: 'INVALID', msg: 'Coupon is not valid.' });
            }
        } catch (error) {
            // console.log('validateCouponForUser error ==>',error);
            resolve({ status: 'ERROR' });
        }
    });
};

const getValidUserCouponList = async (clientDate, customerId) => {
    return new Promise(async (resolve) => {
        try {
            let couonList = [];
            if (customerId && customerId !== 'null') {
                const customerProfile = await getCustomerProfile(customerId);
                if (customerProfile && customerProfile._id
                    && customerProfile.couponList && customerProfile.couponList.length > 0) {
                    couonList = customerProfile.couponList;
                }
            }
            const list = await dao.getValidUserCouponList(clientDate, couonList);
            resolve(list)
        } catch (error) {
            // console.log('validateCouponForUser error ==>',error);
            resolve([]);
        }
    });
};


const getValidClusterUserCouponList = async (customerId, clusters) => {
    return new Promise(async (resolve) => {
        try {
            let couonList = [];
            if (customerId && customerId !== 'null') {
                const customerProfile = await getCustomerProfile(customerId);
                if (customerProfile && customerProfile._id
                    && customerProfile.couponList && customerProfile.couponList.length > 0) {
                    couonList = customerProfile.couponList;
                }
            }
            const list = await dao.getValidClusterUserCouponList(couonList, clusters);
            resolve(list)
        } catch (error) {
            // console.log('validateCouponForUser error ==>',error);
            resolve([]);
        }
    });
};

const getValidClusterOrderTypeUserCouponList = async (customerId, clusters, orderType) => {
    return new Promise(async (resolve) => {
        try {
            let couonList = [];
            if (customerId && customerId !== 'null') {
                const customerProfile = await getCustomerProfile(customerId);
                if (customerProfile && customerProfile._id
                    && customerProfile.couponList && customerProfile.couponList.length > 0) {
                    couonList = customerProfile.couponList;
                }
            }
            const list = await dao.getValidClusterOrderTypeUserCouponList(couonList, clusters, orderType);
            resolve(list)
        } catch (error) {
            // console.log('validateCouponForUser error ==>',error);
            resolve([]);
        }
    });
};

module.exports = {
    getOfferCouponList,
    getValidOfferCouponList,
    saveOfferCoupon,
    updateOfferCoupon,
    deleteOfferCoupon,
    validateCouponForUser,
    getValidUserCouponList,
    getValidClusterUserCouponList,
    getValidClusterOrderTypeUserCouponList
}