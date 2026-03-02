import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";
import { registerCalendarTools } from "./src/tools/calendarTool.js";

// Create MCP server
const server = new McpServer({
  name: "Calendar Buddy",
  version: "1.0.0",
});

/**
 * Register MCP tools
 */
registerCalendarTools(server);


// 4. Start the MCP server using Standard I/O
async function init() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

init().catch((err) => {
  console.error("Failed to start MCP server:", err);
});