const express = require('express');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const service = require('./../service/apartmentMenu.service')
const { kitchenAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');

router.get('/apartmentMenu/:id/future', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        const daysAhead = parseInt(req.query.days) || 2;
        
        console.log('🔍 ROUTE PARAMETERS:');
        console.log('   Kitchen ID:', kitchenId);
        console.log('   Days Ahead:', daysAhead);
        console.log('   Query String:', req.query);
        console.log('   Full URL:', req.originalUrl);
        
        if (kitchenId) {
            const result = await service.getFutureApartmentMenus(kitchenId, daysAhead);
            console.log('✅ Future menus retrieved - item count:', result);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError500(res, 'kitchen id not present')
        }
    } catch (error) {
        console.log('❌ Error in /future route:', error);
        responsehanlder.hasError500(res)
    }
});


router.get('/apartmentMenu/:id/:clientDate', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        const clientDate = req.params.clientDate;
        if (kitchenId && clientDate) {
            const result = await service.getApartmentMenu(kitchenId, clientDate);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError500(res, 'kitchen id not present')
        }
    } catch (error) {
        console.log({error});
        
        responsehanlder.hasError500(res)
    }
});
// router.get('/apartmentMenu/future/:id', async (req, res) => {
//     try {
//         const kitchenId = req.params.id;
//         console.log('🔍 Getting future menus for kitchen:', kitchenId);
        
//         if (kitchenId) {
//             const result = await service.getFutureApartmentMenus(kitchenId);
//             console.log('✅ Future menus retrieved successfully');
//             responsehanlder.success200(req, res, result)
//         } else {
//             responsehanlder.hasError500(res, 'kitchen id not present')
//         }
//     } catch (error) {
//         console.log('❌ Error in /future route:', error);
//         responsehanlder.hasError500(res)
//     }
// });

router.get('/apartmentMenu/:id', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        if (kitchenId) {
            const result = await service.getAllApartmentMenus(kitchenId);
            responsehanlder.success200(req, res, result)
        } else {
            responsehanlder.hasError500(res, 'kitchen id not present')
        }
    } catch (error) {
        console.log({error});
        responsehanlder.hasError500(res)
    }
});
router.post('/saveApartmentMenu', async (req, res) => {
    try {
        const apartmentMenu = req.body;
        console.log({apartmentMenu});
        
        if (apartmentMenu) {
            const result = await service.saveApartmentMenu(apartmentMenu);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        console.log({saveApartmentMenu:error});

        responsehanlder.hasError500(res);
    }
});

router.post('/updateApartmentMenu/:id', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        const apartmentMenu = req.body;
        if (kitchenId && apartmentMenu) {
            const result = await service.updateApartmentMenu(kitchenId, apartmentMenu);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});

router.post('/updateQuantityAvailable/:id', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        const itemList = req.body;
        if (kitchenId && itemList) {
            const result = await service.updateQuantityAvailable(kitchenId, itemList);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        responsehanlder.hasError500(res);
    }
});
router.post('/addToApartmentMenu/:id', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        const { newItems } = req.body;
        
        console.log('📝 Add to Apartment Menu Request:', {
            kitchenId: kitchenId,
            newItemsCount: newItems?.length,
            newItems: newItems?.map(item => ({
                name: item.itemName,
                mealType: item.mealType,
                servingDate: item.itemServingDate
            }))
        });

        if (kitchenId && newItems && Array.isArray(newItems)) {
            const result = await service.addToApartmentMenu(kitchenId, newItems);
            console.log('✅ New items added successfully');
            responsehanlder.success200(req, res, result);
        } else {
            console.log('❌ Invalid request - missing required fields');
            responsehanlder.hasError500(res, 'invalid request - kitchenId and newItems array required');
        }
    } catch (error) {
        console.error('❌ Error adding items to apartment menu:', error);
        responsehanlder.hasError500(res);
    }
});

// Current route - make sure you're passing the correct date
router.post('/validateApartmentFoodOrder/:clientDayStartTime', async (req, res) => {
    try {
        const clientDayStartTime = req.params.clientDayStartTime;
        console.log('🔍 Validation Request Details:', {
            clientDayStartTime: clientDayStartTime,
            kitchenId: req.body.kitchenId,
            items: req.body.itemList?.map(item => ({
                name: item.itemName,
                id: item._id,
                date: item.itemServingDate // Check if this matches clientDayStartTime
            }))
        });
        
        if (req && req.body && clientDayStartTime) {
            const result = await service.validateApartmentFoodOrder(req.body, clientDayStartTime);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError402(res, 'invalid request');
        }
    } catch (error) {
        console.log({validateApartmentFoodOrder:error});
        responsehanlder.hasError500(res)
    }
});

