const FcmCloudMessage = require('../model/fcmCloudMessage.model');

const saveToken = async (tokenObj) => {
    const fcmCloudMessage = new FcmCloudMessage();
    fcmCloudMessage.profileId = tokenObj.profileId;
    fcmCloudMessage.fcmToken = tokenObj.fcmToken;
    const isInserted = await fcmCloudMessage.save();
    return isInserted;
};
const getToken = async (profileId) => {
    const tokenObj = await FcmCloudMessage.findOne({ profileId });
    return tokenObj;
};
const updateToken = async (tokenObj) => {
    const fcmtokenObj = await FcmCloudMessage.findOneAndUpdate({ profileId: tokenObj.profileId },
        { $set: { fcmToken: tokenObj.fcmToken } },
        { new: true });
    return tokenObj;
};
module.exports = {
    saveToken,
    getToken,
    updateToken
};