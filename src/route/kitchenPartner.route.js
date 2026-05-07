const express = require('express');
const service = require('../service/kitchenPartner.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const upload = require('../util/image-handler');
const { kitchenAuthMiddleware, adminAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/getAllKitchenPatners', adminAuthMiddleware, async (req, res) => {
    try {
        const filename = req.file && req.file.filename ? req.file.filename : undefined;
        const kitchenPartner = await service.getAllKitchenPatners();
        responsehanlder.success200(req, res, kitchenPartner);
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res, error);
    }
});
router.post('/kitchenPartner', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const filename = req.file && req.file.filename ? req.file.filename : undefined;
        const kitchenPartnersaved = await service.saveNewKitchenPatner(req.body, filename);
        responsehanlder.success200(req, res, kitchenPartnersaved);
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res, error);
    }
});

router.post('/updateKitchenPatner/:id', kitchenAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        const kitchenPartner = req.body;
        const id = req.params.id
        let fileName = undefined;
        if (req.file && req.file.filename) {
            fileName = req.file.filename;
        }
        if (id && kitchenPartner) {
            const kitchen = await service.updateKitchenPatner(id, kitchenPartner, fileName);
            responsehanlder.success200(req, res, kitchen);
        } else {
            responsehanlder.hasError500(res, 'invlaid request');
        }
    } catch (error) {
        // console.log('updateKitchenPatner erroe ==>',error);
        responsehanlder.hasError500(res);
    }
});

