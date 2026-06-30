import { agentTools } from './tools';

export const faqAgent = {
  process: (message, context) => {
    const text = message.trim();
    
    // Setup state logs
    context.faqState = {
      thought: `Parsing FAQ search query: "${text}". Searching knowledge base.`,
      toolCall: null,
      toolResult: null
    };

    const state = context.faqState;

    // Call FAQ search tool!
    const searchResult = agentTools.searchFAQDatabase(text);
    
    state.toolCall = {
      name: "search_faq_database",
      arguments: { query: text }
    };
    state.toolResult = searchResult;

    let reply = "";
    if (searchResult.success) {
      const entry = searchResult.result;
      state.thought = `Match found in category "${entry.category}": "${entry.question}". Returning answers.`;
      
      reply = `💡 **${entry.question}**\n\n${entry.answer}\n\n_Is there anything else I can answer for you? (You can also ask to 'book a room' or 'order food'.)_`;
    } else {
      state.thought = "No direct FAQ keyword match found. Displaying general helpful fallback.";
      
      reply = `I couldn't find a direct answer to your question in our system. However, I can help you with:
      
- **Check-in/Check-out Timings** (checkin hours, breakfast times)
- **Room Pricing** (Standard, Deluxe, and Suite rates)
- **Amenities** (Pool, Gym, Spa, WiFi, Parking)
- **Policies** (Cancellation, refunds)
- **Room Service / Food Menu** (Or just say "order food")
- **Booking a Room** (Or just say "book a room")

What would you like to know or do?`;
    }

    return { reply, context };
  }
};
