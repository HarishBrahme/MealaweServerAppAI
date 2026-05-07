const express = require('express');
const service = require('../service/marketPlaceItemReview.service');
const router = express.Router();
const responseHandler = require('../util/response-handler');
const { adminAuthMiddleware, userAuthMiddleware, openAuthMiddleware, decryptMiddleware } = require('../util/auth-middleware-jwt');
const upload = require('../util/image-handler');
router.use(decryptMiddleware);

router.get('/getMarketPlaceItemReviews/:page/:limit/:itemId/:verified', openAuthMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, itemId = null, verified = null } = req.params;
        const parsedItemId = itemId === "null" ? null : itemId;
        const reviews = await service.getMarketPlaceItemReviews({ itemId: parsedItemId, page: Number(page), limit: Number(limit), verified: verified });
        responseHandler.success200(req, res, reviews);
    } catch (error) {
        console.error(error);
        responseHandler.hasError500(res);
    }
});

router.get('/getMarketPlaceItemReviewById/:id', openAuthMiddleware, async (req, res) => {
    try {
        const review = await service.getMarketPlaceItemReviewById(req.params.id);
        if (!review) {
            return responseHandler.hasError404(res, 'Review not found');
        }
        responseHandler.success200(req, res, review);
    } catch (error) {
        console.error(error);
        responseHandler.hasError500(res);
    }
});

router.post('/createMarketPlaceItemReview', openAuthMiddleware, upload.array('image'), async (req, res) => {
    try {
        const files = (req.files && req.files.length > 0) ? req.files : [];
        if (req.body) {
            const review = await service.createMarketPlaceItemReview(req.body, files);
            responseHandler.success200(req, res, review);
        } else {
            responseHandler.hasError402(res, 'Invalid request');
        }
    } catch (error) {
        console.error(error);
        responseHandler.hasError500(res);
    }
});

router.put('/updateMarketPlaceItemReview/:id', userAuthMiddleware, upload.array('image'), async (req, res) => {
    try {
        const files = (req.files && req.files.length > 0) ? req.files : [];
        const updated = await service.updateMarketPlaceItemReview(req.params.id, req.body, files);
        responseHandler.success200(req, res, updated);
    } catch (error) {
        console.error(error);
        responseHandler.hasError500(res);
    }
});

router.delete('/deleteMarketPlaceItemReview/:id', adminAuthMiddleware, async (req, res) => {
    try {
        await service.deleteMarketPlaceItemReview(req.params.id);
        responseHandler.success200(req, res, { message: 'Review deleted successfully' });
    } catch (error) {
        console.error(error);
        responseHandler.hasError500(res);
    }
});

router.patch('/setPinnedMarketPlaceItemReview/:id', adminAuthMiddleware, async (req, res) => {
    try {
        console.log("req.body.pinned", req.body);
        const pinned = await service.setPinnedMarketPlaceItemReview(req.params.id, req.body.pinned);
        responseHandler.success200(req, res, pinned);
    } catch (error) {
        console.error(error);
        responseHandler.hasError500(res);
    }
});

router.patch('/setVerifiedMarketPlaceItemReview/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const verified = await service.setVerifiedMarketPlaceItemReview(req.params.id, req.body.verified);
        responseHandler.success200(req, res, verified);
    } catch (error) {
        console.error(error);
        responseHandler.hasError500(res);
    }
});

router.get('/getRatingCountsByItem/:itemId/:verified', openAuthMiddleware, async (req, res) => {
    try {
        const { itemId = null, verified = true } = req.params;
        const parsedItemId = itemId === "null" ? null : itemId;
        const reviews = await service.getRatingCountsByItem({ itemId: parsedItemId, verified: verified });
        responseHandler.success200(req, res, reviews);
    } catch (error) {
        console.error(error);
        responseHandler.hasError500(res);
    }
});

router.get('/getAdminMarketPlaceItemReviews/:page/:limit', adminAuthMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.params;
        const { search = '', verified = '', pinned = '', date = '', itemId = '' } = req.query;
        const filters = {
            search: search || null,
            verified: verified || null,
            pinned: pinned || null,
            date: date || null,
            itemId: itemId || null,
        };
        const reviews = await service.getAdminMarketPlaceItemReviews({ page: Number(page), limit: Number(limit), filters, });
        responseHandler.success200(req, res, reviews);
    } catch (error) {
        console.error('Error fetching admin marketplace item reviews:', error);
        responseHandler.hasError500(res);
    }
});

module.exports = router;