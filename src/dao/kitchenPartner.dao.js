const KitchenPartner = require('../model/kitchenPartner.model');
const KitchenMenu = require('../model/kitchenMenu.model');
const TodaysMenu = require('../model/todaysMenu.model');

const { deleteImage, deleteMultiImages } = require('../service/images.service');
const { getFullFeedbackRating } = require('./feedback.dao');

const saveNewKitchenPatner = async (kitchenPartner, imageName) => {
    // console.log('saveNewKitchenPatner', kitchenPartner)
    const nKitchenPartner = new KitchenPartner();
    nKitchenPartner.kitchenName = kitchenPartner.kitchenName;
    nKitchenPartner.kitchenPartnerName = kitchenPartner.kitchenPartnerName;
    nKitchenPartner.loginId = kitchenPartner.loginId;
    nKitchenPartner.imageUrl = imageName;
    nKitchenPartner.address = JSON.parse(kitchenPartner.address);
    // nKitchenPartner.geolocation = JSON.parse(kitchenPartner.geolocation);
    nKitchenPartner.phoneNo = kitchenPartner.phoneNo;
    nKitchenPartner.mapTelNo = kitchenPartner.mapTelNo;
    nKitchenPartner.email = kitchenPartner.email;
    nKitchenPartner.profileApproval = 'pending';
    nKitchenPartner.preparationTime = kitchenPartner.preparationTime;
    nKitchenPartner.speciality = kitchenPartner.speciality;
    nKitchenPartner.mainSpeciality = kitchenPartner.mainSpeciality;
    nKitchenPartner.referralCode = kitchenPartner.referralCode;
    nKitchenPartner.installReferrer = kitchenPartner.installReferrer;
    nKitchenPartner.kitchenOpened = 'false';
    nKitchenPartner.rating = 5;
    nKitchenPartner.mealType = JSON.parse(kitchenPartner.mealType);
    nKitchenPartner.mealTiming = JSON.parse(kitchenPartner.mealTiming);
    nKitchenPartner.clusters = JSON.parse(kitchenPartner.clusters);
    if (kitchenPartner.kitchenType) {
        nKitchenPartner.kitchenType = JSON.parse(kitchenPartner.kitchenType);
    }
    nKitchenPartner.deliveryByMealaweBoy = kitchenPartner.deliveryByMealaweBoy;
    nKitchenPartner.skipWalletPayment = kitchenPartner.skipWalletPayment;
    const isInserted = await nKitchenPartner.save();
    return isInserted;
}
// Add this method in kitchenPartner.dao.js
const updateApartmentInfo = async (id, apartmentInfo) => {
    try {
        const partner = await KitchenPartner.findOne({ _id: id });
        if (partner && partner._id) {
            const updateData = {
                apartmentInfo: {
                    apartmentId: apartmentInfo.apartmentId,
                    apartmentName: apartmentInfo.apartmentName
                }
            };

            const update = await KitchenPartner.findOneAndUpdate(
                { _id: id },
                { $set: updateData },
                { new: true }
            );

            return update;
        } else {
            return partner;
        }
    } catch (err) {
        console.log('Error updating apartment info:', err);
        throw err;
    }
};

