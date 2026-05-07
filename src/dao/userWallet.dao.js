const UserWallet = require('../model/userWallet.model');

saveUpdateUserWallet = async (customerId, walletObj) => {
    const savedWallet = await UserWallet.findOne({ customerId });
    if (savedWallet && savedWallet._id) {
        savedWallet.customerId = walletObj.customerId || savedWallet.customerId;
        savedWallet.customerPhoneNo = walletObj.customerPhoneNo || savedWallet.customerPhoneNo;
        savedWallet.customerEmail = walletObj.customerEmail || savedWallet.customerEmail;
        if (walletObj.wallet_balance) {
            savedWallet.wallet_balance = walletObj.wallet_balance + savedWallet.wallet_balance;
        }
        const updated = await UserWallet.findOneAndUpdate({ _id: savedWallet._id }, { $set: savedWallet }, { new: true });
        return updated;
    } else {
        const nUserWallet = new UserWallet();
        nUserWallet.customerId = walletObj.customerId;
        nUserWallet.customerPhoneNo = walletObj.customerPhoneNo;
        nUserWallet.customerEmail = walletObj.customerEmail;
        nUserWallet.wallet_balance = walletObj.wallet_balance;
        const isInserted = await nUserWallet.save();
        return isInserted;
    }
}
withdrawFromWallet = async (customerId, withdawAmt) => {
    const savedWallet = await UserWallet.findOne({ customerId });
    if (savedWallet && savedWallet._id) {
        // console.log('withdrawFromWallet',savedWallet.wallet_balance,withdawAmt)
        if (savedWallet.wallet_balance && savedWallet.wallet_balance >= withdawAmt) {
            let updatedAmount = savedWallet.wallet_balance - withdawAmt;
            updatedAmount = parseFloat(updatedAmount.toFixed(2));
            const updated = await UserWallet.findOneAndUpdate({ _id: savedWallet._id }, { $set: { wallet_balance: updatedAmount } },
                { new: true });
            return updated;
        } else {
            // console.log('wallet low balance', savedWallet)
            return savedWallet;
        }
    } else {
        // console.log('wallet not found ', savedWallet)
        return savedWallet;
    }
}
depositeInWallet = async (customerId, withdawAmt) => {
    const savedWallet = await UserWallet.findOne({ customerId });
    if (savedWallet && savedWallet._id) {
        let updatedAmount = savedWallet.wallet_balance + withdawAmt;
        updatedAmount = parseFloat(updatedAmount.toFixed(2));
        const updated = await UserWallet.findOneAndUpdate({ _id: savedWallet._id }, { $set: { wallet_balance: updatedAmount } },
            { new: true });
        return updated;
    } else {
        // console.log('wallet not found ', savedWallet)
        return savedWallet;
    }
}
getUserWallet = async (customerId) => {
    const wallet = await UserWallet.findOne({ customerId });
    if (wallet) {
        return wallet;
    } else {
        return {};
    }
}

getMoneyWalletBalanceExportList = async (searchObj) => {
    const condition = {};
    if (searchObj.customerPhoneNo) {
        condition.customerPhoneNo = searchObj.customerPhoneNo;
    }
    if (searchObj.customerEmail) {
        condition.customerEmail = searchObj.customerEmail;
    }
    if (searchObj.customerId) {
        condition.customerId = searchObj.customerId;
    }
    condition.wallet_balance = { $ne: 0 };
    return await UserWallet.find(condition).sort({ wallet_balance: -1 });
}

module.exports = {
    saveUpdateUserWallet,
    withdrawFromWallet,
    getUserWallet,
    depositeInWallet,
    getMoneyWalletBalanceExportList
}