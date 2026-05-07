

const WooCommerceAPI = require('woocommerce-api');
const { createLoginAuthUser } = require('../service/authUser.service');
const { getCustomerProfileByMobile, saveNewCustomerProfile, updateCustomerProfile } = require('../service/customerProfile.service');
const { getLocalDate, changeToLocalDate, getTodayStartTime } = require('./date-util');
const { saveOrderPackage, getWooCoomerceOrder } = require('../service/foodOrderPackage.service');
const { wooCommerceApisHttpCall } = require('./http-api-handler');
const { getMealPackageById } = require('../service/mealPackage.service');

const wooCommerceObj = {
    url: 'https://www.mealawe.com',
    consumerKey: 'ck_c9e9b93ec8416d30e274b467dd9e071ef2a91d0b',
    consumerSecret: 'cs_b44fe27e4be2666e12e733716d1c839545d607a5',
    wpAPI: true,
    version: 'wc/v1'
};


const checkMeal = async (wooCommerceId) => {
    let orderNotFound = true;
    const mealOrder = await getWooCoomerceOrder(wooCommerceId);
    if (mealOrder && mealOrder._id) {
        orderNotFound = false;
    }
    return orderNotFound;
}

const createUserProfile = async (loginUser, billing, meta_data) => {
    let lat, lng;
    meta_data.forEach(meta => {
        if (meta.key === 'lpac_latitude') {
            lat = meta.value;
        } else if (meta.key === 'lpac_longitude') {
            lng = meta.value;
        }
    });
    // // console.log('lat',lat,'lng',lng);
    return new Promise(async (resolve, reject) => {
        try {
            const profile = await getCustomerProfileByMobile(billing.phone);
            const customerLocation = {
                tagLocation: 'other',
                geolocation: { lat: lat, lng: lng },
                address: `${billing.address_2} ${billing.address_1} `,
                location: `${billing.city} ${billing.state} ${billing.postcode}`,
                landmark: '',
            };
            if (profile && profile._id) {
                let addressNotfound = true;
                profile.addressList.forEach(address => {
                    // // console.log(address.geolocation.lat, lat,address.geolocation.lng, lng)
                    if (address.geolocation.lat == lat && address.geolocation.lng == lng) {
                        addressNotfound = false;
                    }
                });
                if (addressNotfound) {
                    let addressList = [];
                    if (profile.addressList && profile.addressList.length > 0) {
                        addressList = profile.addressList;
                    }
                    addressList.push({
                        ...customerLocation,
                        currentlySelected: false
                    });
                    // console.log('updateCustomerProfile');
                    const savedProfile = await updateCustomerProfile(profile._id, { addressList });
                    resolve({ savedProfile, customerLocation });
                } else {
                    // console.log('address Found ');
                    resolve({ savedProfile: profile, customerLocation });
                }
            } else {
                const userProfile = {
                    userName: `${billing.first_name} ${billing.last_name}`,
                    phoneNo: billing.phone,
                    loginId: loginUser._id,
                    addressList: [{
                        ...customerLocation,
                        currentlySelected: true
                    }
                    ]
                }
                // console.log('saveNewCustomerProfile');
                const savedProfile = await saveNewCustomerProfile(userProfile);
                savedProfile.customerLocation = customerLocation;
                resolve({ savedProfile, customerLocation });
            }
        } catch (error) {
            // console.log('Error while validateIfManualDelivery ', error);         
            reject(error);
        }
    });
}

