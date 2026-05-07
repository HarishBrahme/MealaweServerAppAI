const express = require('express');
const service = require('../service/kitchenPartnerLead.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/savekitchenlead', async (req, res) => {
    try {
        const kitchenPartnersaved = await service.saveNewKitchenPatnerLead(req.body);
        if (kitchenPartnersaved.erroCode) {
            responsehanlder.hasError503(res, kitchenPartnersaved.erroCode)
        } else {
            responsehanlder.success200(req, res, kitchenPartnersaved);
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getkitchenlead', adminAuthMiddleware, async (req, res) => {
    try {
        const getKitchenLead = await service.getkitchlead();
        responsehanlder.success200(req, res, getKitchenLead);
    }
    catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.put('/deletekitchenlead/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const deleteKitchenLead = await service.deleteKitchenLead(req.params.id);
        responsehanlder.success200(req, res, deleteKitchenLead)
    }
    catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.put('/updatekitchenleadstatus/:id/:status', adminAuthMiddleware, async (req, res) => {
    try {
        const status = req.params.status;
        const id = req.params.id;
        if (id && status) {
            const deleteKitchenLead = await service.updatekitchenleadstatus(id, status);
            responsehanlder.success200(req, res, deleteKitchenLead)
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    }
    catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/leadnoteligible', adminAuthMiddleware, async (req, res) => {
    try {
        if (req.body) {
            const updated = await service.leadnoteligible(req.body);
            responsehanlder.success200(req, res, updated);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }

    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

module.exports = router;