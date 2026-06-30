import { mockDatabase } from '../data/mockDatabase';
import { faqDatabase } from '../data/faqDb';
import { menuDatabase } from '../data/menuDb';

export const agentTools = {
  // 1. Booking Tools
  checkRoomAvailability: (roomType, checkIn, checkOut) => {
    mockDatabase.addLog({
      agent: "Booking",
      action: "Tool Call",
      details: `Called checkRoomAvailability(roomType: "${roomType}", checkIn: "${checkIn}", checkOut: "${checkOut}")`
    });

    // Check if dates are logically valid
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        success: false,
        result: "Invalid date format.",
        log: "Tool rejected call: checkIn or checkOut date is unparseable."
      };
    }
    
    if (start >= end) {
      return {
        success: false,
        result: "Check-out date must be after check-in date.",
        log: "Tool rejected call: checkOut date is before checkIn date."
      };
    }

    // Dynamic mock availability based on dates
    // Just simulate that Suites are unavailable on holiday dates (e.g. Dec 24-25) or standard check:
    const isHoliday = checkIn.includes("-12-24") || checkIn.includes("-12-25");
    if (roomType.toLowerCase().includes("suite") && isHoliday) {
      return {
        success: false,
        result: "Luxury Suite is sold out for the selected dates.",
        log: "Tool executed: Room unavailable for selected dates."
      };
    }

    return {
      success: true,
      result: "Room is available.",
      log: `Tool executed: Confirmed "${roomType}" is available from ${checkIn} to ${checkOut}.`
    };
  },

  calculateBookingCost: (roomType, nights, guests) => {
    mockDatabase.addLog({
      agent: "Booking",
      action: "Tool Call",
      details: `Called calculateBookingCost(roomType: "${roomType}", nights: ${nights}, guests: ${guests})`
    });

    let pricePerNight = 150;
    const type = roomType.toLowerCase();
    if (type.includes("deluxe")) pricePerNight = 250;
    else if (type.includes("suite") || type.includes("luxury")) pricePerNight = 450;

    // Additional guests fee: +$25/night for guests beyond 2
    const extraGuests = Math.max(0, guests - 2);
    const extraFee = extraGuests * 25;

    const baseCost = pricePerNight * nights;
    const extraCost = extraFee * nights;
    const totalPrice = baseCost + extraCost;

    return {
      success: true,
      result: {
        pricePerNight,
        nights,
        baseCost,
        extraCost,
        totalPrice
      },
      log: `Tool executed: Calculated total cost for ${nights} nights, ${guests} guests in ${roomType}: $${totalPrice}.`
    };
  },

  createBookingRecord: (bookingDetails) => {
    mockDatabase.addLog({
      agent: "Booking",
      action: "Tool Call",
      details: `Called createBookingRecord(name: "${bookingDetails.name}", roomType: "${bookingDetails.roomType}", checkIn: "${bookingDetails.checkIn}")`
    });

    const newBooking = mockDatabase.saveBooking({
      name: bookingDetails.name,
      phone: bookingDetails.phone,
      roomType: bookingDetails.roomType,
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      guests: parseInt(bookingDetails.guests) || 1,
      totalPrice: bookingDetails.totalPrice,
      status: "Confirmed"
    });

    return {
      success: true,
      result: newBooking,
      log: `Tool executed: Successfully saved booking record ${newBooking.id} in database.`
    };
  },

  // 2. Food Ordering Tools
  getMenu: () => {
    mockDatabase.addLog({
      agent: "Food",
      action: "Tool Call",
      details: "Called getMenu()"
    });

    return {
      success: true,
      result: menuDatabase,
      log: "Tool executed: Retrieved restaurant menu database."
    };
  },

  calculateFoodBill: (items) => {
    mockDatabase.addLog({
      agent: "Food",
      action: "Tool Call",
      details: `Called calculateFoodBill(items: ${JSON.stringify(items)})`
    });

    if (!items || items.length === 0) {
      return {
        success: false,
        result: "No items selected.",
        log: "Tool rejected call: Cart is empty."
      };
    }

    let subtotal = 0;
    const billItems = items.map(cartItem => {
      const dbItem = menuDatabase.find(m => m.id === cartItem.itemId || m.name.toLowerCase() === cartItem.name.toLowerCase());
      if (!dbItem) {
        throw new Error(`Menu item not found: ${cartItem.name}`);
      }
      const itemCost = dbItem.price * cartItem.quantity;
      subtotal += itemCost;
      return {
        itemId: dbItem.id,
        name: dbItem.name,
        quantity: cartItem.quantity,
        price: dbItem.price
      };
    });

    const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
    const deliveryFee = 5; // Flat room delivery fee
    const totalPrice = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

    return {
      success: true,
      result: {
        items: billItems,
        subtotal,
        tax,
        deliveryFee,
        totalPrice
      },
      log: `Tool executed: Food bill summary computed. Total: $${totalPrice.toFixed(2)}.`
    };
  },

  createFoodOrderRecord: (orderDetails) => {
    mockDatabase.addLog({
      agent: "Food",
      action: "Tool Call",
      details: `Called createFoodOrderRecord(name: "${orderDetails.name}", roomNumber: "${orderDetails.roomNumber}")`
    });

    const newOrder = mockDatabase.saveOrder({
      name: orderDetails.name,
      phone: orderDetails.phone,
      roomNumber: orderDetails.roomNumber,
      deliveryType: orderDetails.deliveryType || "room",
      items: orderDetails.items,
      subtotal: orderDetails.subtotal,
      tax: orderDetails.tax,
      deliveryFee: orderDetails.deliveryFee,
      totalPrice: orderDetails.totalPrice,
      status: "Pending"
    });

    return {
      success: true,
      result: newOrder,
      log: `Tool executed: Saved food order record ${newOrder.id} in database.`
    };
  },

  // 3. FAQ Tools
  searchFAQDatabase: (query) => {
    mockDatabase.addLog({
      agent: "FAQ",
      action: "Tool Call",
      details: `Called searchFAQDatabase(query: "${query}")`
    });

    const searchTokens = query.toLowerCase().split(/\s+/);
    let bestMatch = null;
    let maxMatches = 0;

    faqDatabase.forEach(faq => {
      let matches = 0;
      faq.keywords.forEach(keyword => {
        if (searchTokens.some(token => token.includes(keyword) || keyword.includes(token))) {
          matches++;
        }
      });

      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = faq;
      }
    });

    if (bestMatch && maxMatches > 0) {
      return {
        success: true,
        result: bestMatch,
        log: `Tool executed: Found matching FAQ record "${bestMatch.id}" (Matches: ${maxMatches}).`
      };
    }

    return {
      success: false,
      result: "No direct match found in FAQ knowledge base.",
      log: "Tool executed: No relevant FAQ entries matched query keywords."
    };
  },

  // 4. Analytics Tools
  generateAnalyticsReport: () => {
    mockDatabase.addLog({
      agent: "Admin Analytics",
      action: "Tool Call",
      details: "Called generateAnalyticsReport()"
    });

    const stats = mockDatabase.getDatabaseStats();
    
    // Generate AI recommendations based on metrics
    const recommendations = [];
    if (stats.occupancyRate < 40) {
      recommendations.push("Current room occupancy is low. Recommend creating a 'Weekday Escape' package at 20% discount to boost mid-week occupancy.");
    } else if (stats.occupancyRate > 70) {
      recommendations.push("Hotel occupancy is high. Recommend implementing a dynamic price increase of 10% for upcoming peak weekends.");
    }

    // Food trend recommendations
    const topFood = stats.popularFood[0];
    if (topFood) {
      recommendations.push(`'${topFood.name}' is highly popular. Recommend creating a combo deal (e.g. pairing it with Napa Sauvignon at 15% discount) to drive food sales.`);
    }

    recommendations.push("Most dining orders originate from rooms between 7 PM and 9 PM. Recommend scheduling kitchen staff peak shifts during this block to optimize response time.");

    return {
      success: true,
      result: {
        stats,
        recommendations
      },
      log: "Tool executed: Compiled business KPIs and agent recommendations."
    };
  }
};