const createVariable = async (wooComMeal) => {
    const orderVariables = {
        orderDate: changeToLocalDate(wooComMeal.date_created),
        amount: 0,
        mealaweTotalAmt: 0,
        discount: 0,
        mealPackage: undefined,
        payment_id: wooComMeal.transaction_id,
        order_id: wooComMeal.order_key,
        subscriptionStartDate: undefined,
        subscriptionDays: 0,
        mealTimeLunch: false,
        mealTimeDinner: false,
        userSelectedDates: [],
        multiDateAllowed: false,
        wooCommerceId: wooComMeal.id,
        taxes: wooComMeal.total_tax
    }
    const mealPackageInfo = wooComMeal.line_items[0];
    const total = parseFloat(wooComMeal.total);
    orderVariables.amount = parseFloat(total.toFixed(2));;
    orderVariables.mealaweTotalAmt = parseFloat(total.toFixed(2));
    orderVariables.totalCount = mealPackageInfo.quantity;
    // get Actual mealPackage from DB
    // console.log('mealPackageInfo.sku ',mealPackageInfo.sku);
    const savedPackage = await getMealPackageById(mealPackageInfo.sku);
    // // console.log('savedPackage ',savedPackage);
    if (savedPackage && savedPackage._id) {
        orderVariables.subscriptionDays = savedPackage.days;
        let daysList = [];
        let sweetEveryDay = false;
        let sweetAddonObj;
        let goGreen = false;
        let goGreenAddonObj;
        let allDayNonVeg = false;
        let allDayNonVegObj;
        let addonsCustomList = [];
        mealPackageInfo.meta_data.forEach(packageInfo => {
            // // console.log(packageInfo.key,packageInfo.value);
            if (packageInfo.key === 'Start Date' || packageInfo.key === 'Pick Subscription Start Date') {
                const subscribeDate = packageInfo.value.split('-');
                const day = subscribeDate[0];
                const month = subscribeDate[1];
                subscribeDate[0] = month;
                subscribeDate[1] = day;
                orderVariables.subscriptionStartDate = changeToLocalDate(subscribeDate.join('/'));
            } else if (packageInfo.key === 'Lunch / Dinner') {
                if (packageInfo.value === 'Lunch') {
                    orderVariables.mealTimeLunch = true;
                } else if (packageInfo.value === 'Dinner') {
                    orderVariables.mealTimeDinner = true;
                }
            } else if (packageInfo.key === 'Include Weekends') {
                if (packageInfo.value.indexOf('Include Saturday') >= 0) {
                    daysList.push(7);
                }
                if (packageInfo.value.indexOf('Include Sunday') >= 0) {
                    daysList.push(1);
                }
            } else if (packageInfo.key === 'Include Weekends') {
                if (packageInfo.value.indexOf('Include Saturday') >= 0) {
                    daysList.push(7);
                }
                if (packageInfo.value.indexOf('Include Sunday') >= 0) {
                    daysList.push(1);
                }
            } else if (packageInfo.key === 'Sweet Everyday') {
                if (packageInfo.value === 'Sweet') {
                    sweetEveryDay = true;
                }
            } else if (packageInfo.key === 'Non-Veg on Every Wednesday / Friday') {
                if (packageInfo.value.indexOf('Non-Veg on Every Wednesday') >= 0) {
                    daysList.push(4);
                }
                if (packageInfo.value.indexOf('Non-Veg on Every Friday') >= 0) {
                    daysList.push(6);
                }
            } else if (packageInfo.key === 'Go Green') {
                if (packageInfo.value === 'Cornstarch Trays') {
                    goGreen = true;
                }
            } else if (packageInfo.key === '7 Days Non-Veg' || packageInfo.key === 'Everyday Non-Veg') {
                if (packageInfo.value === '1 Non-Veg Added Every Meal') {
                    allDayNonVeg = true;
                }
            }
        });
        // console.log('daysList ',daysList);
        savedPackage.addonsList.forEach(mealAddons => {
            let addons = {
                addonName: mealAddons.addonName,
                extraPrice: mealAddons.extraPrice,
                payKitchenExtraPerMeal: mealAddons.payKitchenExtraPerMeal,
                day: mealAddons.day,
                addOnType: mealAddons.addOnType,
                daily: mealAddons.daily,
                dayCount: mealAddons.dayCount,
                hidetoKitchen: mealAddons.hidetoKitchen
            };
            if (daysList.indexOf(addons.day) > -1) {
                addons.selected = true;
                addons.userAmount = addons.dayCount * addons.extraPrice;
                if ((addons.day === 1 || addons.day === 7) && !savedPackage.deliveryOnWeekends) {
                    orderVariables.subscriptionDays += addons.dayCount;
                }
                addonsCustomList.push(addons);
            }
            if (sweetEveryDay && addons.addOnType === 'Sweet') {
                addons.selected = true;
                sweetAddonObj = addons;
            }
            if (goGreen && addons.addOnType === 'NA') {
                addons.selected = true;
                goGreenAddonObj = addons;
            }
            if (goGreen && addons.addOnType === 'NA') {
                addons.selected = true;
                goGreenAddonObj = addons;
            }
            if (allDayNonVeg && addons.addOnType === 'NonVeg') {
                addons.selected = true;
                allDayNonVegObj = addons;
            }
        });

        if (sweetEveryDay) {
            sweetAddonObj.userAmount = orderVariables.subscriptionDays * sweetAddonObj.extraPrice;
            addonsCustomList.push(sweetAddonObj);
        }
        if (goGreen) {
            goGreenAddonObj.userAmount = orderVariables.subscriptionDays * goGreenAddonObj.extraPrice;
            addonsCustomList.push(goGreenAddonObj);
        }
        if (allDayNonVeg) {
            allDayNonVegObj.userAmount = orderVariables.subscriptionDays * allDayNonVegObj.extraPrice;
            addonsCustomList.push(allDayNonVegObj);
        }
        // // console.log('orderVariables ',addonsCustomList);
        orderVariables.mealPackage = {
            packageName: savedPackage.packageName,
            packagePrice: savedPackage.packagePrice,
            packageCategory: savedPackage.packageCategory,
            packageSubCategory: savedPackage.packageSubCategory,
            packageType: savedPackage.packageType,
            days: savedPackage.days,
            payToKitchenPerMeal: savedPackage.payToKitchenPerMeal,
            vegMealDescription: savedPackage.vegMealDescription,
            nonVegMealDescription: savedPackage.nonVegMealDescription,
            deliveryOnWeekends: savedPackage.deliveryOnWeekends,
            discount: savedPackage.discount,
            priority: savedPackage.priority,
            packageInfo: savedPackage.packageInfo,
            clusters: savedPackage.clusters,
            addonsList: addonsCustomList,
            menuList: savedPackage.menuList,
            userAmount: savedPackage.packagePrice,
            multiDateAllowed: savedPackage.multiDateAllowed,
            count: orderVariables.totalCount
        };
        orderVariables.discount = orderVariables.mealPackage.discount * orderVariables.mealPackage.count;
        return orderVariables;
    } else {
        return {};
    }

}

