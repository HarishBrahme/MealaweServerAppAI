const dao = require('../dao/appVersionControl.dao');

const getAllAppVersionList = async () => {
    return dao.getAllAppVersionList();
};
const saveAppVersion = async (appObj) => {
    return dao.saveAppVersion(appObj);
};
const updateAppVersion = async (appObj) => {
    return dao.updateAppVersion(appObj);
};
const gerAppVersion = async (id) => {
    return dao.gerAppVersion(id);
};
const getAppVersionByName = async (appName) => {
    return dao.getAppVersionByName(appName);
};

module.exports = {
    getAllAppVersionList,
    saveAppVersion,
    updateAppVersion,
    gerAppVersion,
    getAppVersionByName
}