const ApartmentMenu = require('../model/apartmentMenu.model');
const KitchenPartner = require('../model/kitchenPartner.model');
const { getTodayStartTime } = require('../util/date-util');
const mongoose = require('mongoose');

const getAllKitchenApartmentMenu = async () => {
    const apartmentMenu = await ApartmentMenu.find({}, { kitchenId: 1 });
    return apartmentMenu;
}
const getFutureApartmentMenus = async (kitchenId, daysAhead = 30) => {
    try {
        console.log('🔍 SERVICE CALLED WITH daysAhead:', daysAhead);
        
        // Get TOMORROW's date (exclude today)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Start from tomorrow
        
        const startDateStr = tomorrow.toISOString().split('T')[0];
        
        // Calculate end date
        const endDate = new Date(tomorrow);
        endDate.setDate(endDate.getDate() + (daysAhead - 1));
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log('📅 FILTERING FUTURE ITEMS (Excluding Today):');
        console.log('   From:', startDateStr, '(Tomorrow)');
        console.log('   To:', endDateStr, `(Next ${daysAhead} days)`);
        console.log('   Total future days included:', daysAhead);
        
        const menu = await ApartmentMenu.findOne({ 
            kitchenId: mongoose.Types.ObjectId(kitchenId) 
        });

        if (!menu) return {};

        let includedCount = 0;
        let excludedCount = 0;

        const filteredItems = (menu.itemList || []).filter(item => {
            if (!item.itemServingDate) {
                excludedCount++;
                return false;
            }
            
            const itemDate = new Date(item.itemServingDate);
            const itemDateStr = itemDate.toISOString().split('T')[0];
            
            // Changed: Start from tomorrow, not today
            const isFuture = itemDateStr >= startDateStr;
            const isWithinRange = itemDateStr <= endDateStr;
            const isIncluded = isFuture && isWithinRange;
            
            if (isIncluded) {
                includedCount++;
                console.log(`   ✅ INCLUDED: ${item.itemName} - ${itemDateStr}`);
            } else {
                excludedCount++;
                console.log(`   ❌ EXCLUDED: ${item.itemName} - ${itemDateStr} (Outside range ${startDateStr} to ${endDateStr})`);
            }
            
            return isIncluded;
        });

        console.log(`📊 FINAL RESULT: ${includedCount} included, ${excludedCount} excluded`);
        
        return {
            ...menu.toObject(),
            itemList: filteredItems
        };
    } catch (error) {
        console.error('❌ Error:', error);
        return {};
    }
};

const getApartmentMenu = async (kitchenId, clientDate) => {
    try {
        // Validate input clientDate
        if (!clientDate) {
            console.error('❌ clientDate is required but not provided');
            return {};
        }

        const targetDate = new Date(clientDate);
        
        // Validate the input date
        if (isNaN(targetDate.getTime())) {
            console.error('❌ Invalid clientDate provided:', clientDate);
            return {};
        }
        
        const targetDateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const menu = await ApartmentMenu.findOne({ 
            kitchenId: mongoose.Types.ObjectId(kitchenId) 
        });

        if (!menu) {
            console.log('⚠️ No menu found for kitchen:', kitchenId);
            return {};
        }

        // Compare only the date part (ignore time)
        const filteredItems = (menu.itemList || []).filter(item => {
            if (!item.itemServingDate) {
                return false;
            }
            
            try {
                const itemDateObj = new Date(item.itemServingDate);
                if (isNaN(itemDateObj.getTime())) {
                    console.log('⚠️ Invalid date for item:', item.itemName || 'Unknown');
                    return false;
                }
                
                const itemDate = itemDateObj.toISOString().split('T')[0];
                return itemDate === targetDateString;
            } catch (error) {
                console.error('❌ Error parsing date:', error);
                return false;
            }
        });

        console.log(`📊 Date filtering: ${filteredItems.length} items match date ${targetDateString}`);

        return {
            ...menu.toObject(),
            itemList: filteredItems
        };

    } catch (error) {
        console.error('❌ Error in getApartmentMenu:', error);
        return {};
    }
};