const createMealPackage = async (userProfile, customerLocation, orderPackage, wooComMeal) => {
    const nOrderPackage = {};
    nOrderPackage.orderType = 'subscriptionPackage';
    nOrderPackage.customerId = userProfile._id;
    nOrderPackage.customerName = userProfile.userName;
    nOrderPackage.customerLocation = customerLocation,
        nOrderPackage.customerPhoneNo = userProfile.phoneNo;
    nOrderPackage.customerEmail = userProfile.email;
    nOrderPackage.orderCreatedBy = 'Auto';
    nOrderPackage.orderDate = new Date();
    nOrderPackage.amount = orderPackage.amount;
    nOrderPackage.mealaweTotalAmt = orderPackage.mealaweTotalAmt;
    nOrderPackage.discount = orderPackage.discount;
    nOrderPackage.orderstatus = 'placed';
    nOrderPackage.mealPackage = orderPackage.mealPackage;
    nOrderPackage.payment_id = orderPackage.payment_id;
    nOrderPackage.order_id = orderPackage.order_id;
    nOrderPackage.receipt = orderPackage.receipt;
    nOrderPackage.moneyWalletPointsUsed = 0;
    nOrderPackage.subscriptionStartDate = orderPackage.subscriptionStartDate;
    nOrderPackage.subscriptionDays = orderPackage.subscriptionDays;
    nOrderPackage.mealTimeLunch = orderPackage.mealTimeLunch;
    nOrderPackage.mealTimeDinner = orderPackage.mealTimeDinner;
    nOrderPackage.wooCommerceId = wooComMeal.id;
    nOrderPackage.taxes = orderPackage.taxes;
    const newMealOrder = await saveOrderPackage(nOrderPackage);
    // console.log('Auto order placed');
    return newMealOrder;
}
const updateWooCommerceMealOrderStatus = async (id) => {
    try {
        const url = `${wooCommerceObj.url}/wp-json/wc/v3/orders/${id}?consumer_key=${wooCommerceObj.consumerKey}&consumer_secret=${wooCommerceObj.consumerSecret}&status=processing`;
        await wooCommerceApisHttpCall(url, 'PUT', { status: "completed" });
    } catch (error) {
        // console.log('error while updateWooCommerceMealOrderStatus ',error);
    }
}

