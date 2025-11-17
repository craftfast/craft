import { prisma } from '../src/lib/db';

const projectId = process.argv[2];
const filePath = process.argv[3] || 'src/app/page.tsx';

if (!projectId) {
    console.error('Usage: npx tsx scripts/read-db-file.ts <projectId> [filePath]');
    process.exit(1);
}

async function main() {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { codeFiles: true },
    });

    if (!project) {
        console.error(`Project ${projectId} not found`);
        process.exit(1);
    }

    const files = project.codeFiles as Record<string, string> | null;

    if (!files) {
        console.error('No files in project');
        process.exit(1);
    }

    const content = files[filePath];

    if (!content) {
        console.error(`File ${filePath} not found`);
        console.error('\nAvailable files:');
        Object.keys(files).forEach(f => console.log(`  - ${f}`));
        process.exit(1);
    }

    console.log(content);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
