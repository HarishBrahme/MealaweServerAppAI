const dao = require('../dao/banner.dao');

const saveNewBanner = async (foodItemObj, imageName) => {
    return dao.saveNewBanner(foodItemObj, imageName);
};

const getBannerList = async () => {
    const bannerList = await dao.getBannerList();
    return bannerList;
};

const updatingbanner = async (id, banner, imageUrl) => {
    const updatebanner = await dao.updatebanner(id, banner, imageUrl);
    return updatebanner;
}

const deleteBanner = async (id) => {
    const deletebanner = await dao.deleteBanner(id);
    return deletebanner;
}

module.exports = {
    saveNewBanner,
    getBannerList,
    updatingbanner,
    deleteBanner
}