const authUtil = require('../util/auth-util')
const dao = require('../dao/authKitchen.dao');
const { sendOTPsms } = require('../util/sms-provider-util');

const registerKitchen = async (phoneNo) => {
    const loginId = await authUtil.getNewKitchenLoginId();
    const password = authUtil.generateOTP();
    const hashPassword = await authUtil.generateHashPassword(password);
    return await dao.saveCredential(loginId, phoneNo, hashPassword);
}

const loginKitchen = async (kitchenId) => {
    const kitchen = await dao.getLoginCredential(kitchenId);
    if (kitchen && kitchen._id) {
        if (kitchenId === 'TEST') {
            const otp = '123456';
            const hashPassword = await authUtil.generateHashPassword(otp);
            await dao.updatePassword(kitchenId, hashPassword);
            return { status: true };
        } else {
            const status = checkOTPCountLimit(kitchen.phoneNo);
            if (status) {
                const otp = authUtil.generateOTP();
                const hashPassword = await authUtil.generateHashPassword(otp);
                await dao.updatePassword(kitchenId, hashPassword);
                sendOTPsms(otp, 'mealawe chef', kitchen.phoneNo);
                console.log(otp, 'mealawe chef', kitchen.phoneNo);
                return { status: true };
            } else {
                return { status: false, msg: 'You have crossed the Maximum no. of retry, please try after 10mins.' };
            }
        }
    } else {
        return { status: true };
    }
}

const registerTestKitchen = async (phoneNo) => {
    const loginId = 'TEST';
    const password = '123456';
    const hashPassword = await authUtil.generateHashPassword(password);
    return await dao.saveCredential(loginId, phoneNo, hashPassword);
}

const saveToken = async (kitchenId, token) => {
    try {
        const res = await dao.saveToken(kitchenId, token);
    } catch (error) {
        console.log('error while saving token', error)
    }
};

const increaseAttempt = async (kitchenId, attempts) => {
    try {
        const res = await dao.increaseAttempt(kitchenId, attempts);
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

module.exports = {
    registerKitchen,
    loginKitchen,
    registerTestKitchen,
    saveToken,
    increaseAttempt,
    deleteToken
}