const getAllApartmentMenus = async (kitchenId) => {
    try {
        const menu = await ApartmentMenu.findOne({ 
            kitchenId: mongoose.Types.ObjectId(kitchenId) 
        });

        if (!menu) return {};

        // Return all items without date filtering
        console.log(`📊 All menus: ${menu.itemList.length} total items for kitchen ${kitchenId}`);

        return menu.toObject();

    } catch (error) {
        console.error('Error:', error);
        return {};
    }
};


const saveApartmentMenu = async (apartmentMenu) => {
    try {
        // Check if kitchen menu already exists
        const existingMenu = await ApartmentMenu.findOne({ kitchenId: apartmentMenu.kitchenId });
        
        if (existingMenu && existingMenu._id) {
            // ✅ KITCHEN EXISTS - JUST PUSH NEW ITEMS TO EXISTING ITEMLIST
            const newItemsWithIds = (apartmentMenu.itemList || []).map(item => ({
                ...item,
                _id: new mongoose.Types.ObjectId(), // Generate new ID for each item
                quantityAvailable: (item.servesTo || 0) - (item.quantityBooked || 0)
            }));

            const updatedMenu = await ApartmentMenu.findOneAndUpdate(
                { kitchenId: apartmentMenu.kitchenId },
                { 
                    $push: { 
                        itemList: { 
                            $each: newItemsWithIds
                        } 
                    },
                    $set: {
                        kitchenName: apartmentMenu.kitchenName || existingMenu.kitchenName,
                        kitchenOpened: apartmentMenu.kitchenOpened !== undefined ? apartmentMenu.kitchenOpened : existingMenu.kitchenOpened,
                        menuCreatedOn: new Date(),
                        // Only update these if provided
                        ...(apartmentMenu.clusters && { clusters: apartmentMenu.clusters }),
                        ...(apartmentMenu.geolocation && { 
                            location: { 
                                type: 'Point', 
                                coordinates: [apartmentMenu.geolocation.lng, apartmentMenu.geolocation.lat] 
                            }
                        }),
                        ...(apartmentMenu.bulkInfo && { bulkInfo: apartmentMenu.bulkInfo }),
                        ...(apartmentMenu.bulkItemList && { bulkItemList: apartmentMenu.bulkItemList })
                    }
                },
                { new: true }
            );
            
            console.log('✅ Added new items to existing kitchen menu');
            return updatedMenu;
            
        } else {
            // ✅ KITCHEN DOESN'T EXIST - CREATE FULL NEW MENU
            const calculatedItemList = apartmentMenu.itemList.map(item => {
                const quantityBooked = item.quantityBooked || 0;
                const quantityAvailable = item.servesTo - quantityBooked;
                
                return {
                    ...item,
                    _id: new mongoose.Types.ObjectId(), // Generate IDs for new items
                    quantityAvailable: quantityAvailable >= 0 ? quantityAvailable : 0,
                    quantityBooked: quantityBooked >= 0 ? quantityBooked : 0
                };
            });

            const nApartmentMenu = new ApartmentMenu({
                kitchenName: apartmentMenu.kitchenName,
                kitchenId: apartmentMenu.kitchenId,
                kitchenOpened: apartmentMenu.kitchenOpened !== undefined ? apartmentMenu.kitchenOpened : true,
                clusters: apartmentMenu.clusters || [],
                menuCreatedOn: new Date(apartmentMenu.menuCreatedOn || new Date()),
                itemList: calculatedItemList,
                bulkInfo: apartmentMenu.bulkInfo,
                bulkItemList: apartmentMenu.bulkItemList
            });

            if (apartmentMenu.geolocation) {
                let geolocation = apartmentMenu.geolocation;
                if (geolocation.lng && geolocation.lat) {
                    nApartmentMenu.location = { 
                        type: 'Point', 
                        coordinates: [geolocation.lng, geolocation.lat] 
                    };
                }
            }

            const isInserted = await nApartmentMenu.save();
            console.log('✅ Created new kitchen menu with all items');
            return isInserted;
        }
    } catch (error) {
        console.error('❌ Error saving apartment menu:', error);
        throw error;
    }
}

