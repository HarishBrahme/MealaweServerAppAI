const dao = require('../dao/mealPackage.dao');

const getMealPackageList = async () => {
    return await dao.getMealPackageList();
};
const getMealPackageById = async (id) => {
    return await dao.getMealPackageById(id);
};
const getMealPackageListCluster = async (custerList) => {
    return await dao.getMealPackageListCluster(custerList);
};
const saveMealPackage = async (mealPackage, imageName) => {
    return await dao.saveMealPackage(mealPackage, imageName);
};
const updateMealPackage = async (id, mealPackage, imageName) => {
    return await dao.updateMealPackage(id, mealPackage, imageName);
};
const deleteMealPackage = async (id) => {
    return await dao.deleteMealPackage(id);
};
const changePackageStatus = async (status, id) => {
    return dao.changePackageStatus(status, id);
}

module.exports = {
    saveMealPackage,
    getMealPackageListCluster,
    getMealPackageList,
    getMealPackageById,
    updateMealPackage,
    deleteMealPackage,
    changePackageStatus
};