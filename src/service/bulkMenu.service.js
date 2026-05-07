const dao = require('../dao/bulkMenu.dao');

const bulkMenuAdd = async (menu) => {
    const savedMenu = await dao.bulkMenuAdd(menu);
    return savedMenu;
};

const fetchBulkMenu = async (category) => {
    const fetchedMenu = await dao.fetchBulkMenu(category);
    return fetchedMenu;
};

const updateBulkMenu = async (menu, id) => {
    const fetchedMenu = await dao.updateBulkMenu(menu, id);
    return fetchedMenu;
};

const syncBulkMenu = async (foodItem) => {
    try {
        await dao.syncBulkMenu(foodItem);
    } catch (error) {
        // console.log('syncBulkMenu service error ',error)
    }
};

module.exports = {
    bulkMenuAdd,
    fetchBulkMenu,
    updateBulkMenu,
    syncBulkMenu
}