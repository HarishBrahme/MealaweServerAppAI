const dao = require('../dao/fcmCloudMessage.dao');

const saveToken = async (tokenObj) => {
    const savedTokenObj = await dao.getToken(tokenObj.profileId);
    if (savedTokenObj && savedTokenObj._id) {
        return dao.updateToken(tokenObj);
    } else {
        return dao.saveToken(tokenObj);
    }
}
const getToken = async (profileId) => {
    return await dao.getToken(profileId);
}


module.exports = {
    saveToken,
    getToken
}