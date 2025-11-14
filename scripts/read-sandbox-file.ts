import { Sandbox } from '@e2b/code-interpreter';

const sandboxId = process.argv[2];
const filePath = process.argv[3];

if (!sandboxId || !filePath) {
    console.error('Usage: npx tsx scripts/read-sandbox-file.ts <sandboxId> <filePath>');
    process.exit(1);
}

async function main() {
    try {
        const sandbox = await Sandbox.connect(sandboxId);
        const content = await sandbox.files.read(filePath);
        console.log(content);
        // Don't kill - let E2B auto-pause handle it
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
