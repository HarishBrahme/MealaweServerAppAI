const express = require('express');
const service = require('../service/companyProfile.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);

router.post('/saveCompanyProfile', async (req, res) => {
    try {
        const cartsave = await service.saveCompanyProfile(req.body);
        responsehanlder.success200(req, res, cartsave)
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getCompanyProfileList', async (req, res) => {
    try {
        const list = await service.getCompanyProfileList();
        responsehanlder.success200(req, res, list);
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/updateCompanyProfile/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const profileUpdated = await service.updateCompanyProfile(id, req.body);
            responsehanlder.success200(req, res, profileUpdated);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.delete('/deleteCompanyProfile/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const profileDeleted = await service.deleteCompanyProfile(id);
            responsehanlder.success200(req, res, profileDeleted);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});


module.exports = router;