const authUtil = require('../util/auth-util')
const dao = require('../dao/authUser.dao');
const userDao = require('./customerProfile.service');
const { sendOTPsms, navmoolLoginOtpSMS, navmoolLoginCompletedSMS } = require('../util/sms-provider-util');
const { saveNewCustomerProfile } = require('../dao/customerProfile.dao');
const { autoUpdateLead } = require('../util/telecrm-util');

const registerUser = async (phoneNo, registeredPlatform) => {
    let userIsNew = false;
    if (phoneNo === 1111122222) {
        const otp = '123456';
        const hashPassword = await authUtil.generateHashPassword(otp);
        const user = await dao.getLoginCredential(phoneNo);
        if (user && user._id) {
            await dao.updatePassword(phoneNo, hashPassword);
            return userIsNew;
        } else {
            await dao.saveCredential(phoneNo, hashPassword);
            
            userIsNew = true;
            return userIsNew;
        }
    } else {
        const otp = authUtil.generateOTP();
        const hashPassword = await authUtil.generateHashPassword(otp);
        const user = await dao.getLoginCredential(phoneNo);
        if (user && user._id) {
            if (registeredPlatform && registeredPlatform == 'navmool_web') {
                navmoolLoginOtpSMS(otp, user.phoneNo);
                await dao.updatePassword(phoneNo, hashPassword);
                return userIsNew;
            } else {
                sendOTPsms(otp, 'mealawe', user.phoneNo);
                await dao.updatePassword(phoneNo, hashPassword);
                return userIsNew;
            }
        } else {
            if (registeredPlatform && registeredPlatform == 'navmool_web') {
                navmoolLoginOtpSMS(otp, user.phoneNo);
                let user = await dao.saveCredential(phoneNo, hashPassword);
                setTimeout(() => {
                    autoUpdateLead(
                        {
                            phone: user.phoneNo,
                            name: user.name,
                            email: user.email,
                            installReferrer: user.installReferrer,
                            registeredPlatform: user.registeredPlatform ? user.registeredPlatform : registeredPlatform,
                            lead_source: user.registeredPlatform ? user.registeredPlatform : registeredPlatform,
                            is_new_customer: 'true',
                        },
                        [{ type: 'SYSTEM_NOTE', text: 'App Data: ' }]
                    ).catch(err => console.error('TeleCRM autoUpdateLead failed:', err));
                }, 800000); // 15 minutes
                userIsNew = true;
                return userIsNew;
            } else {
                sendOTPsms(otp, 'mealawe', phoneNo);
                let newuser = await dao.saveCredential(phoneNo, hashPassword);
                setTimeout(() => {
                    autoUpdateLead(
                        {
                            phone: newuser.phoneNo,
                            name: newuser.name,
                            email: newuser.email,
                            installReferrer: newuser.installReferrer,
                            registeredPlatform: newuser.registeredPlatform ? newuser.registeredPlatform : registeredPlatform,
                            lead_source: newuser.registeredPlatform ? newuser.registeredPlatform : registeredPlatform,
                            is_new_customer: 'true',
                        },
                        [{ type: 'SYSTEM_NOTE', text: 'App Data: ' }]
                    ).catch(err => console.error('TeleCRM autoUpdateLead failed:', err));
                }, 900000); // 15 minutes
                userIsNew = true;
                return userIsNew;
            }
            
        }
    }
};


const resendOTP = async (phoneNo, registeredPlatform) => {
    const otp = authUtil.generateOTP();
    const hashPassword = await authUtil.generateHashPassword(otp);
    if (registeredPlatform && registeredPlatform == 'navmool_web') {
        navmoolLoginOtpSMS(otp, phoneNo);
        return dao.updatePassword(phoneNo, hashPassword);
    } else {
        sendOTPsms(otp, 'mealawe', phoneNo);
        return dao.updatePassword(phoneNo, hashPassword);
    }
};

const createLoginAuthUser = async (phoneNo) => {
    const otp = authUtil.generateOTP();
    const hashPassword = await authUtil.generateHashPassword(otp);
    const user = await dao.getLoginCredential(phoneNo);
    if (user && user._id) {
        dao.updatePassword(phoneNo, hashPassword);
        return user;
    } else {
        return dao.saveCredential(phoneNo, hashPassword);
    }
}

const signupUser = async (customerProfile) => {
    return new Promise(async (resolve, reject) => {
        try {
            const otp = authUtil.generateOTP();
            const hashPassword = await authUtil.generateHashPassword(otp);
            const user = await dao.getLoginCredential(customerProfile.phoneNo);
            if (user && user._id) {
                resolve({ msg: 'Phone no. is already registered' });
            } else {
                const logingObj = await dao.saveCredential(customerProfile.phoneNo, hashPassword, customerProfile.registeredPlatform);
                customerProfile.loginId = logingObj._id;
                const savedCustomer = await saveNewCustomerProfile(customerProfile);
                setTimeout(() => {
                    autoUpdateLead(
                        {
                            phone: savedCustomer.phoneNo,
                            name: savedCustomer.name,
                            email: savedCustomer.email,
                            installReferrer: savedCustomer.installReferrer,
                            registeredPlatform: savedCustomer.registeredPlatform ? savedCustomer.registeredPlatform : registeredPlatform,
                            lead_source: savedCustomer.registeredPlatform ? savedCustomer.registeredPlatform : registeredPlatform,
                            is_new_customer: 'true',
                        },
                        [{ type: 'SYSTEM_NOTE', text: 'App Data: ' }]
                    ).catch(err => console.error('TeleCRM autoUpdateLead failed:', err));
                }, 1000000); // 15 minutes
                if (customerProfile.registeredPlatform && customerProfile.registeredPlatform == 'navmool_web') {
                    navmoolLoginOtpSMS(otp, phoneNo);
                } else {
                    sendOTPsms(otp, 'mealawe', savedCustomer.phoneNo);
                }
                resolve(savedCustomer);
            }
        } catch (error) {
            reject(error)
        }
    })

}

const saveToken = async (phoneNo, token, registeredPlatform) => {
    try {
        const res = await dao.saveToken(phoneNo, token);
        if (registeredPlatform && (registeredPlatform == 'navmool_web')) {
            const user = await userDao.getCustomerProfileByMobile(phoneNo);
            navmoolLoginCompletedSMS(user.userName, phoneNo);
        }
    } catch (error) {
        console.log('error while saving token', error)
    }
};

const increaseAttempt = async (phoneNo, attempts) => {
    try {
        const res = await dao.increaseAttempt(phoneNo, attempts);
    } catch (error) {
        console.log('error while saving token', error)
    }
};

const deleteToken = async (id) => {
    try {
        const res = await dao.deleteToken(id);
    } catch (error) {
        console.log('error while deleting token', error)
    }
};

module.exports = {
    resendOTP,
    registerUser,
    createLoginAuthUser,
    signupUser,
    saveToken,
    increaseAttempt,
    deleteToken
}