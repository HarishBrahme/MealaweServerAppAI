const express = require('express');
const service = require('../service/customercart.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/savecart/:id', async (req, res) => {
    try {
        const cartsave = await service.saveNewCustomerCart(req.params.id, req.body);
        responsehanlder.success200(req, res, cartsave)
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/deletecart/:id', async (req, res) => {
    try {

        const deletecart = await service.deleteCart(req.params.id);
        responsehanlder.success200(req, res, deletecart)
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

module.exports = router;