const prepareWooComMealOrder = async (wooComMeal) => {
    try {
        const orderNotFound = await checkMeal(wooComMeal.id);
        // console.log('prepareWooComMealOrder orderNotFound',wooComMeal.id,orderNotFound);
        if (orderNotFound) {
            const loginUser = await createLoginAuthUser(wooComMeal.billing.phone);
            if (loginUser && loginUser._id) {
                const { savedProfile, customerLocation } = await createUserProfile(loginUser, wooComMeal.billing, wooComMeal.meta_data);
                if (savedProfile && customerLocation) {
                    const orderPackage = await createVariable(wooComMeal);
                    if (orderPackage) {
                        const mealPackage = await createMealPackage(savedProfile, customerLocation, orderPackage, wooComMeal);
                        if (mealPackage && mealPackage._id) {
                            // console.log('woo commerce order completed1');
                            updateWooCommerceMealOrderStatus(wooComMeal.id);
                        }
                    }
                }
            }
        } else {
            // console.log('woo commerce order completed2');
            updateWooCommerceMealOrderStatus(wooComMeal.id);
        }
    } catch (error) {
        // console.log('error while prepareAllMealOrder ',error);
    }
}

const getWooCommerceMealOrders = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${wooCommerceObj.url}/wp-json/wc/v3/orders?consumer_key=${wooCommerceObj.consumerKey}&consumer_secret=${wooCommerceObj.consumerSecret}&status=processing`;
            // console.log('getWooCommerceMealOrders',url);
            const response = await wooCommerceApisHttpCall(url, 'GET', null);
            try {
                const promiseArr = [];
                if (response && response.length > 0) {
                    response.forEach(wooComMeal => {
                        // console.log('wooComMeal _id',wooComMeal.id);                  
                        promiseArr.push(prepareWooComMealOrder(wooComMeal));
                    });
                } else {
                    // console.log('getWooCommerceMealOrders no response');
                }
                await Promise.all(promiseArr);
                resolve(response);
            } catch (error) {
                // console.log('error while getWooCommerceMealOrders ',error);
                reject('error while getWooCommerceMealOrders ');
            }
        } catch (error) {
            // console.log('error while getWooCommerceMealOrders ',error);
            reject('error while getWooCommerceMealOrders ');
        }
    });
}

const getWooCommerceMealOneOrder = async (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `${wooCommerceObj.url}/wp-json/wc/v3/orders/${id}?consumer_key=${wooCommerceObj.consumerKey}&consumer_secret=${wooCommerceObj.consumerSecret}&status=processing`;
            const response = await wooCommerceApisHttpCall(url, 'GET', null);
            // console.log('getWooCommerceMealOneOrder id',response._id);
            try {
                prepareWooComMealOrder(response)
                resolve(response);
            } catch (error) {
                // console.log('error while getWooCommerceMealOneOrder ',error);
                reject(error);
            }
        } catch (error) {
            // console.log('error while getWooCommerceMealOneOrder ',error);
            reject(error);
        }
    });
}

module.exports = {
    getWooCommerceMealOrders,
    getWooCommerceMealOneOrder
}
