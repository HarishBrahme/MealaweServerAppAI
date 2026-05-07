const dao = require('../dao/foodAddOn.dao');



const getAddOnList = async () => {
    const getaddonlist = await dao.getAddOnList();
    return getaddonlist;
};




const deleteAddonList = async (ids) => {
    const deleteaddonlist = await dao.deleteAddonList(ids);
    return deleteaddonlist;

}

const saveaddOn = async (foodItem, imageName) => {
    return dao.saveAddOn(foodItem, imageName);
};


const UpdateAddOn = async (id, foodItem, imageName) => {
    return dao.UpdateAddOn(id, foodItem, imageName)
}

const getAddOn = async (id) => {
    const getaddon = await dao.getAddOn(id)
    return getaddon;
};


const deleteAddon = async (id) => {
    const deleteaddon = await dao.deleteAddon(id);
    return deleteaddon;
}

const saveAddOnList = async (foodItem) => {
    return dao.saveAddOnList(foodItem);
}


module.exports = {
    getAddOnList,
    deleteAddonList,
    saveaddOn,
    getAddOn,
    deleteAddon,
    saveAddOnList,
    UpdateAddOn
}
