const express = require('express');
const service = require('../service/marketPlaceItemRating.service');
const router = express.Router();
const { decryptMiddleware, userAuthMiddleware } = require('../util/auth-middleware');
router.use(decryptMiddleware);


router.get('/getRatingfromList', async (req, res) => {
    try {
        const getRatingfromList = await service.getRatingfromList();
        responsehanlder.success200(req, res, getRatingfromList)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});


router.post('/saveRating', userAuthMiddleware, async (req, res) => {
    try {
        if (req.body) {
            const saveRating = await service.saveRating(req.body);
            responsehanlder.success200(req, res, saveRating)
        } else {
            responsehanlder.hasError402(res, 'Invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res)
    }
})

module.exports = router;