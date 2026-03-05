
import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema, InsertConnection } from "../../shared/schema";
import { z } from "zod";
import { GoogleAuthService } from "../services/google/auth";
import { sendError } from "../utils/errors";
import axios from "axios";
import crypto from "crypto";

export const authRouter = Router();

/**
 * Simple password hashing using crypto (avoids adding bcrypt dependency).
 * Uses PBKDF2 with a random salt.
 */
function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
    // Support legacy plain-text passwords during migration
    if (!stored.includes(':')) {
        return password === stored;
    }
    const [salt, hash] = stored.split(':');
    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === testHash;
}

// USER ROUTES
authRouter.post('/api/register', async (req, res) => {
    try {
        const userData = insertUserSchema.parse(req.body);

        // Check if user already exists
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser) {
            return sendError(res, 409, "Username already exists");
        }

        // Hash password before storing
        const hashedUserData = {
            ...userData,
            password: hashPassword(userData.password)
        };

        const user = await storage.createUser(hashedUserData);

        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: "Invalid user data", details: error.errors });
        }
        sendError(res, 500, "Failed to create user", error);
    }
});

authRouter.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return sendError(res, 400, "Username and password are required");
        }

        if (typeof username !== 'string' || typeof password !== 'string') {
            return sendError(res, 400, "Username and password must be strings");
        }

        const user = await storage.getUserByUsername(username);

        if (!user || !verifyPassword(password, user.password)) {
            return sendError(res, 401, "Invalid username or password");
        }

        // In a real app, you would set up a session or JWT here
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        sendError(res, 500, "Login failed", error);
    }
});

// OAUTH ROUTES
authRouter.get('/api/auth/:service', (req, res) => {
    const service = req.params.service;

    // Create a cryptographically secure state parameter to prevent CSRF attacks
    const state = crypto.randomBytes(16).toString('hex');

    switch (service) {
        case 'github':
            if (process.env.GITHUB_CLIENT_ID) {
                const scopes = 'repo read:user user:email';
                const redirectUri = process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
                const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;

                res.redirect(authUrl);
            } else {
                sendError(res, 500, "GitHub client ID not configured");
            }
            break;

        case 'slack':
            res.json({
                auth_url: "https://slack.com/oauth/v2/authorize",
                required_params: ["client_id", "scope", "redirect_uri"]
            });
            break;

        case 'notion':
            res.json({
                auth_url: "https://api.notion.com/v1/oauth/authorize",
                required_params: ["client_id", "response_type", "redirect_uri"]
            });
            break;

        case 'linear':
            res.json({
                auth_url: "https://linear.app/oauth/authorize",
                required_params: ["client_id", "redirect_uri", "scope", "response_type"]
            });
            break;

        case 'gdrive':
            res.json({
                auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
                required_params: ["client_id", "redirect_uri", "response_type", "scope"]
            });
            break;

        case 'gmail':
        case 'gcal': {
            const googleServiceType = service === 'gmail' ? 'gmail' : 'calendar';
            const googleRedirectUri = process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/${service}/callback`;
            const googleAuthUrl = GoogleAuthService.getAuthUrl(googleServiceType, googleRedirectUri, state);
            res.redirect(googleAuthUrl);
            break;
        }

        case 'discord': {
            const discordRedirectUri = process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/discord/callback`;
            const discordScope = 'identify guilds';
            const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID || 'dummy_id'}&redirect_uri=${encodeURIComponent(discordRedirectUri)}&response_type=code&scope=${encodeURIComponent(discordScope)}&state=${state}`;

            if (!process.env.DISCORD_CLIENT_ID) {
                res.redirect(`${discordRedirectUri}?code=mock_discord_code&state=${state}`);
            } else {
                res.redirect(discordAuthUrl);
            }
            break;
        }

        default:
            sendError(res, 400, `Unsupported service: ${service}`);
    }
});

authRouter.get('/api/auth/:service/callback', async (req, res) => {
    const service = req.params.service;
    const code = req.query.code as string;

    if (!code) {
        return sendError(res, 400, "Missing authorization code");
    }

    const userId = req.user?.id ?? 1;

    if (service === 'github') {
        try {
            const tokenResponse = await axios.post(
                'https://github.com/login/oauth/access_token',
                {
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/github/callback`,
                },
                {
                    headers: { Accept: 'application/json' },
                }
            );

            const accessToken = tokenResponse.data.access_token;

            if (!accessToken) {
                throw new Error('Failed to obtain access token');
            }

            const userResponse = await axios.get('https://api.github.com/user', {
                headers: {
                    Authorization: `token ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            const user = userResponse.data;

            const connection: InsertConnection = {
                userId,
                name: `${user.name || user.login}'s GitHub`,
                service: 'github',
                credentials: { token: accessToken },
                active: true,
            };

            const newConnection = await storage.createConnection(connection);

            await storage.createDataSource({
                connectionId: newConnection.id,
                name: 'GitHub Repositories',
                sourceId: 'repos',
                sourceType: 'repository',
                config: { username: user.login },
            });

            await storage.createActivity({
                userId,
                type: 'connection_created',
                description: `Connected to GitHub as ${user.login}`,
                metadata: { service: 'github', username: user.login },
            });

            res.redirect('/?github=success');
        } catch (error) {
            console.error('GitHub OAuth error:', error);
            res.redirect('/?github=error');
        }
    } else if (service === 'gmail' || service === 'gcal') {
        try {
            const redirectUri = process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/${service}/callback`;
            const tokenData = await GoogleAuthService.exchangeCode(code, redirectUri);
            const userProfile = await GoogleAuthService.getUserProfile(tokenData.access_token);

            const connectionName = `${userProfile.name || userProfile.email}'s ${service === 'gmail' ? 'Gmail' : 'Google Calendar'}`;

            const connection: InsertConnection = {
                userId,
                name: connectionName,
                service: service,
                credentials: {
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    email: userProfile.email
                },
                active: true,
            };

            await storage.createConnection(connection);

            await storage.createActivity({
                userId,
                type: 'connection_created',
                description: `Connected to ${service === 'gmail' ? 'Gmail' : 'Google Calendar'} as ${userProfile.email}`,
                metadata: { service, email: userProfile.email }
            });

            res.redirect(`/?${service}=success`);
        } catch (error) {
            console.error(`${service} OAuth error:`, error);
            res.redirect(`/?${service}=error`);
        }
    } else if (service === 'discord') {
        try {
            let accessToken = 'mock_discord_token';
            let discordUser = { username: 'DemoDiscordUser', id: '123' };

            if (code !== 'mock_discord_code') {
                console.log('Real Discord exchange not implemented in this demo, using mock.');
            }

            const connection: InsertConnection = {
                userId,
                name: `${discordUser.username}'s Discord`,
                service: 'discord',
                credentials: { token: accessToken },
                active: true,
            };

            await storage.createConnection(connection);

            await storage.createActivity({
                userId,
                type: 'connection_created',
                description: `Connected to Discord as ${discordUser.username}`,
                metadata: { service: 'discord', username: discordUser.username }
            });

            res.redirect('/?discord=success');
        } catch (error) {
            console.error('Discord OAuth error:', error);
            res.redirect('/?discord=error');
        }
    } else {
        res.json({
            message: `Received authorization code for ${service}`,
            note: "This is a demo implementation. In a real app, this would exchange the code for access tokens."
        });
    }
});
