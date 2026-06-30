import { menuDatabase } from './menuDb';

const SEED_BOOKINGS = [
  {
    id: "B-8831",
    name: "Alice Smith",
    phone: "5550101890",
    roomType: "Standard Room",
    checkIn: "2026-06-25",
    checkOut: "2026-06-28",
    guests: 2,
    totalPrice: 450,
    status: "Completed",
    createdAt: "2026-06-24T10:15:30Z"
  },
  {
    id: "B-9204",
    name: "Bob Johnson",
    phone: "5550102123",
    roomType: "Deluxe Room",
    checkIn: "2026-06-28",
    checkOut: "2026-07-02",
    guests: 2,
    totalPrice: 1000,
    status: "Checked In",
    createdAt: "2026-06-27T14:32:00Z"
  },
  {
    id: "B-3012",
    name: "Charlie Brown",
    phone: "5550103456",
    roomType: "Luxury Suite",
    checkIn: "2026-06-29",
    checkOut: "2026-07-02",
    guests: 1,
    totalPrice: 1350,
    status: "Checked In",
    createdAt: "2026-06-28T09:12:15Z"
  },
  {
    id: "B-4992",
    name: "David Miller",
    phone: "5550104882",
    roomType: "Standard Room",
    checkIn: "2026-07-05",
    checkOut: "2026-07-10",
    guests: 1,
    totalPrice: 750,
    status: "Confirmed",
    createdAt: "2026-06-29T17:40:00Z"
  },
  {
    id: "B-1288",
    name: "Emma Watson",
    phone: "5550105991",
    roomType: "Deluxe Room",
    checkIn: "2026-06-15",
    checkOut: "2026-06-20",
    guests: 3,
    totalPrice: 1250,
    status: "Completed",
    createdAt: "2026-06-12T11:05:00Z"
  }
];

const SEED_ORDERS = [
  {
    id: "O-2041",
    name: "Bob Johnson",
    phone: "5550102123",
    roomNumber: "204",
    deliveryType: "room",
    items: [
      { itemId: "app2", name: "Garlic Butter Shrimp", quantity: 1, price: 15 },
      { itemId: "main1", name: "Filet Mignon", quantity: 1, price: 38 },
      { itemId: "des1", name: "Classic Tiramisu", quantity: 1, price: 9 }
    ],
    subtotal: 62,
    tax: 6.2,
    deliveryFee: 5,
    totalPrice: 73.2,
    status: "Delivered",
    createdAt: "2026-06-28T19:30:00Z"
  },
  {
    id: "O-3011",
    name: "Charlie Brown",
    phone: "5550103456",
    roomNumber: "301",
    deliveryType: "room",
    items: [
      { itemId: "main4", name: "Margherita Pizza", quantity: 2, price: 18 },
      { itemId: "drk4", name: "Perrier Sparkling Water", quantity: 1, price: 5 }
    ],
    subtotal: 41,
    tax: 4.1,
    deliveryFee: 5,
    totalPrice: 50.1,
    status: "Preparing",
    createdAt: "2026-06-30T21:45:00Z"
  },
  {
    id: "O-1051",
    name: "Frank Castle",
    phone: "5550109988",
    roomNumber: "105",
    deliveryType: "room",
    items: [
      { itemId: "app1", name: "Caesar Salad", quantity: 1, price: 12 },
      { itemId: "main3", name: "Truffle Mushroom Pasta", quantity: 1, price: 24 },
      { itemId: "drk2", name: "Local Craft IPA", quantity: 2, price: 8 }
    ],
    subtotal: 52,
    tax: 5.2,
    deliveryFee: 5,
    totalPrice: 62.2,
    status: "Pending",
    createdAt: "2026-06-30T22:30:00Z"
  },
  {
    id: "O-9002",
    name: "Grace Kelly",
    roomNumber: "128 Ocean Drive",
    deliveryType: "address",
    phone: "5550107766",
    items: [
      { itemId: "main1", name: "Filet Mignon", quantity: 2, price: 38 },
      { itemId: "drk1", name: "Napa Cabernet Sauvignon", quantity: 2, price: 14 }
    ],
    subtotal: 104,
    tax: 10.4,
    deliveryFee: 10,
    totalPrice: 124.4,
    status: "Delivered",
    createdAt: "2026-06-29T20:10:00Z"
  },
  {
    id: "O-2101",
    name: "Henry Cavill",
    roomNumber: "210",
    deliveryType: "room",
    phone: "5550108877",
    items: [
      { itemId: "des2", name: "Chocolate Lava Cake", quantity: 2, price: 10 },
      { itemId: "drk3", name: "Fresh Squeezed Orange Juice", quantity: 1, price: 6 }
    ],
    subtotal: 26,
    tax: 2.6,
    deliveryFee: 5,
    totalPrice: 33.6,
    status: "Delivered",
    createdAt: "2026-06-30T15:20:00Z"
  },
  {
    id: "O-1021",
    name: "Ian Somerhalder",
    roomNumber: "102",
    deliveryType: "room",
    phone: "5550104433",
    items: [
      { itemId: "app1", name: "Caesar Salad", quantity: 2, price: 12 }
    ],
    subtotal: 24,
    tax: 2.4,
    deliveryFee: 5,
    totalPrice: 31.4,
    status: "Cancelled",
    createdAt: "2026-06-27T18:15:00Z"
  },
  {
    id: "O-3031",
    name: "Julia Roberts",
    roomNumber: "303",
    deliveryType: "room",
    phone: "5550102211",
    items: [
      { itemId: "main4", name: "Margherita Pizza", quantity: 1, price: 18 },
      { itemId: "drk4", name: "Perrier Sparkling Water", quantity: 1, price: 5 }
    ],
    subtotal: 23,
    tax: 2.3,
    deliveryFee: 5,
    totalPrice: 30.3,
    status: "Delivered",
    createdAt: "2026-06-29T12:00:00Z"
  },
  {
    id: "O-2081",
    name: "Kevin Hart",
    roomNumber: "208",
    deliveryType: "room",
    phone: "5550105544",
    items: [
      { itemId: "app2", name: "Garlic Butter Shrimp", quantity: 2, price: 15 },
      { itemId: "des1", name: "Classic Tiramisu", quantity: 1, price: 9 }
    ],
    subtotal: 39,
    tax: 3.9,
    deliveryFee: 5,
    totalPrice: 47.9,
    status: "Pending",
    createdAt: "2026-06-30T22:50:00Z"
  }
];

