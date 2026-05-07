const { sendSMStoMobile } = require('./http-api-handler');

const sendOTPsms = (otp, appName, mobileNumber) => sendSMStoMobile({ From: 'MEALAW', To: mobileNumber, TemplateName: 'Mealawe OTP SMS', VAR1: appName, VAR2: otp });

const welcomeLeadsms = (leadName, mobileNumber) => sendSMStoMobile({ From: 'MEALAW', To: mobileNumber, TemplateName: 'Mealawe Chef Reg Short', VAR1: leadName });

const kitchenLoginIdsms = (kitchenId, KitchenName, mobileNumber) => sendSMStoMobile({ From: 'MEALAW', To: mobileNumber, TemplateName: 'Mealawe Home Chef Welcome', VAR1: KitchenName, VAR2: kitchenId });

const navmoolLoginOtpSMS = (otp, mobileNumber) => sendSMStoMobile({ From: 'NAVMOL', To: mobileNumber, TemplateName: 'NAVMOOL LOGIN OTP', VAR1: otp });
const navmoolOrderPlacedSMS = (mobileNumber, customerName) => sendSMStoMobile({ From: 'NAVMOL', To: mobileNumber, TemplateName: 'NAVMOOL ORDER PLACED', VAR1: customerName });
const navmoolOrderDeliveredSMS = (mobileNumber, customerName) => sendSMStoMobile({ From: 'NAVMOL', To: mobileNumber, TemplateName: 'NAVMOOL ORDER DELIVERED', VAR1: customerName });
const navmoolOrderAcceptedSMS = (mobileNumber, customerName) => sendSMStoMobile({ From: 'NAVMOL', To: mobileNumber, TemplateName: 'NAVMOOL ORDER ACCEPTED', VAR1: customerName });
const navmoolRefundInitiatedSMS = (mobileNumber, customerName) => sendSMStoMobile({ From: 'NAVMOL', To: mobileNumber, TemplateName: 'NAVMOOL REFUND INITIATED', VAR1: customerName });
const navmoolOrderDispatchedSMS = (mobileNumber, customerName) => sendSMStoMobile({ From: 'NAVMOL', To: mobileNumber, TemplateName: 'NAVMOOL ORDER DISPATCHED', VAR1: customerName });
const navmoolLoginCompletedSMS = (mobileNumber, customerName) => sendSMStoMobile({ From: 'NAVMOL', To: mobileNumber, TemplateName: 'NAVMOOL LOGIN', VAR1: customerName });
module.exports = {
    sendOTPsms,
    welcomeLeadsms,
    kitchenLoginIdsms,
    navmoolOrderDeliveredSMS,
    navmoolOrderAcceptedSMS,
    navmoolRefundInitiatedSMS,
    navmoolOrderPlacedSMS,
    navmoolOrderDispatchedSMS,
    navmoolLoginOtpSMS,
    navmoolLoginCompletedSMS
};