const express = require('express');
const service = require('../service/bulkFoodItem.service');
const responsehanlder = require('../util/response-handler');
const upload = require('../util/image-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { kitchenAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/saveBulkFoodItem', upload.single('image'), async (req, res) => {
    try {
        let filename;
        if (req.file && req.file.filename) {
            filename = req.file.filename;
        }
        const foodItemsaved = await service.saveBulkFoodItem(req.body, filename);
        responsehanlder.success200(req, res, foodItemsaved)
    } catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

router.get('/getAllBulkFooditems', async (req, res) => {
    try {
        const getfooditem = await service.getAllBulkFooditems();
        responsehanlder.success200(req, res, getfooditem);
    }
    catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
})

router.post('/updateBulkfoodItem/:id', upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        let fileName = undefined;
        if (req.file && req.file.filename) {
            fileName = req.file.filename;
        }
        const updatefoodItem = await service.updateBulkfoodItem(id, req.body, fileName);
        responsehanlder.success200(req, res, updatefoodItem);

    }
    catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

router.post('/deleteBulkFoodItem/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const updatefoodItem = await service.deleteBulkFoodItem(id);
            responsehanlder.success200(req, res, updatefoodItem);
        }
        else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    }
    catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

module.exports = router;