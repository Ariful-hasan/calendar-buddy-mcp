# Calendar Buddy MCP

Calendar Buddy is a simple **Model Context Protocol (MCP) server** that lets AI tools (like Cursor) read your **Google Calendar** for a given date and return a friendly summary of your meetings.

This version uses a **Google API key** and a **public Google Calendar** (read‑only). That makes it easy to set up and safe to share, because it only exposes whatever you explicitly make public on that calendar.

---

## Features

- **MCP tool**: `getMyCalendarDataByDate`
- **Input**: `date` as a string in `YYYY-MM-DD` format (e.g. `"2026-03-01"`)
- **Output**: JSON like:

```json
{
  "meetings": [
    "Team Standup at 2026-03-01T09:00:00+01:00",
    "1:1 with Alex at 2026-03-01T14:30:00+01:00"
  ]
}
```

If there are no visible events that day, you’ll get a helpful message instead of an error.

---

## Prerequisites

- **Node.js** 18+ (or any recent LTS with ES modules support)
- A **Google account**
- A **Google Cloud project** with **Google Calendar API** enabled
- A **Calendar API key** created in Google Cloud Console
- A **Google Calendar that is public** (read‑only) for use with this tool

> For private calendars, you should use OAuth instead of an API key. This repo is configured for the **public calendar + API key** flow.

---

## 1. Make a calendar public

1. Open `https://calendar.google.com` and log in.
2. On the left, under **My calendars**, hover over the calendar you want to expose.
3. Click the **⋮** menu → **Settings and sharing**.
4. Under **Access permissions for events**:
   - Check **“Make available to public”**.
   - Set permission to **“See all event details”**.
5. Scroll down to **Integrate calendar** and copy the **Calendar ID**  
   (it often looks like `your-name@yourdomain.com` or `xxxx@group.calendar.google.com`).

You’ll use this value as `CALENDAR_ID`.

---

## 2. Create an API key

1. Go to `https://console.cloud.google.com/apis/credentials` in your Google Cloud project.
2. Click **Create credentials → API key**.
3. Copy the generated key.
4. (Optional but recommended) **Restrict** the key:
   - Restrict by **API** to **Google Calendar API**.
   - Optionally restrict by HTTP referrers / IPs according to your deployment.

You’ll use this value as `GOOGLE_PUBLIC_API_KEY`.

---

## 3. Clone and install

```bash
git clone https://github.com/your-username/calendar-buddy-mcp.git
cd calendar-buddy-mcp
npm install
```

---

## 4. Configure environment

Create a `.env` file in the project root:

```bash
CALENDAR_ID=your_public_calendar_id_here
GOOGLE_PUBLIC_API_KEY=your_google_api_key_here
```

Example:

```bash
CALENDAR_ID=demogsl007@gmail.com
GOOGLE_PUBLIC_API_KEY=AIzaSyExample1234567890
```

> The calendar **must** be public, or Google will return `Not Found` / permission errors when using an API key.

---

## 5. Project structure

- `index.js`  
  - Entry point that creates the `McpServer`, loads `.env`, and wires everything together.
- `src/services/calendarService.js`  
  - Pure Google Calendar logic.
  - Uses `process.env.CALENDAR_ID` and `process.env.GOOGLE_PUBLIC_API_KEY` to call `calendar.events.list`.
  - Returns a simple `{ meetings } | { message } | { error }` object.
- `src/tools/calendarTool.js`  
  - Defines `registerCalendarTools(server)`.
  - Registers the MCP tool `getMyCalendarDataByDate` and delegates to `calendarService`.

This separation keeps your **business logic** (calendar fetching) independent from the **MCP wiring**, so it’s easy to test or reuse.

---

## 6. Project architecture

At a high level, the system looks like this:

```text
MCP Client (e.g. Cursor)
        │
        │  calls tool: getMyCalendarDataByDate
        ▼
MCP Server (index.js)
        │
        │  delegates registration / validation
        ▼
Tool Layer (src/tools/calendarTool.js)
        │
        │  calls service function
        ▼
Service Layer (src/services/calendarService.js)
        │
        │  uses env: CALENDAR_ID, GOOGLE_PUBLIC_API_KEY
        │  calls Google Calendar API (calendar.events.list)
        ▼
Google Calendar API → Your public Google Calendar
```

- **MCP client** only knows about the tool name and its JSON schema.
- **MCP server (index.js)** only wires transports and calls `registerCalendarTools`.
- **Tool layer** is responsible for schema, validation, and formatting MCP responses.
- **Service layer** is responsible for Google Calendar details and error handling.

This layering makes it easy to:

- Add more tools that reuse the same service functions.
- Swap the Google auth method (e.g. to OAuth) without touching the MCP wiring.

---

## 7. How it works (under the hood)

End‑to‑end flow for a tool call:

1. Your MCP client calls `getMyCalendarDataByDate` with `{ "date": "2026-03-01" }`.
2. `index.js` has already created a `McpServer` and called `registerCalendarTools(server)`.
3. `src/tools/calendarTool.js` receives the request, validates the `date` with `zod`, and calls `getMyCalendarDataByDate(date)`.
4. `src/services/calendarService.js`:
   - Builds a Google Calendar client with `auth: process.env.GOOGLE_PUBLIC_API_KEY`.
   - Calls `calendar.events.list` for `process.env.CALENDAR_ID` between midnight–midnight of that date.
   - Maps results to readable strings like `"Title at 2026-03-01T15:30:00+01:00"`.
5. The MCP tool returns those results as a JSON string in the `content` block.

You generally don’t need to touch this wiring unless you want to:

- Add more tools (e.g. “this week’s meetings”).
- Change how results are formatted or filtered.
- Swap the auth method from **API key** to **OAuth**.

---

## 8. Running as an MCP server

### Generic (any MCP‑compatible client)

Configure your MCP client to run this server with:

- **Command**: `node index.js`
- **Working directory**: the cloned project folder

The server exposes one tool:

- **Name**: `getMyCalendarDataByDate`
- **Input schema**:

  ```json
  { "date": "2026-03-01" }
  ```

- **Output**: a `text` block containing JSON with either `meetings`, a `message`, or an `error`.

### Example tool call

Request payload:

```json
{
  "date": "2026-03-01"
}
```

Possible response content:

```json
{
  "meetings": [
    "test meeting at 2026-03-01T15:30:00+01:00"
  ]
}
```

---

## 9. Troubleshooting

- **Error: `Google API Error: Not Found`**
  - The `CALENDAR_ID` is wrong, **or**
  - The calendar is **not public** / not shared with the world.

- **No meetings returned, but you know you have events**
  - Check that the events on that date are **on the correct calendar**.
  - Ensure event visibility is not more restrictive than the calendar’s public setting.

- **`Invalid date format` error from the tool**
  - Make sure you send a valid date string, e.g. `"2026-03-01"`.

If you get stuck, double‑check:

- `.env` values (`CALENDAR_ID`, `GOOGLE_PUBLIC_API_KEY`)
- That the correct calendar is public in Google Calendar settings
- That the Google Calendar API is enabled for your API key

---

## 10. Extending this project

Ideas for improvements:

- Add a **“this week’s meetings”** tool.
- Support **multiple calendars** and merge events.
- Add optional **filters** (only meetings with certain keywords, only work hours, etc.).
- Implement **OAuth** for private calendars instead of a public API key.

Feel free to fork and adapt Calendar Buddy MCP to your own workflow.