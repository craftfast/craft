/**
 * User Memory Service
 * 
 * AI-powered memory system that learns from user interactions
 * and provides contextual information to improve AI responses.
 * 
 * MEMORY CATEGORIES:
 * - preference: User preferences (UI, workflow, style choices)
 * - skill: Technical skills and expertise areas
 * - project_context: Project-specific information and patterns
 * - workflow: How the user likes to work
 * - style: Coding style, design preferences
 * - technical: Tech stack, frameworks, tools
 * - personal: Personal information shared by user
 * 
 * MEMORY LIFECYCLE:
 * 1. Capture: Extract memories from conversations using AI
 * 2. Store: Save structured memories to database
 * 3. Retrieve: Get relevant memories for context
 * 4. Update: Merge similar or conflicting memories
 * 5. Prune: Remove outdated or low-value memories
 */

import { prisma } from "@/lib/db";
import { generateText } from "ai";
import { createXai } from "@ai-sdk/xai";

const xai = createXai({
    apiKey: process.env.XAI_API_KEY || "",
});

// ============================================================================
// MEMORY EXTRACTION (AI-Powered)
// ============================================================================

/**
 * Extract memories from a conversation using AI
 * Analyzes user messages to identify learnable information
 */
export async function extractMemoriesFromConversation(params: {
    userId: string;
    userMessage: string;
    assistantResponse?: string;
    projectId?: string;
}): Promise<{
    memories: Array<{
        category: string;
        title: string;
        content: string;
        importance: number;
        confidence: number;
        source: string;
    }>;
}> {
    const { userId, userMessage, assistantResponse, projectId } = params;

    try {
        // Use Grok 4 Fast for memory extraction (cheap, fast)
        const model = xai("grok-4-fast");

        const extractionPrompt = `Analyze this conversation and extract any memorable information about the user that would help improve future AI assistance.

User message: ${userMessage}
${assistantResponse ? `Assistant response: ${assistantResponse}` : ""}

Extract memories in the following categories:
- **preference**: UI/workflow/style preferences (e.g., "prefers dark mode", "likes minimal designs")
- **skill**: Technical skills or expertise (e.g., "experienced with React", "learning TypeScript")
- **project_context**: Project-specific info (e.g., "building e-commerce site", "prefers Next.js")
- **workflow**: How they work (e.g., "prefers TDD", "likes to iterate quickly")
- **style**: Coding/design style (e.g., "functional programming", "uses Tailwind")
- **technical**: Tech stack (e.g., "uses PostgreSQL", "deploys to Vercel")
- **personal**: Personal info they shared (e.g., "works at startup", "timezone PST")

Respond with JSON array:
[
  {
    "category": "preference|skill|project_context|workflow|style|technical|personal",
    "title": "Brief title (3-5 words)",
    "content": "Detailed memory (1-2 sentences)",
    "importance": 1-10,
    "confidence": 0.0-1.0,
    "reason": "Why this is worth remembering"
  }
]

ONLY extract if:
1. Information is specific and actionable
2. Would help improve future interactions
3. Is not temporary/transient information

If nothing worth remembering, return: []`;

        const result = await generateText({
            model,
            prompt: extractionPrompt,
            maxOutputTokens: 1000,
        });

        // Parse AI response
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return { memories: [] };
        }

        const extractedMemories = JSON.parse(jsonMatch[0]);

        // Filter and structure memories
        const memories = extractedMemories
            .filter((m: { confidence: number }) => m.confidence >= 0.6) // Only confident memories
            .map((m: { category: string; title: string; content: string; importance: number; confidence: number }) => ({
                category: m.category,
                title: m.title,
                content: m.content,
                importance: Math.min(10, Math.max(1, m.importance)),
                confidence: Math.min(1, Math.max(0, m.confidence)),
                source: "inferred",
            }));

        return { memories };
    } catch (error) {
        console.error("❌ Memory extraction failed:", error);
        return { memories: [] };
    }
}

/**
 * Automatically capture memories from conversation
 * Called after each AI interaction
 */
export async function captureMemoriesFromConversation(params: {
    userId: string;
    userMessage: string;
    assistantResponse?: string;
    projectId?: string;
}): Promise<number> {
    const { userId, projectId } = params;

    // Extract memories using AI
    const { memories } = await extractMemoriesFromConversation(params);

    if (memories.length === 0) {
        return 0;
    }

    // Check for duplicates and save new memories
    let savedCount = 0;

    for (const memory of memories) {
        // Check if similar memory exists
        const existing = await prisma.userMemory.findFirst({
            where: {
                userId,
                category: memory.category,
                isActive: true,
                OR: [
                    { title: { contains: memory.title, mode: "insensitive" } },
                    { content: { contains: memory.content, mode: "insensitive" } },
                ],
            },
        });

        if (existing) {
            // Update existing memory if new one is more confident
            if (memory.confidence > existing.confidence) {
                await prisma.userMemory.update({
                    where: { id: existing.id },
                    data: {
                        title: memory.title,
                        content: memory.content,
                        importance: memory.importance,
                        confidence: memory.confidence,
                        updatedAt: new Date(),
                    },
                });
                console.log(`🔄 Updated memory: ${memory.title}`);
            }
        } else {
            // Create new memory
            await prisma.userMemory.create({
                data: {
                    userId,
                    projectId,
                    category: memory.category,
                    title: memory.title,
                    content: memory.content,
                    importance: memory.importance,
                    confidence: memory.confidence,
                    source: memory.source,
                    isActive: true,
                },
            });
            savedCount++;
            console.log(`✅ New memory: ${memory.title}`);
        }
    }

    return savedCount;
}

