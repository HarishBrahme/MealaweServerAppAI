const dao = require('../dao/subscriptionWeeklyMenu.dao')

const saveSubscriptionWeeklyMenu = async (weeklyMenu) => {
    return await dao.saveSubscriptionWeeklyMenu(weeklyMenu);
}

const getSubscriptionWeeklyMenu = async (packageCategory, clusterId) => {
    return await dao.getSubscriptionWeeklyMenu(packageCategory, clusterId);
}

const searchSubscriptionWeeklyMenuList = async (searchObj, page) => {
    return await dao.searchSubscriptionWeeklyMenuList(searchObj, page);
}

const deleteSubscriptionWeeklyMenu = async (id) => {
    return await dao.deleteSubscriptionWeeklyMenu(id);
}

const getWeeklyMenuByCategory = async (packageCategory) => {
    try {
        const menus = await dao.getWeeklyMenuByCategory(packageCategory);
        return menus;
    } catch (err) {
        console.error('Error fetching weekly menus by category:', err);
        throw err;
    }
};

module.exports = {
    saveSubscriptionWeeklyMenu,
    getWeeklyMenuByCategory,
    getSubscriptionWeeklyMenu,
    searchSubscriptionWeeklyMenuList,
    deleteSubscriptionWeeklyMenu
}