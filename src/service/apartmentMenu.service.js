const apartmentMenuDao = require('../dao/apartmentMenu.dao');
const kitchenMenuDao = require('../dao/kitchenMenu.dao');
const { getTodayStartTime } = require('../util/date-util');
const ApartmentMenu = require('../model/apartmentMenu.model'); // ✅ ADD THIS LINE
const mongoose = require('mongoose');

const getApartmentMenu = async (kitchenId, clientDate) => {
    const menu = await apartmentMenuDao.getApartmentMenu(kitchenId, clientDate);
    return menu;
};
const getAllApartmentMenus = async (kitchenId) => {
    const menus = await apartmentMenuDao.getAllApartmentMenus(kitchenId);
    return menus;
};

const getFutureApartmentMenus = async (kitchenId, daysAhead = 30) => {
    console.log('🎯 SERVICE: getFutureApartmentMenus called with daysAhead:', daysAhead);
    const menus = await apartmentMenuDao.getFutureApartmentMenus(kitchenId, daysAhead);
    return menus;
};

const getApartmentBulkMenu = async (kitchenId) => {
    const menu = await apartmentMenuDao.getApartmentBulkMenu(kitchenId);
    return menu;
};

const saveApartmentMenu = async (apartmentMenu) => {
    return apartmentMenuDao.saveApartmentMenu(apartmentMenu);
};
const addToApartmentMenu = async (kitchenId, newItems) => {
    return apartmentMenuDao.addToApartmentMenu(kitchenId, newItems);
};

const updateApartmentMenu = async (kitchenId, updateApartmentMenu) => {
    return apartmentMenuDao.updateApartmentMenu(kitchenId, updateApartmentMenu);
};

const updateKitchenInfo = async (kitchen) => {
    try {
        apartmentMenuDao.updateKitchenInfo(kitchen);
    } catch (error) {
        // console.log('ApartmentMenu.service updateKitchenInfo ==> ',error);
    }
};

const searchApartmentMenu = async (text) => {
    return await apartmentMenuDao.searchApartmentMenu(text)
}

const updateQuantityAvailable = async (kitchenId, itemList) => {
    return await apartmentMenuDao.updateQuantityAvailable(kitchenId, itemList);
}

const updateQuantityBooked = async (kitchenId, itemList, decreaseCount) => {
    try {
        return await apartmentMenuDao.updateQuantityBooked(kitchenId, itemList, decreaseCount);
    } catch (e) {
        // console.log('Error while updating booked quantity ',e)
    }
}

// In apartmentMenu.service.ts - Update the validation logic

const validateApartmentFoodOrder = async (orderData, clientDayStartTime) => {
    try {
        console.log('🔍 Validating apartment food order:', {
            kitchenId: orderData.kitchenId,
            clientDayStartTime: clientDayStartTime,
            orderItems: orderData.itemList?.map(item => ({
                name: item.itemName,
                id: item._id,
                count: item.count,
                // Check if items have their own serving dates
                itemServingDate: item.itemServingDate 
            }))
        });

        // Get menu for the specific date
        const apartmentMenu = await apartmentMenuDao.getApartmentMenu(
            orderData.kitchenId, 
            clientDayStartTime
        );

        console.log('📊 Menu Analysis:', {
            menuExists: !!apartmentMenu,
            kitchenId: apartmentMenu?.kitchenId,
            targetDate: clientDayStartTime,
            availableItems: apartmentMenu?.itemList?.map(item => ({
                name: item.itemName,
                id: item._id,
                date: item.itemServingDate,
                servesTo: item.servesTo,
                quantityBooked: item.quantityBooked,
                available: item.servesTo - (item.quantityBooked || 0)
            })) || []
        });

        if (!apartmentMenu || !apartmentMenu._id) {
            console.log('❌ No apartment menu found for:', {
                kitchenId: orderData.kitchenId,
                date: clientDayStartTime
            });
            return {
                valid: false,
                message: `No menu available for ${clientDayStartTime}`,
                unavailableItems: []
            };
        }

        if (!apartmentMenu.kitchenOpened) {
            return {
                valid: false,
                message: 'Kitchen is currently closed',
                unavailableItems: []
            };
        }

        if (!apartmentMenu.itemList || apartmentMenu.itemList.length === 0) {
            return {
                valid: false,
                message: `No menu items available for ${clientDayStartTime}`,
                unavailableItems: []
            };
        }

        const unavailableItems = [];
        let allItemsAvailable = true;

        for (const orderItem of orderData.itemList) {
            console.log(`🔍 Looking for item: ${orderItem.itemName} (ID: ${orderItem._id})`);
            
            // Try to find by ID first
            let menuItem = apartmentMenu.itemList.find(
                item => item._id.toString() === orderItem._id?.toString()
            );

            // If not found by ID, try by name AND date
            if (!menuItem) {
                console.log('⚠️ Item not found by ID, trying by name and date...');
                menuItem = apartmentMenu.itemList.find(
                    item => item.itemName === orderItem.itemName
                );
            }

            if (!menuItem) {
                console.log(`❌ Item "${orderItem.itemName}" not found in menu for date ${clientDayStartTime}`);
                unavailableItems.push({
                    itemName: orderItem.itemName,
                    requestedCount: orderItem.count,
                    availableCount: 0,
                    reason: `Item not available for ${clientDayStartTime}`
                });
                allItemsAvailable = false;
                continue;
            }

            // Check if the menu item date matches the requested date
            const menuItemDate = new Date(menuItem.itemServingDate).toISOString().split('T')[0];
            const requestedDate = clientDayStartTime;
            
            if (menuItemDate !== requestedDate) {
                console.log(`❌ Date mismatch for "${orderItem.itemName}":`, {
                    menuItemDate: menuItemDate,
                    requestedDate: requestedDate
                });
                unavailableItems.push({
                    itemName: orderItem.itemName,
                    requestedCount: orderItem.count,
                    availableCount: 0,
                    reason: `Item available on ${menuItemDate} but requested for ${requestedDate}`
                });
                allItemsAvailable = false;
                continue;
            }

            // Calculate available quantity
            const quantityBooked = menuItem.quantityBooked || 0;
            const servesTo = menuItem.servesTo || 0;
            const quantityAvailable = servesTo - quantityBooked;
            const actualAvailable = Math.max(0, quantityAvailable);

            console.log(`📊 Validating "${menuItem.itemName}":`, {
                servesTo: servesTo,
                quantityBooked: quantityBooked,
                available: actualAvailable,
                requested: orderItem.count,
                date: menuItemDate
            });

            if (orderItem.count > actualAvailable) {
                unavailableItems.push({
                    itemName: menuItem.itemName,
                    requestedCount: orderItem.count,
                    availableCount: actualAvailable,
                    reason: 'Insufficient quantity'
                });
                allItemsAvailable = false;
            }
        }

        const result = {
            valid: allItemsAvailable,
            message: allItemsAvailable ? 'Order validated successfully' : 'Some items are not available',
            unavailableItems: unavailableItems,
            debug: {
                requestedDate: clientDayStartTime,
                kitchenId: orderData.kitchenId
            }
        };

        console.log('✅ Validation Result:', result);
        return result;

    } catch (error) {
        console.error('❌ Error validating apartment food order:', error);
        return {
            valid: false,
            message: 'Error validating order - ' + error.message,
            unavailableItems: [],
            error: error.message
        };
    }
};


