const { withdrawFromWallet, getWalletBalance, depositeInWallet } = require("../service/userWallet.service");
const { updateUserTransactionHistory, saveUserTransactionHistory } = require("../service/userTransactionHistory.service");
const { withdrawFromMealaweWallet, getMealaweWalletBalance, depositeInMealaweWallet, saveUpdateUserMealaweWallet } = require("../service/userMealaweWallet.service");
const { updateUserMealaweTransactionHistory, saveUserMealaweTransactionHistory } = require("../service/userMealaweTransactionHistory.service");
const { saveCashBack, getValidCashBackList, updateCashbackListUser, expireCashBack } = require("../service/cashback.service");
const { sendTransactionFcmMessage } = require("./fcm-message-handler");

const deductMoneyPointsFromWallet = async (customerId, customerName, rewardsPoints, remark) => {
    try {
        const wallet = await getWalletBalance(customerId);
        // console.log('wallet ',wallet);
        const transactionHistoryObj = {
            status: 'inprogress',
            transaction_points: rewardsPoints,
            created_at: new Date(),
            customerId: customerId,
            customerName: customerName,
            wallet_balance: wallet.wallet_balance,
            transactionType: 'Debit',
            remark: remark
        };
        const userTransactionHistory = await saveUserTransactionHistory(transactionHistoryObj);
        await withdrawFromWallet(customerId, rewardsPoints);
        await updateUserTransactionHistory(userTransactionHistory._id, 'completed');
        // sendTransactionFcmMessage('user_debit',rewardsPoints, customerId, 'USER');
    } catch (error) {
        console.log('error at deductMoneyPointsFromWallet ', error);
    }
}

const addMoneyPointsInWallet = async (customerId, customerName, rewardsPoints, remark) => {
    try {
        const wallet = await getWalletBalance(customerId);
        // console.log('wallet ',wallet);
        let wallet_balance = 0;
        if (wallet && wallet._id) {
            wallet_balance = wallet.wallet_balance;
        }
        const transactionHistoryObj = {
            status: 'inprogress',
            transaction_points: rewardsPoints,
            created_at: new Date(),
            customerId: customerId,
            customerName: customerName,
            wallet_balance,
            transactionType: 'Credit',
            remark: remark
        };
        const userTransactionHistory = await saveUserTransactionHistory(transactionHistoryObj);
        await depositeInWallet(customerId, rewardsPoints);
        await updateUserTransactionHistory(userTransactionHistory._id, 'completed');
        sendTransactionFcmMessage('user_credit', rewardsPoints, customerId, 'USER');
    } catch (error) {
        // console.log('error at addMoneyPointsInWallet ', error);
    }
}
const createMealaweWalletAndTransaction = async (newCustomerProfile) => {
    try {
        const walletObj = {
            customerId: newCustomerProfile._id,
            customerPhoneNo: newCustomerProfile.phoneNo,
            customerEmail: newCustomerProfile.email,
            wallet_balance: 50
        }
        const transactionHistoryObj = {
            status: 'inprogress',
            transaction_points: 50,
            created_at: new Date(),
            customerId: walletObj.customerId,
            customerName: walletObj.customerName,
            wallet_balance: 0,
            transactionType: 'Credit',
            remark: 'On creating new profile in mealawe'
        };
        const userTransactionHistory = await saveUserMealaweTransactionHistory(transactionHistoryObj);
        await saveUpdateUserMealaweWallet(walletObj.customerId, walletObj);
        await updateUserMealaweTransactionHistory(userTransactionHistory._id, 'completed');
    } catch (error) {
        // console.log('error at createMealaweWalletAndTransaction ', error);
    }
}

