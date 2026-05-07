const LoginCredentialAdmin = require('../model/loginCredentialAdmin.model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const saveCredential = async (adminId, phoneNo, password) => {
    const nCredential = new LoginCredentialAdmin();
    nCredential.adminId = adminId;
    nCredential.password = password;
    nCredential.phoneNo = phoneNo;
    nCredential.attempts = 0;
    const isInserted = await nCredential.save();
    return isInserted;
};

const getLoginCredential = async (adminId) => {
    const credential = await LoginCredentialAdmin.findOne({ adminId });
    return credential;
};
const updatePassword = async (adminId, password) => {
    const credential = await LoginCredentialAdmin.updateOne({ adminId }, { password, attempts: 0 });
    return credential;
};
const updatePhoneNo = async (adminId, phoneNo) => {
    const credential = await LoginCredentialAdmin.updateOne({ adminId }, { phoneNo });
    return credential;
};
const getLoginCredentialByPh = async (phoneNo) => {
    const credential = await LoginCredentialAdmin.findOne({ phoneNo });
    return credential;
};

const saveToken = async (adminId, token) => {
    const setObj = {
        token: token,
        loginAt: new Date(),
        attempts: 0
    };
    const credential = await LoginCredentialAdmin.updateOne({ adminId }, setObj);
    return credential;
};

const increaseAttempt = async (adminId, attempts) => {
    const setObj = {
        attempts
    };
    const credential = await LoginCredentialAdmin.updateOne({ adminId }, setObj);
    return credential;
};

const deleteToken = async (id) => {
    const setObj = {
        token: null
    };
    const credential = await LoginCredentialAdmin.updateOne({ _id: ObjectId(id) }, setObj);
    return credential;
};

const deleteAdmin = async (adminId) => {
    const credential = await LoginCredentialAdmin.findOneAndDelete({ adminId });
    return credential;
};

const logoutAllAdmin = async (id) => {
    const setObj = {
        token: null
    };
    const credential = await LoginCredentialAdmin.updateMany({}, setObj);
    return credential;
};

module.exports = {
    saveCredential,
    getLoginCredential,
    updatePassword,
    updatePhoneNo,
    saveToken,
    increaseAttempt,
    deleteToken,
    getLoginCredentialByPh,
    deleteAdmin,
    logoutAllAdmin
};