const deleteSingleMenuItem = async (menuId, itemId) => {
    try {
        console.log('🔧 SERVICE: Processing single item delete request', {
            menuId,
            itemId
        });

        // Validate input
        if (!menuId || !itemId) {
            throw new Error('Menu ID and Item ID are required');
        }

        // Validate itemId format
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            throw new Error(`Invalid item ID: ${itemId}`);
        }

        const result = await apartmentMenuDao.deleteSingleMenuItem(menuId, itemId);

        console.log('✅ Single item delete operation completed successfully');
        return {
            success: true,
            message: 'Menu item deleted successfully',
            deletedItemId: itemId,
            menuId: menuId,
            remainingItemCount: result.remainingItemCount
        };
    } catch (error) {
        console.error('❌ Error in deleteSingleMenuItem service:', error);
        throw error;
    }
};

const cleanupPastMenuItems = async (kitchenId = null) => {
    try {
        console.log('🧹 SERVICE: Starting cleanup of past menu items...');
        
        if (kitchenId) {
            console.log(`🎯 Targeting specific kitchen: ${kitchenId}`);
        } else {
            console.log('🌍 Processing all kitchens');
        }
        
        const result = await apartmentMenuDao.cleanupPastMenuItems(kitchenId);
        
        console.log('✅ SERVICE: Cleanup completed successfully');
        return result;
        
    } catch (error) {
        console.error('❌ Error in cleanup service:', error);
        throw error;
    }
};

const getKitchensWithMenuList = async (kitchenIds) => { try {
      console.log('🎯 KitchenMenuService.getKitchensWithMenuList called');
      
      // Validate input
      if (!Array.isArray(kitchenIds)) {
        throw new Error('kitchenIds must be an array');
      }

      if (kitchenIds.length === 0) {
        return [];
      }

      console.log('📊 Service input:', {
        totalKitchenIds: kitchenIds.length,
        sampleIds: kitchenIds.slice(0, 3)
      });

      // Validate and filter kitchen IDs
      const validKitchenIds = validateKitchenIds(kitchenIds);
      
      if (validKitchenIds.length === 0) {
        console.log('⚠️ No valid kitchen IDs provided');
        return [];
      }

      console.log('✅ Valid kitchen IDs:', validKitchenIds.length);

      // Get data from DAO layer
      const kitchens = await apartmentMenuDao.getKitchensWithMenus(validKitchenIds);
      
      console.log('📊 DAO result:', {
        kitchensFound: kitchens.length
      });

      // Format the response
      const formattedKitchens = formatKitchensResponse(kitchens);
      
      console.log('✅ Service completed successfully');
      return formattedKitchens;

    } catch (error) {
      console.error('❌ Service error in getKitchensWithMenuList:', error);
      throw error;
    }
  }
