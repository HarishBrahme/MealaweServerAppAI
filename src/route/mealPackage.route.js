const express = require('express');
const service = require('../service/mealPackage.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware, allAuthMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware } = require('../util/auth-middleware-jwt');
var upload = require('../util/image-handler');

router.get('/getMealPackageList', allAuthMiddleware, async (req, res) => {
    try {
        const list = await service.getMealPackageList();
        responsehanlder.success200(req, res, list);
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getMealPackageListCluster', async (req, res) => {
    try {
        const body = req.body;
        if (body && body.custerList) {
            const list = await service.getMealPackageListCluster(body.custerList);
            responsehanlder.success200(req, res, list);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.post('/saveMealPackage', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const package = req.body;
        if (package) {
            let filename;
            if (req.file && req.file.filename) {
                filename = req.file.filename;
            }
            const savedPackage = await service.saveMealPackage(package, filename);
            responsehanlder.success200(req, res, savedPackage);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('saveMealPackage error',error);
        responsehanlder.hasError500(res)
    }
});
router.post('/updateMealPackage/:id', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const package = req.body;
        const id = req.params.id;
        if (package && id) {
            let fileName = undefined;
            if (req.file && req.file.filename) {
                fileName = req.file.filename;
            }
            const updatedPackage = await service.updateMealPackage(id, package, fileName);
            responsehanlder.success200(req, res, updatedPackage);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('error updateMealPackage ',error);
        responsehanlder.hasError500(res)
    }
});
router.delete('/deleteMealPackage/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const deletedPackage = await service.deleteMealPackage(id);
            responsehanlder.success200(req, res, deletedPackage)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/changePackageStatus/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const status = req.body.status;
        // console.log(status)
        const id = req.params.id;
        // console.log(id)
        if (id) {
            const orderList = await service.changePackageStatus(status, id);
            responsehanlder.success200(req, res, orderList)
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

module.exports = router;
