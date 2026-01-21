
import axios from 'axios';

export class GoogleAuthService {
    private static readonly AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private static readonly TOKEN_URL = 'https://oauth2.googleapis.com/token';

    static getAuthUrl(service: 'gmail' | 'calendar' | 'drive', redirectUri: string, state: string): string {
        let scope = '';
        switch (service) {
            case 'gmail':
                scope = 'https://www.googleapis.com/auth/gmail.readonly';
                break;
            case 'calendar':
                scope = 'https://www.googleapis.com/auth/calendar.readonly';
                break;
            case 'drive':
                scope = 'https://www.googleapis.com/auth/drive.readonly';
                break;
        }

        const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: scope,
            access_type: 'offline',
            state: state,
            prompt: 'consent'
        });

        return `${this.AUTH_URL}?${params.toString()}`;
    }

    static async exchangeCode(code: string, redirectUri: string): Promise<any> {
        // In a real env, we'd POST to Google. 
        // For this demo, if credentials are missing, we'll return a mock token.
        if (!process.env.GOOGLE_CLIENT_SECRET) {
            console.log('⚠️ No GOOGLE_CLIENT_SECRET found, returning mock token user.');
            return {
                access_token: 'mock_google_access_token_' + Date.now(),
                refresh_token: 'mock_google_refresh_token',
                expires_in: 3600,
                token_type: 'Bearer'
            };
        }

        const response = await axios.post(this.TOKEN_URL, {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        });

        return response.data;
    }

    static async getUserProfile(accessToken: string): Promise<any> {
        if (accessToken.startsWith('mock_')) {
            return {
                email: 'demo@example.com',
                name: 'Demo User',
                picture: 'https://github.com/shadcn.png'
            };
        }

        const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data;
    }
}
