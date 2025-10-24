/**
 * AI Tools for File Operations, Commands, and Database Management
 * 
 * This module defines all the tools that the AI can use to:
 * - Create, update, read, delete files (both in database and E2B sandbox)
 * - Execute shell commands in sandboxes
 * - Create and manage databases with Neon
 * 
 * Architecture:
 * 1. Files are stored in Project.codeFiles JSON field (primary source of truth)
 * 2. Files are synced to E2B sandbox for live preview
 * 3. All operations are atomic and tracked
 */

import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getNeonAPI, getNeonOrgIdForPlan, parseConnectionUri } from "@/lib/neon-api";
import { activeSandboxes } from "@/app/api/sandbox/[projectId]/route";

// ============================================================================
// FILE OPERATIONS TOOLS
// ============================================================================

/**
 * Generate or update multiple files in the project
 * 
 * This tool:
 * 1. Saves files to Project.codeFiles JSON (source of truth)
 * 2. Syncs files to E2B sandbox for live preview
 * 3. Creates file structure as needed
 */
export const generateFiles = tool({
    description: `Generate or update multiple files in the project. 
    Use this to create new files or modify existing ones.
    Files will be saved to the database and synced to the sandbox.
    
    Examples:
    - Create component: generateFiles([{path: "src/components/Button.tsx", content: "..."}])
    - Update page: generateFiles([{path: "src/app/page.tsx", content: "..."}])
    - Create multiple files at once for related features`,

    parameters: z.object({
        projectId: z.string().describe("The project ID"),
        files: z.array(z.object({
            path: z.string().describe("File path relative to project root (e.g., 'src/app/page.tsx')"),
            content: z.string().describe("The complete file content"),
        })).describe("Array of files to create or update"),
    }),

    // @ts-ignore - AI SDK v5 type inference issue
    execute: async ({ projectId, files }) => {
        console.log(`📝 AI Tool: generateFiles - ${files.length} file(s) for project ${projectId}`);

        try {
            // 1. Get current project and code files
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { codeFiles: true },
            });

            if (!project) {
                return {
                    success: false,
                    error: `Project not found: ${projectId}`,
                };
            }

            // Parse existing files (codeFiles is stored as JSON)
            const currentFiles = (project.codeFiles as Record<string, string>) || {};

            // Update files
            for (const { path, content } of files) {
                currentFiles[path] = content;
                console.log(`  ✅ Updated in memory: ${path}`);
            }

            // 2. Save back to database
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    codeFiles: currentFiles,
                    updatedAt: new Date(),
                    lastCodeUpdateAt: new Date(),
                },
            });

            console.log(`  ✅ Saved ${files.length} file(s) to database`);

            // 3. Sync to sandbox if one is running
            const sandboxData = activeSandboxes?.get(projectId);
            if (sandboxData?.sandbox) {
                const sandbox = sandboxData.sandbox;

                await Promise.all(
                    // @ts-ignore - Type inference issue with destructuring
                    files.map(async ({ path, content }) => {
                        const fullPath = `/home/user/project/${path}`;
                        await sandbox.files.write(fullPath, content);
                        console.log(`  ✅ Synced to sandbox: ${path}`);
                    })
                );
            } else {
                console.log(`  ℹ️  No active sandbox - files saved to DB only`);
            } return {
                success: true,
                filesCreated: files.length,
                // @ts-ignore - Type inference issue with map
                files: files.map(f => ({
                    path: f.path,
                    size: f.content.length,
                })),
            };

        } catch (error) {
            console.error("❌ Error in generateFiles:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to generate files",
            };
        }
    },
});

/**
 * Read a file's content from the database
 */
