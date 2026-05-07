const dao = require('./../dao/kitchenWallet.dao');
// const { createKitchenWallet } = require('./paymentGateway.service');
const { kitchenPayouts ,checkJusPayPayoutStatusloc,createKitchenWalletJusPay} = require('./paymentGatewayJusPay.service');
// const {  checkJusPayPayoutStatus } = require("../util/jusPay-util");
const{updatedKitchenTransactionHistory,getTransactionById,saveKitchenTransactionHistory}= require('./kitchenTransactionHistory.service');
const {addkitchenWallet}= require('./kitchenPartner.service');

const checkKitchenWallet = async (wallet) => {
    const savedWallet = await dao.getKitchenWallet(wallet.kitchenId)
    if (savedWallet && savedWallet._id) {
        return { status: 'wallet already present' };
    } else {
        wallet.wallet_balance = 0;
        await dao.saveKitchenWallet(wallet)
        return { status: 'wallet created' };
    }
}

const saveKitchenWallet = (wallet) => {
    return new Promise(async (resolve, reject) => {
        try {
            const fundAccount = await createKitchenWalletJusPay(wallet);
            if(fundAccount.status){
                wallet.fund_id = fundAccount.beneficiaryId;
                wallet.contact_id = fundAccount.beneficiaryId;
                wallet.wallet_balance = 0;
                const savedWallet = await dao.saveKitchenWallet(wallet);
                resolve(savedWallet);
            }else{
                reject(fundAccount)
            }
        } catch (error) {
            // console.log('error while creating wallet', error)
            reject(error)
        }
    });
}
const updateKitchenWallet = (kitchenId, wallet) => {
    return new Promise(async (resolve, reject) => {
        try {
            const updatedWallet = await dao.updateKitchenWallet(kitchenId, wallet);
                resolve(updatedWallet);
            // const fundAccount = await createKitchenWalletJusPay(wallet);
            // console.log(fundAccount,"fundAccount");
            // console.log(wallet,"wallet");
            // if(fundAccount.status){
            //     wallet.fund_id = fundAccount.beneficiaryId;
            //     wallet.contact_id = fundAccount.beneficiaryId;
            //     const updatedWallet = await dao.updateKitchenWallet(kitchenId, wallet);
            //     resolve(updatedWallet);
            // }else{
            //     reject(fundAccount)
            // }
            
        } catch (error) {
            console.log('error while updating wallet', error)
            reject(error)
        }
    });
}
const getKitchenWallet = async (kitchenId) => {
    return await dao.getKitchenWallet(kitchenId);
}

const updateWalletBalance = async (kitchenId, walletMoney) => {
    return await dao.updateWalletBalance(kitchenId, walletMoney)
}
const withdrawal = async (kitchenId) => {
    const kitchenWallet = await dao.getKitchenWallet(kitchenId);
    if (kitchenWallet && kitchenWallet._id && kitchenWallet.wallet_balance > 0) {
        const beneficiaryDetial = {
            beneficiaryName: kitchenWallet.account_name,
            beneficiaryAccountNumber: kitchenWallet.account_number,
            beneficiaryIfscCode: kitchenWallet.ifsc,
            customerId: kitchenWallet.kitchenId,
            beneficiaryMobile: kitchenWallet.phoneNo,
            beneficiaryEmail: kitchenWallet.email,
        };
        const payoutResponse = await kitchenPayouts(beneficiaryDetial, kitchenWallet);
        const newRes = await saveKitchenTransactionHistory(payoutResponse);
        const updated = await dao.updateWalletBalance(kitchenId, 0);
        return updated;
    } else {
        return Promise.reject({ message: 'Wallet balance is zero' });
    }
};

const getAllKitchenWalletList = async () => {
    return await dao.getAllKitchenWalletList();
}
const checkJusPaypayOutStatus = async (transaction) => {
    const payoutResponse = await checkJusPayPayoutStatusloc(transaction.payout_id);
    if(payoutResponse.status=='failed'){
        transaction.status='Faild'
        const transactionRes = await getTransactionById(transaction._id);
        if(!transactionRes.stopTransactionValidation && transactionRes.status=='Pending'){
            transaction.stopTransactionValidation=true;
            const updatedHistory = await updatedKitchenTransactionHistory(transaction._id,transaction);
            const remark =`Refund Credited By Transaction ${transaction.payout_id}`
            const updated = await addkitchenWallet(transaction.kitchenId,transaction.kitchenName, transaction.transaction_amount,remark ); 
        }
        
    }else if(payoutResponse.status=='success'){
        wallet.status='Success'
        const updatedHistory = await updatedKitchenTransactionHistory(wallet._id,wallet)
    }
    return payoutResponse
}

module.exports = {
    checkKitchenWallet,
    saveKitchenWallet,
    updateKitchenWallet,
    getKitchenWallet,
    updateWalletBalance,
    withdrawal,
    getAllKitchenWalletList,
    checkJusPaypayOutStatus
}