const express = require('express');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const service = require('./../service/search.service')
const { userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/fooditem/:text', async (req, res) => {
    try {
        const text = req.params.text;
        const textresult = await service.searchFoodItem(text);
        responsehanlder.success200(req, res, textresult)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.post('/kitchen/:text', async (req, res) => {
    try {
        const clusterList = req.body.clusters;
        const text = req.params.text;
        const textresult = await service.searchkitchen(text, clusterList);
        responsehanlder.success200(req, res, textresult)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.post('/searchkitchenFromMenu/:text/:clientDate', async (req, res) => {
    try {
        const text = req.params.text;
        const clientDate = req.params.clientDate;
        const clusterList = req.body.clusters;
        const textresult = await service.searchkitchenFromMenu(text, clientDate, clusterList);
        responsehanlder.success200(req, res, textresult)
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.post('/userSearch/:text/:clientDate', async (req, res) => {
    try {
        const text = req.params.text;
        const clientDate = req.params.clientDate;
        const clusterList = req.body.clusters;
        const textresult = await service.userSearch(text, clientDate, clusterList);
        responsehanlder.success200(req, res, {
            kitchenList: textresult[0],
            todaysMenuList: textresult[1],
            kitchenMenuList: textresult[2]
        })
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
});

router.post('/categoryItems/:text/:clientDate', async (req, res) => {
    try {
        const text = req.params.text;
        const clusterList = req.body.clusters;
        const clientDate = req.params.clientDate;
        if (text && clusterList && clientDate) {
            const textresult = await service.categoryItems(text, clientDate, clusterList);
            responsehanlder.success200(req, res, { todaysMenuList: textresult[0], kitchenMenuList: textresult[1] })
        } else {
            responsehanlder.hasError402(res)
        }
    } catch (error) {
        // console.log('searchroute.js categoryItems ',error);
        responsehanlder.hasError500(res)
    }
});


router.get('/getfooditemlist/:query/:text', async (req, res) => {
    try {
        const text = req.params.text;
        const query = req.params.query;
        const getfooditemlist = await service.getFoodItemList(query, text);
        responsehanlder.success200(req, res, getfooditemlist)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});

router.get('/fooditemname/:text', async (req, res) => {
    try {
        const text = req.params.text;
        const textresult = await service.getFoodItemName(text);
        responsehanlder.success200(req, res, textresult)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.post('/lookup', async (req, res) => {
    try {
        const clusterList = req.body.clusters;
        const lookupResult = await service.lookupSearch(clusterList);
        responsehanlder.success200(req, res, [...lookupResult[0], ...lookupResult[1]].map(e => e.trim()))
    } catch (error) {
        // console.log('search.route.js lookup route =>',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/categoryNearItems/:text/:clientDate/:pageNumber/:lng/:lat', async (req, res) => {
    try {
        const text = req.params.text;
        const clusterList = req.body.clusters;
        const clientDate = req.params.clientDate;
        const lng = req.params.lng;
        const lat = req.params.lat;
        const pageNumber = req.params.pageNumber;
        if (text && clusterList && clientDate && pageNumber && lng && lat) {
            const textresult = await service.categoryNearItems(text, clientDate, clusterList, pageNumber, lng, lat);
            responsehanlder.success200(req, res, { todaysMenuList: textresult[0], kitchenMenuList: textresult[1] })
        } else {
            responsehanlder.hasError402(res)
        }
    } catch (error) {
        // console.log('searchroute.js categoryNearItems ',error);
        responsehanlder.hasError500(res)
    }
});
router.post('/nearkitchen/:text/:pageNumber/:lng/:lat', async (req, res) => {
    try {
        const clusterList = req.body.clusters;
        const text = req.params.text;
        const lng = req.params.lng;
        const lat = req.params.lat;
        const pageNumber = req.params.pageNumber;
        if (text && clusterList && pageNumber && lng && lat) {
            const textresult = await service.searchNearkitchen(text, clusterList, pageNumber, lng, lat);
            responsehanlder.success200(req, res, textresult)
        } else {
            responsehanlder.hasError402(res)
        }
    } catch (error) {
        // console.log('searchroute.js nearkitchen ',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/searchNearkitchenFromMeal/:text/:clientDate/:pageNumber/:lng/:lat', async (req, res) => {
    try {
        const clusterList = req.body.clusters;
        const text = req.params.text;
        const clientDate = req.params.clientDate;
        const lng = req.params.lng;
        const lat = req.params.lat;
        const pageNumber = req.params.pageNumber;
        if (text && clusterList && clientDate && pageNumber && lng && lat) {
            const textresult = await service.searchNearkitchenFromMeal(text, clientDate, clusterList, pageNumber, lng, lat);
            responsehanlder.success200(req, res, textresult);
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log('searchroute.js searchNearkitchenFromMeal ',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/userNearSearch/:text/:clientDate/:pageNumber/:lng/:lat', async (req, res) => {
    try {
        const text = req.params.text;
        const clientDate = req.params.clientDate;
        const clusterList = req.body.clusters;
        const lng = req.params.lng;
        const lat = req.params.lat;
        const pageNumber = req.params.pageNumber;
        if (text && clusterList && clientDate && pageNumber && lng && lat) {
            const textresult = await service.userNearSearch(text, clientDate, clusterList, pageNumber, lng, lat);
            responsehanlder.success200(req, res, {
                kitchenList: textresult[0],
                todaysMenuList: textresult[1],
                kitchenMenuList: textresult[2]
            })
        } else {
            responsehanlder.hasError402(res);
        }
    } catch (error) {
        // console.log('searchroute.js userNearSearch',error);
        responsehanlder.hasError500(res)
    }
});

module.exports = router;
