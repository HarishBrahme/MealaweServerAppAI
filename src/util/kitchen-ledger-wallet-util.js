const { withdrawFromMealaweWallet, getMealaweWalletBalance, depositeInMealaweWallet } = require("../service/kitchenMealaweWallet.service");
const { saveKitchenMealaweTransactionHistory, updateKitchenMealaweTransactionHistory } = require("../service/kitchenMealaweTransactionHistory.service");
const { sendTransactionFcmMessage } = require("./fcm-message-handler");
const { saveKitchenLedger, getstatusWiseLedgerList,getLedgerList, updateKitchenLedger } = require("../service/kitchenLedger.service");
const { saveKitchenTransactionHistory, updatedKitchenTransactionHistory, getKitchenBankPendingTransactionList } = require("../service/kitchenTransactionHistory.service");
const { depositeWalletBalance, getKitchenWallet, updateWalletBalance } = require("../dao/kitchenWallet.dao");
const { payoutJusPay, checkJusPayPayoutStatus } = require("./jusPay-util");
const { serverLog } = require("./firebasedb-util");

const deductKitchenMealawePointsFromWallet = async (kitchenId, kitchenName, rewardsPoints, remark) => {
    try {
        const wallet = await getMealaweWalletBalance(kitchenId);
        // console.log('wallet ',wallet);
        const transactionHistoryObj = {
            status: 'inprogress',
            transaction_points: rewardsPoints,
            created_at: new Date(),
            kitchenId: kitchenId,
            kitchenName: kitchenName,
            wallet_balance: wallet.wallet_balance,
            transactionType: 'Debit',
            remark: remark
        };
        const kitchenTransactionHistory = await saveKitchenMealaweTransactionHistory(transactionHistoryObj);
        await withdrawFromMealaweWallet(kitchenId, rewardsPoints);
        await updateKitchenMealaweTransactionHistory(kitchenTransactionHistory._id, 'completed');
        sendTransactionFcmMessage('kitchen_mealawe_debit', rewardsPoints, kitchenId, 'KITCHEN');
    } catch (error) {
        // console.log('error at deductMoneyPointsFromWallet ', error);
    }
}
const addKitchenMealawePointsInWallet = async (kitchenId, kitchenName, rewardsPoints, remark) => {
    try {
        const wallet = await getMealaweWalletBalance(kitchenId);
        // console.log('wallet ',wallet);
        let wallet_balance = 0;
        if (wallet && wallet._id) {
            wallet_balance = wallet.wallet_balance;
        }
        const transactionHistoryObj = {
            status: 'inprogress',
            transaction_points: rewardsPoints,
            created_at: new Date(),
            kitchenId: kitchenId,
            kitchenName: kitchenName,
            wallet_balance,
            transactionType: 'Credit',
            remark: remark
        };
        const kitchenTransactionHistory = await saveKitchenMealaweTransactionHistory(transactionHistoryObj);
        await depositeInMealaweWallet(kitchenId, rewardsPoints);
        await updateKitchenMealaweTransactionHistory(kitchenTransactionHistory._id, 'completed');
        sendTransactionFcmMessage('kitchen_mealawe_credit', rewardsPoints, kitchenId, 'KITCHEN');
    } catch (error) {
        // console.log('error at addMealawePointsInWallet ', error);
    }
}

const createKitchenLedger = async (ledgerObj) => {
    let kitchenLedgeObj = {
        status: "New",
        remark: ledgerObj.remark,
        createdOn: new Date(),
        transferOn: addDays(new Date(), 7),
        totalItemAmount: ledgerObj.totalItemAmount,
        kitchenCommissionPercentage: ledgerObj.kitchenCommissionPercentage,
        kitchenCommissionAmount: ledgerObj.kitchenCommissionAmount,
        kitchenLedgerAmt: ledgerObj.kitchenLedgerAmt,
        orderNo: ledgerObj.orderNo,
        kitchenName: ledgerObj.kitchenName,
        kitchenPhoneNo: ledgerObj.kitchenPhoneNo,
        kitchenEmail: ledgerObj.kitchenEmail,
        // kitchenUniqueId: kitchen?.kitchenUniqueId,
        kitchenId: ledgerObj.kitchenId,
        orderType: ledgerObj.orderType,
        updateHistory: [
            {
                currentStatus: "New",
                updatedOn: new Date(),
                updateRemark: `New Ledger Created for order ${ledgerObj?.orderNo}`,
            }
        ]
    }
    const saved = await saveKitchenLedger(kitchenLedgeObj);
    return saved
}


