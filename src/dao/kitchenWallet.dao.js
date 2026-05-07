const KitchenWallet = require('../model/kitchenWallet.model');
const { saveKitchenTransactionHistory } = require('./kitchenTransactionHistory.dao');

const saveKitchenWallet = async (wallet) => {
    const nKitchenWallet = new KitchenWallet();
    nKitchenWallet.kitchenName = wallet.kitchenName;
    nKitchenWallet.kitchenId = wallet.kitchenId;
    nKitchenWallet.kitchenPartnerName = wallet.kitchenPartnerName;
    nKitchenWallet.phoneNo = wallet.phoneNo;
    nKitchenWallet.email = wallet.email;
    nKitchenWallet.ifsc = wallet.ifsc;
    nKitchenWallet.bank_name = wallet.bank_name;
    nKitchenWallet.account_name = wallet.account_name;
    nKitchenWallet.account_number = wallet.account_number;
    nKitchenWallet.contact_id = wallet.contact_id;
    nKitchenWallet.fund_id = wallet.fund_id;
    nKitchenWallet.wallet_balance = wallet.wallet_balance;
    const isInserted = await nKitchenWallet.save();
    return isInserted;
}
const updateKitchenWallet = async (kitchenId, wallet) => {
    const savedWallet = await KitchenWallet.findOne({ kitchenId });
    if (savedWallet && savedWallet._id) {
        savedWallet.contact_id = wallet.contact_id || savedWallet.contact_id;
        savedWallet.fund_id = wallet.fund_id || savedWallet.fund_id;
        savedWallet.ifsc = wallet.ifsc || savedWallet.ifsc;
        savedWallet.bank_name = wallet.bank_name || savedWallet.bank_name;
        savedWallet.account_name = wallet.account_name || savedWallet.account_name;
        savedWallet.account_number = wallet.account_number || savedWallet.account_number;
        const updated = await KitchenWallet.findOneAndUpdate({ _id: savedWallet._id }, { $set: savedWallet }, { new: true });
        return updated;
    }
    else {
        // console.log('wallet not found ', savedWallet)
        return savedWallet;
    }
}
const getKitchenWallet = async (kitchenId) => {
    const savedWallet = await KitchenWallet.findOne({ kitchenId });
    return savedWallet ? savedWallet : {};
}
const depositeWalletBalance = async (kitchenId, walletMoney) => {
    const savedWallet = await KitchenWallet.findOne({ kitchenId });
    if (savedWallet && savedWallet._id) {
        const balance = savedWallet.wallet_balance ? savedWallet.wallet_balance : 0;
        let updatedAmount = balance + walletMoney;
        // console.log('updatedAmount ',updatedAmount);
        updatedAmount = parseFloat(updatedAmount.toFixed(2));
        const updated = await KitchenWallet.findOneAndUpdate({ _id: savedWallet._id }, { $set: { wallet_balance: updatedAmount } },
            { new: true });

        return updated;
    } else {
        // console.log('wallet not found ', savedWallet)
        return savedWallet;
    }
}

const withdrawWalletBalance = async (kitchenId, walletMoney) => {
    const savedWallet = await KitchenWallet.findOne({ kitchenId });
    if (savedWallet && savedWallet._id) {
        let updatedAmount = savedWallet.wallet_balance - walletMoney;
        updatedAmount = parseFloat(updatedAmount.toFixed(2));
        const updated = await KitchenWallet.findOneAndUpdate({ _id: savedWallet._id }, { $set: { wallet_balance: updatedAmount } },
            { new: true });

        return updated;
    } else {
        // console.log('wallet not found ', savedWallet)
        return savedWallet;
    }
}

const updateWalletBalance = async (kitchenId, walletMoney) => {
    const savedWallet = await KitchenWallet.findOne({ kitchenId });
    if (savedWallet && savedWallet._id) {
        let updatedAmount = parseFloat(walletMoney.toFixed(2));
        const updated = await KitchenWallet.findOneAndUpdate({ _id: savedWallet._id }, { $set: { wallet_balance: updatedAmount } },
            { new: true });
        return updated;
    } else {
        // console.log('wallet not found ', savedWallet)
        return savedWallet;
    }
}

const getAllKitchenWalletList = async () => {
    return await KitchenWallet.find({});
}

const updateKitchenIdAndName = async (kitchenId, loginId, kitchenName) => {
    return await KitchenWallet.findOneAndUpdate({ kitchenId }, { $set: { loginId, kitchenName } },
        { new: true });
}

const getAllKitchenWalletListForWithdarwal = async () => {
    return await KitchenWallet.find({ wallet_balance: { $gt: 0 } });
};

module.exports = {
    saveKitchenWallet,
    updateKitchenWallet,
    getKitchenWallet,
    depositeWalletBalance,
    updateWalletBalance,
    withdrawWalletBalance,
    getAllKitchenWalletList,
    updateKitchenIdAndName,
    getAllKitchenWalletListForWithdarwal
}