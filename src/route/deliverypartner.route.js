const express = require('express');
const service = require('../service/deliverypartner.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
var upload = require('../util/image-handler');



router.post('/savedeliverypartner', upload.single('image'), async (req, res) => {
    try {
        const filename = req.file && req.file.filename ? req.file.filename : null
        const savedeliverypartner = await service.saveDeliveryPartner(req.body, filename);
        responsehanlder.success200(req, res, savedeliverypartner)
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});



router.post('/getdeliverypartner/:id', async (req, res) => {
    try {
        const getdeliverypartner = await service.getDeliveryPartner(req.params.id);
        responsehanlder.success200(req, res, getdeliverypartner)
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});



router.post('/updatedeliverypartner/:id', upload.single('image'), async (req, res) => {
    try {
        const filename = req.file && req.file.filename ? req.file.filename : null

        const updatedeliverypartner = await service.updateDeliveryPartner(req.params.id, req.body, filename)
        responsehanlder.success200(req, res, updatedeliverypartner)
    } catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
})



router.post('/updatelocation/:id', async (req, res) => {
    try {
        const UPLocation = await service.updateLocation(req.params.id)
        responsehanlder.success200(req, res, UPLocation)
    } catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
})


router.post('/getCurrentLocation/:id', async (req, res) => {
    try {
        const current = await service.getCurrentLocation(req.params.id)
        responsehanlder.success200(req, res, current)
    } catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
})


router.post('/deletedeliverypartner/:id', async (req, res) => {
    try {
        const deletepartner = await service.DeleteDeliveryPartner(req.params.id);
        responsehanlder.success200(req, res, deletepartner)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
})


module.exports = router;