const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

const transferLedgerListToWallet = async () => {
    try {
        // console.log('transferLedgerToWallet');
        serverLog("transferLedgerToWalletCroneJobs started");
        // const allLedgerNewList = await getstatusWiseLedgerList('New', 7);
        const allLedgerNewList = await getLedgerList('New');
        serverLog(`transferLedgerToWallet allLedgerNewList, ${allLedgerNewList.length}`);
        console.log('transferLedgerToWallet allLedgerNewList', allLedgerNewList.length);
        await ledgerToWalletTransfer(allLedgerNewList, 0);
    } catch (error) {
        console.log('transferLedgerToWallet error', error)
    }
}

const ledgerToWalletTransfer = async (allLedgerNewList, index) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (index < allLedgerNewList.length) {
                const ledger = allLedgerNewList[index];
                serverLog(`ledgerToWalletTransfer ledger ${ledger}`)
                console.log('ledgerToWalletTransfer ledger', ledger);
                if (ledger && ledger.status === 'New') {
                    await updateKitchenLedger(ledger._id, 'InProgress', 'Transfer to Wallet Initiated', 'Auto', 'Auto');
                    const wallet = await getKitchenWallet(ledger.kitchenId);
                    const transaction_amount = ledger.kitchenLedgerAmt;
                    const transactionHistoryObj = {
                        ledgerId: ledger._id,
                        status: 'Pending',
                        mode: 'Ledger',
                        transaction_amount,
                        created_at: new Date(),
                        kitchenId: ledger.kitchenId,
                        kitchenName: ledger.kitchenName,
                        kitchenPhoneNo: ledger.kitchenPhoneNo,
                        kitchenEmail: ledger.kitchenEmail,
                        // kitchenUniqueId: ledger.kitchenUniqueId,
                        walletPreviousBalance: wallet.wallet_balance?wallet.wallet_balance:0,
                        transactionType: 'Credit',
                        remark: `Ledger amount transfer for orderNo ${ledger.orderNo}`
                    };
                    serverLog('ledgerToWalletTransfer transactionHistoryObj', transactionHistoryObj)
                    console.log('ledgerToWalletTransfer transactionHistoryObj', transactionHistoryObj);
                    const kitchenTransactionHistory = await saveKitchenTransactionHistory(transactionHistoryObj);
                    await depositeWalletBalance(ledger.kitchenId, parseFloat(transaction_amount));
                    await updatedKitchenTransactionHistory(kitchenTransactionHistory._id, { status: 'Success' });
                    await updateKitchenLedger(ledger._id, 'Closed', 'Transfer to Wallet Initiated', 'Auto', 'Auto');
                    console.log("updated wallet")
                    serverLog("updated wallet")
                }
                index++;
                const result = await ledgerToWalletTransfer(allLedgerNewList, index);
                result.responseCount = index;
                resolve(result);
            } else {
                resolve({ status: 'completed', responseCount: 0 });
            }

        } catch (error) {
            console.log('ledgerToWalletTransfer error', error);
            resolve('error');
        }
    });
}


const transferWalletListToBank = async () => {
    try {
        const allKitcheneWalletList = await getAllKitchenWalletListForWithdarwal();
        kitchenWalletBalanceTransferToBank(allKitcheneWalletList, 0);
    } catch (error) {
        console.log('transferWalletListToBank error', error)
    }
}

