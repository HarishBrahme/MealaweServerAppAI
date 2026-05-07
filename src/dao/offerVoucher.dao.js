const OfferVoucher = require('../model/offerVoucher.model');

const getOfferVoucherList = async () => {
    const list = await OfferVoucher.find({});
    return list;
};
const getValidVoucher = async (voucherCode, orderType, clusters) => {
    let today = new Date();
    // const regexText = new RegExp(voucherCode, 'i');
    if(orderType==='apartment_today' || orderType==='apartment_advance'){
        orderType='apartment';
    }
    condition = {
        voucherCode: voucherCode.toUpperCase(),
        orderTypes: { $in: [orderType] },
        startDate: { $lte: today },
        expiryDate: { $gte: today }
    };
    // 'advance', 'daily', 'allDay', 'subscription','bulk'
    if ((orderType == 'advance' || orderType == 'daily' || orderType == 'allDay' || orderType == 'subscription' || orderType == 'bulk') && clusters) {
        condition.clusters = { $in: [...clusters] }
    }
    const voucher = await OfferVoucher.findOne(condition);
    return voucher;
};

const saveOfferVoucher = async (offerVoucher) => {
    const nOfferVoucher = new OfferVoucher();
    nOfferVoucher.voucherCode = offerVoucher.voucherCode.toUpperCase();
    nOfferVoucher.termsAndConditions = offerVoucher.termsAndConditions;
    nOfferVoucher.description = offerVoucher.description;
    nOfferVoucher.discountType = offerVoucher.discountType;
    nOfferVoucher.maxLimit = offerVoucher.maxLimit;
    nOfferVoucher.discountValue = offerVoucher.discountValue;
    nOfferVoucher.minAmount = offerVoucher.minAmount;
    nOfferVoucher.startDate = new Date(offerVoucher.startDate);
    nOfferVoucher.expiryDate = new Date(offerVoucher.expiryDate);
    nOfferVoucher.voucherUsage = offerVoucher.voucherUsage;
    nOfferVoucher.orderTypes = offerVoucher.orderTypes;
    nOfferVoucher.clusters = offerVoucher.clusters;
    nOfferVoucher.marketplaceCategoryList = offerVoucher.marketplaceCategoryList;
    const saved = await nOfferVoucher.save();
    return saved;
};
const updateOfferVoucher = async (id, offerVoucher) => {
    const savedofferVoucher = await OfferVoucher.findOne({ _id: id })
    const nOfferVoucher = {};
    nOfferVoucher.termsAndConditions = offerVoucher.termsAndConditions || savedofferVoucher.termsAndConditions;
    nOfferVoucher.description = offerVoucher.description || savedofferVoucher.description;
    nOfferVoucher.voucherCode = offerVoucher.voucherCode || savedofferVoucher.voucherCode;
    nOfferVoucher.discountType = offerVoucher.discountType || savedofferVoucher.discountType;
    nOfferVoucher.maxLimit = offerVoucher.maxLimit || savedofferVoucher.maxLimit;
    nOfferVoucher.discountValue = offerVoucher.discountValue || savedofferVoucher.discountValue;
    nOfferVoucher.minAmount = offerVoucher.minAmount || savedofferVoucher.minAmount;
    nOfferVoucher.voucherUsage = offerVoucher.voucherUsage || savedofferVoucher.voucherUsage;
    nOfferVoucher.orderTypes = offerVoucher.orderTypes || savedofferVoucher.orderTypes;
    nOfferVoucher.clusters = offerVoucher.clusters || savedofferVoucher.clusters;
    nOfferVoucher.marketplaceCategoryList = offerVoucher.marketplaceCategoryList || savedofferVoucher.marketplaceCategoryList;
    if (offerVoucher.startDate) {
        nOfferVoucher.startDate = new Date(offerVoucher.startDate)
    }
    if (offerVoucher.expiryDate) {
        nOfferVoucher.expiryDate = new Date(offerVoucher.expiryDate)
    }
    const updated = await OfferVoucher.findOneAndUpdate({ _id: id }, { $set: nOfferVoucher }, { new: true });
    return updated;
};
const deleteOfferVoucher = async (id) => {
    const deleted = OfferVoucher.findByIdAndRemove({ _id: id });
    return deleted;
}

module.exports = {
    getOfferVoucherList,
    getValidVoucher,
    saveOfferVoucher,
    updateOfferVoucher,
    deleteOfferVoucher
};