const authUtil = require('../util/auth-util')
const dao = require('../dao/authAdmin.dao');
const { sendOTPsms } = require('../util/sms-provider-util');
const { getDeskDyneToken } = require('../util/deskdyne-util');
const { checkOTPCountLimit } = require('../util/security-util');

const registerAdmin = async (phoneNo, role) => {
    const savedAdmin = await dao.getLoginCredentialByPh(phoneNo);
    if (savedAdmin && savedAdmin._id) {
        return savedAdmin;
    } else {
        const adminId = await authUtil.getNewAdminLoginId(role);
        const password = authUtil.generateOTP();
        const hashPassword = await authUtil.generateHashPassword(password);
        return await dao.saveCredential(adminId, phoneNo, hashPassword);
    }

}

const loginAdmin = async (adminId) => {
    const admin = await dao.getLoginCredential(adminId);
    if (admin && admin._id) {
        const status = checkOTPCountLimit(admin.phoneNo);
        if (status) {
            const password = authUtil.generateOTP();
            const hashPassword = await authUtil.generateHashPassword(password);
            await dao.updatePassword(adminId, hashPassword);
            sendOTPsms(password, 'mealawe admin', admin.phoneNo);
            return { status: true };
        } else {
            return { status: false, msg: 'You have crossed the Maximum no. of retry, please try after 10mins.' };
        }
    } else {
        return { status: false };
    }
}

const getDeskDyneAdminToken = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            const { token } = await getDeskDyneToken();
            resolve(token);
        } catch (e) {
            // console.log(e);
            resolve(null);
        }
    });

}
const saveToken = async (adminId, token) => {
    try {
        const res = await dao.saveToken(adminId, token);
    } catch (error) {
        // console.log('error while saving token',error)
    }
};

const increaseAttempt = async (adminId, attempts) => {
    try {
        const res = await dao.increaseAttempt(adminId, attempts);
    } catch (error) {
        // console.log('error while saving token',error)
    }
};

const deleteToken = async (id) => {
    try {
        const res = await dao.deleteToken(id);
    } catch (error) {
        // console.log('error while deleting token',error)
    }
};

const deleteAdmin = async (adminId) => {
    try {
        const res = await dao.deleteAdmin(adminId);
    } catch (error) {
        console.log('error while deleting admin', error)
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    getDeskDyneAdminToken,
    saveToken,
    increaseAttempt,
    deleteToken,
    deleteAdmin
}