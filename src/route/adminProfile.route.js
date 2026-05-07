const express = require('express');
const service = require('../service/adminProfile.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware, adminAuthMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
var upload = require('../util/image-handler');


router.post('/adminProfile', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const filename = req.file && req.file.filename ? req.file.filename : null;
        const AdminProfilesaved = await service.saveNewAdminProfile(req.body, filename);
        responsehanlder.success200(req, res, AdminProfilesaved)
    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getAdminProfileList', adminAuthMiddleware, async (req, res) => {
    try {
        const getAdminProfileList = await service.getAdminProfileList();
        responsehanlder.success200(req, res, getAdminProfileList)
    } catch (error) {
        // console.log('getAdminProfileList', error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getadminprofile/:loginId', adminAuthMiddleware, async (req, res) => {
    try {
        const getadminprofile = await service.getAdminProfile(req.params.loginId);
        if (getadminprofile && getadminprofile._id) {
            responsehanlder.success200(req, res, getadminprofile)
        } else {
            responsehanlder.success200(req, res, { status: 'admin profile not found' })
        }
    }
    catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

router.post('/updateadminprofile/:id', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        // console.log('updateadminprofile body 1',req.headers)
        const filename = req.file && req.file.filename ? req.file.filename : null
        // console.log(req.params.id);
        // console.log('updateadminprofile body',req.body, filename)
        const updateadminprofile = await service.updateAdminProfile(req.params.id, req.body, filename)
        responsehanlder.success200(req, res, updateadminprofile)
    } catch (error) {
        console.log(error)
        responsehanlder.hasError500(res)
    }
});

router.post('/searchAdmin', adminAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body;
        if (searchObj) {
            const adminList = await service.searchAdmin(searchObj);
            responsehanlder.success200(req, res, adminList);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.delete('/deleteAdmin/:loginId', adminAuthMiddleware, async (req, res) => {
    try {
        const loginId = req.params.loginId
        if (loginId) {
            const admin = await service.deleteAdmin(loginId);
            responsehanlder.success200(req, res, admin);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res, error)
    }
});

module.exports = router;
