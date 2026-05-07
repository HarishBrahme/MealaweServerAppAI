const OfferCoupon = require('../model/offerCoupon.model');
const { getTodayStartTime, getTodayEndTime } = require('../util/date-util');
const getLocalDate = () => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

const getOfferCouponList = async () => {
    const list = await OfferCoupon.find({});
    return list;
};
const getValidOfferCouponList = async () => {
    let today = getTodayStartTime();
    const list = await OfferCoupon.find({ startDate: { $lte: today }, expiryDate: { $gte: today } });
    return list;
};
const getValidUserCouponList = async (clientDate, couponList) => {
    let today = getTodayStartTime();
    let endToday = getTodayEndTime();
    let condition = { startDate: { $lte: today }, expiryDate: { $gte: today } };
    if (couponList && couponList.length > 0) {
        condition.$or = [{ couponScope: 'generic' }, { couponCode: { $in: [...couponList] } }];
    } else {
        condition.couponScope = 'generic';
    }
    const list = await OfferCoupon.find(condition);
    return list;

}

const getValidClusterUserCouponList = async (couponList, clusters, orderType) => {
    let today = getTodayStartTime();
    let endToday = getTodayEndTime();
    // 
    let condition = { startDate: { $lte: today }, expiryDate: { $gte: today }, clusters: { $in: [...clusters] } };
    if (couponList && couponList.length > 0) {
        condition.$or = [{ couponScope: 'generic' }, { couponCode: { $in: [...couponList] } }];
    } else {
        condition.couponScope = 'generic';
    }
    const list = await OfferCoupon.find(condition);
    return list;

}
const getValidClusterOrderTypeUserCouponList = async (couponList, clusters, orderType) => {
    let today = getTodayStartTime();
    let endToday = getTodayEndTime();
    let condition = { startDate: { $lte: today }, expiryDate: { $gte: today } };
    if (orderType === 'marketPlaceMain') {
        condition.orderTypes = { $in: ["marketPlaceMain"] }
    } else if (orderType === 'oyo') {
        condition.orderTypes = { $in: ["oyo"] }
    }else if (orderType === 'apartment_today'|| orderType === 'apartment_advance') {
        condition.orderTypes = { $in: ["apartment"] }
    } else if (orderType === 'apartmentBulk') {
        condition.orderTypes = { $in: ["apartmentBulk"] }
    }else {
    condition.clusters = { $in: [...clusters] }
    }
    if (couponList && couponList.length > 0) {
        condition.$or = [{ couponScope: 'generic' }, { couponCode: { $in: [...couponList] } }];
    } else {
        condition.couponScope = 'generic';
    }
    const list = await OfferCoupon.find(condition);
    return list;

}

