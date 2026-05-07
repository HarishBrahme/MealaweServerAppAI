const DeliveryOrder = require('../model/deliveryOrder.model');

const getDeliveryOrder = async (reference_id) => {
    return await DeliveryOrder.findOne({ reference_id, deliveryTaskState: { $not: { $in: ['cancelled', 'runner_cancelled', 'CANCELLED'] } } });
}

const getDeliveryOrderByTaskId = async (deliveryTaskId) => {
    return await DeliveryOrder.findOne({ deliveryTaskId, deliveryTaskState: { $not: { $in: ['cancelled', 'runner_cancelled', 'CANCELLED'] } } });
}

const saveDeliveryOrder = async (deliveryOrder) => {
    const order = await DeliveryOrder.findOne({ reference_id: deliveryOrder.reference_id });
    if (order && order._id) {
        const nDeliveryOrder = {};
        nDeliveryOrder.request_id = deliveryOrder.request_id || order.request_id;
        nDeliveryOrder.deliveryTaskId = deliveryOrder.deliveryTaskId || order.deliveryTaskId;
        nDeliveryOrder.deliveryTaskState = deliveryOrder.deliveryTaskState || order.deliveryTaskState;
        nDeliveryOrder.deliveryVendor = deliveryOrder.deliveryVendor || order.deliveryVendor;
        nDeliveryOrder.serverNameOrderType = deliveryOrder.serverNameOrderType || order.serverNameOrderType;
        return await DeliveryOrder.findOneAndUpdate({ _id: order._id },
            { $set: nDeliveryOrder }, { new: true });
    } else {
        const nDeliveryOrder = new DeliveryOrder();
        nDeliveryOrder.reference_id = deliveryOrder.reference_id;
        nDeliveryOrder.request_id = deliveryOrder.request_id;
        nDeliveryOrder.deliveryTaskId = deliveryOrder.deliveryTaskId;
        nDeliveryOrder.orderNoList = deliveryOrder.orderNoList;
        nDeliveryOrder.deliveryTaskState = deliveryOrder.deliveryTaskState;
        nDeliveryOrder.deliveryVendor = deliveryOrder.deliveryVendor;
        nDeliveryOrder.serverNameOrderType = deliveryOrder.serverNameOrderType;
        const isInserted = await nDeliveryOrder.save();
        return isInserted;
    }
}

const updateDeliveryOrderStatus = async (deliveryTaskId, deliveryTaskState) => {
    return await DeliveryOrder.findOneAndUpdate({ deliveryTaskId },
        { $set: { deliveryTaskState } }, { new: true });
}

const getDeliveryOrderDetails = async (deliveryTaskId) => {
    return await DeliveryOrder.findOne({ deliveryTaskId });
}

module.exports = {
    saveDeliveryOrder,
    updateDeliveryOrderStatus,
    getDeliveryOrder,
    getDeliveryOrderByTaskId,
    getDeliveryOrderDetails
}