export const readFile = tool({
    description: `Read the content of a specific file from the project.
    Use this when you need to see the current content of a file before modifying it.`,

    parameters: z.object({
        projectId: z.string().describe("The project ID"),
        path: z.string().describe("File path relative to project root (e.g., 'src/app/page.tsx')"),
    }),

    // @ts-ignore - AI SDK v5 type inference issue
    execute: async ({ projectId, path }) => {
        console.log(`📖 AI Tool: readFile - ${path} from project ${projectId}`);

        try {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { codeFiles: true },
            });

            if (!project) {
                return {
                    success: false,
                    error: `Project not found: ${projectId}`,
                };
            }

            const files = (project.codeFiles as Record<string, string>) || {};
            const content = files[path];

            if (!content) {
                return {
                    success: false,
                    error: `File not found: ${path}`,
                };
            }

            return {
                success: true,
                path,
                content,
                size: content.length,
            };

        } catch (error) {
            console.error("❌ Error in readFile:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to read file",
            };
        }
    },
});

/**
 * List all files in the project
 */
export const listFiles = tool({
    description: `List all files in the project with their paths and sizes.
    Use this to get an overview of the project structure.`,

    parameters: z.object({
        projectId: z.string().describe("The project ID"),
    }),

    // @ts-ignore - AI SDK v5 type inference issue
    execute: async ({ projectId }) => {
        console.log(`📂 AI Tool: listFiles - project ${projectId}`);

        try {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { codeFiles: true },
            });

            if (!project) {
                return {
                    success: false,
                    error: `Project not found: ${projectId}`,
                };
            }

            const files = (project.codeFiles as Record<string, string>) || {};
            const fileList = Object.entries(files).map(([path, content]) => ({
                path,
                size: content.length,
            }));

            return {
                success: true,
                totalFiles: fileList.length,
                files: fileList,
            };

        } catch (error) {
            console.error("❌ Error in listFiles:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to list files",
            };
        }
    },
});

/**
 * Delete a file from both database and sandbox
 */
export const deleteFile = tool({
    description: `Delete a file from the project.
    Use this when a file is no longer needed.
    The file will be removed from both the database and the sandbox.`,

    parameters: z.object({
        projectId: z.string().describe("The project ID"),
        path: z.string().describe("File path relative to project root (e.g., 'src/components/OldComponent.tsx')"),
    }),

    // @ts-ignore - AI SDK v5 type inference issue
    execute: async ({ projectId, path }) => {
        console.log(`🗑️  AI Tool: deleteFile - ${path} from project ${projectId}`);

        try {
            // 1. Get current files
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { codeFiles: true },
            });

            if (!project) {
                return {
                    success: false,
                    error: `Project not found: ${projectId}`,
                };
            }

            const files = (project.codeFiles as Record<string, string>) || {};

            if (!files[path]) {
                return {
                    success: false,
                    error: `File not found: ${path}`,
                };
            }

            // 2. Delete from files object
            delete files[path];

            // 3. Save back to database
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    codeFiles: files,
                    updatedAt: new Date(),
                },
            });

            console.log(`  ✅ Deleted from DB: ${path}`);

            // 4. Delete from sandbox if running
            const sandboxData = activeSandboxes?.get(projectId);
            if (sandboxData?.sandbox) {
                const sandbox = sandboxData.sandbox;
                const fullPath = `/home/user/project/${path}`;

                try {
                    await sandbox.files.remove(fullPath);
                    console.log(`  ✅ Deleted from sandbox: ${path}`);
                } catch (sandboxError) {
                    console.warn(`  ⚠️  Could not delete from sandbox: ${sandboxError}`);
                    // Non-critical error - file is deleted from DB
                }
            }

            return {
                success: true,
                path,
                message: `Successfully deleted ${path}`,
            };

        } catch (error) {
            console.error("❌ Error in deleteFile:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to delete file",
            };
        }
    },
});

// ============================================================================
// COMMAND EXECUTION TOOL
// ============================================================================

/**
 * Run a shell command in the E2B sandbox
 * 
 * This tool allows the AI to:
 * - Install packages (npm install, pnpm add)
 * - Run build commands
 * - Execute tests
 * - Start dev servers
 * - Any other shell command needed
 */