const updateApartmentMenu = async (kitchenId, updateData) => {
    try {
        const updateFields = {};
        
        // Update basic kitchen info if provided
        if (updateData.kitchenOpened !== undefined) {
            updateFields.kitchenOpened = updateData.kitchenOpened;
        }
        if (updateData.clusters) {
            updateFields.clusters = updateData.clusters;
        }
        if (updateData.geolocation) {
            let geolocation = updateData.geolocation;
            if (geolocation.lng && geolocation.lat) {
                updateFields.location = { 
                    type: 'Point', 
                    coordinates: [geolocation.lng, geolocation.lat] 
                };
            }
        }
        // Bulk Properties
        if (updateData.bulkInfo) {
            updateFields.bulkInfo = updateData.bulkInfo;
        }
        if (updateData.bulkItemList) {
            updateFields.bulkItemList = updateData.bulkItemList;
        }
        // ✅ UPDATING INDIVIDUAL ITEMS - ONLY ID REQUIRED
        if (updateData.updatedItems && updateData.updatedItems.length > 0) {
            const bulkOperations = updateData.updatedItems.map(item => {
                if (!item._id) {
                    throw new Error('Item _id is required for updates');
                }
                
                // Auto-calculate quantityAvailable
                const quantityBooked = item.quantityBooked || 0;
                const quantityAvailable = (item.servesTo || 0) - quantityBooked;
                
                // Build update object dynamically - only include provided fields
                const itemUpdate = {};
                if (item.itemName !== undefined) itemUpdate['itemList.$.itemName'] = item.itemName;
                if (item.itemPrice !== undefined) itemUpdate['itemList.$.itemPrice'] = item.itemPrice;
                if (item.servesTo !== undefined) itemUpdate['itemList.$.servesTo'] = item.servesTo;
                if (item.quantityBooked !== undefined) itemUpdate['itemList.$.quantityBooked'] = quantityBooked;
                if (item.mealType !== undefined) itemUpdate['itemList.$.mealType'] = item.mealType;
                if (item.tasteOfRegion !== undefined) itemUpdate['itemList.$.tasteOfRegion'] = item.tasteOfRegion;
                if (item.itemServingDate !== undefined) itemUpdate['itemList.$.itemServingDate'] = item.itemServingDate;
                if (item.spicyLevel !== undefined) itemUpdate['itemList.$.spicyLevel'] = item.spicyLevel;
                if (item.itemDescription !== undefined) itemUpdate['itemList.$.itemDescription'] = item.itemDescription;
                if (item.deliveryEnabled !== undefined) itemUpdate['itemList.$.deliveryEnabled'] = item.deliveryEnabled;
                // Always update calculated fields
                itemUpdate['itemList.$.quantityAvailable'] = quantityAvailable;
                
                
                return {
                    updateOne: {
                        filter: { 
                            kitchenId: mongoose.Types.ObjectId(kitchenId),
                            'itemList._id': mongoose.Types.ObjectId(item._id)
                        },
                        update: {
                            $set: itemUpdate
                        }
                    }
                };
            });
            
            // Execute bulk operations
            await ApartmentMenu.bulkWrite(bulkOperations);
        }
        
        // ✅ ADDING NEW ITEMS (if provided)
        if (updateData.newItems && updateData.newItems.length > 0) {
            const newItemsWithIds = updateData.newItems.map(item => ({
                ...item,
                _id: new mongoose.Types.ObjectId(),
                quantityAvailable: (item.servesTo || 0) - (item.quantityBooked || 0)
            }));

            await ApartmentMenu.findOneAndUpdate(
                { kitchenId: mongoose.Types.ObjectId(kitchenId) },
                { 
                    $push: { 
                        itemList: { 
                            $each: newItemsWithIds
                        } 
                    }
                }
            );
        }
        
        // ✅ DELETING ITEMS (if provided)
        if (updateData.deletedItems && updateData.deletedItems.length > 0) {
            await ApartmentMenu.findOneAndUpdate(
                { kitchenId: mongoose.Types.ObjectId(kitchenId) },
                { 
                    $pull: { 
                        itemList: { 
                            _id: { $in: updateData.deletedItems.map(id => mongoose.Types.ObjectId(id)) }
                        } 
                    } 
                }

            );
        }
        
        // Update other fields if provided
        if (Object.keys(updateFields).length > 0) {
            await ApartmentMenu.findOneAndUpdate(
                { kitchenId: mongoose.Types.ObjectId(kitchenId) },
                { $set: updateFields },
                { new: true }
            );
        }
        
        // Return the updated menu
        let menu =await ApartmentMenu.findOne({ kitchenId: mongoose.Types.ObjectId(kitchenId) });
        return menu;
    } catch (error) {
        console.error('❌ Error updating apartment menu:', error);
        throw error;
    }
};