const updateKitchenPatner = async (id, kitchenPartner, imageName) => {
    try {
        const partner = await KitchenPartner.findOne({ _id: id });
        if (partner && partner._id) {
            const nKitchenPartner = {};
            nKitchenPartner.kitchenName = kitchenPartner.kitchenName || partner.kitchenName;
            nKitchenPartner.kitchenPartnerName = kitchenPartner.kitchenPartnerName || partner.kitchenPartnerName;
            nKitchenPartner.imageUrl = imageName || partner.imageUrl;
            nKitchenPartner.address = kitchenPartner.address ? JSON.parse(kitchenPartner.address)
                : partner.address;
            
            if (kitchenPartner.geolocation) {
                let geolocation = kitchenPartner.geolocation;
                if (geolocation.lng && geolocation.lat) {
                    nKitchenPartner.geolocation = geolocation;
                    nKitchenPartner.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
                } else {
                    geolocation = JSON.parse(kitchenPartner.geolocation);
                    if (geolocation.lng && geolocation.lat) {
                        nKitchenPartner.geolocation = geolocation;
                        nKitchenPartner.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
                    }
                }
            }
            
            nKitchenPartner.phoneNo = kitchenPartner.phoneNo || partner.phoneNo;
            nKitchenPartner.mapTelNo = kitchenPartner.mapTelNo|| partner.mapTelNo;
            nKitchenPartner.email = kitchenPartner.email || partner.email;
            nKitchenPartner.preparationTime = kitchenPartner.preparationTime || partner.preparationTime;
            nKitchenPartner.speciality = kitchenPartner.speciality || partner.speciality;
            nKitchenPartner.mainSpeciality = kitchenPartner.mainSpeciality || partner.mainSpeciality;
            nKitchenPartner.referralCode = kitchenPartner.referralCode || partner.referralCode;
            nKitchenPartner.installReferrer = kitchenPartner.installReferrer || partner.installReferrer;
            nKitchenPartner.mealType = kitchenPartner.mealType ? JSON.parse(kitchenPartner.mealType)
                : partner.mealType;
            nKitchenPartner.mealTiming = kitchenPartner.mealTiming ? JSON.parse(kitchenPartner.mealTiming)
                : partner.mealTiming;
            nKitchenPartner.clusters = kitchenPartner.clusters ? JSON.parse(kitchenPartner.clusters)
                : partner.clusters;
            nKitchenPartner.localArea = kitchenPartner.localArea || partner.localArea;
            
            if (kitchenPartner.kitchenType) {
                nKitchenPartner.kitchenType = kitchenPartner.kitchenType ? JSON.parse(kitchenPartner.kitchenType) : partner.kitchenType;
                console.log(nKitchenPartner.kitchenType);
            }

            // Handle apartmentInfo if provided
            if (kitchenPartner.apartmentInfo) {
                nKitchenPartner.apartmentInfo = {
                    apartmentId: kitchenPartner.apartmentInfo.apartmentId,
                    apartmentName: kitchenPartner.apartmentInfo.apartmentName
                };
            }
            if (kitchenPartner.deliveryByMealaweBoy) {
                nKitchenPartner.deliveryByMealaweBoy = kitchenPartner.deliveryByMealaweBoy;
            } else {
                nKitchenPartner.deliveryByMealaweBoy = false;
            }
            
            if (kitchenPartner.skipWalletPayment) {
                nKitchenPartner.skipWalletPayment = kitchenPartner.skipWalletPayment;
            } else {
                nKitchenPartner.skipWalletPayment = false;
            }

            const update = await KitchenPartner.findOneAndUpdate({ _id: id }, { $set: nKitchenPartner }, { new: true });
            
            if (imageName) {
                try {
                    deleteImage(partner.imageUrl);
                } catch (error) {
                    console.log('Error while deleting kitchen partner previous image ', error);
                }
            }
            
            return update;
        }
        else {
            console.log('partner not found ', partner)
            return partner;
        }
    } catch (err) {
        console.log(err);
        throw err;
    }
};



const deleteKitchenPartner = async (id) => {
    var id = req.params.id;
    const deleteKitchenPartner = await KitchenPartner.findByIdAndRemove({ _id })
    return deleteKitchenPartner;
}

