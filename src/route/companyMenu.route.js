const express = require('express');
const service = require('../service/companyMenu.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);

router.post('/saveCompanyMenu', async (req, res) => {
    try {
        const cartsave = await service.saveCompanyMenu(req.body);
        responsehanlder.success200(req, res, cartsave)
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getCompanyMenuList', async (req, res) => {
    try {
        const list = await service.getCompanyMenuList();
        responsehanlder.success200(req, res, list);
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/updateCompanyMenu/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const menuUpdated = await service.updateCompanyMenu(id, req.body);
            responsehanlder.success200(req, res, menuUpdated);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.delete('/deleteCompanyMenu/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const menuDeleted = await service.deleteCompanyMenu(id);
            responsehanlder.success200(req, res, menuDeleted);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});


module.exports = router;