const updateKitchenInfo = async (kitchen) => {
    const KitchenInfo = {};
    KitchenInfo.kitchenName = kitchen.kitchenName;
    KitchenInfo.kitchenOpened = kitchen.kitchenOpened;
    KitchenInfo.clusters = kitchen.clusters;
    if (kitchen.geolocation) {
        let geolocation = kitchen.geolocation;
        if (geolocation.lng && geolocation.lat) {
            KitchenInfo.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
        } else {
            geolocation = JSON.parse(kitchen.geolocation);
            if (geolocation.lng && geolocation.lat) {
                KitchenInfo.location = { type: 'Point', coordinates: [geolocation.lng, geolocation.lat] };
            }
        }
    }
    await ApartmentMenu.findOneAndUpdate(
        { kitchenId: kitchen._id },
        { $set: KitchenInfo }
    );
}

// ✅ FIXED: updateQuantityAvailable - matches by _id instead of itemName
const updateQuantityAvailable = async (kitchenId, itemList) => {
    const apartmentMenu = await ApartmentMenu.findOne({ kitchenId });
    if (apartmentMenu && apartmentMenu._id) {
        const updatedItemList = [...apartmentMenu.itemList].map(item => {
            itemList.forEach(element => {
                // ✅ Match by _id to target the exact item (date + mealType specific)
                if (element._id && item._id.toString() === element._id.toString()) {
                    item.quantityAvailable -= element.count;
                    item.quantityBooked -= element.count;
                    item.quantityAvailable = item.quantityAvailable >= 0 ? item.quantityAvailable : 0;
                    item.quantityBooked = item.quantityBooked >= 0 ? item.quantityBooked : 0;
                    
                    console.log(`✅ Updated quantityAvailable for ${item.itemName}:`, {
                        itemServingDate: item.itemServingDate,
                        mealType: item.mealType,
                        _id: item._id.toString(),
                        quantityAvailable: item.quantityAvailable,
                        quantityBooked: item.quantityBooked
                    });
                }
            });
            return item;
        });
        apartmentMenu.itemList = updatedItemList;
        const update = await ApartmentMenu.findOneAndUpdate(
            { _id: apartmentMenu._id }, 
            { $set: apartmentMenu }, 
            { new: true }
        );
        return update;
    } else {
        return apartmentMenu;
    }
}


