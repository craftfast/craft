/**
 * Personalization utilities for AI system prompts
 */

export interface UserPersonalization {
    responseTone?: string | null;
    customInstructions?: string | null;
    occupation?: string | null;
    techStack?: string | null;
    enableMemory?: boolean;
    referenceChatHistory?: boolean;
    enableWebSearch?: boolean;
    enableImageGeneration?: boolean;
}

/**
 * Format user personalization settings into a system prompt section
 */
export function formatPersonalizationForPrompt(
    personalization?: UserPersonalization | null
): string {
    if (!personalization) return "";

    const sections: string[] = [];

    // Response Tone
    if (personalization.responseTone && personalization.responseTone !== "default") {
        const toneInstructions: Record<string, string> = {
            concise: "Keep responses brief and to-the-point. Avoid lengthy explanations unless necessary.",
            detailed: "Provide thorough, comprehensive explanations with examples and additional context.",
            encouraging: "Use positive, supportive language. Celebrate progress and provide constructive feedback.",
            professional: "Maintain a formal, technical tone. Focus on best practices and industry standards.",
        };

        const instruction = toneInstructions[personalization.responseTone];
        if (instruction) {
            sections.push(`## Response Style\n${instruction}`);
        }
    }

    // Custom Instructions
    if (personalization.customInstructions?.trim()) {
        sections.push(`## Custom Instructions\n${personalization.customInstructions.trim()}`);
    }

    // Developer Profile
    const profileParts: string[] = [];
    if (personalization.occupation?.trim()) {
        profileParts.push(`- **Role**: ${personalization.occupation.trim()}`);
    }
    if (personalization.techStack?.trim()) {
        profileParts.push(`- **Tech Stack**: ${personalization.techStack.trim()}`);
    }
    if (profileParts.length > 0) {
        sections.push(`## Developer Profile\n${profileParts.join("\n")}`);
    }

    return sections.length > 0 ? `\n${sections.join("\n\n")}\n` : "";
}

/**
 * Get tone-specific guidance for AI responses
 */
export function getToneGuidance(tone?: string | null): string {
    if (!tone || tone === "default") return "";

    const guidance: Record<string, string> = {
        concise: "Be brief and direct.",
        detailed: "Provide comprehensive explanations.",
        encouraging: "Be supportive and positive.",
        professional: "Maintain formal technical communication.",
    };

    return guidance[tone] || "";
}