const getKitchenPartner = async (id) => {
    const kitchenPartner = await KitchenPartner.findOne({ _id: id });
    return kitchenPartner;
}
const validateKitchenPartner = async (query) => {
    const condition = {};
    for (const prop in query) {
        const regexText = new RegExp(query[prop], 'i');
        condition[prop] = regexText;
    }
    // console.log('condition',condition);
    const savedKitchenPartner = await KitchenPartner.find(condition);
    if (savedKitchenPartner && savedKitchenPartner.length > 0) {
        return { available: false };
    } else {
        return { available: true };
    }
}
const getKitchenPartnerProfile = async (id) => {
    const kitchenPartner = await KitchenPartner.findOne({ loginId: id });
    if (kitchenPartner && kitchenPartner._id) {
        return kitchenPartner;
    } else {
        return {};
    }
}
const getKitchenPartnerList = async (clusterList, page, limit) => {
    const kitchenPartner = await KitchenPartner.find(
        {
            clusters: { $in: [...clusterList] },
            kitchenOpened: true,
            profileApproval: 'approved'
        })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
    return kitchenPartner;
}
const getClusterKitchenPartnerList = async (clusterList) => {
    const kitchenPartner = await KitchenPartner.find(
        { clusters: { $in: [...clusterList] } }, {
        kitchenName: 1,
        geolocation: 1,
        profileApproval: 1,
        kitchenOpened: 1,
        phoneNo: 1,
        kitchenType: 1
    });
    return kitchenPartner;
}
const getKitchenPartnerListByIds = async (ids) => {
    const kitchenList = await KitchenPartner.find({ _id: { $in: [...ids] } });
    return kitchenList;
}

const setKitchenOpenedStatus = async (id, status) => {
    const kitchen = await KitchenPartner.findOneAndUpdate({ _id: id },
        { $set: { kitchenOpened: status } }, { new: true });
    try {
        const update1 = await KitchenMenu.findOneAndUpdate({ kitchenId: id },
            { $set: { kitchenOpened: status } }, { new: true });
        const update2 = await TodaysMenu.findOneAndUpdate({ kitchenId: id },
            { $set: { kitchenOpened: status } }, { new: true });
    } catch (e) {
        // console.log('error while updating kithen menu ', e);
    }
    return kitchen;
}

const avgRating = async (id) => {
    try {
        const ratingList = await getFullFeedbackRating(id);
        if (ratingList && ratingList.length > 50) {
            let totalRating = 0;
            ratingList.forEach(rating => {
                totalRating += rating.feedbackRating
            });
            const newRating = Math.ceil(totalRating / ratingList.length);
            await KitchenPartner.findOneAndUpdate({ _id: id }, { $set: { rating: newRating } }, { new: true });
        }
    } catch (e) {
        // console.log('error while updating kithen menu ', e);
    }
    return id;
}

const updateMealTimig = async (id, mealTiming) => {
    mealTiming.forEach(element => {
        element.acceptOrderFrom = new Date(element.acceptOrderFrom);
        element.acceptOrderTill = new Date(element.acceptOrderTill);
    });
    const updatetime = await KitchenPartner.findOneAndUpdate({ _id: id }, { mealTiming });
    return updatetime

}
const searchkitchen = async (text, clusterList) => {
    const regexText = new RegExp(text, 'i');
    return await KitchenPartner.find({
        clusters: { $in: [...clusterList] },
        kitchenOpened: true,
        profileApproval: 'approved',
        $or: [{ speciality: regexText }, { mainSpeciality: regexText }, { kitchenName: regexText }]
    })
};
const searchKitchenWithFilter = async (searchObj, page) => {
    const limit = 20;
    const condition = {};
    if (searchObj.clusters && searchObj.clusters.length > 0) {
        condition.clusters = { $in: [...searchObj.clusters] }
    }
    if (searchObj.kitchenName) {
        const regexText = new RegExp(searchObj.kitchenName, 'i');
        condition.kitchenName = regexText;
    }
    if (searchObj.kitchenLocation) {
        const regexText = new RegExp(searchObj.kitchenLocation, 'i');
        condition['address.address2'] = regexText;
    }
    if (searchObj.kitchenPartnerName) {
        const regexText = new RegExp(searchObj.kitchenPartnerName, 'i');
        condition.kitchenPartnerName = regexText;
    }
    if (searchObj.phoneNo) {
        const regexText = new RegExp(searchObj.phoneNo, 'i');
        condition.phoneNo = regexText;
    }
    if (searchObj.mapTelNo) {
        const regexText = new RegExp(searchObj.mapTelNo, 'i');
        condition.mapTelNo = regexText;
    }
    if (searchObj.email) {
        const regexText = new RegExp(searchObj.email, 'i');
        condition.email = regexText;
    }
    if (searchObj.loginId) {
        // const regexText = new RegExp(searchObj.loginId, 'i');
        condition.loginId = searchObj.loginId.toUpperCase();
    }
    if (searchObj.profileApproval || searchObj.profilePending
        || searchObj.profileRejected || searchObj.profileSuspended) {
        const statusArr = [];
        if (searchObj.profileApproval) {
            statusArr.push('approved');
        }
        if (searchObj.profilePending) {
            statusArr.push('pending')
        }
        if (searchObj.profileRejected) {
            statusArr.push('rejected');
        }
        if (searchObj.profileSuspended) {
            statusArr.push('suspended')
        }
        condition.profileApproval = { $in: statusArr }
    }
    if (searchObj.address) {
        const regexText = new RegExp(searchObj.address, 'i');
        condition.$or = [{ 'address.address1': regexText }, { 'address.address2': regexText }, { 'address.landmark': regexText }];
    }
    // console.log('condition ',condition);
    return await KitchenPartner.find(condition).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
};

