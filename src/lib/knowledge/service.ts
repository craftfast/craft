/**
 * Knowledge Base Service
 * Manages project knowledge files and provides context for AI
 */

import { prisma } from "@/lib/db";

export interface KnowledgeContext {
    textFiles: Array<{
        name: string;
        content: string;
        description?: string;
    }>;
    imageFiles: Array<{
        name: string;
        url: string;
        description?: string;
        mimeType: string;
    }>;
    documentFiles: Array<{
        name: string;
        url: string;
        description?: string;
        mimeType: string;
    }>;
}

/**
 * Get knowledge files for a project, organized by type
 */
export async function getProjectKnowledge(projectId: string): Promise<KnowledgeContext> {
    const knowledgeFiles = await prisma.knowledgeFile.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        select: {
            name: true,
            r2Url: true,
            mimeType: true,
            description: true,
            textContent: true,
        },
    });

    const textFiles: KnowledgeContext["textFiles"] = [];
    const imageFiles: KnowledgeContext["imageFiles"] = [];
    const documentFiles: KnowledgeContext["documentFiles"] = [];

    for (const file of knowledgeFiles) {
        // Image files (Figma exports, mockups, wireframes)
        if (file.mimeType.startsWith("image/")) {
            imageFiles.push({
                name: file.name,
                url: file.r2Url,
                description: file.description || undefined,
                mimeType: file.mimeType,
            });
        }
        // Text files with stored content (PRDs, docs, markdown)
        else if (file.textContent) {
            textFiles.push({
                name: file.name,
                content: file.textContent,
                description: file.description || undefined,
            });
        }
        // Other documents (PDFs without extracted text)
        else {
            documentFiles.push({
                name: file.name,
                url: file.r2Url,
                description: file.description || undefined,
                mimeType: file.mimeType,
            });
        }
    }

    return { textFiles, imageFiles, documentFiles };
}

/**
 * Format knowledge context for inclusion in AI system prompt
 * Only includes text-based knowledge (images handled separately in messages)
 */
export function formatKnowledgeForPrompt(knowledge: KnowledgeContext): string {
    const parts: string[] = [];

    // Add text files (PRDs, documentation, etc.)
    if (knowledge.textFiles.length > 0) {
        parts.push("## 📚 Project Knowledge Base\n");
        parts.push("The following documents provide important context for this project:\n");

        for (const file of knowledge.textFiles) {
            parts.push(`### ${file.name}`);
            if (file.description) {
                parts.push(`*${file.description}*\n`);
            }
            parts.push("```");
            // Limit content to avoid excessive token usage
            const maxLength = 10000;
            if (file.content.length > maxLength) {
                parts.push(file.content.substring(0, maxLength));
                parts.push(`\n... [truncated - ${file.content.length - maxLength} more characters]`);
            } else {
                parts.push(file.content);
            }
            parts.push("```\n");
        }
    }

    // Note about available images (for reference)
    if (knowledge.imageFiles.length > 0) {
        parts.push("\n## 🖼️ Design Reference Images\n");
        parts.push("The following design files are available for this project:\n");
        for (const file of knowledge.imageFiles) {
            const desc = file.description ? ` - ${file.description}` : "";
            parts.push(`- **${file.name}**${desc}`);
        }
        parts.push("\n*Note: When the user asks about implementing designs, request they share the relevant image in the chat.*\n");
    }

    // Note about other documents
    if (knowledge.documentFiles.length > 0) {
        parts.push("\n## 📄 Other Documents\n");
        parts.push("Additional documents available (not yet parsed):\n");
        for (const file of knowledge.documentFiles) {
            const desc = file.description ? ` - ${file.description}` : "";
            parts.push(`- **${file.name}** (${file.mimeType})${desc}`);
        }
    }

    return parts.join("\n");
}

/**
 * Get image URLs from knowledge base for inclusion in AI messages
 * Useful when user wants to reference design files
 */
export async function getKnowledgeImageUrls(
    projectId: string,
    fileNames?: string[]
): Promise<Array<{ name: string; url: string; description?: string }>> {
    const where = fileNames
        ? {
            projectId,
            name: { in: fileNames },
            mimeType: { startsWith: "image/" },
        }
        : {
            projectId,
            mimeType: { startsWith: "image/" },
        };

    const images = await prisma.knowledgeFile.findMany({
        where,
        select: {
            name: true,
            r2Url: true,
            description: true,
        },
    });

    return images.map((img) => ({
        name: img.name,
        url: img.r2Url,
        description: img.description || undefined,
    }));
}
