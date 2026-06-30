import { agentTools } from './tools';

export const analyticsAgent = {
  process: (message, context) => {
    const text = message.toLowerCase().trim();
    
    context.analyticsState = {
      thought: "Analyzing administrative request. Triggering generateAnalyticsReport tool.",
      toolCall: {
        name: "generate_analytics_report",
        arguments: {}
      },
      toolResult: null
    };

    const state = context.analyticsState;
    const report = agentTools.generateAnalyticsReport();
    state.toolResult = report;

    const stats = report.result.stats;
    const recs = report.result.recommendations;

    state.thought = "Compiled business reports. Formatting KPI summaries and AI recommendations.";

    let reply = `📊 **DizinS AI Executive Summary Report**
    
As requested, here is the current business performance summary:

📈 **Financial Overview:**
- **Total Revenue:** **$${stats.totalRevenue.toFixed(2)}**
- **Room Revenue:** $${stats.roomRevenue.toFixed(2)}
- **F&B Revenue:** $${stats.foodRevenue.toFixed(2)}

🏨 **Hotel Operations:**
- **Occupancy Rate:** **${stats.occupancyRate}%** (${stats.activeOccupied} of 10 rooms checked in)
- **Total Bookings Logs:** ${stats.totalBookings}
- **Pending Food Tickets:** ${stats.pendingOrders}

🍟 **Top Selling Dining Items:**
${stats.popularFood.map((f, idx) => `${idx + 1}. **${f.name}** (${f.count} orders)`).join("\n")}

🤖 **AI Business Insights & Actions:**
${recs.map(r => `- 💡 ${r}`).join("\n")}

_These insights are compiled in real-time. You can view full interactive charts by switching to the **Admin Dashboard** in the sidebar._`;

    return { reply, context };
  }
};
