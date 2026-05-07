const KitchenMealaweWallet = require('../model/kitchenMealaweWallet.model');

saveUpdateKitchenMealaweWallet = async (kitchenId, mealaweWalletObj) => {
    const savedMealaweWallet = await KitchenMealaweWallet.findOne({ kitchenId });
    if (savedMealaweWallet && savedMealaweWallet._id) {
        savedMealaweWallet.kitchenPhoneNo = mealaweWalletObj.kitchenPhoneNo || savedMealaweWallet.kitchenPhoneNo;
        savedMealaweWallet.kitchenEmail = mealaweWalletObj.kitchenEmail || savedMealaweWallet.kitchenEmail;
        if (mealaweWalletObj.wallet_balance) {
            savedMealaweWallet.wallet_balance = mealaweWalletObj.wallet_balance + savedMealaweWallet.wallet_balance;
        }
        const updated = await KitchenMealaweWallet.findOneAndUpdate({ _id: savedMealaweWallet._id }, { $set: savedMealaweWallet }, { new: true });
        return updated;
    } else {
        const nKitchenMealaweWallet = new KitchenMealaweWallet();
        nKitchenMealaweWallet.kitchenId = mealaweWalletObj.kitchenId;
        nKitchenMealaweWallet.kitchenPartnerName = mealaweWalletObj.kitchenPartnerName;
        nKitchenMealaweWallet.kitchenName = mealaweWalletObj.kitchenName;
        nKitchenMealaweWallet.kitchenPhoneNo = mealaweWalletObj.kitchenPhoneNo;
        nKitchenMealaweWallet.kitchenEmail = mealaweWalletObj.kitchenEmail;
        nKitchenMealaweWallet.wallet_balance = mealaweWalletObj.wallet_balance;
        const isInserted = await nKitchenMealaweWallet.save();
        return isInserted;
    }
}
withdrawFromMealaweWallet = async (kitchenId, withdawAmt) => {
    const savedMealaweWallet = await KitchenMealaweWallet.findOne({ kitchenId });
    if (savedMealaweWallet && savedMealaweWallet._id) {
        let updatedAmount = savedMealaweWallet.wallet_balance - withdawAmt;
        updatedAmount = parseFloat(updatedAmount.toFixed(2));
        const updated = await KitchenMealaweWallet.findOneAndUpdate({ _id: savedMealaweWallet._id }, { $set: { wallet_balance: updatedAmount } },
            { new: true });
        return updated;
    } else {
        // console.log('mealaweWallet not found ', savedMealaweWallet)
        return savedMealaweWallet;
    }
}
depositeInMealaweWallet = async (kitchenId, withdawAmt) => {
    const savedMealaweWallet = await KitchenMealaweWallet.findOne({ kitchenId });
    if (savedMealaweWallet && savedMealaweWallet._id) {
        let updatedAmount = savedMealaweWallet.wallet_balance + withdawAmt;
        updatedAmount = parseFloat(updatedAmount.toFixed(2));
        const updated = await KitchenMealaweWallet.findOneAndUpdate({ _id: savedMealaweWallet._id }, { $set: { wallet_balance: updatedAmount } },
            { new: true });
        return updated;
    } else {
        // console.log('mealaweWallet not found ', savedMealaweWallet)
        return savedMealaweWallet;
    }
}
getKitchenMealaweWallet = async (kitchenId) => {
    return await KitchenMealaweWallet.findOne({ kitchenId });
}

module.exports = {
    saveUpdateKitchenMealaweWallet,
    withdrawFromMealaweWallet,
    getKitchenMealaweWallet,
    depositeInMealaweWallet
}