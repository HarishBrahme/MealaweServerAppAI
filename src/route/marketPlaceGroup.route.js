const express = require('express');
const service = require('../service/marketPlaceGroup.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const upload = require('../util/image-handler');
const { adminAuthMiddleware, openAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/marketPlaceGrouplist', adminAuthMiddleware, async (req, res) => {
    try {
        const marketPlaceGrouplist = await service.getmarketPlaceGroupList();
        responsehanlder.success200(req,res, marketPlaceGrouplist);
    }catch(error){
        responsehanlder.hasError500(res)
    }
});

router.get('/marketPlaceGrouplistByCategoryName/:categoryName', openAuthMiddleware, async (req, res) => {
    try {
        const marketPlaceGrouplist = await service.marketPlaceGrouplistByCategoryName(req.params.categoryName);
        responsehanlder.success200(req, res, marketPlaceGrouplist);
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/marketPlaceGroup', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const foodItemsaved = await service.saveNewmarketPlaceGroup(req.body, req.file.filename);
        responsehanlder.success200(req, res, foodItemsaved)
    } catch (error) {
        console.log('marketPlaceGroup error ==>', error)
        responsehanlder.hasError500(res)
    }
});

router.post('/updatemarketPlaceGroup/:id', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        let filename;
        if (req.file && req.file.filename) {
            filename = req.file.filename;
        }
        const updatemarketPlaceGroup = await service.updatemarketPlaceGroup(req.params.id, req.body, filename);
        responsehanlder.success200(req, res, updatemarketPlaceGroup)
    } catch (error) {
        // console.log('Error at marketPlaceGroup.route route updatemarketPlaceGroup ==> ',error);
        responsehanlder.hasError500(res)
    }
})

router.delete('/deletemarketPlaceGroup/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const deletemarketPlaceGroup = await service.deletemarketPlaceGroup(req.params.id)
        responsehanlder.success200(req, res, deletemarketPlaceGroup)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
})
router.post('/getbulkcatimaglist', async (req, res) => {
    try {
        const catlist = req.body;
        if (catlist) {
            const list = await service.getbulkcatimaglist(catlist);
            responsehanlder.success200(req, res, list);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
        console.log('getbulkcatimaglist error ==> ', error);
    }
});

module.exports = router;