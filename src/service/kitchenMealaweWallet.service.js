const dao = require('./../dao/kitchenMealaweWallet.dao');

const checkKitchenWallet = async (wallet) => {
    const savedWallet = await dao.getKitchenMealaweWallet(wallet.kitchenId)
    if (savedWallet && savedWallet._id) {
        return { status: 'wallet already present' };
    } else {
        wallet.wallet_balance = 0;
        await dao.saveUpdateKitchenMealaweWallet(wallet.kitchenId, wallet)
        return { status: 'wallet created' };
    }
}

const saveUpdateKitchenMealaweWallet = async (kitchenId, mealaweWalletObj) => {
    try {
        await dao.saveUpdateKitchenMealaweWallet(kitchenId, mealaweWalletObj)
    } catch (error) {
        // console.log('error while saving/update mealaweWallet', error)
    }
}
const withdrawFromMealaweWallet = async (kitchenId, withdawAmt) => {
    try {
        await dao.withdrawFromMealaweWallet(kitchenId, withdawAmt)
    } catch (error) {
        // console.log('error while saving/update mealaweWallet', error)
    }
}
const depositeInMealaweWallet = async (kitchenId, withdawAmt) => {
    try {
        await dao.depositeInMealaweWallet(kitchenId, withdawAmt)
    } catch (error) {
        // console.log('error while saving/update mealaweWallet', error)
    }
}
const getMealaweWalletBalance = async (kitchenId) => {
    return await dao.getKitchenMealaweWallet(kitchenId);
}

module.exports = {
    saveUpdateKitchenMealaweWallet,
    withdrawFromMealaweWallet,
    getMealaweWalletBalance,
    depositeInMealaweWallet,
    checkKitchenWallet
}