export const runCommand = tool({
    description: `Execute a shell command in the project's sandbox environment.
    Use this to:
    - Install npm packages: "pnpm add package-name"
    - Run build commands: "pnpm build"
    - Start dev server: "pnpm dev" (for testing, not for production)
    - Execute any shell command needed for the project
    
    The command runs in /home/user/project directory.
    Returns stdout, stderr, and exit code.`,

    parameters: z.object({
        projectId: z.string().describe("The project ID"),
        command: z.string().describe("The shell command to execute (e.g., 'pnpm add react-icons')"),
    }),

    // @ts-ignore - AI SDK v5 type inference issue
    execute: async ({ projectId, command }) => {
        console.log(`💻 AI Tool: runCommand - "${command}" in project ${projectId}`);

        try {
            // Get the active sandbox
            const sandboxData = activeSandboxes?.get(projectId);
            if (!sandboxData?.sandbox) {
                return {
                    success: false,
                    error: "No active sandbox found. Please start a preview first.",
                };
            }

            const sandbox = sandboxData.sandbox;

            // Execute command in the project directory
            const result = await sandbox.commands.run(`cd /home/user/project && ${command}`);

            const success = result.exitCode === 0;

            if (success) {
                console.log(`  ✅ Command successful (exit code ${result.exitCode})`);
            } else {
                console.error(`  ❌ Command failed (exit code ${result.exitCode})`);
            }

            return {
                success,
                exitCode: result.exitCode,
                stdout: result.stdout || "",
                stderr: result.stderr || "",
                command,
            };

        } catch (error) {
            console.error("❌ Error in runCommand:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to execute command",
                command,
            };
        }
    },
});

// ============================================================================
// DATABASE TOOLS
// ============================================================================

/**
 * Prisma schema templates for common use cases
 */
const PRISMA_TEMPLATES = {
    blog: `
// Blog Schema
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?
  posts Post[]
}
`,
    todo: `
// Todo App Schema
model Todo {
  id          String   @id @default(cuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  priority    String   @default("medium") // low, medium, high
  dueDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
`,
    ecommerce: `
// E-commerce Schema
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  image       String?
  stock       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Order {
  id         String   @id @default(cuid())
  total      Float
  status     String   @default("pending")
  createdAt  DateTime @default(now())
  items      OrderItem[]
}

model OrderItem {
  id        String  @id @default(cuid())
  order     Order   @relation(fields: [orderId], references: [id])
  orderId   String
  productId String
  quantity  Int
  price     Float
}
`,
};

/**
 * Create a new Neon database with Prisma schema
 */