const searchApartmentMenu = async (text, clientDate, clusterList) => {
    const regexText = new RegExp(text, 'i');
    let today = getTodayStartTime();
    return await ApartmentMenu.aggregate([
        {
            $match: {
                clusters: { $in: [...clusterList] },
                kitchenOpened: true,
                menuCreatedOn: { $gte: today },
                $or: [
                    { kitchenName: regexText },
                    { 'itemList.itemName': regexText },
                    { 'itemList.aliasNames': regexText },
                    { 'itemList.itemRegion': regexText },
                    { 'itemList.mealType': regexText }
                ]
            }
        },
        { $unwind: "$itemList" },
        {
            $match: {
                $or: [
                    { kitchenName: regexText },
                    { 'itemList.itemName': regexText },
                    { 'itemList.aliasNames': regexText },
                    { 'itemList.itemRegion': regexText },
                    { 'itemList.mealType': regexText }
                ]
            }
        },
        {
            $group: {
                "_id": "$_id",
                "kitchenName": { $first: "$kitchenName" },
                "kitchenId": { $first: "$kitchenId" },
                "kitchenOpened": { $first: "$kitchenOpened" },
                "itemList": { $push: "$itemList" }
            }
        }
    ]);
}

// In apartmentMenu.dao.js - make sure this returns the full updated menu
// ✅ FIXED: updateQuantityBooked - matches by _id instead of itemName
const updateQuantityBooked = async (kitchenId, itemList, decreaseCount) => {
    const apartmentMenu = await ApartmentMenu.findOne({ kitchenId });
    if (apartmentMenu && apartmentMenu._id) {
        const updatedItemList = [...apartmentMenu.itemList].map(item => {
            itemList.forEach(element => {
                // ✅ Match by _id to target the exact item (date + mealType specific)
                if (element._id && item._id.toString() === element._id.toString()) {
                    if (!item.quantityBooked) {
                        item.quantityBooked = 0;
                    }
                    if (decreaseCount) {
                        item.quantityBooked -= element.count;
                    } else {
                        item.quantityBooked += element.count;
                    }
                    item.quantityBooked = item.quantityBooked >= 0 ? item.quantityBooked : 0;
                    item.quantityBooked = item.quantityBooked <= item.servesTo ? item.quantityBooked : item.servesTo;
                    
                    // Auto-recalculate quantityAvailable
                    item.quantityAvailable = item.servesTo - item.quantityBooked;
                    item.quantityAvailable = item.quantityAvailable >= 0 ? item.quantityAvailable : 0;
                    
                    console.log(`✅ Updated quantityBooked for ${item.itemName}:`, {
                        itemServingDate: item.itemServingDate,
                        mealType: item.mealType,
                        _id: item._id.toString(),
                        servesTo: item.servesTo,
                        quantityBooked: item.quantityBooked,
                        quantityAvailable: item.quantityAvailable,
                        operation: decreaseCount ? 'DECREASE' : 'INCREASE'
                    });
                }
            });
            return item;
        });
        apartmentMenu.itemList = updatedItemList;
        
        const update = await ApartmentMenu.findOneAndUpdate(
            { _id: apartmentMenu._id }, 
            { $set: apartmentMenu }, 
            { new: true }
        );
        
        console.log('📊 Returning updated menu with quantities');
        return update;
    } else {
        return apartmentMenu;
    }
}
const addToApartmentMenu = async (kitchenId, newItems) => {
    // Add new items to the existing menu
    const update = await ApartmentMenu.findOneAndUpdate(
        { kitchenId: mongoose.Types.ObjectId(kitchenId) },
        { 
            $push: { 
                itemList: { 
                    $each: newItems.map(item => ({
                        ...item,
                        _id: new mongoose.Types.ObjectId(), // Generate new ID
                        quantityAvailable: item.servesTo - (item.quantityBooked || 0)
                    }))
                } 
            },
            $set: { 
                menuCreatedOn: new Date() // Update menu timestamp
            }
        },
        { new: true }
    );
    
    return update;
};
const deleteSingleMenuItem = async (menuId, itemId) => {
    try {
        console.log('🗑️ DAO: Deleting single menu item:', {
            menuId,
            itemId
        });

        // Use $pull operator to remove the specific item from the itemList array
        const result = await ApartmentMenu.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(menuId) },
            { 
                $pull: { 
                    itemList: { 
                        _id: mongoose.Types.ObjectId(itemId)
                    } 
                },
                $set: { 
                    menuCreatedOn: new Date() // Update menu timestamp
                }
            },
            { new: true }
        );

        if (!result) {
            throw new Error('Menu not found');
        }

        console.log('✅ Single menu item deleted successfully:', {
            deletedItemId: itemId,
            remainingItems: result.itemList?.length || 0
        });

        return {
            success: true,
            deletedItemId: itemId,
            remainingItemCount: result.itemList?.length || 0,
            menu: result
        };
    } catch (error) {
        console.error('❌ Error in deleteSingleMenuItem:', error);
        throw error;
    }
};
const cleanupPastMenuItems = async (kitchenId = null) => {
    try {
        console.log('🧹 DAO: Starting cleanup of past menu items...');
        
        // Get current date at midnight (start of day)
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const currentDateString = currentDate.toISOString().split('T')[0];
        
        console.log('📅 Current date:', currentDateString);
        
        // Build query - specific kitchen or all kitchens
        const query = kitchenId 
            ? { kitchenId: mongoose.Types.ObjectId(kitchenId) }
            : {};
        
        // Find all matching menus
        const allMenus = await ApartmentMenu.find(query);
        console.log(`📊 Found ${allMenus.length} kitchens to process`);
        
        let totalDeleted = 0;
        let menusProcessed = 0;
        let deletedItemsDetails = [];
        
        // Process each kitchen menu
        for (const menu of allMenus) {
            const originalCount = menu.itemList?.length || 0;
            
            if (originalCount === 0) {
                console.log(`⚠️ Kitchen "${menu.kitchenName}" has no items, skipping...`);
                continue;
            }
            
            // Separate past items and future/current items
            const pastItems = [];
            const futureItems = [];
            
            menu.itemList.forEach(item => {
                if (!item.itemServingDate) {
                    futureItems.push(item); // Keep items without date
                    return;
                }
                
                const itemDate = new Date(item.itemServingDate);
                const itemDateString = itemDate.toISOString().split('T')[0];
                
                // Compare dates: past vs current/future
                if (itemDateString < currentDateString) {
                    // PAST ITEM - mark for deletion
                    pastItems.push({
                        itemName: item.itemName,
                        itemServingDate: itemDateString,
                        mealType: item.mealType,
                        kitchenName: menu.kitchenName,
                        _id: item._id
                    });
                    console.log(`   ❌ Marking for deletion: "${item.itemName}" - ${itemDateString} (${item.mealType || 'No meal type'}) from "${menu.kitchenName}"`);
                } else {
                    // CURRENT or FUTURE ITEM - keep it
                    futureItems.push(item);
                    console.log(`   ✅ Keeping: "${item.itemName}" - ${itemDateString} (${item.mealType || 'No meal type'})`);
                }
            });
            
            const deletedCount = pastItems.length;
            
            if (deletedCount > 0) {
                // Update menu - keep only future items
                await ApartmentMenu.findOneAndUpdate(
                    { _id: menu._id },
                    { 
                        $set: { 
                            itemList: futureItems,
                            menuCreatedOn: new Date()
                        } 
                    }
                );
                
                totalDeleted += deletedCount;
                menusProcessed++;
                deletedItemsDetails.push(...pastItems);
                
                console.log(`✅ Kitchen "${menu.kitchenName}": Deleted ${deletedCount} past items (${futureItems.length} items remaining)`);
            } else {
                console.log(`ℹ️ Kitchen "${menu.kitchenName}": No past items to delete (${originalCount} items all current/future)`);
            }
        }
        
        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('🎉 CLEANUP COMPLETE!');
        console.log(`📊 Total items deleted: ${totalDeleted}`);
        console.log(`🏪 Kitchens processed: ${menusProcessed}`);
        console.log(`📅 Cleanup date: ${currentDateString}`);
        console.log('═══════════════════════════════════════════');
        
        return {
            success: true,
            totalDeleted,
            menusProcessed,
            totalKitchensChecked: allMenus.length,
            currentDate: currentDateString,
            deletedItems: deletedItemsDetails,
            message: `Successfully deleted ${totalDeleted} past menu items from ${menusProcessed} kitchens`
        };
        
    } catch (error) {
        console.error('❌ Error in cleanupPastMenuItems DAO:', error);
        throw error;
    }
};
// In apartmentMenu.dao.js - Fix the aggregation pipeline

