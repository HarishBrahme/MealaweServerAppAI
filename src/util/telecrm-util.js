const axios = require('axios');
const { serverLog } = require("./firebasedb-util");
const { getAcceptedOrdersByCustomerPhone } = require('../dao/foodOrderPackage.dao');
const { getCustomerProfile } = require('../dao/customerProfile.dao');

const getCityFromPincode = (pincode) => {
    if (!pincode) return 'Unknown city';
    const pin = String(pincode).trim();
    if (pin.startsWith('41')) return 'Pune';
    if (pin.startsWith('56')) return 'Bangalore';
    if (pin.startsWith('324')) return 'Kota';
    if (pin.startsWith('400')) return 'Mumbai';
    return 'Out Of City';
};

const TELECRM_ENDPOINT = 'https://next-api.telecrm.in/enterprise/69aa795c48a1955965220e86/autoupdatelead';
const TELECRM_ACCESS_TOKEN = 'c1b3874a-91a1-4db8-aeeb-5328566367b11772798565358:f9da9819-910a-4e31-9a99-8add09aaffff';


const RETENTION_TELECRM_ENDPOINT = 'https://next-api.telecrm.in/enterprise/69b3faa2332a6389080c077f/autoupdatelead';
const RETENTION_TELECRM_ACCESS_TOKEN = '12b225e5-3df8-4424-995b-e6572edce82d1773402940030:4cf275b3-cf9c-41da-b809-468830564cee';


