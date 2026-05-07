const express = require('express');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const responsehanlder = require('../util/response-handler');
const service = require('../service/dashboardPolicy.service');

router.post('/addPolicy', async (req, res) => {
    try {
        const policy = await service.addPolicy(req.body);
        responsehanlder.success200(req, res, { policy })
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
})

router.get('/getAllPolicy', async (req, res) => {
    try {
        const policy = await service.getAllPolicy();
        responsehanlder.success200(req, res, policy);
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
})

router.post('/updatePolicy/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const newPolicy = req.body;
        if (id && newPolicy) {
            const policy = await service.updatePolicy(id, newPolicy);
            // console.log(id)
            responsehanlder.success200(req, res, { policy });
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
})

router.delete('/deletePolicy/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const policy = await service.deletePolicy(id);
            // console.log(id)
            responsehanlder.success200(req, res, { policy });
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
})

module.exports = router;