const lookupkitchen = async (clusterList) => {
    const lookupkitchen = await KitchenPartner.find({
        clusters: { $in: [...clusterList] },
        kitchenOpened: true,
        profileApproval: 'approved'
    }, { kitchenName: 1, speciality: 1 });
    const finalResult = [];
    lookupkitchen.forEach(ele => {
        finalResult.push(ele.kitchenName);
    });
    return finalResult;
}

const getKitchenPatnerCount = async () => {
    const result = await KitchenPartner.countDocuments();
    return result;
}

const updateKitchenCompliance = async (id, complianceObj, files) => {
    const compliance = {
        fssaiImageUrl: files[0].filename,
        fssai: complianceObj.fssai,
        fssaiExpiryDate: complianceObj.fssaiExpiryDate,
        adhaarFrontImageUrl: files[1].filename,
        adhaarBackImageUrl: files[2].filename,
        adhaar: complianceObj.adhaar
    }
    if (complianceObj.gstNumber && complianceObj.gstNumber !== 'null') {
        compliance.gstNumber = complianceObj.gstNumber;
    }
    const profileApproval = 'pending';
    const kitchen = await KitchenPartner.findOneAndUpdate({ _id: id }, { $set: { compliance, profileApproval } }, { new: true });
    return kitchen;
}

const updateProfileApproval = async (id, status, comment) => {
    const profileApprovalObj = {
        profileApproval: status
    }
    if (status === 'approved') {
        profileApprovalObj.kitchenApprovedOn = new Date();
    }
    if (status === 'suspended') {
        profileApprovalObj.kitchenOpened = false;
    }
    if (comment) {
        profileApprovalObj['compliance.comment'] = comment;
    }
    const kitchen = await KitchenPartner.findOneAndUpdate({ _id: id }, { $set: profileApprovalObj }, { new: true });
    try {
        if (status === 'suspended') {
            const update1 = await KitchenMenu.findOneAndUpdate({ kitchenId: id },
                { $set: { kitchenOpened: false } }, { new: true });
            const update2 = await TodaysMenu.findOneAndUpdate({ kitchenId: id },
                { $set: { kitchenOpened: false } }, { new: true });
        }
    } catch (e) {
        // console.log('error while updating kithen menu ', e);
    }

    return kitchen;
}

const updateDiscountOffer = async (id, discountOffer) => {
    const kitchenPartner = await KitchenPartner.findOne({ _id: id });
    if (kitchenPartner && kitchenPartner._id) {
        const updated = await KitchenPartner.findOneAndUpdate({ _id: id }, { $set: { discountOffer } }, { new: true });
        return updated;
    } else {
        return kitchenPartner
    }

}

