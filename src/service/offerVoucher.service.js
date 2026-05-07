const dao = require('../dao/offerVoucher.dao');
const { getCustomerVoucherOrderList, getVoucherUsedOrderList } = require('./foodorder.service');
const bulkDao = require('./bulkFoodOrder.service');
const { getCustomerProfile } = require('./customerProfile.service')

const getOfferVoucherList = async () => {
    return await dao.getOfferVoucherList();
};
const getValidOfferVoucherList = async () => {
    return await dao.getValidOfferVoucherList();
};
const saveOfferVoucher = async (offerVoucher) => {
    return await dao.saveOfferVoucher(offerVoucher);
};
const updateOfferVoucher = async (id, offerVoucher) => {
    return await dao.updateOfferVoucher(id, offerVoucher);
};
const deleteOfferVoucher = async (id) => {
    return await dao.deleteOfferVoucher(id);
};
const validateVoucherCode = async (voucherCode, userId, orderType, clusters) => {
    return new Promise(async (resolve) => {
        try {
            const voucher = await dao.getValidVoucher(voucherCode, orderType, clusters);
            if (voucher && voucher._id) {
                // resolve(voucher);
                if (voucher.voucherUsage === 'oneTimeOneUser') {
                    if (userId !== 'null') {
                        const order = await getCustomerVoucherOrderList(userId, voucherCode, false);
                        if (order && order._id) {
                            resolve({ status: 'INVALID', msg: 'This voucher code has been used already.' })
                        }
                        else {
                            if (orderType == 'bulk') {
                                const order = await bulkDao.getCustomerVoucherOrderList(userId, voucherCode, false);
                                if (order && order._id) {
                                    resolve({ status: 'INVALID', msg: 'This voucher code has been used already.' })
                                }
                                else {
                                    resolve({ status: 'VALID_OFFER', voucher });
                                }
                            }
                            else {
                                resolve({ status: 'VALID_OFFER', voucher });
                            }
                        }
                    } else {
                        resolve({ status: 'INVALID', msg: 'Kindly login to use this voucher.' });
                    }

                } else if (voucher.voucherUsage === 'oneTimeOneDay') {
                    if (userId !== 'null') {
                        const order = await getCustomerVoucherOrderList(userId, voucherCode, true);
                        if (order && order._id) {
                            resolve({ status: 'INVALID', msg: 'This voucher can be used once in a day' })
                        } else {
                            if (orderType == 'bulk') {
                                const order = await bulkDao.getCustomerVoucherOrderList(userId, voucherCode, false);
                                if (order && order._id) {
                                    resolve({ status: 'INVALID', msg: 'This voucher code has been used already.' })
                                }
                                else {
                                    resolve({ status: 'VALID_OFFER', voucher });
                                }
                            }
                            else {
                                resolve({ status: 'VALID_OFFER', voucher });
                            }
                        }
                    } else {
                        resolve({ status: 'INVALID', msg: 'Kindly login to use this coupon.' });
                    }

                } else if (voucher.voucherUsage === 'oneTimeOnly') {
                    if (userId !== 'null') {
                        const order = await getVoucherUsedOrderList(voucherCode);
                        if (order && order._id) {
                            resolve({ status: 'INVALID', msg: 'This voucher has been used already' })
                        }
                        else {
                            if (orderType == 'bulk') {
                                const order = await bulkDao.getVoucherUsedOrderList(voucherCode);
                                if (order && order._id) {
                                    resolve({ status: 'INVALID', msg: 'This voucher has been used already' })
                                }
                                else {
                                    resolve({ status: 'VALID_OFFER', voucher });
                                }
                            }
                            else {
                                resolve({ status: 'VALID_OFFER', voucher });
                            }
                        }
                    } else {
                        resolve({ status: 'INVALID', msg: 'Kindly login to use this coupon.' });
                    }

                } else if (voucher.voucherUsage === 'everytime') {
                    resolve({ status: 'VALID_OFFER', voucher });
                }
            } else {
                resolve({ status: 'INVALID', msg: 'Voucher code is not valid.' });
            }
        } catch (error) {
            // console.log('validateVoucherCode error',error);
            resolve({ status: 'INVALID' });
        }
    });
};

module.exports = {
    getOfferVoucherList,
    getValidOfferVoucherList,
    saveOfferVoucher,
    updateOfferVoucher,
    deleteOfferVoucher,
    validateVoucherCode
}