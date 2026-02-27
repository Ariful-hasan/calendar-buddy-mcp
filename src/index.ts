// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { getEventsInRange } from "./calendar.js";

dotenv.config();

// Define the parameter type for your tool
interface GetEventsParams {
  start: string;
  end: string;
}

const server = new McpServer({
  name: "calendar-buddy-mcp",
  version: "1.0.0",
});

// Register your MCP tool
server.registerTool(
  "get_events_in_range",
  {
    description: "Get Google Calendar events between two dates",
    inputSchema: z.object({
      start: z.string().describe("ISO start datetime"),
      end: z.string().describe("ISO end datetime"),
    }),
  },
  async (params: { start: string; end: string }) => {
    const events = await getEventsInRange(params.start, params.end);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(events, null, 2),
        },
      ],
    };
  }
);

// Start MCP server over stdio
const transport = new StdioServerTransport();
await server.connect(transport);