export const createDatabase = tool({
    description: `Create a new PostgreSQL database using Neon with an optional Prisma schema.
    
    The database will be:
    - Created in Neon (serverless PostgreSQL)
    - Configured with a connection string
    - Initialized with Prisma schema if provided
    
    You can provide:
    - A custom Prisma schema
    - A template name (blog, todo, ecommerce)
    - Or leave schema empty for a blank database
    
    After creation, you'll need to:
    1. Save the connection string to .env.local
    2. Run "npx prisma generate" to generate the Prisma Client
    3. Run "npx prisma db push" to create the tables`,

    parameters: z.object({
        projectId: z.string().describe("The project ID"),
        databaseName: z.string().describe("Name for the database (e.g., 'blog-db', 'todo-app-db')"),
        schema: z.string().optional().describe("Prisma schema content, or template name (blog/todo/ecommerce)"),
    }),

    // @ts-ignore - AI SDK v5 type inference issue
    execute: async ({ projectId, databaseName, schema }) => {
        console.log(`🗄️  AI Tool: createDatabase - "${databaseName}" for project ${projectId}`);

        try {
            // Initialize Neon API
            const neonApi = getNeonAPI();

            // Create Neon project
            const neonProject = await neonApi.createProject(databaseName);

            if (!neonProject || !neonProject.connection_uris || neonProject.connection_uris.length === 0) {
                return {
                    success: false,
                    error: "Failed to create Neon database",
                };
            }

            const connectionUri = neonProject.connection_uris[0].connection_uri;
            const connectionParams = neonProject.connection_uris[0].connection_parameters;

            console.log(`  ✅ Neon database created: ${databaseName}`);

            // Save to our database
            await prisma.neonDatabase.create({
                data: {
                    projectId,
                    neonProjectId: neonProject.project.id,
                    neonBranchId: neonProject.branch.id,
                    connectionUri,
                    host: connectionParams?.host || "",
                    database: connectionParams?.database || "",
                    user: connectionParams?.role || "",
                    password: "", // We don't store passwords for security
                    region: neonProject.project.region_id,
                    pgVersion: neonProject.project.pg_version,
                    status: "active",
                },
            });

            // Prepare Prisma schema if needed
            let prismaSchema = schema;

            // Check if schema is a template name
            if (schema && schema in PRISMA_TEMPLATES) {
                prismaSchema = PRISMA_TEMPLATES[schema as keyof typeof PRISMA_TEMPLATES];
            }

            // If we have a schema, create the Prisma files
            if (prismaSchema) {
                // Get current project files
                const project = await prisma.project.findUnique({
                    where: { id: projectId },
                    select: { codeFiles: true },
                });

                if (project) {
                    const files = (project.codeFiles as Record<string, string>) || {};

                    // Create prisma/schema.prisma
                    const schemaContent = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

${prismaSchema}
`.trim();

                    files["prisma/schema.prisma"] = schemaContent;

                    // Create .env.local with connection string
                    const envContent = `DATABASE_URL="${connectionUri}"`;
                    files[".env.local"] = envContent;

                    // Save back to database
                    await prisma.project.update({
                        where: { id: projectId },
                        data: {
                            codeFiles: files,
                            updatedAt: new Date(),
                        },
                    });

                    console.log(`  ✅ Prisma schema and .env.local created`);
                }
            }

            return {
                success: true,
                databaseName,
                connectionString: connectionUri,
                schemaCreated: !!prismaSchema,
                nextSteps: prismaSchema
                    ? [
                        "Connection string saved to .env.local",
                        "Run: npx prisma generate",
                        "Run: npx prisma db push",
                    ]
                    : [
                        "Database created successfully",
                        "Connection string: " + connectionUri,
                    ],
            };

        } catch (error) {
            console.error("❌ Error in createDatabase:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create database",
            };
        }
    },
});

/**
 * Create a branch of an existing database (for testing, staging, etc.)
 */
export const createDatabaseBranch = tool({
    description: `Create a branch of an existing Neon database.
    
    Database branches are useful for:
    - Testing schema changes without affecting production
    - Creating isolated environments for development
    - Running tests against production-like data
    
    The branch will be a copy of the parent database at the time of creation.`,

    parameters: z.object({
        projectId: z.string().describe("The project ID"),
        branchName: z.string().describe("Name for the branch (e.g., 'development', 'testing')"),
    }),

    // @ts-ignore - AI SDK v5 type inference issue
    execute: async ({ projectId, branchName }) => {
        console.log(`🌿 AI Tool: createDatabaseBranch - "${branchName}" for project ${projectId}`);

        try {
            // Get the project's database
            const neonDb = await prisma.neonDatabase.findUnique({
                where: { projectId },
            });

            if (!neonDb) {
                return {
                    success: false,
                    error: "No database found for this project. Create one first.",
                };
            }

            // Create branch using Neon API
            const neonApi = getNeonAPI();
            const branchResult = await neonApi.createBranch(
                neonDb.neonProjectId,
                branchName,
                neonDb.neonBranchId || undefined
            );

            if (!branchResult || !branchResult.branch) {
                return {
                    success: false,
                    error: "Failed to create database branch",
                };
            }

            console.log(`  ✅ Database branch created: ${branchName}`);

            return {
                success: true,
                branchName,
                branchId: branchResult.branch.id,
                message: `Branch "${branchName}" created successfully`,
            };

        } catch (error) {
            console.error("❌ Error in createDatabaseBranch:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create database branch",
            };
        }
    },
});

// ============================================================================
// EXPORT ALL TOOLS
// ============================================================================

export const tools = {
    generateFiles,
    readFile,
    listFiles,
    deleteFile,
    runCommand,
    createDatabase,
    createDatabaseBranch,
};
