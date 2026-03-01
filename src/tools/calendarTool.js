import { z } from "zod";
import { getMyCalendarDataByDate } from "../services/calendarService.js";

export function registerCalendarTools(server) {
  server.registerTool(
    "getMyCalendarDataByDate",
    {
      description: "Get calendar meetings for a specific date (Format: YYYY-MM-DD)",
      inputSchema: z.object({
        date: z
          .string()
          .refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format (use YYYY-MM-DD)",
          }),
      }),
    },
    async ({ date }) => {
      const result = await getMyCalendarDataByDate(date);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}