const autoUpdateLead = (fields = {}, actions = [{ "type": "SYSTEM_NOTE", "text": "App Data: " }]
) => {
    return new Promise((resolve, reject) => {
        let phone = String(fields.phone ?? '');
        if (phone && (!phone.startsWith('91') || phone.length !== 12)) {
            phone = '91' + phone;
        }
        const { phone: _p, ...restFields } = fields;
        fields = phone ? { ...restFields, phone } : restFields;
        fields.city = getCityFromPincode(fields.pincode);
        const payload = { fields, actions };
        serverLog('autoUpdateLead', payload);
        if (process.env.PRODUCTION === 'true') {
            axios({
                method: 'POST',
                url: TELECRM_ENDPOINT,
                data: payload,
                headers: {
                    'Authorization': `Bearer ${TELECRM_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            })
                .then((res) => {
                    if (res.status === 200) {
                        resolve(res.data);
                    } else {
                        reject({ errorMsg: `Unexpected status code: ${res.status}` });
                    }
                })
                .catch((error) => {
                    console.error('TeleCRM autoUpdateLead error:', error.response?.data || error.message);
                    reject({
                        errorMsg: 'TeleCRM API call failed',
                        status: error.response?.status,
                        details: error.response?.data,
                    });
                });
        }
    });
};


const getTotalTransactionCountAndPrice = async (customerPhoneNo, type, cache = null) => {
    let result;
    if (cache && cache.has(customerPhoneNo)) {
        result = cache.get(customerPhoneNo);
    } else {
        result = await getAcceptedOrdersByCustomerPhone(customerPhoneNo);
        if (cache) cache.set(customerPhoneNo, result);
    }
    if (type === 'count') return result.totalOrders;
    if (type === 'price') return result.totalAmount;
    return null;
};

const getCustomerSignUpDate = async (customerId, cache = null) => {
    const key = String(customerId);
    if (cache && cache.has(key)) return cache.get(key);
    const profile = await getCustomerProfile(customerId);
    const createdOn = profile?.createdOn ?? null;
    if (cache) cache.set(key, createdOn);
    return createdOn;
};

const retentionAutoUpdateLead = async (fieldsOrOrders = {}, orderEndDetailsStatus='') => {
    // Bulk mode: first arg is an array of orders
    if (Array.isArray(fieldsOrOrders)) {
        const orders = fieldsOrOrders;
        const orderStatsCache = new Map();
        const signUpDateCache = new Map();
        try {
            for (const order of orders) {
                const signUpDate = await getCustomerSignUpDate(order.customerId, signUpDateCache);
                const fields = {
                    phone: String(order.customerPhoneNo ?? ''),
                    name: String(order.customerName ? order.customerName : (order.userName ?? '')),
                    email: String(order.customerEmail ?? ''),
                    installReferrer: String(order.installReferrer ?? ''),
                    registeredPlatform: String(order.registeredPlatform ?? ''),
                    lead_source: String(order.registeredPlatform ?? ''),
                    ending_order_date: order.lastOrderDate ? new Date(order.lastOrderDate).toLocaleDateString('en-GB').replace(/\//g, '/') : '',
                    packages: order.mealPackage.packageName,
                    subscription_type: order.subscriptionType,
                    package_category: order.mealPackage.packageCategory,
                    city: getCityFromPincode(order.pincode),
                    orderNo:order.orderNo,
                    orderenddetailsstatus:orderEndDetailsStatus,
                    is_new_customer: 'false',
                    subscriptionTransactionCount: await getTotalTransactionCountAndPrice(order.customerPhoneNo, "count", orderStatsCache),
                    totalSubscriptionTansactionValue: await getTotalTransactionCountAndPrice(order.customerPhoneNo, "price", orderStatsCache),
                    CustomerSignUpdate: signUpDate ? new Date(signUpDate).toLocaleDateString('en-GB').replace(/\//g, '/') : '',
                    OrderStartDate: order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB').replace(/\//g, '/') : '',
                };
                const actions = [{ type: 'ACTION_1001', fields:{
                    OrderStartDate: order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB').replace(/\//g, '/') : '',
                    CustomerSignUpdate: signUpDate ? new Date(signUpDate).toLocaleDateString('en-GB').replace(/\//g, '/') : '',
                    subscriptionTransactionCount: await getTotalTransactionCountAndPrice(order.customerPhoneNo, "count", orderStatsCache),
                    totalSubscriptionTansactionValue: await getTotalTransactionCountAndPrice(order.customerPhoneNo, "price", orderStatsCache),
                    orderenddetailsstatus:orderEndDetailsStatus,
                    subscription_type: order.subscriptionType,
                    package_category: order.mealPackage.packageCategory,
                    ending_order_date: order.lastOrderDate ? new Date(order.lastOrderDate).toLocaleDateString('en-GB').replace(/\//g, '/') : ''
                } }];
                const payload = { fields, actions };
                if (process.env.PRODUCTION === 'true') {
                axios({
                    method: 'POST',
                    url: RETENTION_TELECRM_ENDPOINT,
                    data: payload,
                    headers: {
                        'Authorization': `Bearer ${RETENTION_TELECRM_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 95000,
                }).catch(error => {
                    console.error('Retention TeleCRM autoUpdateLead error:', error.response?.data || error.message);
                });
                }
            }
        } catch (err) {
            console.error('Retention TeleCRM bulk autoUpdateLead failed:', err);
        }
        return;
    }

    // Single mode: first arg is a fields object
    return new Promise((resolve, reject) => {
        fieldsOrOrders.city = getCityFromPincode(fieldsOrOrders.pincode);
        const payload = { fields: fieldsOrOrders };
        const actions = actionsOrGetNote;
        if (actions.length > 0) {
            payload.actions = actions;
        }
        if (process.env.PRODUCTION === 'true') {
        axios({
            method: 'POST',
            url: RETENTION_TELECRM_ENDPOINT,
            data: payload,
            headers: {
                'Authorization': `Bearer ${RETENTION_TELECRM_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        })
            .then((res) => {
                if (res.status === 200) {
                    resolve(res.data);
                } else {
                    reject({ errorMsg: `Unexpected status code: ${res.status}` });
                }
            })
            .catch((error) => {
                console.error('Retention TeleCRM autoUpdateLead error:', error.response?.data || error.message);
                reject({
                    errorMsg: 'Retention TeleCRM API call failed',
                    status: error.response?.status,
                    details: error.response?.data,
                });
            });
        }
    });
};


module.exports = { autoUpdateLead, retentionAutoUpdateLead };
