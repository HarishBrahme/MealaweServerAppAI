const express = require('express');
const service = require('../service/bulkMenu.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);

router.post('/bulkMenuAdd', async (req, res) => {
    try {
        const savedMenu = await service.bulkMenuAdd(req.body);
        responsehanlder.success200(req, res, savedMenu)
    } catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

router.get('/fetchBulkMenu/:category', async (req, res) => {
    try {
        const category = req.params.category;
        if (category) {
            const fetchedMenu = await service.fetchBulkMenu(category);
            responsehanlder.success200(req, res, fetchedMenu);
        }
        else {
            this.responsehanlder.hasError500(req, 'invalid request')
        }
    } catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

router.post('/updateBulkMenu', async (req, res) => {
    try {
        const updatedMenu = await service.updateBulkMenu(req.body);
        responsehanlder.success200(req, res, updatedMenu);
    } catch (error) {
        // console.log(error)
        responsehanlder.hasError500(res)
    }
});

module.exports = router;