const updatePreparationTime = async (id, preparationTime) => {
    const kitchenPartner = await KitchenPartner.findOne({ _id: id });
    if (kitchenPartner && kitchenPartner._id) {
        const updated = await KitchenPartner.findOneAndUpdate({ _id: id }, { $set: { preparationTime } }, { new: true });
        return updated;
    } else {
        return kitchenPartner
    }
}
const getAllKitchenPatners = async () => {
    const result = await KitchenPartner.find({});
    return result;
}

// new apis with geolocation
const getNearestKitchen = async (clusterList, page, lng, lat) => {
    const limit = 20;
    const kitchenPartner = await KitchenPartner.find({
        clusters: { $in: [...clusterList] },
        profileApproval: 'approved',
        kitchenOpened: true,
        location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] } } },
        kitchenType: { $in: ['B2C'] }
    })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
    return kitchenPartner;
}

const getNearestKitchensOfType = async (clusterList, page, lng, lat, kitchenType) => {
    const limit = 20;
    const kitchenPartner = await KitchenPartner.find({
        kitchenType: { $in: [...kitchenType] },
        clusters: { $in: [...clusterList] },
        profileApproval: 'approved',
        kitchenOpened: true,
        location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] } } }
    })
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
    return kitchenPartner;
}

const searchNearkitchen = async (text, clusterList, page, lng, lat) => {
    const limit = 20;
    const condition = {
        clusters: { $in: [...clusterList] },
        kitchenOpened: true,
        profileApproval: 'approved',
        location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] } } },
        kitchenType: { $in: ['B2C'] }
    };
    if (text === 'subscription') {
        condition.subscriptionAllowed = true;
    } else {
        // Normalize search text: remove special characters and extra spaces
        const normalizedText = text.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

        // Create a flexible regex pattern that matches each word separately
        const words = normalizedText.split(' ');
        const regexPattern = words.map(word => `(?=.*${word})`).join('');
        const regexText = new RegExp(regexPattern, 'i');

        // Also keep the original regex for backward compatibility
        const originalRegex = new RegExp(text, 'i');

        condition.$or = [
            { speciality: originalRegex },
            { mainSpeciality: originalRegex },
            { kitchenName: originalRegex },
            // Add normalized search for kitchen name
            { kitchenName: regexText }
        ]
    }
    return await KitchenPartner.find(condition)
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .exec();
};

const validateKitchenReferralCode = async (referralCode) => {
    const result = await KitchenPartner.findOne({ referralCode });
    if (result && result._id) {
        return { referrerId: result._id, referrerName: result.kitchenName, referralCodeValid: true };
    } else {
        return { referralCodeValid: false };
    }
}

