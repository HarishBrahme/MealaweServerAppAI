const dao = require('./../dao/userMealaweWallet.dao');

const checkUserWallet = async (wallet) => {
    const savedWallet = await dao.getUserMealaweWallet(wallet.customerId)
    if (savedWallet && savedWallet._id) {
        return { status: 'wallet already present' };
    } else {
        wallet.wallet_balance = 0;
        await dao.saveUpdateUserMealaweWallet(wallet.customerId, wallet)
        return { status: 'wallet created' };
    }
}

const saveUpdateUserMealaweWallet = async (customerId, mealaweWalletObj) => {
    try {
        await dao.saveUpdateUserMealaweWallet(customerId, mealaweWalletObj)
    } catch (error) {
        // console.log('error while saving/update mealaweWallet', error)
    }
}
const withdrawFromMealaweWallet = async (customerId, withdawAmt) => {
    try {
        await dao.withdrawFromMealaweWallet(customerId, withdawAmt)
    } catch (error) {
        // console.log('error while saving/update mealaweWallet', error)
    }
}
const depositeInMealaweWallet = async (customerId, withdawAmt) => {
    try {
        await dao.depositeInMealaweWallet(customerId, withdawAmt)
    } catch (error) {
        // console.log('error while saving/update mealaweWallet', error)
    }
}
const getMealaweWalletBalance = async (customerId) => {
    return await dao.getUserMealaweWallet(customerId);
}

module.exports = {
    saveUpdateUserMealaweWallet,
    withdrawFromMealaweWallet,
    getMealaweWalletBalance,
    depositeInMealaweWallet,
    checkUserWallet
}
