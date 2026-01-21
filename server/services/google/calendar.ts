
import axios from 'axios';

export class CalendarService {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    async getUpcomingEvents() {
        if (this.accessToken.startsWith('mock_')) {
            return {
                items: Array(3).fill(0).map((_, i) => ({
                    id: `evt_${i}`,
                    summary: `Mock Meeting ${i}`,
                    start: { dateTime: new Date(Date.now() + i * 86400000).toISOString() },
                    end: { dateTime: new Date(Date.now() + i * 86400000 + 3600000).toISOString() }
                }))
            };
        }

        const now = new Date().toISOString();
        const response = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=10&orderBy=startTime&singleEvents=true`, {
            headers: { Authorization: `Bearer ${this.accessToken}` }
        });
        return response.data;
    }
}
