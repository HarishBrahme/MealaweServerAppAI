const Banner = require('../model/banner.model');
const { deleteImage } = require('../service/images.service');

const saveNewBanner = async (banner, imageUrl) => {
    const nBanner = new Banner();
    nBanner.seqOrder = banner.seqOrder;
    nBanner.searchBy = banner.searchBy;
    nBanner.imageUrl = imageUrl;
    const isInserted = await nBanner.save();
    return isInserted;
};

const getBannerList = async () => {
    const bannerList = await Banner.find({});
    return bannerList;
};

const updatebanner = async (id, banner, imageUrl) => {
    const ban = await Banner.findOne({ _id: id });
    if (ban) {
        const nBanner = {};
        nBanner.seqOrder = banner.seqOrder || ban.seqOrder;
        nBanner.searchBy = banner.searchBy || ban.searchBy;
        nBanner.imageUrl = imageUrl || ban.imageUrl;
        nBanner.type = banner.type || ban.type;
        nBanner.packageCategory = banner.packageCategory || ban.packageCategory;
        nBanner.packageSubCategory = banner.packageSubCategory || ban.packageSubCategory;
        const update = await Banner.findOneAndUpdate({ _id: id }, { $set: nBanner }, { new: true });
        if (imageUrl) {
            deleteImage(ban.imageUrl);
        }
        return update;
    } else {
        return ban;
    }
}

const deleteBanner = async (id) => {
    const deletebanner = Banner.findByIdAndRemove(id);
    return deletebanner;
}

module.exports = {
    saveNewBanner,
    getBannerList,
    updatebanner,
    deleteBanner
};