import { prisma } from '../src/lib/db';

const projectId = process.argv[2];

if (!projectId) {
    console.error('Usage: npx tsx scripts/check-project-files.ts <projectId>');
    process.exit(1);
}

async function main() {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            name: true,
            codeFiles: true,
            sandboxId: true,
            version: true,
            generationStatus: true,
        },
    });

    if (!project) {
        console.error(`Project ${projectId} not found`);
        process.exit(1);
    }

    console.log('\n📊 Project Info:');
    console.log(`  Name: ${project.name}`);
    console.log(`  ID: ${project.id}`);
    console.log(`  Sandbox: ${project.sandboxId}`);
    console.log(`  Version: ${project.version}`);
    console.log(`  Status: ${project.generationStatus}`);

    const files = project.codeFiles as Record<string, string> | null;

    if (!files || Object.keys(files).length === 0) {
        console.log('\n❌ NO FILES IN DATABASE!');
    } else {
        console.log(`\n✅ Files in database: ${Object.keys(files).length}`);
        console.log('\n📁 File list:');
        Object.keys(files).sort().forEach(path => {
            const content = files[path];
            const lines = content.split('\n').length;
            const size = content.length;
            console.log(`  - ${path} (${lines} lines, ${size} bytes)`);
        });
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
