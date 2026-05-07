const reviewDao = require('../dao/marketPlaceItemReview.dao');

const createMarketPlaceItemReview = async (reviewData, images) => {
    if (!reviewData.itemId || !reviewData.customerEmail || !reviewData.customerName) {
        throw new Error('Missing required fields: itemId, customerName, customerEmail');
    }
    if (images && images.length) {
        reviewData.reviewImages = [];
        images.forEach((image) => {
            reviewData.reviewImages.push(image.filename);
        });
    }
    return await reviewDao.createMarketPlaceItemReview(reviewData);
};

const getMarketPlaceItemReviews = async (payload) => {
    return await reviewDao.getMarketPlaceItemReviews(payload);
};

const getMarketPlaceItemReviewById = async (reviewId) => {
    return await reviewDao.getMarketPlaceItemReviewById(reviewId);
};

const updateMarketPlaceItemReview = async (reviewId, updateData, images) => {
    if (images && images.length) {
        reviewDao.reviewImages = images;
    }
    return await reviewDao.updateMarketPlaceItemReview(reviewId, updateData);
};

const deleteMarketPlaceItemReview = async (reviewId) => {
    return await reviewDao.deleteMarketPlaceItemReview(reviewId);
};

const setPinnedMarketPlaceItemReview = async (reviewId, pinned = true) => {
    return await reviewDao.setPinnedMarketPlaceItemReview(reviewId, pinned);
};

const setVerifiedMarketPlaceItemReview = async (reviewId, verified = true) => {
    return await reviewDao.setVerifiedMarketPlaceItemReview(reviewId, verified);
};

const getRatingCountsByItem = async (payload) => {
    return await reviewDao.getRatingCountsByItem(payload);
};

const getAdminMarketPlaceItemReviews = async ({ page, limit, filters }) => {
    return await reviewDao.getAdminMarketPlaceItemReviews({ page, limit, filters });
};

module.exports = {
    createMarketPlaceItemReview,
    getMarketPlaceItemReviews,
    getMarketPlaceItemReviewById,
    updateMarketPlaceItemReview,
    deleteMarketPlaceItemReview,
    setPinnedMarketPlaceItemReview,
    setVerifiedMarketPlaceItemReview,
    getRatingCountsByItem,
    getAdminMarketPlaceItemReviews,
};
