const LoginCredentialKitchen = require('../model/loginCredentialKitchen.model');

const saveCredential = async (kitchenId, phoneNo, password) => {
    const nCredential = new LoginCredentialKitchen();
    nCredential.kitchenId = kitchenId;
    nCredential.password = password;
    nCredential.phoneNo = phoneNo;
    nCredential.attempts = 0;
    const isInserted = await nCredential.save(nCredential);
    return isInserted;
};

const getLoginCredential = async (kitchenId) => {
    const credential = await LoginCredentialKitchen.findOne({ kitchenId });
    return credential;
};
const updatePassword = async (kitchenId, password) => {
    const credential = await LoginCredentialKitchen.updateOne({ kitchenId }, { password, attempts: 0 });
    return credential;
};

const saveToken = async (kitchenId, token) => {
    const setObj = {
        token: token,
        loginAt: new Date(),
        attempts: 0
    };
    const credential = await LoginCredentialKitchen.updateOne({ kitchenId }, setObj, { new: true });
    return credential;
};

const increaseAttempt = async (kitchenId, attempts) => {
    const setObj = {
        attempts
    };
    const credential = await LoginCredentialKitchen.updateOne({ kitchenId }, setObj);
    return credential;
};

const deleteToken = async (id) => {
    const setObj = {
        token: null
    };
    const credential = await LoginCredentialKitchen.updateOne({ _id: ObjectId(id) }, setObj);
    return credential;
};

module.exports = {
    saveCredential,
    getLoginCredential,
    updatePassword,
    saveToken,
    increaseAttempt,
    deleteToken
};