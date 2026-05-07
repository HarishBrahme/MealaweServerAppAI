const dao = require('../dao/marketPlaceGroup.dao');

const saveNewmarketPlaceGroup = async (foodItemObj, imageName) => {
    return dao.saveNewmarketPlaceGroup(foodItemObj, imageName);
};

const getmarketPlaceGroupList = async () => {
    const marketPlaceGroupList = await dao.getmarketPlaceGroupList();
    return marketPlaceGroupList;
};
// const marketPlaceGrouplistByCategoryName = async (categoryName) => {
//     const marketPlaceGroupList = await dao.marketPlaceGrouplistByCategoryName(categoryName);
//     return marketPlaceGroupList;
// };

const marketPlaceGrouplistByCategoryName = async (categoryName) => {
    const marketPlaceGroupList = await dao.marketPlaceGrouplistByCategoryName({ categoryName: categoryName });
    return marketPlaceGroupList;
};

const updatemarketPlaceGroup = async (id, marketPlaceGroup, imageUrl) => {
    const updatemarketPlaceGroup = await dao.updatemarketPlaceGroup(id, marketPlaceGroup, imageUrl);
    return updatemarketPlaceGroup;
}

const deletemarketPlaceGroup = async (id) => {
    const deletemarketPlaceGroup = await dao.deletemarketPlaceGroup(id);
    return deletemarketPlaceGroup;
}

const getbulkcatimaglist = async (List) => {
    return dao.getbulkcatimaglist(List);
};

module.exports = {
    saveNewmarketPlaceGroup,
    marketPlaceGrouplistByCategoryName,
    getmarketPlaceGroupList,
    updatemarketPlaceGroup,
    deletemarketPlaceGroup,
    getbulkcatimaglist
}