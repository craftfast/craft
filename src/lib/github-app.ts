import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

/**
 * GitHub App utilities for authentication and token management
 */

// Cache for JWT to avoid regenerating frequently
let cachedJwt: { token: string; expiresAt: number } | null = null;

/**
 * Get the GitHub App private key from environment
 */
function getPrivateKey(): string {
    const privateKeyEnv = process.env.GITHUB_APP_PRIVATE_KEY;

    if (!privateKeyEnv) {
        throw new Error("GITHUB_APP_PRIVATE_KEY is not configured");
    }

    // Check if it's a file path or the actual key
    if (privateKeyEnv.startsWith("-----BEGIN")) {
        // It's the actual key (possibly with \n escaped)
        return privateKeyEnv.replace(/\\n/g, "\n");
    }

    // It's a file path - read the file
    const keyPath = path.resolve(process.cwd(), privateKeyEnv);

    if (!fs.existsSync(keyPath)) {
        throw new Error(`GitHub App private key file not found: ${keyPath}`);
    }

    return fs.readFileSync(keyPath, "utf-8");
}

/**
 * Generate a JWT for GitHub App authentication
 * JWTs are used to get installation access tokens
 */
export function generateAppJwt(): string {
    const now = Math.floor(Date.now() / 1000);

    // Return cached JWT if still valid (with 30 second buffer)
    if (cachedJwt && cachedJwt.expiresAt > now + 30) {
        return cachedJwt.token;
    }

    const appId = process.env.GITHUB_APP_ID;
    if (!appId) {
        throw new Error("GITHUB_APP_ID is not configured");
    }

    const privateKey = getPrivateKey();

    // JWT expires in 10 minutes (max allowed by GitHub)
    const expiresAt = now + 600;

    const header = {
        alg: "RS256",
        typ: "JWT",
    };

    const payload = {
        iat: now - 60, // Issued 60 seconds ago to account for clock drift
        exp: expiresAt,
        iss: appId,
    };

    // Base64url encode
    const base64UrlEncode = (obj: object): string => {
        return Buffer.from(JSON.stringify(obj))
            .toString("base64")
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    };

    const headerEncoded = base64UrlEncode(header);
    const payloadEncoded = base64UrlEncode(payload);
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;

    // Sign with RSA-SHA256
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(signatureInput);
    const signature = sign
        .sign(privateKey, "base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    const jwt = `${signatureInput}.${signature}`;

    // Cache the JWT
    cachedJwt = { token: jwt, expiresAt };

    return jwt;
}

/**
 * Get an installation access token for a specific installation
 * Installation tokens are used for API calls on behalf of an installation
 */
export async function getInstallationToken(installationId: number): Promise<{
    token: string;
    expiresAt: Date;
}> {
    const jwt = generateAppJwt();

    const response = await fetch(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("Failed to get installation token:", error);
        throw new Error(`Failed to get installation token: ${error.message || response.statusText}`);
    }

    const data = await response.json();

    return {
        token: data.token,
        expiresAt: new Date(data.expires_at),
    };
}

/**
 * Get app info using the JWT
 */
export async function getAppInfo(): Promise<{
    id: number;
    slug: string;
    name: string;
    html_url: string;
}> {
    const jwt = generateAppJwt();

    const response = await fetch("https://api.github.com/app", {
        headers: {
            Authorization: `Bearer ${jwt}`,
            Accept: "application/vnd.github.v3+json",
        },
    });

    if (!response.ok) {
        throw new Error("Failed to get app info");
    }

    return response.json();
}

/**
 * List all installations for the app
 */
export async function listInstallations(): Promise<
    Array<{
        id: number;
        account: { login: string; type: string };
        repository_selection: string;
    }>
> {
    const jwt = generateAppJwt();

    const response = await fetch("https://api.github.com/app/installations", {
        headers: {
            Authorization: `Bearer ${jwt}`,
            Accept: "application/vnd.github.v3+json",
        },
    });

    if (!response.ok) {
        throw new Error("Failed to list installations");
    }

    return response.json();
}

/**
 * Get installation for a specific user
 */
export async function getUserInstallation(username: string): Promise<{
    id: number;
    account: { login: string };
    repository_selection: string;
    permissions: Record<string, string>;
} | null> {
    const jwt = generateAppJwt();

    const response = await fetch(
        `https://api.github.com/users/${username}/installation`,
        {
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    );

    if (response.status === 404) {
        return null; // User hasn't installed the app
    }

    if (!response.ok) {
        throw new Error("Failed to get user installation");
    }

    return response.json();
}

/**
 * Exchange OAuth code for user access token (GitHub App OAuth flow)
 */
export async function exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    token_type: string;
    scope: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
}> {
    const clientId = process.env.GITHUB_APP_CLIENT_ID;
    const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("GitHub App OAuth credentials not configured");
    }

    const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to exchange code for token");
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error_description || data.error);
    }

    return data;
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    token_type: string;
    scope: string;
    refresh_token: string;
    expires_in: number;
    refresh_token_expires_in: number;
}> {
    const clientId = process.env.GITHUB_APP_CLIENT_ID;
    const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("GitHub App OAuth credentials not configured");
    }

    const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to refresh token");
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error_description || data.error);
    }

    return data;
}

