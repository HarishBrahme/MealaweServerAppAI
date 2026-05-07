const dataCache = require('./data-cache-util');

checkOTPSecurity = (mobileNo, increseLimit) => {
    const actualLimit = 4;
    let exitingLimit = dataCache.getCacheData(`OTP_LIMIT_${mobileNo}`);
    if (!exitingLimit) {
        exitingLimit = 0;
    }
    if (increseLimit) {
        // console.log('exitingLimit',mobileNo,exitingLimit);  
        dataCache.setCacheData(`OTP_LIMIT_${mobileNo}`, exitingLimit + 1, 10 * 60 * 1000);//10min    
    } else {
        // console.log('checking Limit',mobileNo,exitingLimit);  
        dataCache.setCacheData(`OTP_LIMIT_${mobileNo}`, exitingLimit, 10 * 60 * 1000);//10min  
    }
    if (exitingLimit >= actualLimit) {
        return false;
    } else {
        return true;
    }
}

checkOTPCountLimit = (mobileNo) => {
    const actualLimit = 4;
    let exitingLimit = dataCache.getCacheData(`OTP_LIMIT_${mobileNo}`);
    console.log(actualLimit, exitingLimit, 'mobileNo', mobileNo);
    if (exitingLimit >= actualLimit) {
        return false;
    } else {
        return true;
    }
};

module.exports = { checkOTPSecurity, checkOTPCountLimit }