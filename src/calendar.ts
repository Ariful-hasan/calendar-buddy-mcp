import { google } from "googleapis";

/**
 * Fetch calendar events between two ISO datetimes
 */
export async function getEventsInRange(
  start: string,
  end: string
) {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  return response.data.items ?? [];
}