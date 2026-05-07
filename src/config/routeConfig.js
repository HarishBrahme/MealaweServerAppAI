const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const connectRedis = require('connect-redis');
const cors = require('cors');
const passport = require('passport');
const { initialize } = require('./../config/passportConfig');
const imageRouter = require('../route/images.route');
const foodItemRouter = require('./../route/foodItem.route');
const bannerRouter = require('./../route/banner.route');
const regionalRouter = require('./../route/regionalInfo.route');
const searchRouter = require('./../route/search.route');
const kitchenPartnerRouter = require('./../route/kitchenPartner.route');
const authUserRouter = require('./../route/authUser.route');
const authKitchenRouter = require('./../route/authKitchen.route');
const authAdminRouter = require('./../route/authAdmin.route');
const adminProfileRouter = require('./../route/adminProfile.route');
const customerProfileRouter = require('./../route/customerProfile.route');
const FoodAddon = require('./../route/foodaddon.route');
const FAQroute = require('./../route/faq.route');
const deliverypartner = require('./../route/deliverypartner.route');
const kitchenPartnerLead = require('./../route/kitchenPartnerLead.route');
const todaysMenuRouter = require('./../route/todaysMenu.route');
const kitchenMenuRouter = require('./../route/kitchenMenu.route');
const foodOrderRouter = require('./../route/foodorder.route');
const geoFencingRouter = require('./../route/geoFencing.route');
const subscriptionWeeklyMenuRouter = require('./../route/subscriptionWeeklyMenu.route');
const feedBackRouter = require('./../route/feedback.route');
const fcmCloudRouter = require('./../route/fcmCloudMessage.route');
const paymentGateway = require('./../route/paymentGateway.route');
const kitchenWallet = require('./../route/kitchenWallet.route');
const kitchenTransactionHistory = require('./../route/kitchenTransactionHistory.route');
const kitchenMealaweWallet = require('./../route/kitchenMealaweWallet.route');
const kitchenMealaweTransactionHistory = require('./../route/kitchenMealaweTransactionHistory.route');
const offerCouponRouter = require('./../route/offerCoupon.route');
const offerVoucherRouter = require('./../route/offerVoucher.route');
const configVariables = require('./../route/appConfigVariable.route');
const configImagesRouter = require('./../route/appConfigImage.route');
const userWalletRouter = require('./../route/userWallet.route');
const userMealaweWalletRouter = require('./../route/userMealaweWallet.route');
const deliveryOrderRouter = require('./../route/deliveryOrder.route');
const publicRouter = require('./../route/public.route');
const appVersionControl = require('./../route/appVersionControl.route');
const generalAppFeedbackRouter = require('./../route/generalAppFeedback.route');
const userWalletHistory = require('./../route/userTransactionHistory.route');
const userMealaweWalletHistory = require('./../route/userMealaweTransactionHistory.route');
const dishSuggestionRoute = require('./../route/dishSuggestion.route');
const testUserRoute = require('./../route/testUser.route');
const favKitchenRoute = require('./../route/customerFavKitchen.route');
const utilityRoute = require('./../route/utility.route')
const foodOrderSubscriptionRouter = require('./../route/foodOrderSubscription.route');
const orderBookingRouter = require('./../route/orderBooking.route');
const cashbackRouter = require('./../route/cashback.route');
const companyProfileRouter = require('./../route/companyProfile.route');
const companyMenuRouter = require('./../route/companyMenu.route');
const foodOrderPackageRouter = require('./../route/foodOrderPackage.route');
const mealPackageRouter = require('./../route/mealPackage.route');
const policyRouter = require('./../route/dashboardPolicy.route');
const bulkFoodItem = require('./../route/bulkFoodItem.route');
const bulkFoodOrder = require('./../route/bulkFoodOrder.route');
const bulkMenu = require('./../route/bulkMenu.route');
const marketPlaceGroup = require('./../route/marketPlaceGroup.route');
const marketPlaceItem = require('./../route/marketPlaceItem.route');
const marketPlaceInventory = require('./../route/marketPlaceInventory.route');
const marketPlaceItemOrder = require('./../route/marketPlaceItemOrder.route');
const marketPlaceMainOrder = require('./../route/marketPlaceMainOrder.route');
const marketPlaceDelivery = require('./../route/marketplaceDeliveryOrder.route');
const marketPlaceInventoryItemHistory = require('./../route/marketPlaceInventoryItemHistory.route');
const navmooFeedBackRouter = require('./../route/marketPlaceFeedback.route');
const oyoHotelRoutes = require('./../route/oyoHotels.route');
const utmEventsRoutes = require('../route/utmEvents.routes');
const paymentGatewayJusPay = require('./../route/paymentGatewayJusPay.route');
const clusterConfigVariable = require('../route/clusterConfigVariable.route');
const blogsRoutes = require('../route/blogs.route');
const blogCategorysRoutes = require('../route/blogCategory.route');
const blogAuthorRoutes = require('./../route/blogAuthor.route');
const metaRoutes = require('../route/metaManagement.route');
const imageGroupConfigRoutes = require('../route/imageGroupConfig.route');
const marketPlaceItemReview = require('./../route/marketPlaceItemReview.route');
const kitchenLedgerRoute = require('../route/kitchenLedger.route');
const videoRouter = require('../route/video.route');
const configVideosRouter = require('./../route/appConfigVideo.route');
const apartmentRoutes = require('./../route/apartment.route');
const apartmentMenuRoutes = require('./../route/apartmentMenu.route');
const whatsappMessageRouter = require('./../route/whatsappMessage.route');

