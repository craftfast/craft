// Type declarations for CSS imports
declare module "*.css";

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// Polar.sh type
interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Polar: any;
}

// Better Auth type extensions
// Note: Better Auth has built-in TypeScript types from the Prisma schema
// Session structure is automatically inferred from the auth configuration
