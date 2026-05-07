const express = require('express');
const service = require('../service/marketplaceDeliveryOrder.service');
const shipWayService = require('../service/marketplaceDeliveryShipWayOrder.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { allAuthMiddleware } = require('../util/auth-middleware-jwt');
const { shipRocketAuthMiddleware } = require('../util/auth-middleware');


router.post('/createShipRocketDeliveryTask', allAuthMiddleware, async (req, res) => {
    try {
        const order = await service.createShipRocketDeliveryTask(req.body);
        responsehanlder.success200(req, res, order);
    } catch (error) {
        const msg = error && error.msg ? error.msg : 'Error while creating ShipRocket Delivery Task, Please try after some time'
        responsehanlder.hasError500(res, msg);
    }
});

router.get('/generateShipRocketAWB/:shipment_id', allAuthMiddleware, async (req, res) => {
    try {
        const shipment_id = req.params.shipment_id
        if (shipment_id) {
            const order = await service.generateShipRocketAWB(shipment_id);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while generateShipRocketAWB, Please try after some time');
    }
});

router.get('/requestShipRocketPickUp/:shipment_id', allAuthMiddleware, async (req, res) => {
    try {
        const shipment_id = req.params.shipment_id
        if (shipment_id) {
            const order = await service.requestShipRocketPickUp(shipment_id);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while requestShipRocketPickUp, Please try after some time');
    }
});

router.get('/trackShipRocketDeliveryTask/:taskId', allAuthMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId
        if (taskId) {
            const order = await service.trackShipRocketDeliveryTask(taskId);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while tracking delivery task, Please try after some time');
    }
});

router.put('/cancelShipRocketDeliveryTask/:taskId', allAuthMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId
        if (taskId) {
            const order = await service.cancelShipRocketDeliveryTask(taskId);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while tracking delivery task, Please try after some time');
    }
});

router.post('/shipRocketcallback', shipRocketAuthMiddleware, async (req, res) => {
    try {
        console.log('shipRocketcallback called');
        const callbackbody = req.body
        if (callbackbody) {
            await service.shipRocketcallback(callbackbody);
            responsehanlder.success200(req, res, { status: 'thank you for updating task status' });
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.get('/generateShipRocketMenifest/:shipment_id', allAuthMiddleware, async (req, res) => {
    try {
        const shipment_id = req.params.shipment_id
        if (shipment_id) {
            const order = await service.generateShipRocketMenifest(shipment_id);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while generateShipRocketMenifest, Please try after some time');
    }
});

router.get('/generateShipRocketLabel/:shipment_id', allAuthMiddleware, async (req, res) => {
    try {
        const shipment_id = req.params.shipment_id
        if (shipment_id) {
            const order = await service.generateShipRocketLabel(shipment_id);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while generateShipRocketLabel, Please try after some time');
    }
});

router.get('/generateShipRocketInvoice/:order_id', allAuthMiddleware, async (req, res) => {
    try {
        const order_id = req.params.order_id
        if (order_id) {
            const order = await service.generateShipRocketInvoice(order_id);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while generateShipRocketInvoice, Please try after some time');
    }
});

//

router.post('/createShipWayDeliveryTask', allAuthMiddleware, async (req, res) => {
    try {
        const order = await shipWayService.createShipWayDeliveryTask(req.body);
        responsehanlder.success200(req, res, order);
    } catch (error) {
        const msg = error && error.msg ? error.msg : 'Error while creating ShipRocket Delivery Task, Please try after some time'
        responsehanlder.hasError500(res, msg);
    }
});

router.get('/trackShipWayDeliveryTask/:order_id', allAuthMiddleware, async (req, res) => {
    try {
        const order_id = req.params.order_id
        if (order_id) {
            const order = await shipWayService.trackShipWayDeliveryTask(order_id);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while tracking delivery task, Please try after some time');
    }
});

router.put('/cancelShipWayDeliveryTask/:order_id', allAuthMiddleware, async (req, res) => {
    try {
        const order_id = req.params.order_id
        if (order_id) {
            const order = await shipWayService.cancelShipWayDeliveryTask(order_id);
            responsehanlder.success200(req, res, order);
        } else {
            console.log('error', error)
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while cancelling delivery task, Please try after some time');
    }
});


module.exports = router;