initialize();
module.exports = (app, redisClient, wsInstance) => {
    const webSocketRouter = require('./../route/websocket.route');
    wsInstance.applyTo(webSocketRouter);
    const corsOptions = {
        origin: (origin, callback) => {
            callback(null, true)
        },
        'preflightContinue': false,
        'optionsSuccessStatus': 204,
        'credentials': true
    }
    app.use(cors(corsOptions))
    app.use(express.json({ limit: '50mb', extended: true }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.use(cookieParser());
    app.set('trust proxy', 1)
    const RedisStore = connectRedis(session);
    let cookie = {};
    if (process.env.PRODUCTION === 'true' || process.env.STAGING === 'true') {
        cookie = {
            secure: true,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24,
            sameSite: 'none'
        }
    } else {
        cookie = {
            secure: false,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24,
            sameSite: true
        }
    }
    app.use(session({
        store: new RedisStore({ client: redisClient }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie
    }));

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.static('public'));
    app.set('view engine', 'ejs');
    app.use('/', imageRouter);
    app.use('/', videoRouter);
    app.use('/api', foodItemRouter);
    app.use('/api', bannerRouter);
    app.use('/api', regionalRouter);
    app.use('/search', searchRouter);
    app.use('/api', kitchenPartnerRouter);
    app.use('/authuser', authUserRouter);
    app.use('/authkitchen', authKitchenRouter);
    app.use('/authadmin', authAdminRouter);
    app.use('/api', customerProfileRouter);
    app.use('/api', FoodAddon);
    app.use('/api', FAQroute);
    app.use('/api', deliverypartner);
    app.use('/api', kitchenPartnerLead);
    app.use('/api', todaysMenuRouter);
    app.use('/api', kitchenMenuRouter);
    app.use('/api', foodOrderRouter);
    app.use('/api', geoFencingRouter);
    app.use('/api', feedBackRouter);
    app.use('/api', fcmCloudRouter);
    app.use('/api', kitchenWallet);
    app.use('/api', kitchenTransactionHistory);
    app.use('/api', kitchenMealaweWallet);
    app.use('/api', kitchenMealaweTransactionHistory);
    app.use('/transaction', paymentGateway);
    app.use('/transaction', paymentGatewayJusPay);
    app.use('/api', offerCouponRouter);
    app.use('/api', offerVoucherRouter);
    app.use('/api', configVariables);
    app.use('/api', userWalletRouter);
    app.use('/api', userMealaweWalletRouter);
    app.use('/api', adminProfileRouter);
    app.use('/api', deliveryOrderRouter);
    app.use('/public', publicRouter);
    app.use('/api', appVersionControl);
    app.use('/api', generalAppFeedbackRouter);
    app.use('/api', userWalletHistory);
    app.use('/api', userMealaweWalletHistory);
    app.use('/test', testUserRoute);
    app.use('/api', dishSuggestionRoute);
    app.use('/api', favKitchenRoute);
    app.use('/api', configImagesRouter);
    app.use('/utility', utilityRoute);
    app.use('/api', foodOrderSubscriptionRouter);
    app.use('/api', orderBookingRouter);
    app.use('/api', cashbackRouter);
    app.use('/api', companyProfileRouter);
    app.use('/api', companyMenuRouter);
    app.use('/websocket', webSocketRouter);
    app.use('/api', foodOrderPackageRouter);
    app.use('/api', mealPackageRouter);
    app.use('/api', policyRouter);
    app.use('/api', bulkFoodItem);
    app.use('/api', bulkFoodOrder);
    app.use('/api', bulkMenu);
    app.use('/api', marketPlaceGroup);
    app.use('/api', marketPlaceItem);
    app.use('/api', marketPlaceItemReview);
    app.use('/api', marketPlaceInventory);
    app.use('/api', marketPlaceItemOrder);
    app.use('/api', marketPlaceMainOrder);
    app.use('/api', marketPlaceDelivery);
    app.use('/api', marketPlaceInventoryItemHistory);
    app.use('/api', navmooFeedBackRouter);
    app.use('/api', oyoHotelRoutes);
    app.use('/api', utmEventsRoutes);
    app.use('/api', subscriptionWeeklyMenuRouter);
    app.use('/api', clusterConfigVariable);
    app.use('/api', blogCategorysRoutes);
    app.use('/api', blogsRoutes);
    app.use('/api', blogAuthorRoutes);
    app.use('/api', metaRoutes);
    app.use('/api', imageGroupConfigRoutes);
    app.use('/api', kitchenLedgerRoute)
    app.use('/api', configVideosRouter);
    app.use('/api', apartmentRoutes);
    app.use('/api', apartmentMenuRoutes);
    app.use('/api', whatsappMessageRouter); 
}
