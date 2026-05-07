const foodDao = require('../dao/foodItem.dao');
const kitchenDao = require('../dao/kitchenPartner.dao');
const todaysMenuDao = require('../dao/todaysMenu.dao');
const kitchenMenuDao = require('../dao/kitchenMenu.dao');
const foodItemDao = require('../dao/foodItem.dao');

const searchFoodItem = async (text) => {
    return foodDao.searchFoodItem(text);
};

const searchkitchen = async (text, clusterList) => {
    return kitchenDao.searchkitchen(text, clusterList);
};
const searchkitchenFromMenu = async (text, clientDate, clusterList) => {
    const menuList = await todaysMenuDao.searchTodaysMenu(text, clientDate, clusterList);
    let kitchenList = [];
    if (menuList && menuList.length > 0) {
        const kitchenIds = menuList.map(menu => menu.kitchenId);
        kitchenList = await kitchenDao.getKitchenPartnerListByIds(kitchenIds);
    }
    return kitchenList;
};

const userSearch = async (text, clientDate, clusterList) => {
    return Promise.all([kitchenDao.searchkitchen(text, clusterList),
    todaysMenuDao.searchTodaysMenu(text, clientDate, clusterList),
    kitchenMenuDao.searchKitchenMenu(text, clusterList)]);
};

const categoryItems = async (text, clientDate, clusterList) => {
    return Promise.all([
        todaysMenuDao.searchCategoryTodaysMenu(text, clientDate, clusterList),
        kitchenMenuDao.searchCategoryKitchenMenu(text, clusterList)]);
};

const lookupSearch = async (clusterList) => {
    return Promise.all([foodItemDao.lookupFooditem(), kitchenDao.lookupkitchen(clusterList)]);
}

const categoryNearItems = async (text, clientDate, clusterList, pageNumber, lng, lat) => {
    return Promise.all([
        todaysMenuDao.searchNearCategoryTodaysMenu(text, clientDate, clusterList, pageNumber, lng, lat),
        kitchenMenuDao.searchNearCategoryKitchenMenu(text, clusterList, pageNumber, lng, lat)]);
};

const searchNearkitchen = async (text, clusterList, page, lng, lat) => {
    return kitchenDao.searchNearkitchen(text, clusterList, page, lng, lat);
};

const searchNearkitchenFromMeal = async (text, clientDate, clusterList, pageNumber, lng, lat) => {
    let menuList = [];
    if (text === 'allDay') {
        menuList = await kitchenMenuDao.searchNearAlldayMeal(clusterList, pageNumber, lng, lat);
    } else if (text === 'subscription') {
        menuList = await kitchenDao.searchNearkitchen(text, clusterList, pageNumber, lng, lat);
    } else if (text === 'special') {
        menuList = await kitchenMenuDao.searchNearSpecialMeal(clusterList, pageNumber, lng, lat);
    } else {
        menuList = await todaysMenuDao.searchNearTodaysMeal(text, clientDate, clusterList, pageNumber, lng, lat);
    }
    let kitchenList = [];
    if (menuList && menuList.length > 0) {
        if (text === 'subscription') {
            kitchenList = menuList;
        } else {
            const kitchenIds = menuList.map(menu => menu.kitchenId);
            kitchenList = await kitchenDao.getKitchenPartnerListByIds(kitchenIds);
        }
    }
    return kitchenList;
};
const userNearSearch = async (text, clientDate, clusterList, pageNumber, lng, lat) => {
    return Promise.all([kitchenDao.searchNearkitchen(text, clusterList, pageNumber, lng, lat),
    todaysMenuDao.searchNearTodaysMenu(text, clientDate, clusterList, pageNumber, lng, lat),
    kitchenMenuDao.searchNearKitchenMenu(text, clusterList, pageNumber, lng, lat)]);
}

module.exports = {
    searchFoodItem,
    searchkitchen,
    userSearch,
    lookupSearch,
    searchkitchenFromMenu,
    categoryItems,
    categoryNearItems,
    searchNearkitchen,
    searchNearkitchenFromMeal,
    userNearSearch
}