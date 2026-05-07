const express = require('express');
const router = express.Router();
const { decryptMiddleware, allAuthMiddleware, adminAuthMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const service = require('../service/subscriptionWeeklyMenu.service');
const responsehanlder = require('../util/response-handler');

router.post('/saveSubscriptionWeeklyMenu', adminAuthMiddleware, async (req, res) => {
    try {
        const weeklyMenuObj = req.body;
        if (weeklyMenuObj) {
            const savedmenu = await service.saveSubscriptionWeeklyMenu(weeklyMenuObj);
            responsehanlder.success200(req, res, savedmenu);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        console.log(error)
        responsehanlder.hasError500(res);
    }
});

router.get('/getSubscriptionWeeklyMenu/:category/:clusterId', async (req, res) => {
    try {
        const { category, clusterId } = req.params;
        const weekluMenu = await service.getSubscriptionWeeklyMenu(category, clusterId);
        responsehanlder.success200(req, res, weekluMenu);
    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/searchSubscriptionWeeklyMenuList/:page', adminAuthMiddleware, async (req, res) => {
    try {
        const searchObj = req.body || {};
        const page = req.params.page;
        if (page) {
            const records = await service.searchSubscriptionWeeklyMenuList(searchObj, page);
            responsehanlder.success200(req, res, records);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        console.log(error)
        responsehanlder.hasError500(res);
    }
});

router.delete('/deleteSubscriptionWeeklyMenu/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const result = await service.deleteSubscriptionWeeklyMenu(id);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getWeeklyMenuByCategory/:packageCategory', allAuthMiddleware, async (req, res) => {
    try {
        const packageCategory = req.params.packageCategory;
        if (packageCategory) {
            const result = await service.getWeeklyMenuByCategory(packageCategory);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
});

module.exports = router;