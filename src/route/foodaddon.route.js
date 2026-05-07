const express = require('express');
const service = require('../service/foodaddon.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
var upload = require('../util/image-handler')
const { kitchenAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/saveaddon', kitchenAuthMiddleware, upload.single('image'), async (req, res) => {
  try {
    const saveAddOn = await service.saveaddOn(req.body, req.file.filename);
    responsehanlder.success200(req, res, saveAddOn)
  } catch (error) {
    // console.log(error)
    responsehanlder.hasError500(res)
  }
});


// router.post('/saveaddonlist',upload.single('image'),async(req,res)=>{
//     try{
//       const saveAddOnList = await service.saveAddOnList(req.body)
//       responsehanlder.success200(req,res,saveAddOnList);
//     }catch(error){
//       // console.log(error)
//       responsehanlder.hasError500(res)
//     }
// })


router.post('/updateaddon/:id', kitchenAuthMiddleware, upload.single("image"), async (req, res) => {
  try {
    let fileName = undefined;
    if (req.file && req.file.filename) {
      fileName = req.file.filename;
    }
    const updateaddon = await service.UpdateAddOn(req.params.id, req.body, fileName)
    responsehanlder.success200(req, res, updateaddon);
  } catch (error) {
    // console.log(error)
    responsehanlder.hasError500(res)
  }

})

router.post('/deleteaddonlist', kitchenAuthMiddleware, async (req, res) => {
  try {
    // console.log("showing body"  + req.body)
    const deleteaddonlist = await service.deleteAddonList(req.body)
    responsehanlder.success200(req, res, deleteaddonlist)
  } catch (error) {
    // console.log(error)
    responsehanlder.hasError500(res)
  }
})

router.get('/getaddonlist', async (req, res) => {
  try {
    const getaddonlist = await service.getAddOnList();
    responsehanlder.success200(req, res, getaddonlist)
  } catch (error) {
    // console.log(error)
    responsehanlder.hasError500(res)
  }
});

router.delete('/deleteAddon/:id', kitchenAuthMiddleware, async (req, res) => {
  try {
    const deleteaddon = await service.deleteAddon(req.params.id);
    responsehanlder.success200(req, res, deleteaddon);
  } catch (error) {
    // console.log(error)
    responsehanlder.hasError500(res);
  }
})

router.get('/getAddOn/:id', async (req, res) => {
  try {
    const result = await service.getAddOn(req.params.id);
    responsehanlder.success200(req, res, result)
  } catch (error) {
    responsehanlder.hasError500(res)
  }
});

module.exports = router;
