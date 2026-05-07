const express = require('express');
const service = require('../service/banner.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const upload = require('../util/image-handler');
const { adminAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/bannerlist', async (req, res) => {
    try {
        const bannerlist = await service.getBannerList();
        responsehanlder.success200(req, res, bannerlist);
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/banner', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const foodItemsaved = await service.saveNewBanner(req.body, req.file.filename);
        responsehanlder.success200(req, res, foodItemsaved)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/updatebanner/:id', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        let filename;
        if (req.file && req.file.filename) {
            filename = req.file.filename;
        }
        const updatebanner = await service.updatingbanner(req.params.id, req.body, filename);
        responsehanlder.success200(req, res, updatebanner)
    } catch (error) {
        // console.log('Error at Banner.route route updatebanner ==> ',error);
        responsehanlder.hasError500(res)
    }
})

router.delete('/deletebanner/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const deletebanner = await service.deleteBanner(req.params.id)
        responsehanlder.success200(req, res, deletebanner)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
})


module.exports = router;
