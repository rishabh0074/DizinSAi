import { agentTools } from './tools';
import { menuDatabase } from '../data/menuDb';

export const foodAgent = {
  process: (message, context) => {
    const text = message.trim();
    const textLower = text.toLowerCase();

    // Initialize food state if not present
    if (!context.foodState) {
      context.foodState = {
        step: "WELCOME", // WELCOME, COLLECT_ITEMS, COLLECT_DELIVERY, COLLECT_NAME, COLLECT_PHONE, CONFIRMATION, COMPLETED
        cart: [],
        deliveryType: "", // room / address
        roomNumber: "", // room number or address
        name: "",
        phone: "",
        thought: "",
        toolCall: null,
        toolResult: null
      };
    }

    const state = context.foodState;
    let reply = "";
    let toolCall = null;
    let toolResult = null;
    let thought = "";

    // Step: WELCOME (Show menu, extract what we can)
    if (state.step === "WELCOME") {
      thought = "User wants to order food. Retrieving menu and starting item collection.";
      const menuTool = agentTools.getMenu();
      toolCall = { name: "get_menu", arguments: {} };
      toolResult = menuTool;

      state.step = "COLLECT_ITEMS";
      
      // Let's print out a formatted menu
      let menuMsg = "Sure, here is our current Room Service & Restaurant Menu:\n\n";
      const categories = ["Appetizers", "Mains", "Desserts", "Drinks"];
      
      categories.forEach(cat => {
        menuMsg += `🍽️ **${cat}**:\n`;
        menuDatabase.filter(item => item.category === cat).forEach(item => {
          menuMsg += `- **${item.name}** ($${item.price}): _${item.description}_\n`;
        });
        menuMsg += "\n";
      });

      menuMsg += "Please type the items and quantities you'd like to order (e.g. '2 Margherita Pizza and 1 Tiramisu'). You can also check out at any time by saying 'checkout'.";
      
      state.thought = thought;
      state.toolCall = toolCall;
      state.toolResult = toolResult;
      return { reply: menuMsg, context };
    }

    // Step: COLLECT_ITEMS
    if (state.step === "COLLECT_ITEMS") {
      // If user says "checkout", "done", "ready", "finish"
      if (textLower.includes("checkout") || textLower.includes("done") || textLower.includes("ready") || textLower.includes("finish") || textLower.includes("that is all") || textLower.includes("that's all")) {
        if (state.cart.length === 0) {
          thought = "User tried to check out with an empty cart. Prompting to select items first.";
          reply = "Your cart is currently empty! Please tell me what you'd like to order from the menu first.";
        } else {
          state.step = "COLLECT_DELIVERY";
          thought = "Cart populated. Moving to delivery location collection.";
          reply = "Great! Will this order be delivered to a hotel **Room** or an external **Address**? Please provide your room number or address.";
        }
      } else {
        // Parse items from user input
        thought = "Parsing user text for menu item names and quantities.";
        const addedItems = [];

        menuDatabase.forEach(item => {
          const itemNameLower = item.name.toLowerCase();
          // Check if item name is mentioned
          if (textLower.includes(itemNameLower)) {
            // Find quantity preceding the item name
            // Regex matches numbers before the item name or some common variations
            const regex = new RegExp(`(\\d+)\\s*(x|of)?\\s*${itemNameLower}`);
            const match = textLower.match(regex);
            let qty = 1;
            if (match) {
              qty = parseInt(match[1]);
            } else {
              // Check if singular/plural or just general mentions
              // E.g. "a pizza" -> qty 1
              const prefixMatch = textLower.match(new RegExp(`(a|an|one)\\s+${itemNameLower}`));
              if (prefixMatch) qty = 1;
            }

            addedItems.push({
              itemId: item.id,
              name: item.name,
              quantity: qty,
              price: item.price
            });
          }
        });

        if (addedItems.length > 0) {
          // Add or update cart
          addedItems.forEach(added => {
            const existing = state.cart.find(c => c.itemId === added.itemId);
            if (existing) {
              existing.quantity += added.quantity;
            } else {
              state.cart.push(added);
            }
          });

          thought += ` Found items: ${addedItems.map(i => `${i.quantity}x ${i.name}`).join(", ")}. Cart updated.`;
          
          let cartSummary = "🛒 **Current Cart:**\n";
          let total = 0;
          state.cart.forEach(item => {
            cartSummary += `- **${item.quantity}x** ${item.name} ($${item.price * item.quantity})\n`;
            total += item.price * item.quantity;
          });
          cartSummary += `\nSubtotal: **$${total}**\n\nWould you like to add anything else? If you're ready, say **Checkout** to specify delivery details.`;
          reply = cartSummary;
        } else {
          thought = "No matching menu items found in user input. Re-prompting user.";
          reply = "I couldn't match any items in your message to our menu. Please specify item names as listed (e.g. '1 Caesar Salad and 2 Lava Cakes').";
        }
      }
    }
    
    // Step: COLLECT_DELIVERY
    else if (state.step === "COLLECT_DELIVERY") {
      // Parse room or address
      if (textLower.includes("room")) {
        const roomMatch = textLower.match(/room\s*(\d+)/) || text.match(/(\d+)/);
        if (roomMatch) {
          state.roomNumber = `Room ${roomMatch[1]}`;
          state.deliveryType = "room";
          state.step = "COLLECT_NAME";
          thought = `Delivery room parsed: "${state.roomNumber}". Proceeding to collect name.`;
          reply = `Delivery set to ${state.roomNumber}. What full name should we put on the ticket?`;
        } else {
          thought = "User specified Room delivery but did not provide a room number.";
          reply = "Please specify your hotel room number (e.g., 'Room 204').";
        }
      } else if (text.length > 4) {
        // Assume external address or room specified directly
        state.roomNumber = text;
        state.deliveryType = textLower.match(/^\d+$/) ? "room" : "address";
        if (state.deliveryType === "room") state.roomNumber = `Room ${text}`;
        
        state.step = "COLLECT_NAME";
        thought = `Parsed delivery location: "${state.roomNumber}" (${state.deliveryType}). Prompting for name.`;
        reply = `Got it! Under what full name should we place this order?`;
      } else {
        thought = "Invalid delivery location input.";
        reply = "Please tell me where you'd like your order delivered. You can say 'Room [number]' or enter an address:";
      }
    }
    
    // Step: COLLECT_NAME
    else if (state.step === "COLLECT_NAME") {
      if (text.length > 2) {
        state.name = text;
        state.step = "COLLECT_PHONE";
        thought = `Captured customer name: "${state.name}". Prompting for contact phone.`;
        reply = `Thank you, ${state.name}. What is a phone number we can contact you at?`;
      } else {
        thought = "Name input too short.";
        reply = "Please enter your name so we can label your order.";
      }
    }
    
    // Step: COLLECT_PHONE
    else if (state.step === "COLLECT_PHONE") {
      const digits = text.replace(/\D/g, "");
      if (digits.length >= 7) {
        state.phone = text;
        
        // Execute Bill Calculation Tool!
        thought = "Calculating food bill summary with tax and delivery fee.";
        const billTool = agentTools.calculateFoodBill(state.cart);
        
        toolCall = {
          name: "calculate_food_bill",
          arguments: { items: state.cart }
        };
        toolResult = billTool;

        if (billTool.success) {
          state.bill = billTool.result;
          state.step = "CONFIRMATION";
          
          let billSummary = `🍳 **Food Order Confirmation Summary:**\n`;
          billSummary += `- **Customer:** ${state.name} (${state.phone})\n`;
          billSummary += `- **Deliver To:** ${state.roomNumber}\n\n`;
          billSummary += `📋 **Ordered Items:**\n`;
          
          state.bill.items.forEach(item => {
            billSummary += `- ${item.quantity}x ${item.name} ($${item.price} each) = $${(item.price * item.quantity).toFixed(2)}\n`;
          });
          
          billSummary += `\n`;
          billSummary += `- Subtotal: $${state.bill.subtotal.toFixed(2)}\n`;
          billSummary += `- Tax (10%): $${state.bill.tax.toFixed(2)}\n`;
          billSummary += `- Delivery Fee: $${state.bill.deliveryFee.toFixed(2)}\n`;
          billSummary += `💰 **Grand Total:** **$${state.bill.totalPrice.toFixed(2)}**\n\n`;
          billSummary += `Would you like to place this order? Please reply **Yes** to confirm, or **No** to cancel.`;
          
          reply = billSummary;
        } else {
          thought += " Pricing tool failed unexpectedly. Restarting order.";
          state.step = "WELCOME";
          reply = "Something went wrong calculating your bill. Let's restart. What would you like to order?";
        }
      } else {
        thought = "Phone validation failed.";
        reply = "Please enter a valid contact phone number (at least 7 digits) to finalize the order.";
      }
    }
    
    // Step: CONFIRMATION
    else if (state.step === "CONFIRMATION") {
      if (textLower.includes("yes") || textLower.includes("yep") || textLower.includes("confirm")) {
        // Execute create order tool!
        thought = "User confirmed order. Saving order record in database.";
        const orderSave = agentTools.createFoodOrderRecord({
          name: state.name,
          phone: state.phone,
          roomNumber: state.roomNumber,
          deliveryType: state.deliveryType,
          items: state.bill.items,
          subtotal: state.bill.subtotal,
          tax: state.bill.tax,
          deliveryFee: state.bill.deliveryFee,
          totalPrice: state.bill.totalPrice
        });

        toolCall = {
          name: "create_food_order",
          arguments: {
            name: state.name,
            phone: state.phone,
            roomNumber: state.roomNumber,
            totalPrice: state.bill.totalPrice
          }
        };
        toolResult = orderSave;
        
        state.step = "COMPLETED";
        const orderId = orderSave.result.id;
        
        // Reset active agent context
        context.activeAgent = null;
        
        reply = `🎉 **Success! Your order has been placed.**
        
Order Reference: **${orderId}**
Delivery Destination: **${state.roomNumber}**
Est. Delivery Time: **30-40 minutes**
        
Your room service ticket has been pushed to the kitchen. Thank you for dining with us! 
        
Is there anything else DizinS AI can help you with?`;
      } else if (textLower.includes("no") || textLower.includes("cancel") || textLower.includes("nope")) {
        thought = "User cancelled order. Resetting state.";
        state.step = "WELCOME";
        state.cart = [];
        context.activeAgent = null;
        reply = "No problem! I have cancelled the food order. What would you like to do instead?";
      } else {
        thought = "Unrecognized response to confirmation request. Asking again.";
        reply = "Please reply with **Yes** to confirm and place your order, or **No** to cancel.";
      }
    }

    state.thought = thought;
    state.toolCall = toolCall;
    state.toolResult = toolResult;
    
    return { reply, context };
  }
};