const SEED_LOGS = [
  { timestamp: "2026-06-30T22:30:00Z", agent: "Intent", action: "Routing", details: "Message classified as FOOD_ORDERING. Customer Frank Castle in Room 105." },
  { timestamp: "2026-06-30T22:31:02Z", agent: "Food", action: "Tool Call", details: "Called calculate_food_bill. Subtotal: $52, Total: $62.20" },
  { timestamp: "2026-06-30T22:31:15Z", agent: "Food", action: "Database", details: "Saved Order O-1051. Status: Pending" },
  { timestamp: "2026-06-30T22:50:00Z", agent: "Intent", action: "Routing", details: "Message classified as FOOD_ORDERING. Customer Kevin Hart in Room 208." },
  { timestamp: "2026-06-30T22:50:45Z", agent: "Food", action: "Database", details: "Saved Order O-2081. Status: Pending" }
];

export const getDB = (key, seedData) => {
  const data = localStorage.getItem(`dizins_${key}`);
  if (!data) {
    localStorage.setItem(`dizins_${key}`, JSON.stringify(seedData));
    return seedData;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return seedData;
  }
};

export const saveDB = (key, data) => {
  localStorage.setItem(`dizins_${key}`, JSON.stringify(data));
};

export const mockDatabase = {
  // Bookings
  getBookings: () => getDB("bookings", SEED_BOOKINGS),
  
  saveBooking: (booking) => {
    const bookings = getDB("bookings", SEED_BOOKINGS);
    const newBooking = {
      ...booking,
      id: booking.id || `B-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()
    };
    bookings.push(newBooking);
    saveDB("bookings", bookings);
    
    // Add transaction log
    mockDatabase.addLog({
      agent: "Booking",
      action: "Database Write",
      details: `Saved Room Booking ${newBooking.id} for ${newBooking.name}. Total: $${newBooking.totalPrice}`
    });
    
    return newBooking;
  },

  updateBookingStatus: (id, status) => {
    const bookings = getDB("bookings", SEED_BOOKINGS);
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b);
    saveDB("bookings", updated);
    
    mockDatabase.addLog({
      agent: "System",
      action: "Database Update",
      details: `Updated Booking ${id} status to ${status}`
    });
    return updated;
  },

  // Food Orders
  getOrders: () => getDB("orders", SEED_ORDERS),
  
  saveOrder: (order) => {
    const orders = getDB("orders", SEED_ORDERS);
    const newOrder = {
      ...order,
      id: order.id || `O-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    saveDB("orders", orders);
    
    mockDatabase.addLog({
      agent: "Food",
      action: "Database Write",
      details: `Saved Food Order ${newOrder.id} for ${newOrder.name}. Total: $${newOrder.totalPrice.toFixed(2)}`
    });
    
    return newOrder;
  },

  updateOrderStatus: (id, status) => {
    const orders = getDB("orders", SEED_ORDERS);
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    saveDB("orders", updated);
    
    mockDatabase.addLog({
      agent: "System",
      action: "Database Update",
      details: `Updated Order ${id} status to ${status}`
    });
    return updated;
  },

  // Logs
  getLogs: () => getDB("logs", SEED_LOGS),
  
  addLog: (logEntry) => {
    const logs = getDB("logs", SEED_LOGS);
    const entry = {
      timestamp: new Date().toISOString(),
      ...logEntry
    };
    logs.unshift(entry); // newest first
    // limit to 100 logs
    if (logs.length > 100) logs.pop();
    saveDB("logs", logs);
  },

  // Reset database helper
  resetDatabase: () => {
    localStorage.removeItem("dizins_bookings");
    localStorage.removeItem("dizins_orders");
    localStorage.removeItem("dizins_logs");
    
    // reinitialize
    getDB("bookings", SEED_BOOKINGS);
    getDB("orders", SEED_ORDERS);
    getDB("logs", SEED_LOGS);
    
    mockDatabase.addLog({
      agent: "System",
      action: "Reset",
      details: "Database reset to factory defaults."
    });
  },

  // Calculate statistics for the dashboard
  getDatabaseStats: () => {
    const bookings = getDB("bookings", SEED_BOOKINGS);
    const orders = getDB("orders", SEED_ORDERS);
    
    // Revenue calculations
    const roomRevenue = bookings
      .filter(b => b.status !== "Cancelled")
      .reduce((sum, b) => sum + b.totalPrice, 0);
      
    const foodRevenue = orders
      .filter(o => o.status !== "Cancelled")
      .reduce((sum, o) => sum + o.totalPrice, 0);
      
    const totalRevenue = roomRevenue + foodRevenue;
    
    // Room Occupancy (let's assume total hotel rooms is 10)
    // Occupancy is the percentage of rooms that are in 'Checked In' state.
    const activeOccupied = bookings.filter(b => b.status === "Checked In").length;
    const occupancyRate = Math.round((activeOccupied / 10) * 100);
    
    // Active counts
    const pendingOrdersCount = orders.filter(o => o.status === "Pending" || o.status === "Preparing").length;
    const totalBookingsCount = bookings.length;
    
    // Food popularity
    const itemCounts = {};
    orders.filter(o => o.status !== "Cancelled").forEach(o => {
      o.items.forEach(i => {
        itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
      });
    });
    
    const popularFood = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Dynamic stats history (for charting)
    // Booking count and Revenue by Room Type
    const roomTypeStats = bookings.reduce((acc, b) => {
      if (!acc[b.roomType]) {
        acc[b.roomType] = { count: 0, revenue: 0 };
      }
      acc[b.roomType].count += 1;
      if (b.status !== "Cancelled") {
        acc[b.roomType].revenue += b.totalPrice;
      }
      return acc;
    }, {});
    
    return {
      totalRevenue,
      roomRevenue,
      foodRevenue,
      occupancyRate,
      pendingOrders: pendingOrdersCount,
      totalBookings: totalBookingsCount,
      popularFood,
      roomTypeStats,
      activeOccupied
    };
  }
};
