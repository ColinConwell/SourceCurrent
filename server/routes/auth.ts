
import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema, InsertConnection } from "../../shared/schema";
import { z } from "zod";
import { GoogleAuthService } from "../services/google/auth";
import axios from "axios";

export const authRouter = Router();

// USER ROUTES
authRouter.post('/api/register', async (req, res) => {
    try {
        const userData = insertUserSchema.parse(req.body);

        // Check if user already exists
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser) {
            return res.status(409).json({ message: "Username already exists" });
        }

        const user = await storage.createUser(userData);

        // Don't return the password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid user data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create user" });
    }
});

authRouter.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const user = await storage.getUserByUsername(username);

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // In a real app, you would set up a session or JWT here
        // For demo, just return the user without the password
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: "Login failed" });
    }
});

// OAUTH ROUTES
authRouter.get('/api/auth/:service', (req, res) => {
    const service = req.params.service;

    // Create a state parameter to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2, 15);

    // In a real app, this would redirect to the OAuth provider
    switch (service) {
        case 'github':
            // For GitHub, we'll actually implement the real OAuth flow
            if (process.env.GITHUB_CLIENT_ID) {
                const scopes = 'repo read:user user:email';
                const redirectUri = process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
                const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;

                res.redirect(authUrl);
            } else {
                res.status(500).json({ message: "GitHub client ID not configured" });
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
        case 'gcal':
            // Use our helper to generating the URL
            const googleServiceType = service === 'gmail' ? 'gmail' : 'calendar';
            const googleRedirectUri = process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/${service}/callback`;
            const googleAuthUrl = GoogleAuthService.getAuthUrl(googleServiceType, googleRedirectUri, state);
            res.redirect(googleAuthUrl);
            break;

        case 'discord':
            const discordRedirectUri = process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/discord/callback`;
            const discordScope = 'identify guilds';
            const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID || 'dummy_id'}&redirect_uri=${encodeURIComponent(discordRedirectUri)}&response_type=code&scope=${encodeURIComponent(discordScope)}&state=${state}`;

            if (!process.env.DISCORD_CLIENT_ID) {
                // Mock flow if no client ID
                res.redirect(`${discordRedirectUri}?code=mock_discord_code&state=${state}`);
            } else {
                res.redirect(discordAuthUrl);
            }
            break;

        default:
            res.status(400).json({ message: `Unsupported service: ${service}` });
    }
});

authRouter.get('/api/auth/:service/callback', async (req, res) => {
    // Handle OAuth callbacks for different services
    const service = req.params.service;
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code) {
        return res.status(400).json({ message: "Missing authorization code" });
    }

    // For GitHub, implement the full OAuth flow
    if (service === 'github') {
        try {
            // Exchange the code for an access token
            const tokenResponse = await axios.post(
                'https://github.com/login/oauth/access_token',
                {
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/github/callback`,
                },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            const accessToken = tokenResponse.data.access_token;

            if (!accessToken) {
                throw new Error('Failed to obtain access token');
            }

            // Get user info to create a meaningful connection name
            const userResponse = await axios.get('https://api.github.com/user', {
                headers: {
                    Authorization: `token ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            const user = userResponse.data;

            // Create a connection for this GitHub account
            const connection: InsertConnection = {
                userId: 1, // Demo user
                name: `${user.name || user.login}'s GitHub`,
                service: 'github',
                credentials: {
                    token: accessToken,
                },
                active: true,
            };

            const newConnection = await storage.createConnection(connection);

            // Create a data source for repositories
            await storage.createDataSource({
                connectionId: newConnection.id,
                name: 'GitHub Repositories',
                sourceId: 'repos',
                sourceType: 'repository',
                config: {
                    username: user.login,
                },
            });

            // Create an activity record
            await storage.createActivity({
                userId: 1,
                type: 'connection_created',
                description: `Connected to GitHub as ${user.login}`,
                metadata: {
                    service: 'github',
                    username: user.login,
                },
            });

            // Redirect to the dashboard with success message
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

            // Create connection
            const connection: InsertConnection = {
                userId: 1, // Demo user
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

            // Log activity
            await storage.createActivity({
                userId: 1,
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
            // Mock token exchange if code is mock
            let accessToken = 'mock_discord_token';
            let discordUser = { username: 'DemoDiscordUser', id: '123' };

            if (code !== 'mock_discord_code') {
                // Real exchange would go here
                // For now, let's assume if we got a real code we fail properly or mock it
                console.log('Real Discord exchange not implemented in this demo, using mock.');
            }

            const connection: InsertConnection = {
                userId: 1,
                name: `${discordUser.username}'s Discord`,
                service: 'discord',
                credentials: { token: accessToken },
                active: true,
            };

            await storage.createConnection(connection);

            await storage.createActivity({
                userId: 1,
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
        // For other services, we'd implement similar OAuth exchange flows
        res.json({
            message: `Received authorization code for ${service}`,
            note: "This is a demo implementation. In a real app, this would exchange the code for access tokens."
        });
    }
});
