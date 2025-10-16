import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { getSmartModel, logModelSelection } from "@/lib/ai/model-router";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Create OpenRouter client
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
});

// Types for message content
interface TextContent {
    type: 'text';
    text: string;
}

interface ImageUrlContent {
    type: 'image_url';
    image_url: { url?: string };
}

type MessageContent = string | (TextContent | ImageUrlContent)[];

export async function POST(req: Request) {
    try {
        const { messages, taskType, projectFiles } = await req.json();

        // Get the last user message for analysis
        const lastUserMessage = messages
            .filter((m: { role: string }) => m.role === 'user')
            .pop();

        const userMessageText = typeof lastUserMessage?.content === 'string'
            ? lastUserMessage.content
            : Array.isArray(lastUserMessage?.content)
                ? lastUserMessage.content.find((c: { type: string }) => c.type === 'text')?.text || ''
                : '';

        // Use smart router to determine the best model
        const { model: modelName, modelName: displayName, analysis } = getSmartModel(
            userMessageText,
            projectFiles || {},
            messages.slice(0, -1) // conversation history before last message
        );

        // Log the routing decision
        logModelSelection(displayName, analysis, userMessageText);

        // Get environment-aware system prompt
        const systemPrompt = getSystemPrompt(taskType || 'coding', projectFiles);

        // Convert messages to AI SDK format
        const formattedMessages = messages.map((m: { role: string; content: MessageContent }) => {
            // Handle messages with image_url format (from frontend)
            if (Array.isArray(m.content)) {
                const textPart = m.content.find((c): c is TextContent => c.type === 'text');
                const imageParts = m.content.filter((c): c is ImageUrlContent => c.type === 'image_url');

                // If there are images with valid URLs
                if (imageParts.length > 0 && imageParts.some((p) => p.image_url?.url)) {
                    return {
                        role: m.role,
                        content: [
                            { type: 'text' as const, text: textPart?.text || '' },
                            ...imageParts
                                .filter((p) => p.image_url?.url) // Only include images with URLs
                                .map((p) => ({
                                    type: 'image' as const,
                                    image: p.image_url.url as string,
                                })),
                        ],
                    };
                }
                // Fallback to text only if images are missing URLs
                return {
                    role: m.role,
                    content: textPart?.text || (m.content[0] as TextContent)?.text || '',
                };
            }
            // Regular text-only messages
            return {
                role: m.role,
                content: m.content,
            };
        });

        // Check if any messages contain images
        const hasImages = formattedMessages.some((m: { content: unknown }) =>
            Array.isArray(m.content) && m.content.some((c: { type: string }) => c.type === 'image')
        );

        console.log(`🤖 AI Chat Request - Model: ${modelName}, Task: ${taskType || 'coding'}${hasImages ? ' (with images)' : ''}`);
        if (projectFiles && Object.keys(projectFiles).length > 0) {
            console.log(`📁 Context: ${Object.keys(projectFiles).length} existing project files`);
        }

        const result = streamText({
            model: openrouter.chat(modelName),
            system: systemPrompt,
            messages: formattedMessages,
        });

        // Use the official AI SDK method for streaming responses
        return result.toTextStreamResponse();
    } catch (error) {
        console.error("AI Chat Error:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to process chat request",
                details: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