// ============================================================================
// MEMORY RETRIEVAL
// ============================================================================

/**
 * Get relevant memories for a given context
 * Returns most important and recently used memories
 */
export async function getRelevantMemories(params: {
    userId: string;
    projectId?: string;
    category?: string;
    limit?: number;
}): Promise<Array<{
    id: string;
    category: string;
    title: string;
    content: string;
    importance: number;
    useCount: number;
}>> {
    const { userId, projectId, category, limit = 10 } = params;

    const memories = await prisma.userMemory.findMany({
        where: {
            userId,
            isActive: true,
            ...(projectId && { projectId }),
            ...(category && { category }),
        },
        orderBy: [
            { importance: "desc" },
            { lastUsedAt: "desc" },
            { createdAt: "desc" },
        ],
        take: limit,
        select: {
            id: true,
            category: true,
            title: true,
            content: true,
            importance: true,
            useCount: true,
        },
    });

    // Update last used timestamp
    if (memories.length > 0) {
        await prisma.userMemory.updateMany({
            where: {
                id: { in: memories.map((m) => m.id) },
            },
            data: {
                lastUsedAt: new Date(),
                useCount: { increment: 1 },
            },
        });
    }

    return memories;
}

/**
 * Get all memories for a user (for UI display)
 */
export async function getAllUserMemories(userId: string) {
    return prisma.userMemory.findMany({
        where: {
            userId,
            isActive: true,
        },
        orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
    });
}

type Memory = {
    id: string;
    category: string;
    title: string;
    content: string;
    importance: number;
    useCount: number;
    [key: string]: unknown;
};

/**
 * Get memories grouped by category
 */
export async function getMemoriesByCategory(userId: string) {
    const memories = await getAllUserMemories(userId);

    return memories.reduce(
        (acc: Record<string, Memory[]>, memory) => {
            if (!acc[memory.category]) {
                acc[memory.category] = [];
            }
            acc[memory.category].push(memory);
            return acc;
        },
        {} as Record<string, typeof memories>
    );
}

// ============================================================================
// MEMORY MANAGEMENT
// ============================================================================

/**
 * Create a memory manually (user-provided)
 */
export async function createMemory(params: {
    userId: string;
    category: string;
    title: string;
    content: string;
    importance?: number;
    projectId?: string;
}) {
    return prisma.userMemory.create({
        data: {
            userId: params.userId,
            category: params.category,
            title: params.title,
            content: params.content,
            importance: params.importance || 5,
            confidence: 1.0, // User-provided = 100% confident
            source: "explicit",
            projectId: params.projectId,
            isActive: true,
        },
    });
}

/**
 * Update an existing memory
 */
export async function updateMemory(
    memoryId: string,
    data: {
        title?: string;
        content?: string;
        importance?: number;
        category?: string;
    }
) {
    return prisma.userMemory.update({
        where: { id: memoryId },
        data,
    });
}

/**
 * Deactivate a memory (soft delete)
 */
export async function deactivateMemory(memoryId: string) {
    return prisma.userMemory.update({
        where: { id: memoryId },
        data: { isActive: false },
    });
}

/**
 * Delete a memory permanently
 */
export async function deleteMemory(memoryId: string) {
    return prisma.userMemory.delete({
        where: { id: memoryId },
    });
}

/**
 * Clear all memories for a user
 */
export async function clearAllMemories(userId: string) {
    return prisma.userMemory.deleteMany({
        where: { userId },
    });
}

// ============================================================================
// MEMORY FORMATTING FOR AI
// ============================================================================

/**
 * Format memories for inclusion in AI system prompt
 */
export function formatMemoriesForPrompt(
    memories: Array<{
        category: string;
        title: string;
        content: string;
        importance: number;
    }>
): string {
    if (memories.length === 0) {
        return "";
    }

    // Group by category
    const grouped = memories.reduce(
        (acc, memory) => {
            if (!acc[memory.category]) {
                acc[memory.category] = [];
            }
            acc[memory.category].push(memory);
            return acc;
        },
        {} as Record<string, typeof memories>
    );

    const categoryNames: Record<string, string> = {
        preference: "User Preferences",
        skill: "Skills & Expertise",
        project_context: "Project Context",
        workflow: "Workflow Preferences",
        style: "Style Preferences",
        technical: "Tech Stack",
        personal: "Personal Information",
    };

    let formatted = "\n## 🧠 User Memory (Context from Past Interactions)\n\n";

    for (const [category, categoryMemories] of Object.entries(grouped)) {
        formatted += `### ${categoryNames[category] || category}\n`;
        for (const memory of categoryMemories) {
            formatted += `- **${memory.title}**: ${memory.content}\n`;
        }
        formatted += "\n";
    }

    return formatted;
}
