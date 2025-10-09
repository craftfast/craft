// Utility functions for AI chat integration

export type TaskType = "coding" | "naming" | "general";

/**
 * Detects the type of task from user input
 * This helps determine which AI model to use
 */
export function detectTaskType(input: string): TaskType {
    const lowerInput = input.toLowerCase();

    // Naming-related keywords
    const namingKeywords = [
        "name this project",
        "suggest a name",
        "what should i call",
        "naming",
        "rename",
        "project name",
    ];

    // Coding-related keywords
    const codingKeywords = [
        "create",
        "build",
        "implement",
        "add",
        "update",
        "fix",
        "change",
        "component",
        "function",
        "api",
        "database",
        "style",
        "layout",
        "page",
        "route",
    ];

    // Check for naming task
    if (namingKeywords.some((keyword) => lowerInput.includes(keyword))) {
        return "naming";
    }

    // Check for coding task
    if (codingKeywords.some((keyword) => lowerInput.includes(keyword))) {
        return "coding";
    }

    // Default to general for questions and other queries
    return "general";
}

/**
 * Formats code blocks in markdown for better display
 */
export function formatCodeBlocks(content: string): string {
    // Add syntax highlighting markers if not present
    return content.replace(/```(\w+)?\n/g, (match, lang) => {
        return lang ? match : "```tsx\n";
    });
}

/**
 * Extracts code from markdown code blocks
 */
export function extractCode(content: string): string[] {
    const codeBlocks: string[] = [];
    const regex = /```(?:\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        codeBlocks.push(match[1]);
    }

    return codeBlocks;
}