const updateComplianceByAdmin = async (id, complianceObj, files) => {
    const compliance = {};
    if (complianceObj.fssai) {
        compliance.fssai = complianceObj.fssai;
    }
    if (complianceObj.fssaiExpiryDate) {
        compliance.fssaiExpiryDate = complianceObj.fssaiExpiryDate;
    }
    if (complianceObj.adhaar) {
        compliance.adhaar = complianceObj.adhaar;
    }

    if (files && files.length > 0) {
        if (complianceObj.fssaiImageUrlNo) {
            compliance.fssaiImageUrl = files[complianceObj.fssaiImageUrlNo].filename;
        } else {
            compliance.fssaiImageUrl = complianceObj.fssaiImageUrl;
        }
        if (complianceObj.adhaarFrontImageUrlNo) {
            compliance.adhaarFrontImageUrl = files[complianceObj.adhaarFrontImageUrlNo].filename;
        } else {
            compliance.adhaarFrontImageUrl = complianceObj.adhaarFrontImageUrl;
        }
        if (complianceObj.adhaarBackImageUrlNo) {
            compliance.adhaarBackImageUrl = files[complianceObj.adhaarBackImageUrlNo].filename;
        } else {
            compliance.adhaarBackImageUrl = complianceObj.adhaarBackImageUrl;
        }
        if (complianceObj.agreementPdfUrlNo) {
            compliance.agreementPdfUrl = files[complianceObj.agreementPdfUrlNo]?.filename;
        } else {
            compliance.agreementPdfUrl = complianceObj.agreementPdfUrl;
        }
        if (complianceObj.kitchenImageUrlNo) {
            compliance.kitchenImageUrl = files[complianceObj.kitchenImageUrlNo]?.filename;
        } else {
            compliance.kitchenImageUrl = complianceObj.kitchenImageUrl;
        }
    } else {
        compliance.fssaiImageUrl = complianceObj.fssaiImageUrl;
        compliance.adhaarFrontImageUrl = complianceObj.adhaarFrontImageUrl;
        compliance.adhaarBackImageUrl = complianceObj.adhaarBackImageUrl;
        compliance.agreementPdfUrl = complianceObj.agreementPdfUrl;
        compliance.kitchenImageUrl = complianceObj.kitchenImageUrl;

    }
    if (complianceObj.gstNumber) {
        compliance.gstNumber = complianceObj.gstNumber;
    }
    const kitchen = await KitchenPartner.findOneAndUpdate({ _id: id }, { $set: { compliance } }, { new: true });
    const deleteImages = [];
    if (complianceObj.fssaiImageUrlOld) {
        deleteImages.push(complianceObj.fssaiImageUrlOld)
    }
    if (complianceObj.adhaarFrontImageUrlOld) {
        deleteImages.push(complianceObj.adhaarFrontImageUrlOld)
    }
    if (complianceObj.adhaarBackImageUrlOld) {
        deleteImages.push(complianceObj.adhaarBackImageUrlOld)
    }
    if (complianceObj.agreementPdfUrlOld) {                               
        deleteImages.push(complianceObj.agreementPdfUrlOld);
    }
    if (complianceObj.kitchenImageUrlOld) {
        deleteImages.push(complianceObj.kitchenImageUrlOld);
    }
    if (deleteImages.length > 0) {
        try {
            deleteMultiImages(deleteImages);
        } catch (error) {
            // console.log('Error while deleteing kitchen partner previous image ',error);
        }
    }
    return kitchen;
}

const updateSubscriptionDetails = async (id, subscriptionObj) => {
    const updatedObj = {}
    updatedObj.subscriptionAllowed = subscriptionObj.subscriptionAllowed;
    if (subscriptionObj.subscriptionDiscount) {
        updatedObj.subscriptionDiscount = subscriptionObj.subscriptionDiscount;
    }
    if (subscriptionObj.subscriptionTiming) {
        updatedObj.subscriptionTiming = subscriptionObj.subscriptionTiming;
    }
    const update = await KitchenPartner.findOneAndUpdate({ _id: id }, { $set: updatedObj }, { new: true });
    return update;
}

const getKitchenbyMobile = async (phoneNo) => {
    const kitchenPartner = await KitchenPartner.findOne({ phoneNo });
    if (kitchenPartner && kitchenPartner._id) {
        return kitchenPartner;
    } else {
        return {};
    }
}

const getKitchenActualNobymapTelNo = async (mapTelNo) => {
    const kitchenPartner = await KitchenPartner.findOne({ mapTelNo });
    if (kitchenPartner && kitchenPartner._id) {
        return {phoneNo:kitchenPartner.phoneNo};
    } else {
        return {phoneNo:''};
    }
}

