const AppVersionControl = require('../model/appVersionControl.model');

const getAllAppVersionList = async () => {
    const allAppsVersion = await AppVersionControl.find({});
    return allAppsVersion;
}

const saveAppVersion = async (appVersionControl) => {
    const nappVersionControl = new AppVersionControl();
    nappVersionControl.appName = appVersionControl.appName;
    nappVersionControl.appVersion = appVersionControl.appVersion;
    const isInserted = await nappVersionControl.save();
    return isInserted;
}

const updateAppVersion = async (appVersion) => {
    const updatedVersion = {
        appName: appVersion.appName,
        appVersion: appVersion.appVersion
    };
    const updated = await AppVersionControl.findOneAndUpdate({ _id: appVersion._id }, { $set: updatedVersion }, { new: true });
    return updated;
};

const gerAppVersion = async (id) => {
    const getappVersionControlList = await AppVersionControl.find({ _id: id });
    return getappVersionControlList;
}
const getAppVersionByName = async (appName) => {
    const appNameVersion = await AppVersionControl.findOne({ appName });
    return appNameVersion;
}

module.exports = {
    getAllAppVersionList,
    saveAppVersion,
    updateAppVersion,
    gerAppVersion,
    getAppVersionByName
}