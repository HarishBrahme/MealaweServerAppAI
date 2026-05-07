const dao = require('../dao/marketPlaceItem.dao');

const getAllMarketPlaceItem = () => {
    return dao.getAllMarketPlaceItem();
};

const getMarketPlaceItemById = (id) => {
    return dao.getMarketPlaceItemById(id);
};

const getMarketPlaceItemByPathName = (pathName) => {
    return dao.getMarketPlaceItemByPathName(pathName);
};

const saveMarketPlaceItem = (marketPlaceItem, files = []) => {
    return dao.saveMarketPlaceItem(marketPlaceItem, files);
};

const updateMarketPlaceItem = (id, marketPlaceItem, files = []) => {
    return dao.updateMarketPlaceItem(id, marketPlaceItem, files);
};

const updateMarketPlaceItemImage = (id, filename, index) => {
    return dao.updateMarketPlaceItemImage(id, filename, index);
};

const deleteMarketPlaceItemImage = (id, imageUrl) => {
    return dao.deleteMarketPlaceItemImage(id, imageUrl);
};

const deleteMarketPlaceItem = (id) => {
    return dao.deleteMarketPlaceItem(id);
};

const getMarketPlaceCategoryItem = (category) => {
    return dao.getMarketPlaceCategoryItem(category);
};

const getBestsellorItemlist = () => {
    return dao.getBestsellorItemlist();
};

const getComboItemList = () => {
    return dao.getComboItemList();
};

const searchMarketPlaceItems = (searchTerm) => {
    return dao.searchMarketPlaceItems(searchTerm);
};

module.exports = {
    getAllMarketPlaceItem,
    getMarketPlaceItemById,
    getMarketPlaceItemByPathName,
    saveMarketPlaceItem,
    updateMarketPlaceItem,
    updateMarketPlaceItemImage,
    deleteMarketPlaceItemImage,
    deleteMarketPlaceItem,
    getMarketPlaceCategoryItem,
    getBestsellorItemlist,
    searchMarketPlaceItems,
    getComboItemList
};