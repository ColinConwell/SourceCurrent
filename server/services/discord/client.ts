
import axios from 'axios';

export class DiscordClient {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    async getUserInfo() {
        if (this.token.startsWith('mock_')) {
            return {
                id: '123456789',
                username: 'DemoDiscordUser',
                discriminator: '0000',
                avatar: null
            };
        }

        const response = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${this.token}` }
        });
        return response.data;
    }

    async getGuilds() {
        if (this.token.startsWith('mock_')) {
            return [
                { id: '1', name: 'Demo Server', icon: null },
                { id: '2', name: 'Community Server', icon: null }
            ];
        }

        const response = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${this.token}` }
        });
        return response.data;
    }
}
