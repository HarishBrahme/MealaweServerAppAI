const express = require('express');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const service = require('./../service/kitchenMenu.service');
const { kitchenAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/kitchenMenu/:id', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        if (kitchenId) {
            const textresult = await service.getKitchenMenu(kitchenId);
            responsehanlder.success200(req, res, textresult)
        } else {
            responsehanlder.hasError500(res, 'kitchen id not present')
        }

    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.post('/saveKitchenMenu', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenMenu = req.body;
        if (kitchenMenu) {
            const textresult = await service.saveKitchenMenu(kitchenMenu);
            responsehanlder.success200(req, res, textresult);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/updateKitchenMenu/:id', kitchenAuthMiddleware, async (req, res) => {
    try {
        const kitchenId = req.params.id;
        const kitchenMenu = req.body;
        if (kitchenId && kitchenMenu) {
            const textresult = await service.updateKitchenMenu(kitchenId, kitchenMenu);
            responsehanlder.success200(req, res, textresult);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }

    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.put('/updateAddonAvailability/:id/:aid/:available', kitchenAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const aid = req.params.aid;
        const available = req.params.available;
        if (id && aid && available) {
            const result = await service.updateAddonAvailability(id, aid, available);
            if (result) {
                responsehanlder.success200(req, res, result);
            } else {
                responsehanlder.hasError500(res, 'No data in database');
            }
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }

    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.put('/updateItemAvailability/:id/:itemId/:available', kitchenAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const itemId = req.params.itemId;
        const available = req.params.available;
        if (id && itemId && available) {
            const result = await service.updateItemAvailability(id, itemId, available);
            if (result) {
                responsehanlder.success200(req, res, result);
            } else {
                responsehanlder.hasError500(res, 'No data in database');
            }
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.put('/updateItemServeDaily/:id/:itemId/:available', kitchenAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const itemId = req.params.itemId;
        const available = req.params.available;
        if (id && itemId && available) {
            const result = await service.updateItemServeDaily(id, itemId, available);
            if (result) {
                responsehanlder.success200(req, res, result);
            } else {
                responsehanlder.hasError500(res, 'No data in database');
            }
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getKitchenItemList/:id', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        if (kitchenId) {
            const result = await service.getKitchenItemList(kitchenId);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError500(res, 'kitchen id not present')
        }

    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
router.get('/getKitchenAddonList/:id', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        if (kitchenId) {
            const result = await service.getKitchenAddonList(kitchenId);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError500(res, 'kitchen id not present')
        }

    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
router.post('/validateAdvanceFoodOrder', userAuthMiddleware, async (req, res) => {
    try {
        if (req && req.body) {
            const result = await service.validateAdvanceFoodOrder(req.body);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request')
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
router.get('/getKitchMenuByClusterAndKitchenType/:cluster/:kitchenType', async (req, res) => {
    try {
        const cluster = req.params.cluster;
        const kitchenType = req.params.kitchenType;
        if (cluster && kitchenType) {
            const textresult = await service.getKitchMenuByClusterAndKitchenType(cluster, kitchenType);
            responsehanlder.success200(req, res, textresult)
        } else {
            responsehanlder.hasError500(res, 'kitchen id not present')
        }

    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});
module.exports = router;
