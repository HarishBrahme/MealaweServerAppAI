const express = require('express');
const service = require('../service/deliveryOrder.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { allAuthMiddleware } = require('../util/auth-middleware-jwt');
const { dunzoAuthMiddleware, porterAuthMiddleware, pidgeAuthMiddleware, shadowFaxAuthMiddleware } = require('../util/auth-middleware');

router.post('/createTask', allAuthMiddleware, async (req, res) => {
    try {
        const taskObj = req.body.taskObj
        const orderNoList = req.body.orderNoList;
        const server = req.body.server
        if (taskObj && orderNoList) {
            // const { status } = await service.validateIfManualDelivery(orderNoList);
            const status = true
            if (status) {
                // responsehanlder.hasError500(res, 'This order will be delivered manually');
                responsehanlder.success200(req, res, {msg:'This order will be delivered manually'});
            } else {
                const order = await service.createTask(taskObj, orderNoList, server);
                responsehanlder.success200(req, res, order);
            }
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while creating delivery task, Please try after some time');
    }
});

router.get('/trackTask/:taskId', allAuthMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId
        if (taskId) {
            const order = await service.trackTask(taskId);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while tracking delivery task, Please try after some time');
    }
});

router.get('/trackdeliveryTask/:taskId/:partner', allAuthMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const partner = req.params.partner
        if (taskId) {
            if (partner === 'Dunzo') {
                const order = await service.trackTask(taskId);
                responsehanlder.success200(req, res, order);
            } else if (partner === 'Porter') {
                const order = await service.trackPorterTask(taskId);
                responsehanlder.success200(req, res, order);
            } else if (partner === 'Pidge') {
                const order = await service.trackPidgeTask(taskId);
                responsehanlder.success200(req, res, order);
            } else {
                const order = await service.trackShadowFaxTask(taskId);
                responsehanlder.success200(req, res, order);
            }
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log('trackdeliveryTask error',error);
        responsehanlder.hasError500(res, 'Error while tracking delivery task, Please try after some time');
    }
});

router.post('/quote', async (req, res) => {
    try {
        const taskObj = req.body;
        if (taskObj) {
            const order = await service.quote(taskObj);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {   // console.log('quote error',error);
        responsehanlder.hasError500(res, 'Error while creating delivery quote, Please try after some time');
    }
});

router.post('/dunzocallback', dunzoAuthMiddleware, async (req, res) => {
    try {
        console.log('dunzocallback called');
        const callbackbody = req.body
        if (callbackbody) {
            await service.dunzocallback(callbackbody);
            responsehanlder.success200(req, res, { status: 'thank you for updating task status' });
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.post('/createDunzoTask', allAuthMiddleware, async (req, res) => {
    try {
        const taskObj = req.body.taskObj
        const orderNoList = req.body.orderNoList;
        const server = req.body.server;
        if (taskObj && orderNoList && server) {
            const order = await service.createTask(taskObj, orderNoList, server);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while creating delivery task, Please try after some time');
    }
});

router.post('/createOnlyDunzoTask', allAuthMiddleware, async (req, res) => {
    try {
        const taskObj = req.body.taskObj
        const orderNoList = req.body.orderNoList;
        const server = req.body.server;
        if (taskObj && orderNoList && server) {
            const order = await service.createDunzoTask(taskObj, orderNoList, server);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log('error createOnlyDunzoTask',error);
        responsehanlder.hasError500(res, 'Error while creating delivery task, Please try after some time');
    }
});

router.post('/createPorterTask', allAuthMiddleware, async (req, res) => {
    try {
        const taskObj = req.body.taskObj
        const orderNoList = req.body.orderNoList;
        const server = req.body.server;
        if (taskObj && orderNoList && server) {
            const order = await service.createPorterTask(taskObj, orderNoList, server);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        const msg = error.msg ? error.msg : 'Error while creating delivery task, Please try after some time'
        responsehanlder.hasError500(res, msg);
    }
});

router.get('/trackPorterTask/:taskId', allAuthMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId
        if (taskId) {
            const order = await service.trackPorterTask(taskId);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while tracking delivery task, Please try after some time');
    }
});

router.put('/cancelPorterTask/:taskId', allAuthMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId
        if (taskId) {
            const order = await service.cancelPorterTask(taskId);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while tracking delivery task, Please try after some time');
    }
});
router.put('/cancelDunzotask/:taskId', allAuthMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId
        if (taskId) {
            const order = await service.cancelDunzoTask(taskId);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while tracking delivery task, Please try after some time');
    }
});

router.post('/portercallback', porterAuthMiddleware, async (req, res) => {
    try {
        console.log('portercallback called');
        const callbackbody = req.body
        if (callbackbody) {
            await service.portercallback(callbackbody);
            responsehanlder.success200(req, res, { status: 'thank you for updating task status' });
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});


router.post('/createShadowFaxTask', allAuthMiddleware, async (req, res) => {
    try {
        const taskObj = req.body.taskObj
        const orderNoList = req.body.orderNoList;
        const server = req.body.server;
        if (taskObj && orderNoList && server) {
            const order = await service.createShadowFaxTask(taskObj, orderNoList, server);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log('createShadowFaxTask Error ',error);
        const msg = error.msg ? error.msg : 'Error while creating shadowfax delivery task, Please try after some time'
        responsehanlder.hasError500(res, msg);
    }
});

router.get('/trackShadowFaxTask/:taskId', allAuthMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId
        if (taskId) {
            const order = await service.trackShadowFaxTask(taskId);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while tracking delivery task, Please try after some time');
    }
});

router.put('/cancelShadowFaxTask/:taskId', allAuthMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId
        if (taskId) {
            const order = await service.cancelShadowFaxTask(taskId);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while cancelling delivery task, Please try after some time');
    }
});

router.post('/shadowFaxcallback', shadowFaxAuthMiddleware, async (req, res) => {
    try {
        console.log('shadowFaxcallback called');
        const callbackbody = req.body
        if (callbackbody) {
            await service.shadowFaxcallback(callbackbody);
            responsehanlder.success200(req, res, { status: 'thank you for updating task status' });
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.post('/createPidge3PLTask', allAuthMiddleware, async (req, res) => {
    try {
        const taskObj = req.body.taskObj
        const orderNoList = req.body.orderNoList;
        const server = req.body.server;
        if (taskObj && orderNoList && server) {
            const order = await service.createPidge3PLOrder(taskObj, orderNoList, server);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log('createPidge3PLTask Error ',error);
        const msg = error.msg ? error.msg : 'Error while creating pidge delivery task, Please try after some time'
        responsehanlder.hasError500(res, msg);
    }
});

router.get('/trackPidgeTask/:taskId', allAuthMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId
        if (taskId) {
            const order = await service.trackPidgeTask(taskId);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while tracking delivery task, Please try after some time');
    }
});

router.put('/cancelPidge3PLOrder/:taskId', allAuthMiddleware, async (req, res) => {
    try {
        const taskId = req.params.taskId
        if (taskId) {
            const order = await service.cancelPidge3PLOrder(taskId);
            responsehanlder.success200(req, res, order);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res, 'Error while cancelling delivery task, Please try after some time');
    }
});

router.post('/pidgecallback', pidgeAuthMiddleware, async (req, res) => {
    try {
        console.log('pidgecallback called');
        const callbackbody = req.body
        if (callbackbody) {
            await service.pidgecallback(callbackbody);
            responsehanlder.success200(req, res, { status: 'thank you for updating task status' });
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

module.exports = router;