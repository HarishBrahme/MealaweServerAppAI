const express = require('express');
const service = require('../service/regionalInfo.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
var upload = require('../util/image-handler')

router.get('/regionalInfoList', async (req, res) => {
    try {
        const bannerlist = await service.getRegionalInfoList();
        responsehanlder.success200(req, res, bannerlist);
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/regionalInfo', upload.single('image'), async (req, res) => {
    try {
        const foodItemsaved = await service.saveNewRegionalInfoList(req.body, req.file.filename);
        responsehanlder.success200(req, res, foodItemsaved)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/deleteRegionalInfo/:id', async (req, res) => {
    try {
        const deleteregionalinfo = await service.deleteRegionalInfo(req.params.id);
        responsehanlder.success200(req, res, deleteregionalinfo);
    } catch (error) {
        responsehanlder.hasError500(res)
    }
})

module.exports = router;