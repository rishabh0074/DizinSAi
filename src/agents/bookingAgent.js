import { agentTools } from './tools';

const ROOM_TYPES = {
  standard: "Standard Room",
  deluxe: "Deluxe Room",
  suite: "Luxury Suite",
  luxury: "Luxury Suite"
};

// Simple date parser
const parseDate = (text) => {
  // Check if string matches YYYY-MM-DD
  const match = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return match[0];

  const today = new Date("2026-06-30"); // Base local time from metadata
  if (text.includes("today")) {
    return today.toISOString().split('T')[0];
  }
  if (text.includes("tomorrow")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Try JS parsing
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    // If the year parsed is far off, adjust it to 2026
    if (parsed.getFullYear() < 2026) parsed.setFullYear(2026);
    return parsed.toISOString().split('T')[0];
  }
  
  return null;
};

export const bookingAgent = {
  process: (message, context) => {
    const text = message.trim();
    const textLower = text.toLowerCase();
    
    // Initialize booking state if not present
    if (!context.bookingState) {
      context.bookingState = {
        step: "WELCOME", // WELCOME, COLLECT_ROOM, COLLECT_NAME, COLLECT_PHONE, COLLECT_CHECKIN, COLLECT_CHECKOUT, COLLECT_GUESTS, CONFIRMATION, COMPLETED
        form: {
          name: "",
          phone: "",
          roomType: "",
          checkIn: "",
          checkOut: "",
          guests: null,
          totalPrice: 0
        },
        thought: "",
        toolCall: null,
        toolResult: null
      };
    }

    const state = context.bookingState;
    const form = state.form;
    
    let reply = "";
    let toolCall = null;
    let toolResult = null;
    let thought = "";

    // If first entry or started over, extract what we can from initial query
    if (state.step === "WELCOME") {
      thought = "User initiated room booking. Extracting room details, dates, and guest counts from greeting message.";
      
      // Attempt extraction
      // 1. Room Type
      for (const [key, value] of Object.entries(ROOM_TYPES)) {
        if (textLower.includes(key)) {
          form.roomType = value;
          break;
        }
      }
      
      // 2. Guests
      const guestMatch = textLower.match(/(\d+)\s*(guest|people|person|pax|members)/);
      if (guestMatch) {
        const g = parseInt(guestMatch[1]);
        if (g > 0 && g <= 4) form.guests = g;
      }
      
      // 3. Dates
      const dates = [];
      const dateMatches = textLower.match(/(\d{4}-\d{2}-\d{2})/g);
      if (dateMatches) {
        dateMatches.forEach(d => dates.push(d));
      } else {
        // Look for today/tomorrow
        if (textLower.includes("today")) dates.push(parseDate("today"));
        if (textLower.includes("tomorrow")) dates.push(parseDate("tomorrow"));
      }
      
      if (dates.length >= 1) form.checkIn = dates[0];
      if (dates.length >= 2) form.checkOut = dates[1];

      // Auto-extract name if structure like "my name is John Doe"
      const nameMatch = text.match(/my name is ([a-zA-Z\s]+)/i);
      if (nameMatch) {
        form.name = nameMatch[1].trim();
      }

      // Check what is missing to determine next step
      if (!form.roomType) {
        state.step = "COLLECT_ROOM";
        thought += " Room type not specified. Asking customer to choose standard, deluxe, or suite.";
        reply = "I would be happy to help you book a room. What type of room would you prefer?\n\n- **Standard Room** ($150/night): Cozy and comfortable\n- **Deluxe Room** ($250/night): Spacious, scenic view\n- **Luxury Suite** ($450/night): Absolute luxury, jacuzzi & balcony";
      } else {
        state.step = "COLLECT_NAME";
        thought += ` Extracted roomType: "${form.roomType}". Moving to name collection.`;
        reply = `Excellent choice! Let's get a Standard Room booked for you. Who should we register the reservation under? (Please provide your full name)`;
        if (form.roomType === ROOM_TYPES.deluxe) reply = `Excellent choice! Let's book a Deluxe Room for you. Under what full name should we place the reservation?`;
        if (form.roomType === ROOM_TYPES.suite) reply = `Outstanding choice! Our Luxury Suite offers world-class amenities. Under what full name should we place the reservation?`;
      }
      
      state.thought = thought;
      return { reply, context };
    }

    // STATE MACHINE FOR PARAMETER COLLECTION
    
    // Step: COLLECT_ROOM
    if (state.step === "COLLECT_ROOM") {
      let matchedType = "";
      for (const [key, value] of Object.entries(ROOM_TYPES)) {
        if (textLower.includes(key)) {
          matchedType = value;
          break;
        }
      }

      if (matchedType) {
        form.roomType = matchedType;
        state.step = "COLLECT_NAME";
        thought = `Room type identified as ${matchedType}. Prompting for guest name.`;
        reply = `Got it! Under what name should we make this reservation?`;
      } else {
        thought = "Failed to parse a valid room type. Repeating choices to user.";
        reply = "Please specify a room type. Would you like a **Standard Room**, **Deluxe Room**, or **Luxury Suite**?";
      }
    }
    
    // Step: COLLECT_NAME
    else if (state.step === "COLLECT_NAME") {
      if (text.length > 2) {
        form.name = text;
        state.step = "COLLECT_PHONE";
        thought = `Customer name registered: "${form.name}". Requesting phone number for records.`;
        reply = `Thank you, ${form.name}. What phone number can we reach you at?`;
      } else {
        thought = "Input is too short to be a valid name. Asking again.";
        reply = "Please provide your full name for the booking registration.";
      }
    }
    
    // Step: COLLECT_PHONE
    else if (state.step === "COLLECT_PHONE") {
      // Validate phone number format (must contain at least 7 digits)
      const digits = text.replace(/\D/g, "");
      if (digits.length >= 7) {
        form.phone = text;
        state.step = "COLLECT_CHECKIN";
        thought = `Validated phone number: "${form.phone}". Requesting check-in date.`;
        reply = `Perfect. When will you be checking in? (Please enter a date like YYYY-MM-DD, or say 'today' / 'tomorrow')`;
      } else {
        thought = "Phone number validation failed: fewer than 7 digits. Prompting user to re-enter.";
        reply = "Please enter a valid phone number (at least 7 digits) so we can secure your booking.";
      }
    }
    
    // Step: COLLECT_CHECKIN
    else if (state.step === "COLLECT_CHECKIN") {
      const parsed = parseDate(textLower);
      if (parsed) {
        // Validate that check-in date is not in the past
        const today = new Date("2026-06-30");
        const checkInDate = new Date(parsed);
        
        if (checkInDate < today && parsed !== "2026-06-30") {
          thought = `Check-in date ${parsed} is in the past. Prompting for future date.`;
          reply = "I'm sorry, but we cannot make a booking for a past date. Please enter a current or future check-in date (YYYY-MM-DD):";
        } else {
          form.checkIn = parsed;
          state.step = "COLLECT_CHECKOUT";
          thought = `Parsed check-in date: ${parsed}. Requesting check-out date.`;
          reply = `Check-in set to ${parsed}. When will you be checking out? (YYYY-MM-DD or number of nights)`;
        }
      } else {
        thought = "Could not parse check-in date from input. Re-requesting check-in date.";
        reply = "Please enter a valid check-in date (for example: 2026-07-01).";
      }
    }
    
    // Step: COLLECT_CHECKOUT
    else if (state.step === "COLLECT_CHECKOUT") {
      // User might specify "3 nights" or a date
      const nightMatch = textLower.match(/(\d+)\s*(night|nights|day|days)/);
      let parsed = null;
      
      if (nightMatch) {
        const nights = parseInt(nightMatch[1]);
        if (nights > 0) {
          const checkInDate = new Date(form.checkIn);
          checkInDate.setDate(checkInDate.getDate() + nights);
          parsed = checkInDate.toISOString().split('T')[0];
        }
      } else {
        parsed = parseDate(textLower);
      }

      if (parsed) {
        // Validate check-out is after check-in
        const checkInDate = new Date(form.checkIn);
        const checkOutDate = new Date(parsed);
        
        if (checkOutDate <= checkInDate) {
          thought = `Validation failed: check-out date (${parsed}) is on or before check-in date (${form.checkIn}). Prompting again.`;
          reply = `Check-out must be after check-in (${form.checkIn}). Please enter a valid check-out date:`;
        } else {
          form.checkOut = parsed;
          
          // Execute Availability Check Tool!
          thought = `Validating room availability for ${form.roomType} between ${form.checkIn} and ${form.checkOut}.`;
          const availCheck = agentTools.checkRoomAvailability(form.roomType, form.checkIn, form.checkOut);
          toolCall = {
            name: "check_room_availability",
            arguments: { roomType: form.roomType, checkIn: form.checkIn, checkOut: form.checkOut }
          };
          toolResult = availCheck;
          
          if (availCheck.success) {
            state.step = "COLLECT_GUESTS";
            thought += " Room is available. Requesting number of guests.";
            reply = "Great! That room is available for your dates. How many guests will be staying with us? (Max 4 per room)";
          } else {
            // Room not available. Let them change dates or room type
            state.step = "COLLECT_ROOM";
            form.roomType = "";
            thought += ` Room unavailable: "${availCheck.result}". Re-routing to room select.`;
            reply = `I'm sorry, but our ${form.roomType} is not available for those dates. Would you like to check a different room type or adjust your dates?\n\nPlease enter Standard Room, Deluxe Room, or Luxury Suite to search again.`;
          }
        }
      } else {
        thought = "Could not parse check-out date. Asking again.";
        reply = "Please enter a valid check-out date (YYYY-MM-DD) or number of nights.";
      }
    }
    
    // Step: COLLECT_GUESTS
    else if (state.step === "COLLECT_GUESTS") {
      const guests = parseInt(text.replace(/\D/g, ""));
      if (guests > 0 && guests <= 4) {
        form.guests = guests;
        
        // Calculate nights
        const start = new Date(form.checkIn);
        const end = new Date(form.checkOut);
        const diffTime = Math.abs(end - start);
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Call pricing calculation tool!
        thought = `Calculating booking costs using tool. Nights: ${nights}, Guests: ${guests}.`;
        const costCalc = agentTools.calculateBookingCost(form.roomType, nights, guests);
        toolCall = {
          name: "calculate_booking_cost",
          arguments: { roomType: form.roomType, nights, guests }
        };
        toolResult = costCalc;
        
        form.totalPrice = costCalc.result.totalPrice;
        state.step = "CONFIRMATION";
        
        thought += " Displaying booking summary for final confirmation.";
        reply = `Here is your booking summary:
        
🏨 **Booking Request Details:**
- **Customer Name:** ${form.name}
- **Contact Phone:** ${form.phone}
- **Room Type:** ${form.roomType}
- **Stay Period:** ${form.checkIn} to ${form.checkOut} (${nights} nights)
- **Occupants:** ${guests} ${guests === 1 ? 'guest' : 'guests'}
- **Total Pricing:** **$${form.totalPrice}** ($${costCalc.result.pricePerNight}/night + $${costCalc.result.extraCost} extra charges)

Would you like to confirm this reservation? Please reply **Yes** to complete the booking, or **No** to cancel and start over.`;
      } else {
        thought = `Guests validation failed: input was "${text}". Max 4 guests allowed. Asking again.`;
        reply = "Please enter a guest count between 1 and 4.";
      }
    }
    
    // Step: CONFIRMATION
    else if (state.step === "CONFIRMATION") {
      if (textLower.includes("yes") || textLower.includes("yep") || textLower.includes("confirm")) {
        // Execute booking save tool!
        thought = "User confirmed the booking. Creating database record via tools.";
        const bookingSave = agentTools.createBookingRecord(form);
        
        toolCall = {
          name: "create_booking",
          arguments: { ...form, totalPrice: form.totalPrice }
        };
        toolResult = bookingSave;
        
        state.step = "COMPLETED";
        
        // Save ID
        const bookingId = bookingSave.result.id;
        
        // Set context active agent to none since completed
        context.activeAgent = null;
        
        reply = `🎉 **Congratulations! Your booking is confirmed.**
        
Your Booking Reference ID is **${bookingId}**. We have sent a confirmation text message to ${form.phone}. We look forward to welcoming you on ${form.checkIn}!
        
Is there anything else I can assist you with today (like ordering food, check-in questions, or general FAQs)?`;
      } else if (textLower.includes("no") || textLower.includes("cancel") || textLower.includes("nope")) {
        thought = "User cancelled booking at confirmation stage. Resetting booking state.";
        state.step = "WELCOME";
        state.form = { name: "", phone: "", roomType: "", checkIn: "", checkOut: "", guests: null, totalPrice: 0 };
        context.activeAgent = null;
        reply = "No problem. I have cancelled the booking request. What would you like to do instead? (Book a different room, order food, or ask an FAQ?)";
      } else {
        thought = "Unrecognized response to confirmation request. Re-prompting.";
        reply = "Please reply with **Yes** to confirm the room reservation, or **No** to cancel.";
      }
    }

    state.thought = thought;
    state.toolCall = toolCall;
    state.toolResult = toolResult;
    
    return { reply, context };
  }
};