const kitchenWalletBalanceTransferToBank = async (allKitcheneWalletList, index) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (index < allKitcheneWalletList.length) {
                const kitchenWallet = allKitcheneWalletList[index];
                if (kitchenWallet && kitchenWallet.wallet_balance > 0) {
                    const transaction_amount = kitchenWallet.wallet_balance;
                    const transactionHistoryObj = {
                        ledgerId: ledger._id,
                        status: 'Initiated',
                        mode: 'NEFT',
                        transaction_amount,
                        created_at: new Date(),
                        kitchenId: kitchenWallet.kitchenId,
                        kitchenName: kitchenWallet.kitchenName,
                        kitchenPhoneNo: kitchenWallet.kitchenPhoneNo,
                        kitchenEmail: kitchenWallet.kitchenEmail,
                        kitchenRole: kitchenWallet.kitchenRole,
                        walletPreviousBalance: transaction_amount,
                        transactionType: 'Debit',
                        remark: `Transfer amount from wallet to Bank`
                    };
                    const kitchenTransactionHistory = await saveKitchenTransactionHistory(transactionHistoryObj);
                    await updateWalletBalance(kitchenWallet.kitchenId, 0);
                    try {
                        const beneficiaryDetial = {
                            beneficiaryName: kitchenWallet.accountName,
                            beneficiaryAccountNumber: kitchenWallet.accountNo,
                            beneficiaryIfscCode: kitchenWallet.ifsc,
                            customerId: kitchenWallet.kitchenId,
                            beneficiaryMobile: kitchenWallet.kitchenPhoneNo,
                            beneficiaryEmail: kitchenWallet.kitchenEmail,
                        };
                        const payoutResponse = await payoutJusPay(beneficiaryDetial, transaction_amount);
                        await updatedKitchenTransactionHistory(kitchenTransactionHistory._id, { payout_id: payoutResponse.transactionId, status: payoutResponse.status });
                    } catch (error) {
                        console.log('error while transferring amount from wallet to bank', error);
                        // const refundTransactionHistoryObj = {
                        //     ledgerId: ledger._id,
                        //     status : 'Refund',
                        //     mode : 'NEFT',
                        //     transaction_amount,
                        //     created_at : new Date(),
                        //     kitchenId : kitchenWallet.kitchenId,
                        //     kitchenName : kitchenWallet.kitchenName,
                        //     kitchenPhoneNo : kitchenWallet.kitchenPhoneNo,
                        //     kitchenEmail : kitchenWallet.kitchenEmail,
                        //     kitchenRole : kitchenWallet.kitchenRole,
                        //     walletPreviousBalance: transaction_amount,
                        //     transactionType: 'Credit',
                        //     remark: `Transfer amount from wallet to Bank`
                        // };
                        // await saveKitchenTransactionHistory(refundTransactionHistoryObj);
                        // await updateKitcheneWalletBalance(ledger.kitchenId,transaction_amount);
                    }
                }
                index++;
                const result = await kitchenWalletBalanceTransferToBank(allLedgerNewList, index);
                result.responseCount = index;
                resolve(result);
            } else {
                resolve({ status: 'completed', responseCount: 0 });
            }

        } catch (error) {
            console.log('kitchenWalletBalanceTransferToBank error', error);
            resolve('error');
        }
    });
}

const kitchenBankPendingTransactionList = async () => {
    try {
        const allPendingTransactionList = await getKitchenBankPendingTransactionList();
        updateKitchenBankPendingTransaction(allPendingTransactionList, 0);
    } catch (error) {
        console.log('kitchenBankPendingTransactionList error', error)
    }
}

const updateKitchenBankPendingTransaction = async (allPendingTransactionList, index) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (index < allPendingTransactionList.length) {
                const transaction = allPendingTransactionList[index];
                if (transaction && transaction.status) {
                    const payoutResponse = await checkJusPayPayoutStatus(transaction.payout_id);
                    await updatedKitchenTransactionHistory(transaction._id, { status: payoutResponse.status });
                }
                index++;
                const result = await updateKitchenBankPendingTransaction(allLedgerNewList, index);
                result.responseCount = index;
                resolve(result);
            } else {
                resolve({ status: 'completed', responseCount: 0 });
            }

        } catch (error) {
            console.log('updateKitchenBankPendingTransaction error', error);
            resolve('error');
        }
    });
}

module.exports = {
    deductKitchenMealawePointsFromWallet,
    addKitchenMealawePointsInWallet,
    createKitchenLedger,
    transferLedgerListToWallet,
    transferWalletListToBank,
    kitchenBankPendingTransactionList,
    kitchenWalletBalanceTransferToBank,
}