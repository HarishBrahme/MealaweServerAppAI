const MarketPlaceItemReview = require('../model/marketPlaceItemReview.model');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const createMarketPlaceItemReview = async (reviewData) => {
  const review = new MarketPlaceItemReview(reviewData);
  return await review.save();
};

const getMarketPlaceItemReviews = async ({ itemId, verified, page, limit }) => {
  let filter = itemId ? { itemId } : {};
  if (!(typeof verified === 'undefined') && verified != 'null') {
    filter.verified = verified;
  }
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    MarketPlaceItemReview.find(filter).sort({ pinned: -1, rating: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    MarketPlaceItemReview.countDocuments(filter),
  ]);
  return { reviews, total };
};

const getMarketPlaceItemReviewById = async (reviewId) => {
  return await MarketPlaceItemReview.findById(reviewId).lean();
};

const updateMarketPlaceItemReview = async (reviewId, updateData) => {
  return await MarketPlaceItemReview.findByIdAndUpdate(reviewId, { $set: updateData }, { new: true });
};

const deleteMarketPlaceItemReview = async (reviewId) => {
  return await MarketPlaceItemReview.findByIdAndDelete(reviewId);
};

const setPinnedMarketPlaceItemReview = async (reviewId, pinned = true) => {
  return await MarketPlaceItemReview.findByIdAndUpdate(reviewId, { $set: { pinned } }, { new: true });
};

const setVerifiedMarketPlaceItemReview = async (reviewId, verified = true) => {
  return await MarketPlaceItemReview.findByIdAndUpdate(reviewId, { $set: { verified } }, { new: true });
};

const getRatingCountsByItem = async (payload) => {
  const objectId = new ObjectId(payload.itemId);
  const ratingCounts = await MarketPlaceItemReview.aggregate([
    {
      $match: {
        itemId: objectId,
        verified: true,
        rating: { $gte: 1, $lte: 5 },
      },
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
  ]).allowDiskUse(true);
  const ratingMap = new Map(ratingCounts.map(rc => [rc._id, rc.count]));
  return [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: ratingMap.get(r) || 0,
  }));
};

const getAdminMarketPlaceItemReviews = async ({ page = 1, limit = 10, filters = {} }) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.search) {
    query.$or = [
      { customerName: { $regex: filters.search, $options: 'i' } },
      { customerEmail: { $regex: filters.search, $options: 'i' } },
      { review: { $regex: filters.search, $options: 'i' } },
    ];
  }

  if (filters.itemId && filters.itemId !== 'all') {
    query.itemId = filters.itemId;
  }

  if (filters.verified && filters.verified !== 'all') {
    query.verified = filters.verified === 'true';
  }

  if (filters.pinned && filters.pinned !== 'all') {
    query.pinned = filters.pinned === 'true';
  }

  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  }

  let sortOrder = { createdAt: -1 };

  const [reviews, total] = await Promise.all([
    MarketPlaceItemReview.find(query).sort(sortOrder).skip(Number(skip)).limit(Number(limit)).lean(),
    MarketPlaceItemReview.countDocuments(query),
  ]);
  return { reviews, total, page: Number(page), limit: Number(limit) };
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