/**
 * Figma API Service
 * Handles OAuth, file fetching, and image export from Figma
 */

const FIGMA_API_BASE = "https://api.figma.com/v1";
const FIGMA_OAUTH_BASE = "https://www.figma.com/oauth";

// Figma OAuth configuration
const FIGMA_CLIENT_ID = process.env.FIGMA_CLIENT_ID || "";
const FIGMA_CLIENT_SECRET = process.env.FIGMA_CLIENT_SECRET || "";
const FIGMA_REDIRECT_URI = `${process.env.BETTER_AUTH_URL}/api/integrations/figma/callback`;

// Types
export interface FigmaUser {
    id: string;
    email: string;
    handle: string;
    img_url: string;
}

export interface FigmaFile {
    key: string;
    name: string;
    thumbnail_url: string;
    last_modified: string;
}

export interface FigmaProject {
    id: string;
    name: string;
}

export interface FigmaTeam {
    id: string;
    name: string;
}

export interface FigmaNode {
    id: string;
    name: string;
    type: string;
    children?: FigmaNode[];
}

export interface FigmaFrame {
    id: string;
    name: string;
    type: string;
    absoluteBoundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface FigmaImageExport {
    nodeId: string;
    url: string;
}

export interface FigmaTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user_id: string;
}

/**
 * Get the Figma OAuth authorization URL
 */
export function getFigmaAuthUrl(state: string): string {
    const params = new URLSearchParams({
        client_id: FIGMA_CLIENT_ID,
        redirect_uri: FIGMA_REDIRECT_URI,
        scope: "files:read",
        state,
        response_type: "code",
    });

    return `${FIGMA_OAUTH_BASE}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeFigmaCodeForToken(code: string): Promise<FigmaTokenResponse> {
    const response = await fetch(`${FIGMA_OAUTH_BASE}/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: FIGMA_CLIENT_ID,
            client_secret: FIGMA_CLIENT_SECRET,
            redirect_uri: FIGMA_REDIRECT_URI,
            code,
            grant_type: "authorization_code",
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Figma token exchange error:", error);
        throw new Error(`Failed to exchange Figma code: ${response.status}`);
    }

    return response.json();
}

/**
 * Refresh Figma access token
 */
export async function refreshFigmaToken(refreshToken: string): Promise<FigmaTokenResponse> {
    const response = await fetch(`${FIGMA_OAUTH_BASE}/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: FIGMA_CLIENT_ID,
            client_secret: FIGMA_CLIENT_SECRET,
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to refresh Figma token: ${response.status}`);
    }

    return response.json();
}

/**
 * Get current Figma user
 */
export async function getFigmaUser(accessToken: string): Promise<FigmaUser> {
    const response = await fetch(`${FIGMA_API_BASE}/me`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get Figma user: ${response.status}`);
    }

    return response.json();
}

/**
 * Get user's recent files
 */
export async function getFigmaRecentFiles(accessToken: string): Promise<FigmaFile[]> {
    // Figma doesn't have a direct "recent files" endpoint, so we'll get files from projects
    // For now, we'll use the /me endpoint which includes recent files in some contexts
    // In production, you might want to store file keys that users have accessed

    const response = await fetch(`${FIGMA_API_BASE}/me`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get Figma files: ${response.status}`);
    }

    // The /me endpoint doesn't return files, so we return empty for now
    // Users will need to paste file URLs or browse teams/projects
    return [];
}

/**
 * Get files from a Figma team
 */
export async function getFigmaTeamProjects(accessToken: string, teamId: string): Promise<FigmaProject[]> {
    const response = await fetch(`${FIGMA_API_BASE}/teams/${teamId}/projects`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get Figma team projects: ${response.status}`);
    }

    const data = await response.json();
    return data.projects || [];
}

/**
 * Get files from a Figma project
 */
export async function getFigmaProjectFiles(accessToken: string, projectId: string): Promise<FigmaFile[]> {
    const response = await fetch(`${FIGMA_API_BASE}/projects/${projectId}/files`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get Figma project files: ${response.status}`);
    }

    const data = await response.json();
    return data.files || [];
}

/**
 * Get a Figma file's structure (pages, frames, components)
 */
export async function getFigmaFile(accessToken: string, fileKey: string): Promise<{
    name: string;
    lastModified: string;
    thumbnailUrl: string;
    document: FigmaNode;
}> {
    const response = await fetch(`${FIGMA_API_BASE}/files/${fileKey}?depth=2`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get Figma file: ${response.status}`);
    }

    const data = await response.json();
    return {
        name: data.name,
        lastModified: data.lastModified,
        thumbnailUrl: data.thumbnailUrl,
        document: data.document,
    };
}

/**
 * Get specific nodes from a Figma file
 */
export async function getFigmaNodes(
    accessToken: string,
    fileKey: string,
    nodeIds: string[]
): Promise<Record<string, FigmaNode>> {
    const ids = nodeIds.join(",");
    const response = await fetch(`${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${ids}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get Figma nodes: ${response.status}`);
    }

    const data = await response.json();
    return data.nodes || {};
}

/**
 * Export images from Figma nodes
 */
export async function exportFigmaImages(
    accessToken: string,
    fileKey: string,
    nodeIds: string[],
    options: {
        format?: "png" | "jpg" | "svg" | "pdf";
        scale?: number;
    } = {}
): Promise<FigmaImageExport[]> {
    const { format = "png", scale = 2 } = options;
    const ids = nodeIds.join(",");

    const response = await fetch(
        `${FIGMA_API_BASE}/images/${fileKey}?ids=${ids}&format=${format}&scale=${scale}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to export Figma images: ${response.status}`);
    }

    const data = await response.json();
    const images: FigmaImageExport[] = [];

    if (data.images) {
        for (const [nodeId, url] of Object.entries(data.images)) {
            if (url) {
                images.push({ nodeId, url: url as string });
            }
        }
    }

    return images;
}

/**
 * Parse a Figma URL to extract file key and node ID
 */
export function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
    try {
        const urlObj = new URL(url);

        // Handle different Figma URL formats:
        // https://www.figma.com/file/FILE_KEY/File-Name
        // https://www.figma.com/design/FILE_KEY/File-Name
        // https://www.figma.com/file/FILE_KEY/File-Name?node-id=NODE_ID

        const pathMatch = urlObj.pathname.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
        if (!pathMatch) return null;

        const fileKey = pathMatch[2];
        const nodeId = urlObj.searchParams.get("node-id") || undefined;

        return { fileKey, nodeId };
    } catch {
        return null;
    }
}

/**
 * Get frames from a Figma file (top-level frames in each page)
 */
export function extractFramesFromDocument(document: FigmaNode): FigmaFrame[] {
    const frames: FigmaFrame[] = [];

    function traverse(node: FigmaNode) {
        // CANVAS = Page, FRAME = Frame/Artboard
        if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
            frames.push({
                id: node.id,
                name: node.name,
                type: node.type,
            });
        }

        if (node.children) {
            for (const child of node.children) {
                traverse(child);
            }
        }
    }

    if (document.children) {
        for (const page of document.children) {
            if (page.children) {
                for (const child of page.children) {
                    traverse(child);
                }
            }
        }
    }

    return frames;
}

/**
 * Download an image from URL and return as buffer
 */
export async function downloadFigmaImage(imageUrl: string): Promise<Buffer> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
        throw new Error(`Failed to download Figma image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
