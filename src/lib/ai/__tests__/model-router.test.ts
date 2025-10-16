/**
 * Smart Model Router - Test Examples
 * 
 * Run this file to see how the router makes decisions:
 * node src/lib/ai/__tests__/model-router.test.ts
 */

import { analyzeMessageComplexity, getSmartModel } from '../model-router';

console.log('🧪 Testing Smart Model Router\n');
console.log('='.repeat(80));

// Test cases
const testCases = [
    {
        name: "Simple styling change",
        message: "Change the button color to blue",
        files: {} as Record<string, string>,
        history: [] as Array<{ role: string; content: string }>
    },
    {
        name: "Complex authentication",
        message: "Build a user authentication system with JWT tokens and password hashing",
        files: {} as Record<string, string>,
        history: [] as Array<{ role: string; content: string }>
    },
    {
        name: "Simple question",
        message: "What is React?",
        files: {} as Record<string, string>,
        history: [] as Array<{ role: string; content: string }>
    },
    {
        name: "Architecture task",
        message: "Refactor this code using the repository pattern and dependency injection",
        files: {} as Record<string, string>,
        history: [] as Array<{ role: string; content: string }>
    },
    {
        name: "Large project context",
        message: "Add a contact form",
        files: {
            'src/app/page.tsx': 'code...',
            'src/app/layout.tsx': 'code...',
            'src/components/Header.tsx': 'code...',
            'src/components/Footer.tsx': 'code...',
            'src/lib/utils.ts': 'code...',
        } as Record<string, string>,
        history: [] as Array<{ role: string; content: string }>
    },
    {
        name: "Long complex message",
        message: "Create a comprehensive e-commerce platform with user authentication, product catalog, shopping cart, payment processing using Stripe, order management, admin dashboard, email notifications, and real-time inventory tracking. Make sure to implement proper error handling and validation throughout.",
        files: {} as Record<string, string>,
        history: [] as Array<{ role: string; content: string }>
    },
    {
        name: "Simple UI update",
        message: "Center the heading",
        files: {} as Record<string, string>,
        history: [] as Array<{ role: string; content: string }>
    },
    {
        name: "Real-time feature",
        message: "Add WebSocket support for live chat",
        files: {} as Record<string, string>,
        history: [] as Array<{ role: string; content: string }>
    },
    {
        name: "Basic text change",
        message: "Update the welcome message to say Hello World",
        files: {} as Record<string, string>,
        history: [] as Array<{ role: string; content: string }>
    },
    {
        name: "Performance optimization",
        message: "Optimize this sorting algorithm for better performance with large datasets",
        files: {} as Record<string, string>,
        history: [] as Array<{ role: string; content: string }>
    }
];

// Run tests
testCases.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log('-'.repeat(80));
    console.log(`Message: "${test.message.substring(0, 60)}${test.message.length > 60 ? '...' : ''}"`);
    console.log(`Files: ${Object.keys(test.files).length}`);

    const analysis = analyzeMessageComplexity(test.message, test.files, test.history);
    const { modelName } = getSmartModel(test.message, test.files, test.history);

    const icon = analysis.useHaiku ? '⚡' : '🧠';
    const costRange = analysis.useHaiku ? '$1-5/1M' : '$3-15/1M';

    console.log(`\n${icon} Model: ${modelName}`);
    console.log(`   Complexity: ${analysis.complexity}`);
    console.log(`   Cost Range: ${costRange}`);
    console.log(`   Reasoning: ${analysis.reasoning}`);
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ All tests completed!');

// Statistics
const haikuCount = testCases.filter(test => {
    const analysis = analyzeMessageComplexity(test.message, test.files, test.history);
    return analysis.useHaiku;
}).length;

const sonnetCount = testCases.length - haikuCount;
const haikuPercentage = Math.round((haikuCount / testCases.length) * 100);

console.log('\n📊 Statistics:');
console.log(`   Haiku 4.5:  ${haikuCount}/${testCases.length} (${haikuPercentage}%) - Fast & Cheap ⚡`);
console.log(`   Sonnet 4.5: ${sonnetCount}/${testCases.length} (${100 - haikuPercentage}%) - Smart & Powerful 🧠`);
console.log(`\n💰 Expected cost savings: ${haikuPercentage}% of requests use cheaper model`);
