const UserMealaweWallet = require('../model/userMealaweWallet.model');

saveUpdateUserMealaweWallet = async (customerId, mealaweWalletObj) => {
    const savedMealaweWallet = await UserMealaweWallet.findOne({ customerId });
    if (savedMealaweWallet && savedMealaweWallet._id) {
        savedMealaweWallet.customerId = mealaweWalletObj.customerId || savedMealaweWallet.customerId;
        savedMealaweWallet.customerPhoneNo = mealaweWalletObj.customerPhoneNo || savedMealaweWallet.customerPhoneNo;
        savedMealaweWallet.customerEmail = mealaweWalletObj.customerEmail || savedMealaweWallet.customerEmail;
        if (mealaweWalletObj.wallet_balance) {
            savedMealaweWallet.wallet_balance = mealaweWalletObj.wallet_balance + savedMealaweWallet.wallet_balance;
        }
        const updated = await UserMealaweWallet.findOneAndUpdate({ _id: savedMealaweWallet._id }, { $set: savedMealaweWallet }, { new: true });
        return updated;
    } else {
        const nUserMealaweWallet = new UserMealaweWallet();
        nUserMealaweWallet.customerId = mealaweWalletObj.customerId;
        nUserMealaweWallet.customerPhoneNo = mealaweWalletObj.customerPhoneNo;
        nUserMealaweWallet.customerEmail = mealaweWalletObj.customerEmail;
        nUserMealaweWallet.wallet_balance = mealaweWalletObj.wallet_balance;
        const isInserted = await nUserMealaweWallet.save();
        return isInserted;
    }
}
withdrawFromMealaweWallet = async (customerId, withdawAmt) => {
    const savedMealaweWallet = await UserMealaweWallet.findOne({ customerId });
    if (savedMealaweWallet && savedMealaweWallet._id) {
        if (savedMealaweWallet.wallet_balance && savedMealaweWallet.wallet_balance >= withdawAmt) {
            let updatedAmount = savedMealaweWallet.wallet_balance - withdawAmt;
            updatedAmount = parseFloat(updatedAmount.toFixed(2));
            const updated = await UserMealaweWallet.findOneAndUpdate({ _id: savedMealaweWallet._id }, { $set: { wallet_balance: updatedAmount } },
                { new: true });
            return updated;
        } else {
            // console.log('mealaweWallet lower balance ', savedMealaweWallet)
            return savedMealaweWallet;
        }
    } else {
        // console.log('mealaweWallet not found ', savedMealaweWallet)
        return savedMealaweWallet;
    }
}
depositeInMealaweWallet = async (customerId, withdawAmt) => {
    const savedMealaweWallet = await UserMealaweWallet.findOne({ customerId });
    if (savedMealaweWallet && savedMealaweWallet._id) {
        let updatedAmount = savedMealaweWallet.wallet_balance + withdawAmt;
        updatedAmount = parseFloat(updatedAmount.toFixed(2));
        const updated = await UserMealaweWallet.findOneAndUpdate({ _id: savedMealaweWallet._id }, { $set: { wallet_balance: updatedAmount } },
            { new: true });
        return updated;
    } else {
        // console.log('mealaweWallet not found ', savedMealaweWallet)
        return savedMealaweWallet;
    }
}
getUserMealaweWallet = async (customerId) => {
    return await UserMealaweWallet.findOne({ customerId });
}

getAllUserMealaweWallet = async () => {
    return await UserMealaweWallet.find({});
}
module.exports = {
    saveUpdateUserMealaweWallet,
    withdrawFromMealaweWallet,
    getUserMealaweWallet,
    depositeInMealaweWallet,
    getAllUserMealaweWallet
}