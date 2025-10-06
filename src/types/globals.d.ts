// Type declarations for CSS imports
declare module "*.css";

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// Razorpay type
interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Razorpay: any;
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
  }
}
