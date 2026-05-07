const { updatePlantationStatus } = require("../dao/foodOrderPackage.dao");
const { updateFoodOrderPlantationStatus } = require("../dao/foodorder.dao");
const { formatOnlyDate } = require("./date-util");
const { callGrowBillionTreeAPI } = require("./http-api-handler");


const callTreePlantAPI = async (order) => {
    try {
        // console.log('callTreePlantAPI',order);
        const payload = {
            api_key: process.env.GROW_BILLION_API_KEY,
            customer_name: order.customerName,
            customer_email: order.customerEmail,
            customer_mobile: order.customerPhoneNo,
            event_name: 'Mealawe Tree Plantataion',
            tree_count: 1,
            tree_receiver_name: order.treeReceiverName ? order.treeReceiverName : order.customerName,
            order_number: order.orderNo,
            order_date: new Date().toISOString().split('T')[0]
        };
        // console.log('callTreePlantAPI',payload);
        const urlParams = `/cnb/api/index.php`;
        const header = { 'Content-Type': 'application/json' };
        const apiResponse = await callGrowBillionTreeAPI(urlParams, 'POST', payload, header);
        // console.log('callTreePlantAPI apiResponse',apiResponse);
        if (order.orderType === 'subscriptionPackage') {
            updatePlantationStatus(order.orderNo);
        } else {
            updateFoodOrderPlantationStatus(order.orderNo)
        }

    } catch (error) {
        // console.log('callTreePlantAPI error',error);
    }
};

module.exports = { callTreePlantAPI }