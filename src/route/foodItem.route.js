const express = require('express');
const service = require('../service/foodItem.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const upload = require('../util/image-handler');
const { kitchenAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/fooditemlist/:query/:text', async (req, res) => {
    try {
        const text = req.params.text;
        const query = req.params.query;
        if (query && text) {
            const foodItemlist = await service.getFoodItemList(query, text);
            responsehanlder.success200(req, res, foodItemlist)
        } else {
            responsehanlder.hasError402(res)
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.post('/fooditem', kitchenAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        let filename;
        if (req.file && req.file.filename) {
            filename = req.file.filename;
        }
        const foodItemsaved = await service.saveNewFoodItem(req.body, filename);
        responsehanlder.success200(req, res, foodItemsaved)
    } catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

router.post('/deletefooditemlist', kitchenAuthMiddleware, async (req, res) => {
    try {
        const deletefooditemlist = await service.deleteFoodItemList(req.body);
        responsehanlder.success200(req, res, deletefooditemlist);
    } catch (error) {
        responsehanlder.hasError500(res);
    }
})

router.post('/deleteFooditem/:id', kitchenAuthMiddleware, async (req, res) => {
    try {
        const deletefooditem = await service.deleteFooditem(req.params.id);
        responsehanlder.success200(req, res, deletefooditem);
    }
    catch (error) {
        responsehanlder.hasError500(res)
    }
})

router.get('/getFooditem/:id', async (req, res) => {
    try {
        const getfooditem = await service.getFoodItem(req.params.id);
        responsehanlder.success200(req, res, getfooditem);
    }
    catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
})

router.get('/getAllFooditems', async (req, res) => {
    try {
        const getfooditem = await service.getAllFoodItems();
        responsehanlder.success200(req, res, getfooditem);
    }
    catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
})


router.post('/updatefoodItem/:id', kitchenAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        let fileName = undefined;
        if (req.file && req.file.filename) {
            fileName = req.file.filename;
        }
        const updatefoodItem = await service.updateFoodItem(req.params.id, req.body, fileName);
        responsehanlder.success200(req, res, updatefoodItem);
    }
    catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});
router.get('/getSpecialItems', async (req, res) => {
    try {
        const specialItems = await service.getSpecialItems();
        responsehanlder.success200(req, res, specialItems);
    }
    catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

router.get('/getSubscriptionItemList', async (req, res) => {
    try {
        const subscriptionItems = await service.getSubscriptionItemList();
        responsehanlder.success200(req, res, subscriptionItems);
    }
    catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
})

module.exports = router;
