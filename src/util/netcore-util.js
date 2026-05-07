const axios = require('axios');
const { serverLog } = require("./firebasedb-util");

// Get city from pincode
// const getCityFromPincode = (pincode) => {
//     if (!pincode) return 'Unknown city';
//     const pin = String(pincode).trim();
//     if (pin.startsWith('41')) return 'Pune';
//     if (pin.startsWith('56')) return 'Bangalore';
//     if (pin.startsWith('324')) return 'Kota';
//     if (pin.startsWith('400')) return 'Mumbai';
//     return 'Out Of City';
// };
const getCityFromCluster=(clusterName)=>{
    if (!clusterName) return '';
    const name = clusterName.toLowerCase();
    if (name.includes('kota')) return 'Kota';
    if (name.includes('pune')) return 'Pune';
    if (name.includes('bangalore') || name.includes('bengaluru')) return 'Bangalore';
    if (name.includes('mumbai')) return 'Mumbai';
    return '';
}

// Format phone number
const formatPhone = (phone) => {
    if (!phone) return '';
    phone = phone.toString().replace(/\D/g, '');
    return phone.startsWith('91') ? phone : '91' + phone;
};

// ✅ Safe date formatter (Netcore expects YYYY-MM-DD)
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d) ? '' : d.toISOString().split('T')[0];
};

const RETENTION_NETCORE_ENDPOINT = 'https://api2.netcoresmartech.com/v1/activity/upload';
const RETENTION_NETCORE_API_KEY = 'e8384cdb989cc86e6a33db1e4ea2db00';

const retentionAutoUpdateLeadNetcore = async (
    fieldsOrOrders = {},
    actionsOrGetNote = [{ type: 'SYSTEM_NOTE', text: 'App Data: ' }],
    orderEndDetailsStatus = '',
    activityName = 'subscription_expiring'
) => {

    // =========================
    // BULK MODE
    // =========================
    if (Array.isArray(fieldsOrOrders)) {
        const orders = fieldsOrOrders;
        const getNote = actionsOrGetNote;

        try {
            const activitiesPayload = orders.map(order => ({
                asset_id: "a6fe8c8cae98111daae5600714b4c50c",
                activity_name: activityName,
                identity: formatPhone(order.customerPhoneNo),
                timestamp: new Date().toISOString(), // ✅ correct ISO format
                activity_source: 'app',
                activity_params: {
                    phone: String(order.customerPhoneNo ?? ''),
                    name: String(order.customerName || order.userName || ''),
                    email: String(order.customerEmail ?? ''),
                    installReferrer: String(order.installReferrer ?? ''),
                    registeredPlatform: String(order.registeredPlatform ?? ''),
                    lead_source: String(order.registeredPlatform ?? ''),
                    
                    // ✅ FIXED DATE FORMAT
                    ending_order_date: formatDate(order.lastOrderDate),

                    packages: order?.mealPackage?.packageName ?? '',
                    subscription_type: order.subscriptionType ?? '',
                    package_category: order?.mealPackage?.packageCategory ?? '',
                    city: getCityFromCluster(order.clusterName),
                    orderenddetailsstatus: orderEndDetailsStatus,
                    note: getNote(order),
                },
            }));

            if (process.env.PRODUCTION === 'true') {
                const BATCH_SIZE = 1000;

                for (let i = 0; i < activitiesPayload.length; i += BATCH_SIZE) {
                    const batch = activitiesPayload.slice(i, i + BATCH_SIZE);

                    await axios({
                        method: 'POST',
                        url: RETENTION_NETCORE_ENDPOINT,
                        data: batch,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${RETENTION_NETCORE_API_KEY}`,
                        },
                        timeout: 15000,
                    }).catch(error => {
                        console.error(
                            'Retention Netcore bulk error:',
                            error.response?.data || error.message
                        );
                    });
                }
            }
        } catch (err) {
            console.error('Retention Netcore bulk failed:', err);
        }
        return;
    }

    // =========================
    // SINGLE MODE
    // =========================
    return new Promise((resolve, reject) => {
        const payload = {
            ...fieldsOrOrders,
            city: getCityFromPincode(fieldsOrOrders.pincode),
        };

        // Optional: fix date here too if field exists
        if (payload.lastOrderDate) {
            payload.ending_order_date = formatDate(payload.lastOrderDate);
        }

        if (process.env.PRODUCTION === 'true') {
            axios({
                method: 'POST',
                url: RETENTION_NETCORE_ENDPOINT,
                data: [payload],
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RETENTION_NETCORE_API_KEY}`,
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
                    console.error(
                        'Retention Netcore error:',
                        error.response?.data || error.message
                    );

                    reject({
                        errorMsg: 'Retention Netcore API call failed',
                        status: error.response?.status,
                        details: error.response?.data,
                    });
                });
        } else {
            resolve({ message: 'Skipped API call (not in production)' });
        }
    });
};

module.exports = { retentionAutoUpdateLeadNetcore };
