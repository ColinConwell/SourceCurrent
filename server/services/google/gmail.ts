
import axios from 'axios';

export class GmailService {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    async getProfile() {
        if (this.accessToken.startsWith('mock_')) {
            return { emailAddress: 'demo@example.com', messagesTotal: 1250 };
        }
        const response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
            headers: { Authorization: `Bearer ${this.accessToken}` }
        });
        return response.data;
    }

    async getDesignatedLabel(labelId: 'INBOX' | 'SENT' | 'TRASH') {
        if (this.accessToken.startsWith('mock_')) {
            return {
                messages: Array(5).fill(0).map((_, i) => ({
                    id: `msg_${i}`,
                    snippet: `This is a mock email message ${i}`,
                    payload: { headers: [{ name: 'Subject', value: `Mock Email ${i}` }] }
                }))
            };
        }

        // 1. List messages
        const listResponse = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=${labelId}&maxResults=10`, {
            headers: { Authorization: `Bearer ${this.accessToken}` }
        });

        const messages = listResponse.data.messages || [];
        const details = [];

        // 2. Fetch details for top 5 (batching would be better in prod)
        for (const msg of messages.slice(0, 5)) {
            const detail = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                headers: { Authorization: `Bearer ${this.accessToken}` }
            });
            details.push(detail.data);
        }

        return { messages: details };
    }
}
