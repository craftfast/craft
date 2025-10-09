# AI Integration Setup Guide

This guide explains how to set up the AI-powered coding assistant in Craft.

## Overview

Craft uses **OpenRouter** to access multiple AI models:

- **Claude Sonnet 4.5** - For main coding tasks (building components, features, logic)
- **Grok-4 Fast** - For smaller tasks (naming, quick questions, general queries)

## Setup Steps

### 1. Get Your OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to **Keys** section
4. Create a new API key
5. Copy your API key

### 2. Configure Environment Variables

1. Open `.env` in your project root
2. Add your OpenRouter API key:

```bash
# OpenRouter API Key (for Claude Sonnet 4.5 and Grok-4 Fast)
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# AI Models (default values, you can change these)
CLAUDE_MODEL=anthropic/claude-sonnet-4.5
GROK_MODEL=x-ai/grok-4-fast
```

### 3. Available Models on OpenRouter

You can use any model available on OpenRouter. Some popular options:

**For Coding Tasks:**

- `anthropic/claude-sonnet-4.5` (recommended)
- `anthropic/claude-3-opus`
- `openai/gpt-4-turbo`
- `meta-llama/llama-3.1-70b-instruct`

**For Quick Tasks:**

- `x-ai/grok-4-fast` (recommended for speed)
- `openai/gpt-3.5-turbo`
- `anthropic/claude-3-haiku`

Check [OpenRouter Models](https://openrouter.ai/models) for the full list.

### 4. Test the Integration

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to a project in the coding interface
3. Try sending a message in the chat panel
4. You should see responses from Claude!

## Task Type Detection

The system automatically detects the type of task and uses the appropriate model:

- **Coding Tasks**: Uses Claude Sonnet 4.5
  - Keywords: create, build, implement, add, update, fix, component, api, etc.
- **Naming Tasks**: Uses Grok-4 Fast
  - Keywords: name this project, suggest a name, what should i call, etc.
- **General Tasks**: Uses Grok-4 Fast
  - Everything else (questions, explanations, etc.)

## Features

### Code Syntax Highlighting

- Automatic syntax highlighting for code blocks
- Supports all major programming languages
- Dark theme optimized

### Markdown Support

- Full GitHub Flavored Markdown (GFM)
- Tables, lists, links
- Inline code and code blocks

### Smart Responses

- Contextual understanding of your project
- Follows Craft design system guidelines
- TypeScript and Next.js 15 best practices

## Troubleshooting

### "Failed to process chat request"

- Check that your OpenRouter API key is correctly set in `.env`
- Ensure you have credits/balance in your OpenRouter account
- Verify the model names are correct

### No response or slow responses

- Check your internet connection
- OpenRouter may be experiencing high traffic
- Try a different model

### Code blocks not rendering properly

- Clear your browser cache
- Check that `highlight.js` styles are loading
- Ensure the markdown libraries are installed

## API Costs

OpenRouter charges per token. Approximate costs:

- Claude Sonnet 4.5: ~$3 per million tokens
- Grok-4 Fast: ~$0.50 per million tokens

Monitor your usage at [OpenRouter Dashboard](https://openrouter.ai/activity)

## Next Steps

Future enhancements planned:

- [ ] Conversation history saved to database
- [ ] File context sharing with AI
- [ ] Direct code editing from AI suggestions
- [ ] Live preview of generated code
- [ ] Multi-turn conversations with memory
- [ ] Custom system prompts per project

## Support

If you encounter issues:

1. Check the [OpenRouter Status](https://status.openrouter.ai/)
2. Review the console for error messages
3. Open an issue on GitHub with details
