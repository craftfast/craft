import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Simple ZIP file creator without external dependencies
 * Creates a valid ZIP archive from a map of files
 */
function createZipBuffer(files: Record<string, string>): Buffer {
    const entries: Buffer[] = [];
    const centralDirectory: Buffer[] = [];
    let offset = 0;

    const fileEntries = Object.entries(files);

    for (const [filePath, content] of fileEntries) {
        const fileNameBuffer = Buffer.from(filePath, 'utf-8');
        const fileContentBuffer = Buffer.from(content, 'utf-8');
        const crc32 = calculateCRC32(fileContentBuffer);

        // Local file header
        const localHeader = Buffer.alloc(30 + fileNameBuffer.length);
        localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
        localHeader.writeUInt16LE(20, 4); // Version needed to extract
        localHeader.writeUInt16LE(0, 6); // General purpose bit flag
        localHeader.writeUInt16LE(0, 8); // Compression method (0 = stored)
        localHeader.writeUInt16LE(0, 10); // File last modification time
        localHeader.writeUInt16LE(0, 12); // File last modification date
        localHeader.writeUInt32LE(crc32, 14); // CRC-32
        localHeader.writeUInt32LE(fileContentBuffer.length, 18); // Compressed size
        localHeader.writeUInt32LE(fileContentBuffer.length, 22); // Uncompressed size
        localHeader.writeUInt16LE(fileNameBuffer.length, 26); // File name length
        localHeader.writeUInt16LE(0, 28); // Extra field length
        fileNameBuffer.copy(localHeader, 30);

        entries.push(localHeader);
        entries.push(fileContentBuffer);

        // Central directory header
        const centralHeader = Buffer.alloc(46 + fileNameBuffer.length);
        centralHeader.writeUInt32LE(0x02014b50, 0); // Central directory header signature
        centralHeader.writeUInt16LE(20, 4); // Version made by
        centralHeader.writeUInt16LE(20, 6); // Version needed to extract
        centralHeader.writeUInt16LE(0, 8); // General purpose bit flag
        centralHeader.writeUInt16LE(0, 10); // Compression method
        centralHeader.writeUInt16LE(0, 12); // File last modification time
        centralHeader.writeUInt16LE(0, 14); // File last modification date
        centralHeader.writeUInt32LE(crc32, 16); // CRC-32
        centralHeader.writeUInt32LE(fileContentBuffer.length, 20); // Compressed size
        centralHeader.writeUInt32LE(fileContentBuffer.length, 24); // Uncompressed size
        centralHeader.writeUInt16LE(fileNameBuffer.length, 28); // File name length
        centralHeader.writeUInt16LE(0, 30); // Extra field length
        centralHeader.writeUInt16LE(0, 32); // File comment length
        centralHeader.writeUInt16LE(0, 34); // Disk number start
        centralHeader.writeUInt16LE(0, 36); // Internal file attributes
        centralHeader.writeUInt32LE(0, 38); // External file attributes
        centralHeader.writeUInt32LE(offset, 42); // Relative offset of local header
        fileNameBuffer.copy(centralHeader, 46);

        centralDirectory.push(centralHeader);
        offset += localHeader.length + fileContentBuffer.length;
    }

    // End of central directory record
    const centralDirSize = centralDirectory.reduce((sum, buf) => sum + buf.length, 0);
    const endOfCentralDir = Buffer.alloc(22);
    endOfCentralDir.writeUInt32LE(0x06054b50, 0); // End of central directory signature
    endOfCentralDir.writeUInt16LE(0, 4); // Number of this disk
    endOfCentralDir.writeUInt16LE(0, 6); // Disk where central directory starts
    endOfCentralDir.writeUInt16LE(fileEntries.length, 8); // Number of central directory records on this disk
    endOfCentralDir.writeUInt16LE(fileEntries.length, 10); // Total number of central directory records
    endOfCentralDir.writeUInt32LE(centralDirSize, 12); // Size of central directory
    endOfCentralDir.writeUInt32LE(offset, 16); // Offset of start of central directory
    endOfCentralDir.writeUInt16LE(0, 20); // Comment length

    return Buffer.concat([...entries, ...centralDirectory, endOfCentralDir]);
}

/**
 * Calculate CRC-32 checksum for ZIP file validation
 */
function calculateCRC32(buffer: Buffer): number {
    let crc = 0xFFFFFFFF;
    const table = getCRC32Table();

    for (let i = 0; i < buffer.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xFF];
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
}

let crc32Table: number[] | null = null;

