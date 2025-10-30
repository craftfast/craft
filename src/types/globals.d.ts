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

// NextAuth type extensions
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    // Session fingerprinting for security monitoring (Issue 14)
    ipAddress?: string;
    userAgent?: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    // Session fingerprinting for security monitoring (Issue 14)
    ipAddress?: string;
    userAgent?: string;
  }
}