// In apartmentMenu.service.js - Fix the validateKitchenIds function

const validateKitchenIds = (kitchenIds) => {
  console.log('🔍 Validating kitchen IDs:', kitchenIds);
  
  // Filter and validate the IDs
  const validIds = kitchenIds.filter(id => {
    if (!id) {
      console.warn('⚠️ Empty kitchen ID found, skipping');
      return false;
    }
    
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) {
      console.warn(`⚠️ Invalid kitchen ID format: ${id}`);
    }
    return isValid;
  });
  
  console.log(`✅ Valid IDs: ${validIds.length} out of ${kitchenIds.length}`);
  
  // Convert to ObjectId
  return validIds.map(id => new mongoose.Types.ObjectId(id));
}
// In apartmentMenu.service.js - Fix formatKitchensResponse function

const formatKitchensResponse = (kitchens) => { 
    console.log('🔧 Formatting kitchens response');
    console.log('📊 Input kitchens:', kitchens);
    
    // Filter out null/undefined kitchens
    const validKitchens = kitchens.filter(kitchen => {
        if (!kitchen || !kitchen._id) {
            console.warn('⚠️ Skipping null or invalid kitchen:', kitchen);
            return false;
        }
        return true;
    });
    
    console.log(`✅ Valid kitchens: ${validKitchens.length} out of ${kitchens.length}`);
    
    return validKitchens.map(kitchen => {
        // Filter active meal timings
        const activeMealTiming = (kitchen.mealTiming || [])
            .filter(timing => timing && timing.isActive !== false)
            .map(timing => ({
                mealType: timing.mealType || 'Unknown',
                acceptOrderFrom: timing.acceptOrderFrom,
                acceptOrderTill: timing.acceptOrderTill,
                cutoffTime: timing.cutoffTime,
                daysOfWeek: timing.daysOfWeek || [],
                isActive: true
            }));

        // Format menu items - safely handle null/undefined
        const menuList = ((kitchen.menuItems || kitchen.menuList) || []).map(item => {
            if (!item || !item._id) {
                console.warn('⚠️ Skipping invalid menu item in kitchen:', kitchen._id);
                return null;
            }
            
            return {
                itemId: item._id,
                itemName: item.itemName || 'Unknown Item',
                itemPrice: item.itemPrice || 0,
                imageUrl: item.imageUrl || null,
                itemType: item.itemType || 'Veg',
                mealType: item.mealType || 'Lunch',
                itemServingDate: item.itemServingDate || new Date(),
                quantityAvailable: item.quantityAvailable || 0,
                servesTo: item.servesTo || 0,
                quantityBooked: item.quantityBooked || 0,
                spicyLevel: item.spicyLevel,
                itemDescription: item.itemDescription || '',
                itemFlavour: item.itemFlavour,
                tasteOfRegion: item.tasteOfRegion,
                preparationTime: item.preparationTime
            };
        }).filter(item => item !== null); // Remove any null items

        return {
            kitchenId: kitchen._id,
            kitchenPartnerName: kitchen.kitchenPartnerName || 'Unknown',
            kitchenName: kitchen.kitchenName || 'Unknown Kitchen',
            imageUrl: kitchen.imageUrl || null,
            rating: kitchen.rating || 0,
            mealTiming: activeMealTiming,
            menuList: menuList,
            stats: {
                totalMenuItems: menuList.length,
                hasActiveMenu: menuList.length > 0,
                kitchenStatus: kitchen.kitchenOpened ? 'open' : 'closed'
            }
        };
    });
}
const clearAllKitchenMenuItems = async (kitchenId) => {
    try {
        console.log('🔧 SERVICE: Clearing all menu items for kitchen:', kitchenId);
        
        // Validate input
        if (!kitchenId) {
            throw new Error('Kitchen ID is required');
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(kitchenId)) {
            throw new Error(`Invalid kitchen ID format: ${kitchenId}`);
        }

        // Call DAO to clear items
        const result = await apartmentMenuDao.clearAllKitchenMenuItems(kitchenId);
        
        console.log('✅ SERVICE: Menu items cleared successfully');
        return result;
        
    } catch (error) {
        console.error('❌ Error in clearAllKitchenMenuItems service:', error);
        throw error;
    }
};

module.exports = {
    getApartmentMenu,
    getFutureApartmentMenus,
    getAllApartmentMenus,
    saveApartmentMenu,
    updateApartmentMenu,
    updateKitchenInfo,
    searchApartmentMenu,
    updateQuantityAvailable,
    updateQuantityBooked,
    validateApartmentFoodOrder,
    addToApartmentMenu,
    deleteSingleMenuItem,   
    cleanupPastMenuItems,  // ✅ ADD THIS LINE
 getKitchensWithMenuList   ,
 clearAllKitchenMenuItems,
 getApartmentBulkMenu
}