function getCRC32Table(): number[] {
    if (crc32Table) return crc32Table;

    crc32Table = [];
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crc32Table[i] = c >>> 0;
    }
    return crc32Table;
}

/**
 * Generate a complete Next.js project structure from code files
 */
function generateProjectFiles(
    projectName: string,
    codeFiles: Record<string, string>,
    description?: string | null
): Record<string, string> {
    const files: Record<string, string> = {};

    // Add all code files from the project
    for (const [path, content] of Object.entries(codeFiles)) {
        files[path] = content;
    }

    // Generate package.json if not present
    if (!files['package.json']) {
        files['package.json'] = JSON.stringify({
            name: projectName.toLowerCase().replace(/[^a-z0-9]/gi, '-'),
            version: "0.1.0",
            private: true,
            scripts: {
                dev: "next dev",
                build: "next build",
                start: "next start",
                lint: "next lint"
            },
            dependencies: {
                "next": "16.0.10",
                "react": "19.2.3",
                "react-dom": "19.2.3"
            },
            devDependencies: {
                "@types/node": "^20",
                "@types/react": "^19",
                "@types/react-dom": "^19",
                "typescript": "^5",
                "@tailwindcss/postcss": "^4",
                "tailwindcss": "^4"
            }
        }, null, 2);
    }

    // Generate README.md
    files['README.md'] = `# ${projectName}

${description || 'A project built with Craft.'}

## Getting Started

First, install dependencies:

\`\`\`bash
npm install
# or
pnpm install
# or
yarn install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
pnpm dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4

## Built with Craft

This project was created using [Craft](https://craft.fast) - the AI-powered vibecoding tool.
`;

    // Generate .gitignore if not present
    if (!files['.gitignore']) {
        files['.gitignore'] = `# Dependencies
node_modules
.pnpm-store

# Next.js
.next
out

# Production
build
dist

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.idea
.vscode
*.swp
*.swo
.DS_Store
`;
    }

    // Generate tsconfig.json if not present
    if (!files['tsconfig.json']) {
        files['tsconfig.json'] = JSON.stringify({
            compilerOptions: {
                target: "ES2017",
                lib: ["dom", "dom.iterable", "esnext"],
                allowJs: true,
                skipLibCheck: true,
                strict: true,
                noEmit: true,
                esModuleInterop: true,
                module: "esnext",
                moduleResolution: "bundler",
                resolveJsonModule: true,
                isolatedModules: true,
                jsx: "preserve",
                incremental: true,
                plugins: [{ name: "next" }],
                paths: { "@/*": ["./src/*"] }
            },
            include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
            exclude: ["node_modules"]
        }, null, 2);
    }

    // Generate next.config.ts if not present
    if (!files['next.config.ts'] && !files['next.config.js'] && !files['next.config.mjs']) {
        files['next.config.ts'] = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
`;
    }

    // Generate postcss.config.mjs if not present
    if (!files['postcss.config.mjs'] && !files['postcss.config.js']) {
        files['postcss.config.mjs'] = `const config = {
  plugins: ["@tailwindcss/postcss"],
};
export default config;
`;
    }

    return files;
}

// GET /api/projects/[id]/export - Export project as ZIP
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        // Check for format query parameter
        const { searchParams } = new URL(req.url);
        const format = searchParams.get('format') || 'zip';

        // Get project
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        const codeFiles = (project.codeFiles as Record<string, string>) || {};
        const sanitizedName = project.name.replace(/[^a-z0-9]/gi, "_");

        // JSON format (legacy support)
        if (format === 'json') {
            // NOTE: Environment variables are intentionally NOT exported for security
            // They contain sensitive secrets and should be configured separately
            const exportData = {
                metadata: {
                    name: project.name,
                    description: project.description,
                    type: project.type,
                    version: project.version,
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt,
                },
                codeFiles: project.codeFiles,
                // environmentVariables intentionally excluded - contains secrets
                customViews: project.customViews,
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const buffer = Buffer.from(jsonString, "utf-8");

            return new NextResponse(buffer, {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Content-Disposition": `attachment; filename="${sanitizedName}.json"`,
                },
            });
        }

        // ZIP format (default) - creates a complete runnable project
        const projectFiles = generateProjectFiles(
            project.name,
            codeFiles,
            project.description
        );

        const zipBuffer = createZipBuffer(projectFiles);

        return new NextResponse(new Uint8Array(zipBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${sanitizedName}.zip"`,
                "Content-Length": zipBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Error exporting project:", error);
        return NextResponse.json(
            { error: "Failed to export project" },
            { status: 500 }
        );
    }
}
