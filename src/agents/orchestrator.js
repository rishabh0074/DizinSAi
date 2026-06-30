import { intentAgent } from './intentAgent';
import { bookingAgent } from './bookingAgent';
import { foodAgent } from './foodAgent';
import { faqAgent } from './faqAgent';
import { analyticsAgent } from './analyticsAgent';
import { mockDatabase } from '../data/mockDatabase';

export const agentOrchestrator = {
  initializeContext: () => {
    // Attempt to load long-term memory from last booking in DB
    const bookings = mockDatabase.getBookings();
    let profile = { name: "", phone: "" };
    if (bookings.length > 0) {
      const last = bookings[bookings.length - 1];
      profile = { name: last.name, phone: last.phone };
    }

    return {
      activeAgent: null, // booking, food, faq, analytics
      customerProfile: profile, // long term memory
      bookingState: null,
      foodState: null,
      faqState: null,
      analyticsState: null,
      history: [
        {
          sender: "agent",
          text: profile.name 
            ? `Welcome back to DizinS AI! 🏨 It's great to see you again, ${profile.name}.\n\nHow can I help you today? I can book a room for you, take a room service order, or answer questions about our services.`
            : "Welcome to DizinS AI, your modern hospitality assistant! 🏨\n\nHow can I assist you today? You can say:\n- **\"Book a room\"** to start a reservation\n- **\"Order dinner\"** to see our room service menu\n- **\"What are the pool hours?\"** to search our FAQs\n- **\"Show admin report\"** if you are a manager",
          timestamp: new Date().toISOString()
        }
      ],
      currentThought: "Awaiting user input. Database initialized. Long-term memory profile parsed.",
      currentToolCall: null,
      currentToolResult: null
    };
  },

  handleMessage: (message, context) => {
    const text = message.trim();
    const textLower = text.toLowerCase();

    // 1. Run Intent Detection Agent
    const intentResult = intentAgent.detectIntent(text, context);
    context.currentThought = `[Intent Agent] ${intentResult.thought}`;
    context.currentToolCall = null;
    context.currentToolResult = null;

    mockDatabase.addLog({
      agent: "Intent",
      action: "Detection",
      details: `Classified user message intent as "${intentResult.intent}" (Confidence: ${intentResult.confidence})`
    });

    // 2. Handle Cancel / Reset request
    if (intentResult.intent === "CANCEL") {
      context.activeAgent = null;
      context.bookingState = null;
      context.foodState = null;
      context.currentThought = "Resetting active session parameters on user command.";
      
      const reply = "I have cleared your current activity and cart. How else can I assist you? (You can book a room, order food, or ask about our amenities!)";
      
      return { reply, context };
    }

    // 3. Handle Greeting
    if (intentResult.intent === "GREETING") {
      context.activeAgent = null;
      context.currentThought = "Greeting detected. Returning standard hospitality welcome.";
      let reply = "Hello! Welcome to DizinS AI. How can I help you today? You can ask to book a room, order food, or check our timings.";
      if (context.customerProfile.name) {
        reply = `Hello ${context.customerProfile.name}! Welcome back. How can I assist you today?`;
      }
      return { reply, context };
    }

    // 4. Handle Context Switching / Multi-Agent Orchestration
    
    // Scenario A: User is in booking, but asks a FAQ question (Interruption & Resume)
    if (context.activeAgent === "booking" && intentResult.intent === "FAQ") {
      context.currentThought = "[Orchestrator] Interruption detected. User asked FAQ during Booking. Delegating to FAQ Agent, then preparing to resume Booking.";
      
      // Process FAQ
      const faqResult = faqAgent.process(message, context);
      
      // Update thought and tools logs from FAQ Agent
      context.currentThought = `[FAQ Agent] ${context.faqState.thought}`;
      context.currentToolCall = context.faqState.toolCall;
      context.currentToolResult = context.faqState.toolResult;

      // Build resume prompt based on current Booking step
      const bookingStep = context.bookingState.step;
      let resumeMsg = "";
      
      if (bookingStep === "COLLECT_ROOM") {
        resumeMsg = "Continuing with your reservation... Which room type would you like (Standard Room, Deluxe Room, or Luxury Suite)?";
      } else if (bookingStep === "COLLECT_NAME") {
        resumeMsg = "Resuming your booking... Under what name should we place the room reservation?";
      } else if (bookingStep === "COLLECT_PHONE") {
        resumeMsg = "Now, back to the booking... What is your contact phone number?";
      } else if (bookingStep === "COLLECT_CHECKIN") {
        resumeMsg = "Resuming room reservation... What date would you like to check in (YYYY-MM-DD)?";
      } else if (bookingStep === "COLLECT_CHECKOUT") {
        resumeMsg = `Continuing your booking... What date will you be checking out of your ${context.bookingState.form.roomType}?`;
      } else if (bookingStep === "COLLECT_GUESTS") {
        resumeMsg = "Returning to the room booking... How many guests will be staying in the room (Max 4)?";
      } else if (bookingStep === "CONFIRMATION") {
        resumeMsg = "Back to confirming your stay... Shall I finalize this booking? (Reply Yes/No)";
      }

      const combinedReply = `${faqResult.reply}\n\n---\n🔄 **Resuming Booking:**\n${resumeMsg}`;
      return { reply: combinedReply, context };
    }

    // Scenario B: User is in food ordering, but asks a FAQ question (Interruption & Resume)
    if (context.activeAgent === "food" && intentResult.intent === "FAQ") {
      context.currentThought = "[Orchestrator] Interruption detected. User asked FAQ during Food Ordering. Delegating to FAQ Agent, then resuming Food order.";
      
      const faqResult = faqAgent.process(message, context);
      
      context.currentThought = `[FAQ Agent] ${context.faqState.thought}`;
      context.currentToolCall = context.faqState.toolCall;
      context.currentToolResult = context.faqState.toolResult;

      const foodStep = context.foodState.step;
      let resumeMsg = "";
      
      if (foodStep === "COLLECT_ITEMS") {
        resumeMsg = "Resuming your kitchen order. Please add more items from the menu, or reply 'Checkout' to complete the order.";
      } else if (foodStep === "COLLECT_DELIVERY") {
        resumeMsg = "Continuing with your dining order. Where should we deliver it? (Room [Number] or address)";
      } else if (foodStep === "COLLECT_NAME") {
        resumeMsg = "Back to the food order. What name should we write on the delivery ticket?";
      } else if (foodStep === "COLLECT_PHONE") {
        resumeMsg = "Resuming order details. What phone number can our kitchen staff use to reach you?";
      } else if (foodStep === "CONFIRMATION") {
        resumeMsg = "Back to your order confirmation. Shall we place the order now? (Reply Yes/No)";
      }

      const combinedReply = `${faqResult.reply}\n\n---\n🔄 **Resuming Food Order:**\n${resumeMsg}`;
      return { reply: combinedReply, context };
    }

    // Scenario C: User switches between Booking and Food Ordering mid-flow
    if (context.activeAgent === "booking" && intentResult.intent === "FOOD") {
      context.currentThought = "[Orchestrator] User requested food menu during room booking. Pausing room booking and loading Food Ordering Agent.";
      context.activeAgent = "food";
      
      const foodResult = foodAgent.process(message, context);
      context.currentThought = `[Food Agent] ${context.foodState.thought}`;
      context.currentToolCall = context.foodState.toolCall;
      context.currentToolResult = context.foodState.toolResult;
      
      const transitionReply = `No problem! I will pause your room reservation request. Let's get you set up with dining instead.\n\n${foodResult.reply}`;
      return { reply: transitionReply, context };
    }

    if (context.activeAgent === "food" && intentResult.intent === "BOOKING") {
      context.currentThought = "[Orchestrator] User requested room booking during food ordering. Pausing food order and loading Booking Agent.";
      context.activeAgent = "booking";
      
      const bookingResult = bookingAgent.process(message, context);
      context.currentThought = `[Booking Agent] ${context.bookingState.thought}`;
      context.currentToolCall = context.bookingState.toolCall;
      context.currentToolResult = context.bookingState.toolResult;
      
      const transitionReply = `Sure thing! I will pause your kitchen order. Let's switch over to room reservations.\n\n${bookingResult.reply}`;
      return { reply: transitionReply, context };
    }

    // 5. Normal Agent routing
    if (intentResult.intent === "BOOKING" || context.activeAgent === "booking") {
      context.activeAgent = "booking";
      const result = bookingAgent.process(message, context);
      
      context.currentThought = `[Booking Agent] ${context.bookingState.thought}`;
      context.currentToolCall = context.bookingState.toolCall;
      context.currentToolResult = context.bookingState.toolResult;
      
      // Update long term memory if booking completed
      if (context.bookingState.step === "COMPLETED") {
        context.customerProfile = {
          name: context.bookingState.form.name,
          phone: context.bookingState.form.phone
        };
      }
      
      return { reply: result.reply, context };
    }

    if (intentResult.intent === "FOOD" || context.activeAgent === "food") {
      context.activeAgent = "food";
      const result = foodAgent.process(message, context);
      
      context.currentThought = `[Food Agent] ${context.foodState.thought}`;
      context.currentToolCall = context.foodState.toolCall;
      context.currentToolResult = context.foodState.toolResult;

      // Update long term memory if food completed
      if (context.foodState.step === "COMPLETED") {
        context.customerProfile = {
          name: context.foodState.name,
          phone: context.foodState.phone
        };
      }
      
      return { reply: result.reply, context };
    }

    if (intentResult.intent === "ADMIN") {
      context.activeAgent = "analytics";
      const result = analyticsAgent.process(message, context);
      
      context.currentThought = `[Analytics Agent] ${context.analyticsState.thought}`;
      context.currentToolCall = context.analyticsState.toolCall;
      context.currentToolResult = context.analyticsState.toolResult;
      
      // Reset active agent to null since analytics reports are single-turn replies
      context.activeAgent = null;
      return { reply: result.reply, context };
    }

    // Fallback: FAQ Agent search
    context.activeAgent = "faq";
    const result = faqAgent.process(message, context);
    
    context.currentThought = `[FAQ Agent] ${context.faqState.thought}`;
    context.currentToolCall = context.faqState.toolCall;
    context.currentToolResult = context.faqState.toolResult;
    
    context.activeAgent = null; // FAQ is single-turn
    
    return { reply: result.reply, context };
  }
};
