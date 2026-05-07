const MarketPlaceGroup = require('../model/marketPlaceGroup.model');
const { deleteImage } = require('../service/images.service');

const saveNewmarketPlaceGroup = async (marketPlaceGroup, imageUrl) => {
    const nmarketPlaceGroup = new MarketPlaceGroup();
    nmarketPlaceGroup.categoryName = marketPlaceGroup.categoryName;
    nmarketPlaceGroup.groupName = marketPlaceGroup.groupName;
    nmarketPlaceGroup.pathName = marketPlaceGroup.pathName;
    if (imageUrl) {
        nmarketPlaceGroup.imageUrl = imageUrl;
    }
    const isInserted = await nmarketPlaceGroup.save();
    return isInserted;
};

const getmarketPlaceGroupList = async () => {
    const marketPlaceGroupList = await MarketPlaceGroup.find({});
    return marketPlaceGroupList;
};

const marketPlaceGrouplistByCategoryName = async (categoryName) => {
    const marketPlaceGroupList = await MarketPlaceGroup.find(categoryName);
    return marketPlaceGroupList;
};

const updatemarketPlaceGroup = async (id, marketPlaceGroup, imageUrl) => {
    const category = await MarketPlaceGroup.findOne({ _id: id });
    if (category) {
        const nmarketPlaceGroup = {};
        nmarketPlaceGroup.categoryName = marketPlaceGroup.categoryName || category.categoryName;
        nmarketPlaceGroup.pathName = marketPlaceGroup.pathName || category.pathName;
        nmarketPlaceGroup.groupName = marketPlaceGroup.groupName || category.groupName;
        nmarketPlaceGroup.imageUrl = imageUrl || category.imageUrl;
        const update = await MarketPlaceGroup.findOneAndUpdate({ _id: id }, { $set: nmarketPlaceGroup }, { new: true });
        if (imageUrl) {
            deleteImage(category.imageUrl);
        }
        return update;
    } else {
        return category;
    }
}

const deletemarketPlaceGroup = async (id) => {
    const deletemarketPlaceGroup = MarketPlaceGroup.findByIdAndRemove(id);
    return deletemarketPlaceGroup;
}

const getbulkcatimaglist = async (list) => {
    const imageUrlList = await MarketPlaceGroup.find({ _id: { $in: [...list] } });
    return imageUrlList;
}

module.exports = {
    saveNewmarketPlaceGroup,
    marketPlaceGrouplistByCategoryName,
    getmarketPlaceGroupList,
    updatemarketPlaceGroup,
    deletemarketPlaceGroup,
    getbulkcatimaglist
};