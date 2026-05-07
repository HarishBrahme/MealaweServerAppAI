const templates = require('./whatsapp-templates');
const { sendWhatsAppMessage } = require('../http-api-handler');

const sendWelcomeVideo = async (mobile, isKota) => {
    setTimeout(async () => {
        try {
            let payload;
            const videoLink = isKota ? 'https://d2jw5631lf4dqs.cloudfront.net/content/video/8c15295a24a84420b528069c8fcbb881.mp4' : 'https://d2jw5631lf4dqs.cloudfront.net/content/video/21081cd25a7d46beb930f90c15780f60.mp4'
            if (isKota) {
                payload = templates.welcomeKotaTemplate(mobile, videoLink);
            } else {
                payload = templates.welcomeTemplate(mobile, videoLink);
            }
            console.log("Welcome video sent to:", mobile);
            return await sendWhatsAppMessage(payload);
        } catch (err) {
            console.error("Failed to send welcome video:", err);
        }
    }, 300000);
};

const sendSecondMessageCarousel = async (mobile) => {
    const linksArray = [
        'https://d2jw5631lf4dqs.cloudfront.net/content/image/5dbae4ca7b674fef88367ee129dfc07c.png',
        'https://d2jw5631lf4dqs.cloudfront.net/content/image/37e528a3cec14004bd15a0f2bae8a2c9.png',
        'https://d2jw5631lf4dqs.cloudfront.net/content/image/913cddd103104610b153e6190d9e706e.png',
        'https://d2jw5631lf4dqs.cloudfront.net/content/image/ce0f75acf86f42078a01af2a5c14c336.png',
    ];
    const payload = templates.secondMessageCarousel(mobile, linksArray);
    return await sendWhatsAppMessage(payload);
};

const sendFinalOffer = async (mobile) => {
    const payload = templates.finalOfferTemplate(mobile);
    return await sendWhatsAppMessage(payload);
};

const sendFirstTimeCustomerFeedback = async (mobile, userName) => {
    const imageLink = 'https://d2jw5631lf4dqs.cloudfront.net/content/image/ce0f75acf86f42078a01af2a5c14c336.png';
    const payload = templates.firstTimeCustomerFeedback(mobile, imageLink, userName);
    return await sendWhatsAppMessage(payload);;
};

const sendLowRatingCustomerMessage = async (mobile, userName) => {
    const imageLink = 'https://d2jw5631lf4dqs.cloudfront.net/content/image/4c9302b3b36846fea5cea96a7eb073c5.png';
    const payload = templates.lowRatingCustomerTemplate(mobile, imageLink, userName);
    return await sendWhatsAppMessage(payload);;
};

const sendRenewal3Days = async (orderList) => {
    const imageLink = 'https://d2jw5631lf4dqs.cloudfront.net/content/image/58f8f1c6fd5c424d80d1ce4306379f06.png';
    orderList.forEach(async order => {
        const payload = templates.renewal3DaysReminder(order.mobile, imageLink);
        return await sendWhatsAppMessage(payload);
    });
};

const sendRenewal2Days = async (orderList) => {
    const imageLink = 'https://d2jw5631lf4dqs.cloudfront.net/content/image/5a628dad8c724fff92991f6abb84e3db.png';
    orderList.forEach(async order => {
        const payload = templates.renewal2DaysReminder(order.mobile, imageLink, order.textValue);
        return await sendWhatsAppMessage(payload);
    });
};

const sendRenewal1Day = async (orderList) => {
    const imageLink = 'https://d2jw5631lf4dqs.cloudfront.net/content/image/ef56067a98714ceeab915c2cf9c8c458.png';
    orderList.forEach(async order => {
        const payload = templates.renewal1DayReminder(order.mobile, imageLink, order.textValue);
        return await sendWhatsAppMessage(payload);
    });
};

const sendRenewToday = async (orderList) => {
    const imageLink = 'https://d2jw5631lf4dqs.cloudfront.net/content/image/00d940e3493147aaabd25e48a13a3974.png';
    orderList.forEach(async order => {
        const payload = templates.renewTodayTemplate(order.mobile, imageLink, order.textValue);
        return await sendWhatsAppMessage(payload);
    });
};

module.exports = {
    sendWelcomeVideo,
    sendSecondMessageCarousel,
    sendFinalOffer,
    sendFirstTimeCustomerFeedback,
    sendLowRatingCustomerMessage,
    sendRenewal3Days,
    sendRenewal2Days,
    sendRenewal1Day,
    sendRenewToday
};