/**
 * Get the GitHub App installation URL for a user to install the app
 */
export function getInstallationUrl(state?: string): string {
    const appSlug = process.env.GITHUB_APP_SLUG || "craft-code-sync";
    let url = `https://github.com/apps/${appSlug}/installations/new`;

    if (state) {
        url += `?state=${encodeURIComponent(state)}`;
    }

    return url;
}

/**
 * Get the OAuth authorization URL for GitHub App
 */
export function getOAuthUrl(state: string): string {
    const clientId = process.env.GITHUB_APP_CLIENT_ID;
    const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    const redirectUri = `${baseUrl}/api/integrations/github/callback`;

    if (!clientId) {
        throw new Error("GITHUB_APP_CLIENT_ID is not configured");
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Get a valid access token for GitHub API calls
 * Uses installation token if available (preferred), falls back to user OAuth token
 * Returns both the token and whether it's an installation token
 */
export async function getValidGitHubToken(integration: {
    installationId: number | null;
    accessToken: string;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
    refreshTokenExpiresAt: Date | null;
}): Promise<{ token: string; isInstallationToken: boolean }> {
    // If we have an installation ID, use the installation token (preferred)
    // Installation tokens have the permissions defined in the GitHub App
    if (integration.installationId) {
        try {
            const installationToken = await getInstallationToken(integration.installationId);
            return { token: installationToken.token, isInstallationToken: true };
        } catch (error) {
            console.error("Failed to get installation token, falling back to user token:", error);
            // Fall through to use user's OAuth token
        }
    }

    // Fall back to user's OAuth token
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    // Check if token is expired or about to expire
    if (
        integration.tokenExpiresAt &&
        integration.tokenExpiresAt.getTime() < now.getTime() + bufferTime
    ) {
        // Token is expired, try to refresh
        if (!integration.refreshToken) {
            throw new Error("GitHub token expired. Please reconnect GitHub.");
        }

        // Check if refresh token is also expired
        if (
            integration.refreshTokenExpiresAt &&
            integration.refreshTokenExpiresAt.getTime() < now.getTime()
        ) {
            throw new Error("GitHub refresh token expired. Please reconnect GitHub.");
        }

        const newTokens = await refreshAccessToken(integration.refreshToken);
        return { token: newTokens.access_token, isInstallationToken: false };
    }

    return { token: integration.accessToken, isInstallationToken: false };
}

/**
 * Get a user OAuth token (not installation token) for user-specific operations
 * Some operations like creating repos require user authentication
 */
export async function getUserOAuthToken(integration: {
    accessToken: string;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
    refreshTokenExpiresAt: Date | null;
}): Promise<string> {
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    // Check if token is expired or about to expire
    if (
        integration.tokenExpiresAt &&
        integration.tokenExpiresAt.getTime() < now.getTime() + bufferTime
    ) {
        // Token is expired, try to refresh
        if (!integration.refreshToken) {
            throw new Error("GitHub token expired. Please reconnect GitHub.");
        }

        // Check if refresh token is also expired
        if (
            integration.refreshTokenExpiresAt &&
            integration.refreshTokenExpiresAt.getTime() < now.getTime()
        ) {
            throw new Error("GitHub refresh token expired. Please reconnect GitHub.");
        }

        const newTokens = await refreshAccessToken(integration.refreshToken);
        return newTokens.access_token;
    }

    return integration.accessToken;
}
