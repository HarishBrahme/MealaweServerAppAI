const dao = require('./../dao/userWallet.dao');
const { updateUserTransactionHistory, saveUserTransactionHistory } = require("../service/userTransactionHistory.service");
const { sendTransactionFcmMessage } = require("../util/fcm-message-handler");

const checkUserWallet = async (wallet) => {
    const savedWallet = await dao.getUserWallet(wallet.customerId)
    if (savedWallet && savedWallet._id) {
        return { status: 'wallet already present' };
    } else {
        wallet.wallet_balance = 0;
        await dao.saveUpdateUserWallet(wallet.customerId, wallet)
        return { status: 'wallet created' };
    }
}

const saveUpdateUserWallet = async (customerId, walletObj) => {
    try {
        await dao.saveUpdateUserWallet(customerId, walletObj)
    } catch (error) {
        // console.log('error while saving/update wallet', error)
    }
}
const withdrawFromWallet = async (customerId, withdawAmt) => {
    try {
        await dao.withdrawFromWallet(customerId, withdawAmt)
    } catch (error) {
        // console.log('error while saving/update wallet', error)
    }
}
const depositeInWallet = async (customerId, withdawAmt) => {
    try {
        await dao.depositeInWallet(customerId, withdawAmt)
    } catch (error) {
        // console.log('error while saving/update wallet', error)
    }
}
const getWalletBalance = async (customerId) => {
    return await dao.getUserWallet(customerId);
}

const deductMoneyPointsFromWallet = async (customerId, customerName, rewardsPoints, remark, category) => {
    return new Promise(async (resolve, reject) => {
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
                remark: remark,
                category: category
            };
            const userTransactionHistory = await saveUserTransactionHistory(transactionHistoryObj);
            await withdrawFromWallet(customerId, rewardsPoints);
            await updateUserTransactionHistory(userTransactionHistory._id, 'completed');
            resolve({ status: true });
            // sendTransactionFcmMessage('user_debit',rewardsPoints, customerId, 'USER');
        } catch (error) {
            // console.log('error at deductMoneyPointsFromWallet ', error);
            reject('Error while updating User wallet', error);
        }
    });
}

const addMoneyPointsInWallet = async (customerId, customerName, rewardsPoints, remark, category) => {
    return new Promise(async (resolve, reject) => {
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
                remark: remark,
                category: category
            };
            const userTransactionHistory = await saveUserTransactionHistory(transactionHistoryObj);
            await depositeInWallet(customerId, rewardsPoints);
            await updateUserTransactionHistory(userTransactionHistory._id, 'completed');
            sendTransactionFcmMessage('user_credit', rewardsPoints, customerId, 'USER');
            resolve({ status: true });
        } catch (error) {
            // console.log('error at addMoneyPointsInWallet ', error);
            reject('Error while updating User wallet', error);
        }
    })
}

const getMoneyWalletBalanceExportList = async (searchObj) => {
    return dao.getMoneyWalletBalanceExportList(searchObj);
}

module.exports = {
    saveUpdateUserWallet,
    withdrawFromWallet,
    getWalletBalance,
    depositeInWallet,
    checkUserWallet,
    deductMoneyPointsFromWallet,
    addMoneyPointsInWallet,
    getMoneyWalletBalanceExportList
}
