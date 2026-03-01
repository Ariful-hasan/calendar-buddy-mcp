import { google } from "googleapis";

export const getMyCalendarDataByDate = async (date) => {
    const calendar = google.calendar({
      version: "v3",
      auth: process.env.GOOGLE_PUBLIC_API_KEY,
    });
  
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
  
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
  
    try {
      const res = await calendar.events.list({
        calendarId: process.env.CALENDAR_ID,
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
        key: process.env.GOOGLE_PUBLIC_API_KEY,
      });
  
      const events = res.data.items || [];
  
      if (events.length === 0) {
        return { message: `No public events found for ${date}. Ensure events are set to 'Public' and 'See all event details'.` };
      }
  
      const meetings = events.map((event) => {
        const startTime = event.start?.dateTime || event.start?.date;
        const title = event.summary || "Private/Busy Event";
        return `${title} at ${startTime}`;
      });
  
      return { meetings };
    } catch (err) {
      return { error: `Google API Error: ${err.message}` };
    }
  }