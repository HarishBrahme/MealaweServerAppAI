const LoginCredentialUser = require('../model/loginCredentialUser.model');

const saveCredential = async (phoneNo, password) => {
    const nCredential = new LoginCredentialUser();
    nCredential.phoneNo = phoneNo;
    nCredential.password = password;
    nCredential.attempts = 0;
    const isInserted = await nCredential.save();
    return isInserted;
};

const getLoginCredential = async (phoneNo) => {
    const credObj = {};
    credObj.phoneNo = phoneNo;
    const credential = await LoginCredentialUser.findOne(credObj);
    return credential;
};

const updatePassword = async (phoneNo, password) => {
    const credObj = {};
    credObj.phoneNo = phoneNo;
    const credential = await LoginCredentialUser.updateOne(credObj, { password, attempts: 0 });
    return credential;
};

const validLoginCredential = async (phoneNo, id) => {
    const credObj = {};
    credObj.phoneNo = phoneNo;
    credObj._id = id;
    const credential = await LoginCredentialUser.findOne(credObj);
    return credential;
};

const saveToken = async (phoneNo, token) => {
    const setObj = {
        token: token,
        loginAt: new Date(),
        attempts: 0
    };
    const credential = await LoginCredentialUser.updateOne({ phoneNo }, setObj);
    return credential;
};

const increaseAttempt = async (phoneNo, attempts) => {
    const setObj = {
        attempts
    };
    const credential = await LoginCredentialUser.updateOne({ phoneNo }, setObj);
    return credential;
};

const deleteToken = async (id) => {
    const setObj = {
        token: null
    };
    const credential = await LoginCredentialUser.updateOne({ _id: ObjectId(id) }, setObj);
    return credential;
};

module.exports = {
    saveCredential,
    getLoginCredential,
    updatePassword,
    validLoginCredential,
    saveToken,
    increaseAttempt,
    deleteToken
};