// Add this route in kitchenPartner.route.js
router.put('/updateApartmentInfo/:id', kitchenAuthMiddleware, async (req, res) => {
    try {
        const apartmentInfo = req.body.apartmentInfo;
        const id = req.params.id;
        if (id && apartmentInfo) {
            const kitchen = await service.updateApartmentInfo(id, apartmentInfo);
            responsehanlder.success200(req, res, kitchen);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        console.log('updateApartmentInfo error ==>', error);
        responsehanlder.hasError500(res);
    }
});
router.delete('/deleteKitchenPartner/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const deleteKitchenPartner = await service.deleteKitchenPartner;
        responsehanlder.success200(req, res, deleteKitchenPartner);
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.get('/getKitchenPartner/:id', async (req, res) => {
    try {
        const getkitchenpartner = await service.getKitchenPartner(req.params.id);
        responsehanlder.success200(req, res, getkitchenpartner);
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.post('/validateKitchenPartner', adminAuthMiddleware, async (req, res) => {
    try {
        const body = req.body;
        if (body) {
            const result = await service.validateKitchenPartner(body);
            if (result.erroCode) {
                responsehanlder.hasError503(res, result.erroCode)
            } else {
                responsehanlder.success200(req, res, result);
            }
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getKitchenPartnerProfile/:id', kitchenAuthMiddleware, async (req, res) => {
    try {
        const getkitchenpartner = await service.getKitchenPartnerProfile(req.params.id);
        responsehanlder.success200(req, res, getkitchenpartner);
    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/getKitchenPartnerList/:pageNumber/:nPerPage', userAuthMiddleware, async (req, res) => {
    try {
        const clusterList = req.body.clusterList;
        // const cacheResult =  req.body.cacheResult ? req.body.cacheResult : [];
        const pageNumber = req.params.pageNumber;
        const nPerPage = req.params.nPerPage;
        if (clusterList && pageNumber && nPerPage) {
            const getkitchenpartnerList = await service.getKitchenPartnerList(clusterList, pageNumber, nPerPage);
            responsehanlder.success200(req, res, [...getkitchenpartnerList]);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.post('/getKitchenPartnerListByIds', async (req, res) => {
    try {
        idList = req.body.idList;
        const getkitchenpartnerList = await service.getKitchenPartnerListByIds(idList);
        responsehanlder.success200(req, res, [...getkitchenpartnerList]);
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.put('/kitchenOpenedStatus/:id/:status', kitchenAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const status = req.params.status;
        if (id && status) {
            const kitchen = await service.KitchenOpenedStatus(id, status);
            responsehanlder.success200(req, res, { status });
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.post('/updatemealtiming/:id', kitchenAuthMiddleware, async (req, res) => {
    try {
        const mealTiming = req.body.mealTiming;
        if (mealTiming) {
            const updatetime = await service.updateMealTimig(req.params.id, mealTiming);
            responsehanlder.success200(req, res, updatetime);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log('kitchenPartner route updatemealtiming ==> ',error);
        responsehanlder.hasError500(res);
    }
});
router.post('/updatePreparationTime/:id', kitchenAuthMiddleware, async (req, res) => {
    try {
        const preparationTime = req.body.preparationTime;
        if (preparationTime) {
            const updatetime = await service.updatePreparationTime(req.params.id, preparationTime);
            responsehanlder.success200(req, res, updatetime);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log('kitchenPartner route updatePreparationTime ==> ',error);
        responsehanlder.hasError500(res);
    }
});
router.post('/searchKitchenWithFilter/:page', adminAuthMiddleware, async (req, res) => {
    try {
        const filterObj = req.body;
        const page = req.params.page;
        if (filterObj && page) {
            const result = await service.searchKitchenWithFilter(filterObj, page);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.post('/exportKitchenPartners', adminAuthMiddleware, async (req, res) => {
    try {
        const filterObj = req.body;
        if (filterObj) {
            const result = await service.exportKitchenPartners(filterObj);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});


router.get('/getKitchenPatnerCount', adminAuthMiddleware, async (req, res) => {
    try {
        const result = await service.getKitchenPatnerCount();
        responsehanlder.success200(req, res, { result });
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.post('/updateKitchenCompliance/:id', kitchenAuthMiddleware, upload.array('image'), async (req, res) => {
    try {
        const complianceObj = req.body;
        const id = req.params.id;
        if (complianceObj && id) {
            const result = await service.updateKitchenCompliance(id, complianceObj, req.files);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.post('/updateProfileApproval/:id/:status', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const status = req.params.status;
        const comment = req.body.comment;
        if (status && id) {
            const result = await service.updateProfileApproval(id, status, comment);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.post('/updateDiscountOffer/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const discountOffer = req.body;
        if (id && discountOffer) {
            const result = await service.updateDiscountOffer(id, discountOffer);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/getNearestKitchen/:pageNumber/:lng/:lat', async (req, res) => {
    try {
        const clusterList = req.body.clusterList;
        const pageNumber = req.params.pageNumber;
        const lng = req.params.lng;
        const lat = req.params.lat;
        if (clusterList && pageNumber && lng && lat) {
            const getkitchenpartnerList = await service.getNearestKitchen(clusterList, pageNumber, lng, lat);
            responsehanlder.success200(req, res, [...getkitchenpartnerList]);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/getNearestKitchensOfType/:pageNumber/:lng/:lat', async (req, res) => {
    try {
        // console.log('getNearestKitchensOfType');
        const clusterList = req.body.clusterList;
        const pageNumber = req.params.pageNumber;
        const lng = req.params.lng;
        const lat = req.params.lat;
        const kitchenType = req.body.kitchenType;
        if (clusterList && pageNumber && lng && lat && kitchenType) {
            const getkitchenpartnerList = await service.getNearestKitchensOfType(clusterList, pageNumber, lng, lat, kitchenType);
            responsehanlder.success200(req, res, [...getkitchenpartnerList]);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/validateKitchenReferralCode/:installReferrer', async (req, res) => {
    try {
        const installReferrer = req.params.installReferrer;
        if (installReferrer) {
            const result = await service.validateKitchenReferralCode(installReferrer);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/getClusterKitchenPartnerList', userAuthMiddleware, async (req, res) => {
    try {
        const clusterList = req.body.clusterList;
        if (clusterList) {
            const getkitchenpartnerList = await service.getClusterKitchenPartnerList(clusterList);
            responsehanlder.success200(req, res, [...getkitchenpartnerList]);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/sendTestNotification', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.body.kitchenId;
        const message = req.body.message;
        if (id && message) {
            const result = await service.sendTestNotification(id, message);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/updateComplianceByAdmin/:id', adminAuthMiddleware, upload.array('image'), async (req, res) => {
    try {
        const complianceObj = req.body;
        const id = req.params.id;
        if (complianceObj && id) {
            const result = await service.updateComplianceByAdmin(id, complianceObj, req.files);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/updateSubscriptionDetails/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const subscriptionObj = req.body;
        const id = req.params.id;
        if (subscriptionObj && id) {
            const result = await service.updateSubscriptionDetails(id, subscriptionObj);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getKitchenbyMobile/:phoneNo', adminAuthMiddleware, async (req, res) => {
    try {
        const phoneNo = req.params.phoneNo;
        if (phoneNo) {
            const result = await service.getKitchenbyMobile(phoneNo);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.get('/getKitchenActualNobymapTelNo/:phoneNo', async (req, res) => {
    try {
        const phoneNo = req.params.phoneNo;
        if (phoneNo) {
            const result = await service.getKitchenActualNobymapTelNo(phoneNo);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request body');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/deductkitchenWallet', userAuthMiddleware, async (req, res) => {
    try {
        const walletObj = req.body;
        if (walletObj.kitchenId && walletObj.kitchenName && walletObj.amountToDeduct && walletObj.remark && walletObj.category) {
            const result = await service.deductkitchenWallet(walletObj.kitchenId, walletObj.kitchenName, walletObj.amountToDeduct, walletObj.remark, walletObj.category);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});

router.post('/addkitchenWallet', userAuthMiddleware, async (req, res) => {
    try {
        const walletObj = req.body;
        if (walletObj.kitchenId && walletObj.kitchenName && walletObj.amountToAdd && walletObj.remark && walletObj.category) {
            const result = await service.addkitchenWallet(walletObj.kitchenId, walletObj.kitchenName, walletObj.amountToAdd, walletObj.remark, walletObj.category);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        // console.log(error);
        responsehanlder.hasError500(res);
    }
});



router.post('/getNearestKitchensOfApartment/:pageNumber/:lng/:lat', async (req, res) => {
    try {
        const pageNumber = req.params.pageNumber;
        const lng = req.params.lng;
        const lat = req.params.lat;
        const filters = {
            apartmentId: req.body.apartmentId,
            apartmentName: req.body.apartmentName,
            mealType: req.body.mealType,
            maxDistance: req.body.maxDistance // Optional: max distance in meters
        };
        
        if (pageNumber && lng && lat) {
            const getkitchenpartnerList = await service.getNearestKitchensOfApartment(
                pageNumber, lng, lat, filters
            );
            responsehanlder.success200(req, res, [...getkitchenpartnerList]);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        console.log('getNearestKitchensOfApartment error ==>', error);
        responsehanlder.hasError500(res);
    }
});


module.exports = router;