const getKitchensWithMenus = async (kitchenIds) => {
  try {
    console.log('🗄️ DAO: getKitchensWithMenus called');
    console.log('📊 Kitchen IDs received:', {
      count: kitchenIds.length,
      sample: kitchenIds.slice(0, 3),
      type: typeof kitchenIds[0]
    });
    
    // Validate that we have ObjectIds
    const isValidObjectId = kitchenIds.every(id => 
      id instanceof mongoose.Types.ObjectId || mongoose.Types.ObjectId.isValid(id)
    );
    
    if (!isValidObjectId) {
      console.error('❌ Error: kitchenIds must be valid ObjectIds');
      throw new Error('Invalid kitchen IDs format');
    }

    // Calculate date range for next 3 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(23, 59, 59, 999);

    console.log('📅 Date range for filtering:', {
      from: today.toISOString(),
      to: dayAfterTomorrow.toISOString()
    });

    // Execute aggregation pipeline
    const result = await KitchenPartner.aggregate([
      // Stage 1: Match requested kitchens
      {
        $match: {
          _id: { $in: kitchenIds },
          kitchenOpened: true,
          profileApproval: 'approved'
        }
      },
      
      // Stage 2: Lookup menu items for next 3 days
      {
        $lookup: {
          from: 'apartmentmenus',
          let: { kitchenId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$kitchenId', '$$kitchenId'] },
                    { $ne: ['$kitchenOpened', false] }
                  ]
                }
              }
            },
            { $unwind: '$itemList' },
            {
              $match: {
                'itemList.itemServingDate': {
                  $gte: today,
                  $lte: dayAfterTomorrow
                },
                'itemList.quantityAvailable': { $gt: 0 }
              }
            },
            {
              $project: {
                _id: 0,
                item: '$itemList'
              }
            }
          ],
          as: 'menuItemsRaw'
        }
      },
      
      // Stage 3: Unwind and project menu items
      {
        $unwind: {
          path: '$menuItemsRaw',
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Stage 4: Project kitchen details with formatted menu items
      {
        $project: {
          _id: 1,
          kitchenPartnerName: 1,
          kitchenName: 1,
          imageUrl: 1,
          rating: 1,
          mealTiming: 1,
          kitchenOpened: 1,
          apartmentInfo: 1,
          menuItems: {
            $cond: {
              if: { $eq: ['$menuItemsRaw', null] },
              then: [],
              else: ['$menuItemsRaw.item']
            }
          }
        }
      },
      
      // Stage 5: Group by kitchen
      {
        $group: {
          _id: '$_id',
          kitchenPartnerName: { $first: '$kitchenPartnerName' },
          kitchenName: { $first: '$kitchenName' },
          imageUrl: { $first: '$imageUrl' },
          rating: { $first: '$rating' },
          mealTiming: { $first: '$mealTiming' },
          kitchenOpened: { $first: '$kitchenOpened' },
          apartmentInfo: { $first: '$apartmentInfo' },
          menuItems: { $push: '$menuItems' }
        }
      },
      
      // Stage 6: Flatten menuItems array
      {
        $project: {
          _id: 1,
          kitchenPartnerName: 1,
          kitchenName: 1,
          imageUrl: 1,
          rating: 1,
          mealTiming: 1,
          kitchenOpened: 1,
          apartmentInfo: 1,
          menuItems: {
            $reduce: {
              input: '$menuItems',
              initialValue: [],
              in: { $concatArrays: ['$$value', '$$this'] }
            }
          }
        }
      },
      
      // Stage 7: Sort menu items by serving date
      {
        $addFields: {
          menuItems: {
            $sortArray: {
              input: '$menuItems',
              sortBy: { itemServingDate: 1 }
            }
          }
        }
      }
    ]);

    console.log(`✅ DAO: Retrieved ${result.length} kitchens with menus`);
    return result;

  } catch (error) {
    console.error('❌ DAO error in getKitchensWithMenus:', error);
    // Log more details about the error
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      kitchenIds: kitchenIds
    });
    throw error;
  }
}
const getApartmentBulkMenu = async (kitchenId) => {
    try {
        const menu = await ApartmentMenu.findOne({
            kitchenId: mongoose.Types.ObjectId(kitchenId)
        }, { bulkInfo: 1, bulkItemList: 1 });

        if (!menu) return {};

        return menu.toObject();

    } catch (error) {
        console.error('Error in getApartmentBulkMenu DAO:', error);
        return {};
    }
};
const clearAllKitchenMenuItems = async (kitchenId) => {
    try {
        console.log('🗑️ DAO: Clearing all menu items for kitchen:', {
            kitchenId,
            type: typeof kitchenId
        });

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(kitchenId)) {
            throw new Error(`Invalid kitchen ID: ${kitchenId}`);
        }

        // Convert to ObjectId
        const objectId = new mongoose.Types.ObjectId(kitchenId);
        
        // Find the kitchen menu first to check if it exists
        const existingMenu = await ApartmentMenu.findOne({ 
            kitchenId: objectId 
        });

        if (!existingMenu) {
            return {
                success: false,
                message: 'No menu found for this kitchen',
                itemsCleared: 0,
                kitchenId: kitchenId,
                error: 'MENU_NOT_FOUND'
            };
        }

        // Get count of items before clearing
        const itemsCount = existingMenu.itemList?.length || 0;
        
        if (itemsCount === 0) {
            return {
                success: true,
                message: 'Menu is already empty',
                itemsCleared: 0,
                kitchenId: kitchenId,
                kitchenName: existingMenu.kitchenName
            };
        }

        // Log the items being cleared (for audit)
        console.log('📋 Items to be cleared:', {
            kitchenId: kitchenId,
            kitchenName: existingMenu.kitchenName,
            totalItems: itemsCount,
            sampleItems: existingMenu.itemList.slice(0, 3).map(item => ({
                name: item.itemName,
                date: item.itemServingDate,
                mealType: item.mealType
            }))
        });

        // Clear all items by setting itemList to empty array
        const result = await ApartmentMenu.findOneAndUpdate(
            { kitchenId: objectId },
            { 
                $set: { 
                    itemList: [], // Empty array to clear all items
                    menuCreatedOn: new Date() // Update timestamp
                } 
            },
            { 
                new: true, // Return updated document
                runValidators: true 
            }
        );

        console.log('✅ DAO: Menu items cleared successfully:', {
            kitchenId: kitchenId,
            kitchenName: existingMenu.kitchenName,
            itemsCleared: itemsCount,
            operationTime: new Date().toISOString()
        });

        return {
            success: true,
            message: `Cleared ${itemsCount} menu items from ${existingMenu.kitchenName}`,
            itemsCleared: itemsCount,
            kitchenId: kitchenId,
            kitchenName: existingMenu.kitchenName,
            operation: 'clear_all_items',
            timestamp: new Date().toISOString(),
            stats: {
                before: itemsCount,
                after: 0
            }
        };
        
    } catch (error) {
        console.error('❌ Error in clearAllKitchenMenuItems DAO:', error);
        throw error;
    }
};


module.exports = {
    getAllKitchenApartmentMenu,
    getApartmentMenu,
    getFutureApartmentMenus,
    getAllApartmentMenus,
    saveApartmentMenu,
    updateKitchenInfo,
    updateApartmentMenu,
    searchApartmentMenu,
    updateQuantityAvailable,
    updateQuantityBooked,
    addToApartmentMenu,
    deleteSingleMenuItem,
    cleanupPastMenuItems,  // ✅ ADD THIS LINE
    getKitchensWithMenus,
    getApartmentBulkMenu,
    clearAllKitchenMenuItems

}