const saveOfferCoupon = async (offerCoupon) => {
    const nOfferCoupon = new OfferCoupon();
    nOfferCoupon.couponCode = offerCoupon.couponCode;
    nOfferCoupon.couponHeader = offerCoupon.couponHeader;
    nOfferCoupon.termsAndConditions = offerCoupon.termsAndConditions;
    nOfferCoupon.description = offerCoupon.description;
    nOfferCoupon.discountType = offerCoupon.discountType;
    nOfferCoupon.maxLimit = offerCoupon.maxLimit;
    nOfferCoupon.discountValue = offerCoupon.discountValue;
    nOfferCoupon.minAmount = offerCoupon.minAmount;
    const startDate = new Date(offerCoupon.startDate);
    startDate.setHours(0, 0, 0, 0);
    nOfferCoupon.startDate = startDate;
    const expiryDate = new Date(offerCoupon.expiryDate);
    expiryDate.setHours(23, 59, 59, 999);
    nOfferCoupon.expiryDate = expiryDate;
    nOfferCoupon.subDescription = offerCoupon.subDescription;
    nOfferCoupon.orderTypes = offerCoupon.orderTypes;
    nOfferCoupon.couponScope = offerCoupon.couponScope;
    nOfferCoupon.couponUsage = offerCoupon.couponUsage;
    nOfferCoupon.offerAppliedOn = offerCoupon.offerAppliedOn;
    nOfferCoupon.discountOnDelivery = offerCoupon.discountOnDelivery;
    nOfferCoupon.discountOnItems = offerCoupon.discountOnItems;
    nOfferCoupon.appliedOnlyOnSpecial = offerCoupon.appliedOnlyOnSpecial;
    nOfferCoupon.applyFullDiscount = offerCoupon.applyFullDiscount;
    nOfferCoupon.seqWeightage = offerCoupon.seqWeightage;
    nOfferCoupon.clusters = offerCoupon.clusters;
    nOfferCoupon.marketplaceCategoryList = offerCoupon.marketplaceCategoryList;
    const saved = await nOfferCoupon.save();
    return saved;
};
const updateOfferCoupon = async (id, offerCoupon) => {
    const savedofferCoupon = await OfferCoupon.findOne({ _id: id })
    const nOfferCoupon = {};
    nOfferCoupon.couponHeader = offerCoupon.couponHeader || savedofferCoupon.couponHeader;
    nOfferCoupon.termsAndConditions = offerCoupon.termsAndConditions || savedofferCoupon.termsAndConditions;
    nOfferCoupon.description = offerCoupon.description || savedofferCoupon.description;
    nOfferCoupon.couponCode = offerCoupon.couponCode || savedofferCoupon.couponCode;
    nOfferCoupon.discountType = offerCoupon.discountType || savedofferCoupon.discountType;
    nOfferCoupon.maxLimit = offerCoupon.maxLimit || savedofferCoupon.maxLimit;
    nOfferCoupon.discountValue = offerCoupon.discountValue || savedofferCoupon.discountValue;
    nOfferCoupon.minAmount = offerCoupon.minAmount || savedofferCoupon.minAmount;
    nOfferCoupon.subDescription = offerCoupon.subDescription || savedofferCoupon.subDescription;
    nOfferCoupon.subDescription = offerCoupon.subDescription || savedofferCoupon.subDescription;
    nOfferCoupon.orderTypes = offerCoupon.orderTypes || savedofferCoupon.orderTypes;
    nOfferCoupon.couponScope = offerCoupon.couponScope || savedofferCoupon.couponScope;
    nOfferCoupon.couponUsage = offerCoupon.couponUsage || savedofferCoupon.couponUsage;
    nOfferCoupon.offerAppliedOn = offerCoupon.offerAppliedOn || savedofferCoupon.offerAppliedOn;
    nOfferCoupon.marketplaceCategoryList = offerCoupon.marketplaceCategoryList || savedofferCoupon.marketplaceCategoryList;
    if (offerCoupon.discountOnDelivery) {
        nOfferCoupon.discountOnDelivery = true;
    } else {
        nOfferCoupon.discountOnDelivery = false;
    }
    if (offerCoupon.discountOnItems) {
        nOfferCoupon.discountOnItems = true;
    } else {
        nOfferCoupon.discountOnItems = false;
    }
    if (offerCoupon.appliedOnlyOnSpecial) {
        nOfferCoupon.appliedOnlyOnSpecial = true;
    } else {
        nOfferCoupon.appliedOnlyOnSpecial = false;
    }
    if (offerCoupon.applyFullDiscount) {
        nOfferCoupon.applyFullDiscount = true;
    } else {
        nOfferCoupon.applyFullDiscount = false;
    }

    nOfferCoupon.seqWeightage = offerCoupon.seqWeightage || savedofferCoupon.seqWeightage;
    nOfferCoupon.clusters = offerCoupon.clusters || savedofferCoupon.clusters;
    if (offerCoupon.startDate) {
        const startDate = new Date(offerCoupon.startDate);
        startDate.setHours(0, 0, 0, 0);
        nOfferCoupon.startDate = startDate;
    }
    if (offerCoupon.expiryDate) {
        const expiryDate = new Date(offerCoupon.expiryDate);
        expiryDate.setHours(23, 59, 59, 999);
        nOfferCoupon.expiryDate = expiryDate;
    }
    const updated = await OfferCoupon.findOneAndUpdate({ _id: id }, { $set: nOfferCoupon }, { new: true });
    return updated;
};
const deleteOfferCoupon = async (id) => {
    const deleted = await OfferCoupon.findByIdAndRemove({ _id: id });
    return deleted;
}
const getOfferCouponByCode = async (couponCode) => {
    const coupon = await OfferCoupon.findOne({ couponCode });
    return coupon;
};
module.exports = {
    getOfferCouponList,
    getValidOfferCouponList,
    saveOfferCoupon,
    updateOfferCoupon,
    deleteOfferCoupon,
    getValidUserCouponList,
    getOfferCouponByCode,
    getValidClusterUserCouponList,
    getValidClusterOrderTypeUserCouponList
};