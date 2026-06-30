export const intentAgent = {
  detectIntent: (message, context) => {
    const text = message.toLowerCase().trim();
    
    // Heuristic keywords
    const cancelKeywords = ["cancel", "reset", "abort", "stop", "clear", "start over", "nevermind", "never mind"];
    const bookingKeywords = ["book", "booking", "reserve", "reservation", "stay", "checkin", "check-in", "checkout", "check-out", "room", "suite", "deluxe", "standard"];
    const foodKeywords = ["food", "order", "eat", "menu", "dinner", "lunch", "breakfast", "pizza", "pasta", "salad", "drink", "wine", "beer", "room service", "hungry"];
    const faqKeywords = ["time", "hours", "open", "close", "wifi", "pool", "gym", "spa", "massage", "parking", "shuttle", "cancel policy", "refund", "address", "phone", "contact", "how much", "cost", "price"];
    const adminKeywords = ["admin", "dashboard", "analytics", "stats", "revenue", "report", "occupancy", "insights", "perform", "sales"];
    const greetingKeywords = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening", "yo"];

    let detectedIntent = "GENERAL";
    let confidence = 0.5;
    let thought = "";

    // 1. Check Cancel
    if (cancelKeywords.some(kw => text.includes(kw))) {
      detectedIntent = "CANCEL";
      confidence = 0.95;
      thought = `Detected keyword matching cancellation request ('cancel', 'stop', 'nevermind'). Routing to orchestration reset.`;
    }
    // 2. Check Admin commands
    else if (adminKeywords.some(kw => text.includes(kw))) {
      detectedIntent = "ADMIN";
      confidence = 0.90;
      thought = `Detected administrative keywords related to business performance ('revenue', 'stats', 'admin'). Routing to Admin Analytics Agent.`;
    }
    // 3. Check Booking
    else if (bookingKeywords.some(kw => text.includes(kw))) {
      detectedIntent = "BOOKING";
      confidence = 0.85;
      thought = `Detected booking related vocabulary ('book', 'room', 'reservation'). Routing to Booking Agent.`;
    }
    // 4. Check Food
    else if (foodKeywords.some(kw => text.includes(kw))) {
      detectedIntent = "FOOD";
      confidence = 0.85;
      thought = `Detected culinary terminology ('food', 'order', 'menu'). Routing to Food Ordering Agent.`;
    }
    // 5. Check FAQ
    else if (faqKeywords.some(kw => text.includes(kw))) {
      detectedIntent = "FAQ";
      confidence = 0.80;
      thought = `Detected questions matching local knowledge base categories ('hours', 'wifi', 'pool', 'pricing'). Routing to FAQ Agent.`;
    }
    // 6. Check Greeting
    else if (greetingKeywords.some(kw => text.includes(kw)) && text.length < 15) {
      detectedIntent = "GREETING";
      confidence = 0.90;
      thought = `User greeting detected. Preparing standard warm hospitality welcome.`;
    }
    else {
      // If we are currently in an active dialog (e.g. collecting booking details), maintain that context by default
      if (context.activeAgent === "booking") {
        detectedIntent = "BOOKING";
        confidence = 0.70;
        thought = `Input does not match strong category, but we have an ongoing 'booking' session. Preserving context and routing to Booking Agent.`;
      } else if (context.activeAgent === "food") {
        detectedIntent = "FOOD";
        confidence = 0.70;
        thought = `Input does not match strong category, but we have an ongoing 'food' session. Preserving context and routing to Food Ordering Agent.`;
      } else {
        detectedIntent = "FAQ"; // Default fallback is FAQ / general information search
        confidence = 0.40;
        thought = `Input is generic. Routing to FAQ Agent for keyword-based search over knowledge base.`;
      }
    }

    return {
      intent: detectedIntent,
      confidence,
      thought
    };
  }
};