// Add this route to your apartmentMenu.routes.js
router.post('/updateQuantityBooked/:id', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        const { itemList, decreaseCount } = req.body;
        
        console.log('📊 Update quantity booked request:', {
            kitchenId,
            itemCount: itemList?.length,
            decreaseCount: decreaseCount || false
        });
        
        if (kitchenId && itemList && Array.isArray(itemList)) {
            const result = await service.updateQuantityBooked(
                kitchenId, 
                itemList, 
                decreaseCount || false
            );
            
            console.log('✅ Quantity booked updated successfully');
            responsehanlder.success200(req, res, result);
        } else {
            console.log('❌ Invalid request - missing required fields');
            responsehanlder.hasError500(res, 'invalid request - kitchenId and itemList required');
        }
    } catch (error) {
        console.error('❌ Error updating quantity booked:', error);
        responsehanlder.hasError500(res);
    }
});

// Add this route to your existing routes
router.delete('/deleteApartmentMenuItem/:menuId/:itemId', async (req, res) => {
    try {
        const menuId = req.params.menuId;
        const itemId = req.params.itemId;
        
        console.log('🗑️ Delete single menu item request:', {
            menuId,
            itemId
        });

        if (!menuId) {
            return responsehanlder.hasError500(res, 'Menu ID is required');
        }

        if (!itemId) {
            return responsehanlder.hasError500(res, 'Item ID is required');
        }

        const result = await service.deleteSingleMenuItem(menuId, itemId);

        console.log('✅ Delete operation completed:', result);
        responsehanlder.success200(req, res, result);
        
    } catch (error) {
        console.error('❌ Error deleting menu item:', error);
        responsehanlder.hasError500(res, 'Failed to delete menu item');
    }
});

router.post('/cleanupPastMenuItems/:kitchenId?', async (req, res) => {
    try {
        const kitchenId = req.params.kitchenId;
        
        console.log('🧹 MANUAL CLEANUP REQUESTED');
        console.log('   Target:', kitchenId || 'ALL KITCHENS');
        console.log('   Requested by:', req.user?.name || 'Unknown');
        console.log('   Time:', new Date().toISOString());
        
        const result = await service.cleanupPastMenuItems(kitchenId);
        
        console.log('✅ MANUAL CLEANUP COMPLETED:', result);
        responsehanlder.success200(req, res, result);
        
    } catch (error) {
        console.error('❌ Error in manual cleanup endpoint:', error);
        responsehanlder.hasError500(res, 'Cleanup failed: ' + error.message);
    }
});
// POST /api/kitchen/menums
router.post('/menus', async (req, res) => {
  try {
    console.log('📋 POST /api/kitchen/menums - Request received');
    
    const { kitchenIds } = req.body;
    
    console.log('📊 Request details:', {
      kitchenIds: kitchenIds,
      count: kitchenIds?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!kitchenIds || !Array.isArray(kitchenIds) || kitchenIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'kitchenIds array is required in request body',
        data: null
      });
    }

    // Call service layer
    const result = await service.getKitchensWithMenuList(kitchenIds);
    
    console.log('✅ Request processed successfully:', {
      kitchensReturned: result
    });

    res.status(200).json({
      success: true,
      message: 'Kitchens with menu list retrieved successfully',
      data: result,
      meta: {
        totalKitchens: result.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in POST /api/kitchen/menus:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      data: null
    });
  }
});

router.delete('/clear-all-items/:kitchenId', async (req, res) => {
    try {
        const { kitchenId } = req.params;
        
        if (!kitchenId) {
            return res.status(400).json({
                success: false,
                message: 'Kitchen ID is required'
            });
        }

        console.log(`🧹 API CALL: Clearing all menu items for kitchen ${kitchenId}`);
        
        // Call service directly
        const result = await service.clearAllKitchenMenuItems(kitchenId);
        
        res.status(200).json({
            success: true,
            message: result.message || 'All menu items cleared successfully',
            data: {
                kitchenId: kitchenId,
                kitchenName: result.kitchenName,
                itemsCleared: result.itemsCleared || 0,
                clearedAt: new Date().toISOString(),
                operation: 'clear_all_items'
            }
        });
        
    } catch (error) {
        console.error('❌ Error clearing kitchen menu items:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing menu items',
            error: error.message
        });
    }
});
router.get('/apartmentBulkMenu/:id', async (req, res) => {
    try {
        const kitchenId = req.params.id;
        if (kitchenId) {
            const result = await service.getApartmentBulkMenu(kitchenId);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        console.log({ getApartmentBulkMenu: error });
        responsehanlder.hasError500(res);
    }
});

// Make sure this is exported with other routes
// Make sure this is exported with other routes
module.exports = router;