const assignRandomRating = async (id) => {
    // const newRating = parseFloat((Math.random()*(5-4.2)+4.2).toFixed(1));
    // await KitchenPartner.findOneAndUpdate({_id : id},{$set:{rating:newRating}},{new:true});  

    const kitchenPartnerList = await KitchenPartner.find({});
    if (kitchenPartnerList && kitchenPartnerList.length > 0) {
        const promiseArr = [];
        kitchenPartnerList.forEach(async (kitchen) => {
            // console.log('kitchen',kitchen._id);
            const newRating = parseFloat((Math.random() * (5 - 4.2) + 4.2).toFixed(1));
            promiseArr.push(await KitchenPartner.findOneAndUpdate({ _id: kitchen._id }, { $set: { rating: newRating } }, { new: true }));
            // console.log('kitchen saved');
        });
        return promiseArr;
    } else {
        return [];
    }
}

const assignKitchenType = async () => {
    await KitchenPartner.updateMany({}, { $set: { kitchenType: ['B2C'] } });
}

const exportKitchenPartners = async (searchObj) => {
    try {
        const condition = {};
        condition.clusters = { $in: [...searchObj.clusters] };
        return await KitchenPartner.find(condition);
    } catch (error) {
        // console.log(error)
    }
}

const getKitchenPartenrImageList = async () => {
    const list = await KitchenPartner.find({ kitchenOpened: true }, { imageUrl: 1 });
    return list;
}


const getNearestKitchensOfApartment = async (page, lng, lat, filters = {}) => {
    const limit = 20;

    const kitchenPartner = await KitchenPartner.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                distanceField: "distance",
                maxDistance: filters.maxDistance || 10000,
                spherical: true,
                query: {
                    profileApproval: 'approved',
                    kitchenOpened: true,
                    $or: [
                        { kitchenType: { $in: ['Apartment'] } },
                        { 'apartmentInfo': { $exists: true, $ne: null } }
                    ]
                }
            }
        },
        // Additional filtering
        ...(filters.apartmentId ? [
            { $match: { 'apartmentInfo.apartmentId': mongoose.Types.ObjectId(filters.apartmentId) } }
        ] : []),
        ...(filters.apartmentName ? [
            {
                $match: {
                    'apartmentInfo.apartmentName': {
                        $regex: filters.apartmentName,
                        $options: 'i'
                    }
                }
            }
        ] : []),
        ...(filters.mealType && filters.mealType.length > 0 ? [
            { $match: { mealType: { $in: filters.mealType } } }
        ] : []),
        // Pagination
        { $skip: (page - 1) * limit },
        { $limit: limit }
    ]);
    return kitchenPartner;
};
// Get all kitchen data by apartment ID (without any field selection)
const getKitchensByApartmentId = async (apartmentId) => {
    try {
        const kitchens = await KitchenPartner
            .find({
                'apartmentInfo.apartmentId': apartmentId
            })
            .lean();

        return kitchens;
    } catch (error) {
        throw new Error(`Error fetching kitchens: ${error.message}`);
    }
};

module.exports = {
    saveNewKitchenPatner,
    updateKitchenPatner,
    getKitchenPartner,
    validateKitchenPartner,
    getKitchenPartnerProfile,
    deleteKitchenPartner,
    setKitchenOpenedStatus,
    updateMealTimig,
    getKitchenPartnerList,
    searchkitchen,
    searchKitchenWithFilter,
    getKitchenPartnerListByIds,
    lookupkitchen,
    avgRating,
    getKitchenPatnerCount,
    updateKitchenCompliance,
    updateProfileApproval,
    updateDiscountOffer,
    updatePreparationTime,
    getAllKitchenPatners,
    getNearestKitchen,
    getNearestKitchensOfType,
    searchNearkitchen,
    validateKitchenReferralCode,
    getClusterKitchenPartnerList,
    updateComplianceByAdmin,
    updateSubscriptionDetails,
    getKitchenbyMobile,
    assignRandomRating,
    assignKitchenType,
    exportKitchenPartners,
    getKitchenPartenrImageList,
    updateApartmentInfo,
    getNearestKitchensOfApartment,
    getKitchensByApartmentId,
    getKitchenActualNobymapTelNo
}
