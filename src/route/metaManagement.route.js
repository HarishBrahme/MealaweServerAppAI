const express = require('express');
const router = express.Router();
const metaService = require('../service/metaManagement.service');
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
const { adminAuthMiddleware, openAuthMiddleware } = require('../util/auth-middleware-jwt');
const responsehanlder = require('../util/response-handler');

router.use(decryptMiddleware);

router.post('/createMetaManagement', adminAuthMiddleware, async (req, res) => {
    try {
        const meta = await metaService.createMetaManagement(req.body);
        responsehanlder.success200(req, res, meta);
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getAllMetaManagements/:page/:pageSize', adminAuthMiddleware, async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pageSize) || 10;
    try {
        const metas = await metaService.getAllMetaManagements(page, pageSize);
        responsehanlder.success200(req, res, metas);
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getMetaManagementById/:id', openAuthMiddleware, async (req, res) => {
    try {
        const meta = await metaService.getMetaManagementById(req.params.id);
        if (!meta) {
            return res.status(404).json(req, 'Meta tag not found');
        } else {
            responsehanlder.success200(req, res, meta);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getMetaManagementByPathName/:pathName/:pageType', openAuthMiddleware, async (req, res) => {
    try {
        const meta = await metaService.getMetaManagementByPathName(req.params.pathName,req.params.pageType);
        // if (!meta) {
        //     return res.status(404).json(req, 'Meta tag not found');
        // } else {
            responsehanlder.success200(req, res, meta);
        // }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.put('/updateMetaManagement/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const updatedMeta = await metaService.updateMetaManagement(req.params.id, req.body);
        if (!updatedMeta) {
            return res.status(404).json(req, 'Meta tag not found');
        } else {
            responsehanlder.success200(req, res, updatedMeta);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.delete('/deleteMetaManagement/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const deletedMeta = await metaService.deleteMetaManagement(req.params.id);
        if (!deletedMeta) {
            return res.status(404).json(req, 'Meta tag not found');
        } else {
            responsehanlder.success200(req, res, deletedMeta);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

module.exports = router;
