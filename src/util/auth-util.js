const bcrypt = require('bcryptjs');
var otpGenerator = require('otp-generator');
const counterDao = require('../dao/counters.dao');

const generateHashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
}
const generateOTP = () => {
    return otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false });;
    //return "123456";
}
const generatePassword = () => {
    // return otpGenerator.generate(6);;
    return "test1234"
}
const getNewKitchenLoginId = async () => {
    const newId = await counterDao.getNextSequenceValue('KITCHEN_LOGIN_ID');
    return 'KT' + newId
}
const getNewAdminLoginId = async (role) => {
    if (role === 'ADMIN') {
        const newId = await counterDao.getNextSequenceValue('ADMIN_LOGIN_ID');
        return 'AD' + newId;
    }
    else if (role === 'DEVELOPER') {
        const newId = await counterDao.getNextSequenceValue('DEV_LOGIN_ID');
        return 'DV' + newId;
    }
    else if (role === 'SUPPORT') {
        const newId = await counterDao.getNextSequenceValue('SUPPORT_LOGIN_ID');
        return 'SUP' + newId;
    }
    else if (role === 'SALES') {
        const newId = await counterDao.getNextSequenceValue('SALES_LOGIN_ID');
        return 'SL' + newId;
    }
    else if (role === 'OPERATIONS') {
        const newId = await counterDao.getNextSequenceValue('OPERATIONS_LOGIN_ID');
        return 'OPR' + newId;
    }
    else if (role === 'ADVISOR') {
        const newId = await counterDao.getNextSequenceValue('ADVISOR_LOGIN_ID');
        return 'ADV' + newId;
    }
    else if (role === 'RIDER') {
        const newId = await counterDao.getNextSequenceValue('RIDER_LOGIN_ID');
        return 'RID' + newId;
    } else if (role === 'WAREHOUSEOPERATOR') {
        const newId = await counterDao.getNextSequenceValue('WAREHOUSEOPERATOR_LOGIN_ID');
        return 'WO' + newId;
    } else if (role === 'CUSTOMERSUCCESS') {
        const newId = await counterDao.getNextSequenceValue('CUSTOMERSUCCESS_LOGIN_ID');
        return 'CX' + newId;
    } else if (role === 'OYOMANAGER') {
        const newId = await counterDao.getNextSequenceValue('OYOMANAGER_LOGIN_ID');
        return 'OYOM' + newId;
    }
}
const getNewClusterId = async () => {
    const newId = await counterDao.getNextSequenceValue('GEO_FENCING_CLUSTER_ID');
    return 'cluster' + newId
}


module.exports = {
    generateHashPassword,
    generateOTP,
    generatePassword,
    getNewKitchenLoginId,
    getNewAdminLoginId,
    getNewClusterId
}