const deductMealawePointsFromWallet = async (customerId, customerName, rewardsPoints, remark) => {
    try {
        const wallet = await getMealaweWalletBalance(customerId);
        // console.log('wallet ',wallet);
        const transactionHistoryObj = {
            status: 'inprogress',
            transaction_points: rewardsPoints,
            created_at: new Date(),
            customerId: customerId,
            customerName: customerName,
            wallet_balance: wallet.wallet_balance,
            transactionType: 'Debit',
            remark: remark
        };
        const userTransactionHistory = await saveUserMealaweTransactionHistory(transactionHistoryObj);
        await withdrawFromMealaweWallet(customerId, rewardsPoints);
        await updateUserMealaweTransactionHistory(userTransactionHistory._id, 'completed');
        // sendTransactionFcmMessage('user_mealawe_debit',rewardsPoints, customerId, 'USER');
    } catch (error) {
        // console.log('error at deductMoneyPointsFromWallet ', error);
    }
}
const addMealawePointsInWallet = async (customerId, customerName, rewardsPoints, remark) => {
    try {
        const wallet = await getMealaweWalletBalance(customerId);
        // console.log('wallet ',wallet);
        let wallet_balance = 0;
        if (wallet && wallet._id) {
            wallet_balance = wallet.wallet_balance;
        }
        const transactionHistoryObj = {
            status: 'inprogress',
            transaction_points: rewardsPoints,
            created_at: new Date(),
            customerId: customerId,
            customerName: customerName,
            wallet_balance,
            transactionType: 'Credit',
            remark: remark
        };
        const userTransactionHistory = await saveUserMealaweTransactionHistory(transactionHistoryObj);
        await depositeInMealaweWallet(customerId, rewardsPoints);
        await updateUserMealaweTransactionHistory(userTransactionHistory._id, 'completed');
        sendTransactionFcmMessage('user_mealawe_credit', rewardsPoints, customerId, 'USER');
    } catch (error) {
        // console.log('error at addMealawePointsInWallet ', error);
    }
}

const createCashBack = async (customerId, customerName, customerPhoneNo, customerEmail, rewardsPoints, remark, expiryDay) => {
    try {
        // const cashbackPoints = rewardsPoints ? rewardsPoints : Math.floor(Math.random() * 80) + 5;
        const cashbackPoints = rewardsPoints;
        const cashbackObj = {
            title: 'CASHBACK' + cashbackPoints,
            remark,
            customerId,
            customerName,
            customerPhoneNo,
            customerEmail,
            cashbackPoints
        };
        // console.log('createCashBack ',cashbackObj);
        await saveCashBack(cashbackObj, expiryDay);
        sendTransactionFcmMessage('user_mealawe_credit', rewardsPoints, customerId, 'USER');
    } catch (error) {
        // console.log('error at addMealawePointsInWallet ', error);
    }
}

const updatedCashBack = async (customerId, orderNo, rewardsPoints) => {
    try {
        let updateObjList = [];
        // console.log('updatedCashBack 1',customerId,orderNo, rewardsPoints);
        const validCashBackList = await getValidCashBackList(customerId);
        // console.log('updatedCashBack 1.2 length ',validCashBackList.length);  
        let deductPoints = rewardsPoints;
        if (validCashBackList && validCashBackList.length > 0) {
            // console.log('updatedCashBack 2 length ',validCashBackList.length);      
            validCashBackList.forEach(cashback => {
                if (deductPoints > 0) {
                    if (deductPoints < cashback.cashbackPoints) {
                        const remainingPoints = cashback.cashbackPoints - deductPoints;
                        const updateObj = {
                            _id: cashback._id,
                            status: 'Updated',
                            remark: `${remainingPoints} points left, ${deductPoints} points used in order no. ${orderNo}`,
                            cashbackPoints: remainingPoints,
                            previousAmount: cashback.cashbackPoints,
                            usedAmount: deductPoints,
                            updateRemark: `${deductPoints} points used in order no. ${orderNo}`,
                            previousRemark: cashback.remark
                        };
                        deductPoints = 0,
                            // console.log('updatedCashBack 3');
                            updateObjList.push(updateObj);
                    } else {
                        const updateObj = {
                            _id: cashback._id,
                            status: 'Used',
                            remark: `${cashback.cashbackPoints} points used in order no. ${orderNo}`,
                            cashbackPoints: 0,
                            previousAmount: cashback.cashbackPoints,
                            usedAmount: cashback.cashbackPoints,
                            updateRemark: `${cashback.cashbackPoints} points used in order no. ${orderNo}`,
                            previousRemark: cashback.remark
                        };
                        deductPoints = deductPoints - cashback.cashbackPoints;
                        // console.log('updatedCashBack 4');
                        updateObjList.push(updateObj);
                    }
                }
            });
            const promiseArr = [];
            updateObjList.forEach(updateObj => {
                promiseArr.push(updateCashbackListUser(updateObj));
            });
            // console.log('updatedCashBack 5');
            await Promise.all(promiseArr);
            // sendTransactionFcmMessage('user_mealawe_debit',rewardsPoints, customerId, 'USER');
        }
    } catch (error) {
        // console.log('error at updatedCashBack ', error);
    }
}


module.exports = {
    deductMoneyPointsFromWallet,
    addMoneyPointsInWallet,
    createMealaweWalletAndTransaction,
    deductMealawePointsFromWallet,
    addMealawePointsInWallet,
    createCashBack,
    updatedCashBack
}