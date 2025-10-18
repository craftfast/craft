/**
 * Extract dependency installation commands from AI response
 * Safely parses ```install-deps blocks
 */

export interface DependencyCommand {
    packages: string[];
    raw: string;
}

/**
 * Extract all dependency commands from AI response
 * Looks for ```install-deps blocks and extracts package names
 */
export function extractDependencyCommands(content: string): DependencyCommand[] {
    const commands: DependencyCommand[] = [];

    // Match ```install-deps ... ``` blocks
    // Format: ```install-deps\npackage1 package2 package3\n```
    const regex = /```install-deps\s*\n([\s\S]*?)\n```/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        const raw = match[1].trim();

        if (!raw) continue;

        // Split by whitespace and filter out empty strings
        const packages = raw
            .split(/\s+/)
            .map(pkg => pkg.trim())
            .filter(pkg => pkg.length > 0)
            .filter(pkg => isValidPackageName(pkg));

        if (packages.length > 0) {
            commands.push({ packages, raw });
        }
    }

    return commands;
}

/**
 * Validate package name format
 * Supports: package-name, @scope/package-name
 */
function isValidPackageName(name: string): boolean {
    // Basic validation for npm package names
    // Allows: letters, numbers, hyphens, underscores, dots, @, /
    // Must not start with . or _
    const validPattern = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;

    return validPattern.test(name) && name.length <= 214;
}

/**
 * Extract all unique packages from all dependency commands
 */
export function getAllPackages(commands: DependencyCommand[]): string[] {
    const allPackages = new Set<string>();

    for (const command of commands) {
        for (const pkg of command.packages) {
            allPackages.add(pkg);
        }
    }

    return Array.from(allPackages);
}

/**
 * Check if content contains any dependency commands
 */
export function hasDependencyCommands(content: string): boolean {
    return /```install-deps\s*\n/.test(content);
}

/**
 * Generate installation command for sandbox
 * Returns pnpm add command with all packages
 */
export function generateInstallCommand(packages: string[]): string {
    if (packages.length === 0) return '';
    return `pnpm add ${packages.join(' ')}`;
}
