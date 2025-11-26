"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Database,
  HardDrive,
  CreditCard,
  BarChart3,
  Mail,
  MessageCircle,
  Sparkles,
  Search,
  X,
  Eye,
  EyeOff,
  Filter,
  Shield,
  Bug,
  FileText,
  SearchCheck,
  Upload,
  Radio,
  Workflow,
  Flag,
  Phone,
  Map,
} from "lucide-react";

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

type IntegrationCategory =
  | "all"
  | "database"
  | "storage"
  | "payments"
  | "analytics"
  | "email"
  | "support"
  | "ai"
  | "cache"
  | "auth"
  | "monitoring"
  | "cms"
  | "search"
  | "realtime"
  | "jobs"
  | "flags"
  | "sms"
  | "maps";

interface IntegrationConfig {
  enabled: boolean;
  apiKey?: string;
  config?: Record<string, string>;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: IntegrationCategory;
  fields: Array<{
    label: string;
    placeholder: string;
    type: string;
    key?: string;
  }>;
}

const integrationsList: Integration[] = [
  // Auth (Better Auth providers)
  {
    id: "auth-email-password",
    name: "Email & Password",
    description: "Better Auth - Email/password authentication",
    icon: Shield,
    category: "auth",
    fields: [
      {
        label: "Min Password Length",
        placeholder: "8",
        type: "text",
        key: "minPasswordLength",
      },
      {
        label: "Require Uppercase",
        placeholder: "true",
        type: "text",
        key: "requireUppercase",
      },
      {
        label: "Require Numbers",
        placeholder: "true",
        type: "text",
        key: "requireNumbers",
      },
      {
        label: "Require Special Characters",
        placeholder: "true",
        type: "text",
        key: "requireSpecialChars",
      },
    ],
  },
  {
    id: "auth-google",
    name: "Google OAuth",
    description: "Better Auth - Google Sign-In",
    icon: Shield,
    category: "auth",
    fields: [
      {
        label: "Client ID",
        placeholder: "xxxxxxxxxxxx.apps.googleusercontent.com",
        type: "text",
        key: "clientId",
      },
      {
        label: "Client Secret",
        placeholder: "GOCSPX-xxxxxxxxxxxx",
        type: "password",
        key: "clientSecret",
      },
    ],
  },
  {
    id: "auth-github",
    name: "GitHub OAuth",
    description: "Better Auth - GitHub Sign-In",
    icon: Shield,
    category: "auth",
    fields: [
      {
        label: "Client ID",
        placeholder: "Iv1.xxxxxxxxxxxx",
        type: "text",
        key: "clientId",
      },
      {
        label: "Client Secret",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        type: "password",
        key: "clientSecret",
      },
    ],
  },
  {
    id: "auth-facebook",
    name: "Facebook OAuth",
    description: "Better Auth - Facebook Sign-In",
    icon: Shield,
    category: "auth",
    fields: [
      {
        label: "App ID",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        type: "text",
        key: "appId",
      },
      {
        label: "App Secret",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        type: "password",
        key: "appSecret",
      },
    ],
  },
  {
    id: "auth-twitter",
    name: "Twitter/X OAuth",
    description: "Better Auth - Twitter/X Sign-In",
    icon: Shield,
    category: "auth",
    fields: [
      {
        label: "Client ID",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        type: "text",
        key: "clientId",
      },
      {
        label: "Client Secret",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        type: "password",
        key: "clientSecret",
      },
    ],
  },
  {
    id: "auth-apple",
    name: "Apple Sign In",
    description: "Better Auth - Apple Sign-In",
    icon: Shield,
    category: "auth",
    fields: [
      {
        label: "Client ID",
        placeholder: "com.yourapp.service",
        type: "text",
        key: "clientId",
      },
      {
        label: "Team ID",
        placeholder: "XXXXXXXXXX",
        type: "text",
        key: "teamId",
      },
      {
        label: "Key ID",
        placeholder: "XXXXXXXXXX",
        type: "text",
        key: "keyId",
      },
      {
        label: "Private Key",
        placeholder: "-----BEGIN PRIVATE KEY-----\n...",
        type: "password",
        key: "privateKey",
      },
    ],
  },
  {
    id: "auth-microsoft",
    name: "Microsoft OAuth",
    description: "Better Auth - Microsoft Sign-In",
    icon: Shield,
    category: "auth",
    fields: [
      {
        label: "Client ID",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        type: "text",
        key: "clientId",
      },
      {
        label: "Client Secret",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        type: "password",
        key: "clientSecret",
      },
      {
        label: "Tenant ID",
        placeholder: "common or your-tenant-id",
        type: "text",
        key: "tenantId",
      },
    ],
  },
  {
    id: "auth-discord",
    name: "Discord OAuth",
    description: "Better Auth - Discord Sign-In",
    icon: Shield,
    category: "auth",
    fields: [
      {
        label: "Client ID",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        type: "text",
        key: "clientId",
      },
      {
        label: "Client Secret",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        type: "password",
        key: "clientSecret",
      },
    ],
  },
  {
    id: "auth-magic-link",
    name: "Magic Link",
    description: "Better Auth - Passwordless email magic links",
    icon: Shield,
    category: "auth",
    fields: [
      {
        label: "From Email",
        placeholder: "noreply@yourdomain.com",
        type: "text",
        key: "fromEmail",
      },
      {
        label: "Email Provider API Key",
        placeholder: "Your email service API key",
        type: "password",
        key: "emailApiKey",
      },
    ],
  },
  {
    id: "auth-passkey",
    name: "Passkey/WebAuthn",
    description: "Better Auth - Biometric authentication",
    icon: Shield,
    category: "auth",
    fields: [
      {
        label: "RP Name",
        placeholder: "Your App Name",
        type: "text",
        key: "rpName",
      },
      {
        label: "RP ID",
        placeholder: "yourdomain.com",
        type: "text",
        key: "rpId",
      },
    ],
  },
  // Database (Prisma ORM Supported)
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "Prisma ORM - PostgreSQL database",
    icon: Database,
    category: "database",
    fields: [
      {
        label: "Connection String",
        placeholder: "postgresql://user:password@localhost:5432/dbname",
        type: "password",
        key: "databaseUrl",
      },
    ],
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Prisma ORM - Supabase PostgreSQL",
    icon: Database,
    category: "database",
    fields: [
      {
        label: "Project URL",
        placeholder: "https://xxxxx.supabase.co",
        type: "text",
        key: "url",
      },
      {
        label: "Anon Key",
        placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        type: "password",
        key: "anonKey",
      },
    ],
  },
  {
    id: "mysql",
    name: "MySQL",
    description: "Prisma ORM - MySQL database",
    icon: Database,
    category: "database",
    fields: [
      {
        label: "Connection String",
        placeholder: "mysql://user:password@localhost:3306/dbname",
        type: "password",
        key: "databaseUrl",
      },
    ],
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "Prisma ORM - MongoDB NoSQL database",
    icon: Database,
    category: "database",
    fields: [
      {
        label: "Connection String",
        placeholder: "mongodb+srv://...",
        type: "password",
        key: "connectionString",
      },
    ],
  },
  {
    id: "planetscale",
    name: "PlanetScale",
    description: "Prisma ORM - Serverless MySQL with branching",
    icon: Database,
    category: "database",
    fields: [
      {
        label: "Database URL",
        placeholder: "mysql://...",
        type: "password",
        key: "databaseUrl",
      },
    ],
  },
  {
    id: "neon",
    name: "Neon",
    description: "Prisma ORM - Serverless Postgres with autoscaling",
    icon: Database,
    category: "database",
    fields: [
      {
        label: "Connection String",
        placeholder: "postgresql://...",
        type: "password",
        key: "connectionString",
      },
    ],
  },
  {
    id: "cockroachdb",
    name: "CockroachDB",
    description: "Prisma ORM - Distributed SQL database",
    icon: Database,
    category: "database",
    fields: [
      {
        label: "Connection String",
        placeholder: "postgresql://...",
        type: "password",
        key: "databaseUrl",
      },
    ],
  },
  {
    id: "sqlserver",
    name: "Microsoft SQL Server",
    description: "Prisma ORM - SQL Server database",
    icon: Database,
    category: "database",
    fields: [
      {
        label: "Connection String",
        placeholder: "sqlserver://...",
        type: "password",
        key: "databaseUrl",
      },
    ],
  },
  {
    id: "sqlite",
    name: "SQLite",
    description: "Prisma ORM - Lightweight file-based database",
    icon: Database,
    category: "database",
    fields: [
      {
        label: "Database File",
        placeholder: "file:./dev.db",
        type: "text",
        key: "databaseUrl",
      },
    ],
  },
  // Storage
  {
    id: "supabaseStorage",
    name: "Supabase Storage",
    description: "File storage for images, documents, and more",
    icon: HardDrive,
    category: "storage",
    fields: [
      {
        label: "Bucket Name",
        placeholder: "my-bucket",
        type: "text",
        key: "bucketName",
      },
    ],
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    description: "Image and video management in the cloud",
    icon: HardDrive,
    category: "storage",
    fields: [
      {
        label: "Cloud Name",
        placeholder: "your-cloud-name",
        type: "text",
        key: "cloudName",
      },
      {
        label: "API Key",
        placeholder: "123456789012345",
        type: "text",
        key: "apiKey",
      },
      {
        label: "API Secret",
        placeholder: "abcdefghijklmnopqrstuvwx",
        type: "password",
        key: "apiSecret",
      },
    ],
  },
  {
    id: "s3",
    name: "AWS S3",
    description: "Amazon's scalable object storage service",
    icon: HardDrive,
    category: "storage",
    fields: [
      {
        label: "Bucket Name",
        placeholder: "my-s3-bucket",
        type: "text",
        key: "bucketName",
      },
      {
        label: "Access Key ID",
        placeholder: "AKIAIOSFODNN7EXAMPLE",
        type: "text",
        key: "accessKeyId",
      },
      {
        label: "Secret Access Key",
        placeholder: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        type: "password",
        key: "secretAccessKey",
      },
      {
        label: "Region",
        placeholder: "us-east-1",
        type: "text",
        key: "region",
      },
    ],
  },
  {
    id: "r2",
    name: "Cloudflare R2",
    description: "S3-compatible object storage with zero egress fees",
    icon: HardDrive,
    category: "storage",
    fields: [
      {
        label: "Account ID",
        placeholder: "your-account-id",
        type: "text",
        key: "accountId",
      },
      {
        label: "Access Key ID",
        placeholder: "your-access-key-id",
        type: "text",
        key: "accessKeyId",
      },
      {
        label: "Secret Access Key",
        placeholder: "your-secret-access-key",
        type: "password",
        key: "secretAccessKey",
      },
      {
        label: "Bucket Name",
        placeholder: "my-r2-bucket",
        type: "text",
        key: "bucketName",
      },
    ],
  },
  // Payments
  {
    id: "razorpay",
    name: "Razorpay",
    description: "Payment gateway for India and global payments",
    icon: CreditCard,
    category: "payments",
    fields: [
      {
        label: "Key ID",
        placeholder: "rzp_test_...",
        type: "text",
        key: "keyId",
      },
      {
        label: "Key Secret",
        placeholder: "your-key-secret",
        type: "password",
        key: "keySecret",
      },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Online payment processing for internet businesses",
    icon: CreditCard,
    category: "payments",
    fields: [
      {
        label: "Publishable Key",
        placeholder: "pk_test_...",
        type: "text",
        key: "publishableKey",
      },
      {
        label: "Secret Key",
        placeholder: "sk_test_...",
        type: "password",
        key: "secretKey",
      },
    ],
  },
  {
    id: "paddle",
    name: "Paddle",
    description: "Complete payment solution for SaaS",
    icon: CreditCard,
    category: "payments",
    fields: [
      {
        label: "Vendor ID",
        placeholder: "123456",
        type: "text",
        key: "vendorId",
      },
      {
        label: "API Key",
        placeholder: "your-api-key",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "lemonsqueezy",
    name: "Lemon Squeezy",
    description: "Payment platform for digital products",
    icon: CreditCard,
    category: "payments",
    fields: [
      {
        label: "API Key",
        placeholder: "xxxxx",
        type: "password",
        key: "apiKey",
      },
      {
        label: "Store ID",
        placeholder: "xxxxx",
        type: "text",
        key: "storeId",
      },
    ],
  },
  // Analytics
  {
    id: "openpanel",
    name: "OpenPanel",
    description: "Privacy-friendly analytics for your app",
    icon: BarChart3,
    category: "analytics",
    fields: [
      {
        label: "Client ID",
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        type: "text",
        key: "clientId",
      },
      {
        label: "Client Secret",
        placeholder: "secret_xxxxx",
        type: "password",
        key: "clientSecret",
      },
    ],
  },
  {
    id: "posthog",
    name: "PostHog",
    description: "Product analytics and feature flags",
    icon: BarChart3,
    category: "analytics",
    fields: [
      {
        label: "API Key",
        placeholder: "phc_...",
        type: "password",
        key: "apiKey",
      },
      {
        label: "Host",
        placeholder: "https://app.posthog.com",
        type: "text",
        key: "host",
      },
    ],
  },
  {
    id: "plausible",
    name: "Plausible",
    description: "Simple and privacy-friendly analytics",
    icon: BarChart3,
    category: "analytics",
    fields: [
      {
        label: "Domain",
        placeholder: "yourdomain.com",
        type: "text",
        key: "domain",
      },
    ],
  },
  {
    id: "vercel-analytics",
    name: "Vercel Analytics",
    description: "Built-in analytics for Vercel projects",
    icon: BarChart3,
    category: "analytics",
    fields: [
      {
        label: "Auto-enabled",
        placeholder: "No configuration needed",
        type: "text",
        key: "enabled",
      },
    ],
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Web analytics and reporting",
    icon: BarChart3,
    category: "analytics",
    fields: [
      {
        label: "Measurement ID",
        placeholder: "G-XXXXXXXXXX",
        type: "text",
        key: "measurementId",
      },
    ],
  },
  // Email
  {
    id: "resend",
    name: "Resend",
    description: "Email API for developers",
    icon: Mail,
    category: "email",
    fields: [
      {
        label: "API Key",
        placeholder: "re_xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Email delivery and marketing platform",
    icon: Mail,
    category: "email",
    fields: [
      {
        label: "API Key",
        placeholder: "SG.xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "mailgun",
    name: "Mailgun",
    description: "Transactional email API service",
    icon: Mail,
    category: "email",
    fields: [
      {
        label: "API Key",
        placeholder: "key-xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
      {
        label: "Domain",
        placeholder: "mg.yourdomain.com",
        type: "text",
        key: "domain",
      },
    ],
  },
  {
    id: "loops",
    name: "Loops",
    description: "Modern email platform for product teams",
    icon: Mail,
    category: "email",
    fields: [
      {
        label: "API Key",
        placeholder: "xxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  // Support
  {
    id: "tawkto",
    name: "Tawk.to",
    description: "Free live chat software",
    icon: MessageCircle,
    category: "support",
    fields: [
      {
        label: "Property ID",
        placeholder: "xxxxxxxxxxxxxxxx",
        type: "text",
        key: "propertyId",
      },
      {
        label: "Widget ID",
        placeholder: "default",
        type: "text",
        key: "widgetId",
      },
    ],
  },
  {
    id: "intercom",
    name: "Intercom",
    description: "Customer messaging platform",
    icon: MessageCircle,
    category: "support",
    fields: [
      {
        label: "App ID",
        placeholder: "xxxxxxxx",
        type: "text",
        key: "appId",
      },
      {
        label: "API Key",
        placeholder: "your-api-key",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "crisp",
    name: "Crisp",
    description: "Customer support chat platform",
    icon: MessageCircle,
    category: "support",
    fields: [
      {
        label: "Website ID",
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        type: "text",
        key: "websiteId",
      },
    ],
  },
  // AI (AI SDK Compatible Providers)
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT models - @ai-sdk/openai",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "sk-xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models - @ai-sdk/anthropic",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "sk-ant-xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "google",
    name: "Google Generative AI",
    description: "Gemini models - @ai-sdk/google",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "AIzaSyxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "xai",
    name: "xAI",
    description: "Grok models - @ai-sdk/xai",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "xai-xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    description: "Mistral models - @ai-sdk/mistral",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    description: "Fast LLM inference - @ai-sdk/groq",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "gsk_xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek models - @ai-sdk/deepseek",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "sk-xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "cohere",
    name: "Cohere",
    description: "Enterprise AI - @ai-sdk/cohere",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "fireworks",
    name: "Fireworks",
    description: "Fast model inference - @ai-sdk/fireworks",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "togetherai",
    name: "Together.ai",
    description: "Open model platform - @ai-sdk/togetherai",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "cerebras",
    name: "Cerebras",
    description: "Fastest inference - @ai-sdk/cerebras",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Search-powered AI - @ai-sdk/perplexity",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Key",
        placeholder: "pplx-xxxxxxxxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "replicate",
    name: "Replicate",
    description: "Run AI models in cloud - @ai-sdk/replicate",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "API Token",
        placeholder: "r8_xxxxxxxxxxxx",
        type: "password",
        key: "apiToken",
      },
    ],
  },
  {
    id: "bedrock",
    name: "Amazon Bedrock",
    description: "AWS managed AI service - @ai-sdk/amazon-bedrock",
    icon: Sparkles,
    category: "ai",
    fields: [
      {
        label: "Access Key ID",
        placeholder: "AKIA...",
        type: "text",
        key: "accessKeyId",
      },
      {
        label: "Secret Access Key",
        placeholder: "xxxxx",
        type: "password",
        key: "secretAccessKey",
      },
      {
        label: "Region",
        placeholder: "us-east-1",
        type: "text",
        key: "region",
      },
    ],
  },
  // Cache
  {
    id: "upstash",
    name: "Upstash Redis",
    description: "Serverless Redis for caching and rate limiting",
    icon: Database,
    category: "cache",
    fields: [
      {
        label: "REST URL",
        placeholder: "https://xxxxx.upstash.io",
        type: "text",
        key: "restUrl",
      },
      {
        label: "REST Token",
        placeholder: "AXXXxxxx",
        type: "password",
        key: "restToken",
      },
    ],
  },
  {
    id: "vercel-kv",
    name: "Vercel KV",
    description: "Durable Redis for Vercel projects",
    icon: Database,
    category: "cache",
    fields: [
      {
        label: "REST URL",
        placeholder: "https://xxxxx.kv.vercel-storage.com",
        type: "text",
        key: "restUrl",
      },
      {
        label: "REST Token",
        placeholder: "xxxxx",
        type: "password",
        key: "restToken",
      },
    ],
  },
  // Monitoring & Error Tracking
  {
    id: "sentry",
    name: "Sentry",
    description: "Error tracking and performance monitoring",
    icon: Bug,
    category: "monitoring",
    fields: [
      {
        label: "DSN",
        placeholder: "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx",
        type: "password",
        key: "dsn",
      },
      {
        label: "Environment",
        placeholder: "production",
        type: "text",
        key: "environment",
      },
    ],
  },
  {
    id: "logsnag",
    name: "LogSnag",
    description: "Real-time event tracking and notifications",
    icon: Bug,
    category: "monitoring",
    fields: [
      {
        label: "API Token",
        placeholder: "xxxxx",
        type: "password",
        key: "apiToken",
      },
      {
        label: "Project Name",
        placeholder: "my-project",
        type: "text",
        key: "project",
      },
    ],
  },
  {
    id: "betterstack",
    name: "Better Stack",
    description: "Uptime monitoring and incident management",
    icon: Bug,
    category: "monitoring",
    fields: [
      {
        label: "API Token",
        placeholder: "xxxxx",
        type: "password",
        key: "apiToken",
      },
    ],
  },
  {
    id: "highlight",
    name: "Highlight.io",
    description: "Session replay and error monitoring",
    icon: Bug,
    category: "monitoring",
    fields: [
      {
        label: "Project ID",
        placeholder: "xxxxx",
        type: "text",
        key: "projectId",
      },
    ],
  },
  // CMS & Content
  {
    id: "sanity",
    name: "Sanity",
    description: "Composable content platform",
    icon: FileText,
    category: "cms",
    fields: [
      {
        label: "Project ID",
        placeholder: "xxxxx",
        type: "text",
        key: "projectId",
      },
      {
        label: "Dataset",
        placeholder: "production",
        type: "text",
        key: "dataset",
      },
      {
        label: "API Token",
        placeholder: "skxxxxx",
        type: "password",
        key: "token",
      },
    ],
  },
  {
    id: "contentful",
    name: "Contentful",
    description: "API-first content management",
    icon: FileText,
    category: "cms",
    fields: [
      {
        label: "Space ID",
        placeholder: "xxxxx",
        type: "text",
        key: "spaceId",
      },
      {
        label: "Access Token",
        placeholder: "xxxxx",
        type: "password",
        key: "accessToken",
      },
      {
        label: "Environment",
        placeholder: "master",
        type: "text",
        key: "environment",
      },
    ],
  },
  {
    id: "strapi",
    name: "Strapi",
    description: "Open-source headless CMS",
    icon: FileText,
    category: "cms",
    fields: [
      {
        label: "API URL",
        placeholder: "https://your-strapi.com",
        type: "text",
        key: "apiUrl",
      },
      {
        label: "API Token",
        placeholder: "xxxxx",
        type: "password",
        key: "apiToken",
      },
    ],
  },
  {
    id: "payload",
    name: "Payload CMS",
    description: "TypeScript-first headless CMS",
    icon: FileText,
    category: "cms",
    fields: [
      {
        label: "API URL",
        placeholder: "https://your-payload.com/api",
        type: "text",
        key: "apiUrl",
      },
      {
        label: "API Key",
        placeholder: "xxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  // Search
  {
    id: "algolia",
    name: "Algolia",
    description: "Fast and relevant search",
    icon: SearchCheck,
    category: "search",
    fields: [
      {
        label: "Application ID",
        placeholder: "XXXXXXXXXX",
        type: "text",
        key: "appId",
      },
      {
        label: "Admin API Key",
        placeholder: "xxxxx",
        type: "password",
        key: "adminApiKey",
      },
      {
        label: "Search API Key",
        placeholder: "xxxxx",
        type: "password",
        key: "searchApiKey",
      },
    ],
  },
  {
    id: "meilisearch",
    name: "Meilisearch",
    description: "Open-source search engine",
    icon: SearchCheck,
    category: "search",
    fields: [
      {
        label: "Host URL",
        placeholder: "https://your-meilisearch.com",
        type: "text",
        key: "host",
      },
      {
        label: "Master Key",
        placeholder: "xxxxx",
        type: "password",
        key: "masterKey",
      },
    ],
  },
  {
    id: "typesense",
    name: "Typesense",
    description: "Fast, typo-tolerant search engine",
    icon: SearchCheck,
    category: "search",
    fields: [
      {
        label: "Host URL",
        placeholder: "https://xxxxx.a1.typesense.net",
        type: "text",
        key: "host",
      },
      {
        label: "API Key",
        placeholder: "xxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  // File Upload
  {
    id: "uploadthing",
    name: "UploadThing",
    description: "File uploads for Next.js",
    icon: Upload,
    category: "storage",
    fields: [
      {
        label: "App ID",
        placeholder: "xxxxx",
        type: "text",
        key: "appId",
      },
      {
        label: "Secret",
        placeholder: "sk_xxxxx",
        type: "password",
        key: "secret",
      },
    ],
  },
  {
    id: "uploadcare",
    name: "Uploadcare",
    description: "File uploading, processing and CDN",
    icon: Upload,
    category: "storage",
    fields: [
      {
        label: "Public Key",
        placeholder: "xxxxx",
        type: "text",
        key: "publicKey",
      },
      {
        label: "Secret Key",
        placeholder: "xxxxx",
        type: "password",
        key: "secretKey",
      },
    ],
  },
  {
    id: "vercel-blob",
    name: "Vercel Blob",
    description: "Fast and simple file storage",
    icon: Upload,
    category: "storage",
    fields: [
      {
        label: "Read-Write Token",
        placeholder: "vercel_blob_rw_xxxxx",
        type: "password",
        key: "token",
      },
    ],
  },
  // Real-time & Messaging
  {
    id: "pusher",
    name: "Pusher",
    description: "Real-time messaging for apps",
    icon: Radio,
    category: "realtime",
    fields: [
      {
        label: "App ID",
        placeholder: "xxxxx",
        type: "text",
        key: "appId",
      },
      {
        label: "Key",
        placeholder: "xxxxx",
        type: "text",
        key: "key",
      },
      {
        label: "Secret",
        placeholder: "xxxxx",
        type: "password",
        key: "secret",
      },
      {
        label: "Cluster",
        placeholder: "us2",
        type: "text",
        key: "cluster",
      },
    ],
  },
  {
    id: "ably",
    name: "Ably",
    description: "Real-time data streaming",
    icon: Radio,
    category: "realtime",
    fields: [
      {
        label: "API Key",
        placeholder: "xxxxx.xxxxx:xxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "liveblocks",
    name: "Liveblocks",
    description: "Real-time collaboration infrastructure",
    icon: Radio,
    category: "realtime",
    fields: [
      {
        label: "Public Key",
        placeholder: "pk_xxxxx",
        type: "text",
        key: "publicKey",
      },
      {
        label: "Secret Key",
        placeholder: "sk_xxxxx",
        type: "password",
        key: "secretKey",
      },
    ],
  },
  {
    id: "partykit",
    name: "PartyKit",
    description: "Real-time collaborative apps infrastructure",
    icon: Radio,
    category: "realtime",
    fields: [
      {
        label: "Project Name",
        placeholder: "my-project",
        type: "text",
        key: "projectName",
      },
    ],
  },
  // Background Jobs
  {
    id: "trigger",
    name: "Trigger.dev",
    description: "Background jobs for TypeScript",
    icon: Workflow,
    category: "jobs",
    fields: [
      {
        label: "API Key",
        placeholder: "tr_xxxxx",
        type: "password",
        key: "apiKey",
      },
      {
        label: "API URL",
        placeholder: "https://api.trigger.dev",
        type: "text",
        key: "apiUrl",
      },
    ],
  },
  {
    id: "inngest",
    name: "Inngest",
    description: "Durable workflow engine",
    icon: Workflow,
    category: "jobs",
    fields: [
      {
        label: "Event Key",
        placeholder: "xxxxx",
        type: "password",
        key: "eventKey",
      },
      {
        label: "Signing Key",
        placeholder: "signkey-xxxxx",
        type: "password",
        key: "signingKey",
      },
    ],
  },
  {
    id: "qstash",
    name: "Upstash QStash",
    description: "Serverless message queue and scheduler",
    icon: Workflow,
    category: "jobs",
    fields: [
      {
        label: "QStash Token",
        placeholder: "xxxxx",
        type: "password",
        key: "token",
      },
      {
        label: "Current Signing Key",
        placeholder: "xxxxx",
        type: "password",
        key: "currentSigningKey",
      },
      {
        label: "Next Signing Key",
        placeholder: "xxxxx",
        type: "password",
        key: "nextSigningKey",
      },
    ],
  },
  // Feature Flags
  {
    id: "vercel-flags",
    name: "Vercel Flags",
    description: "Feature flags for Vercel projects",
    icon: Flag,
    category: "flags",
    fields: [
      {
        label: "Access Token",
        placeholder: "xxxxx",
        type: "password",
        key: "accessToken",
      },
    ],
  },
  {
    id: "launchdarkly",
    name: "LaunchDarkly",
    description: "Feature management platform",
    icon: Flag,
    category: "flags",
    fields: [
      {
        label: "SDK Key",
        placeholder: "sdk-xxxxx",
        type: "password",
        key: "sdkKey",
      },
      {
        label: "Client ID",
        placeholder: "xxxxx",
        type: "text",
        key: "clientId",
      },
    ],
  },
  {
    id: "configcat",
    name: "ConfigCat",
    description: "Feature flag and configuration management",
    icon: Flag,
    category: "flags",
    fields: [
      {
        label: "SDK Key",
        placeholder: "xxxxx",
        type: "password",
        key: "sdkKey",
      },
    ],
  },
  // SMS & Communications
  {
    id: "twilio",
    name: "Twilio",
    description: "SMS, voice, and video communication",
    icon: Phone,
    category: "sms",
    fields: [
      {
        label: "Account SID",
        placeholder: "ACxxxxx",
        type: "text",
        key: "accountSid",
      },
      {
        label: "Auth Token",
        placeholder: "xxxxx",
        type: "password",
        key: "authToken",
      },
      {
        label: "Phone Number",
        placeholder: "+1234567890",
        type: "text",
        key: "phoneNumber",
      },
    ],
  },
  {
    id: "vonage",
    name: "Vonage",
    description: "Communication APIs (formerly Nexmo)",
    icon: Phone,
    category: "sms",
    fields: [
      {
        label: "API Key",
        placeholder: "xxxxx",
        type: "text",
        key: "apiKey",
      },
      {
        label: "API Secret",
        placeholder: "xxxxx",
        type: "password",
        key: "apiSecret",
      },
    ],
  },
  {
    id: "messagebird",
    name: "MessageBird",
    description: "Omnichannel communication platform",
    icon: Phone,
    category: "sms",
    fields: [
      {
        label: "Access Key",
        placeholder: "xxxxx",
        type: "password",
        key: "accessKey",
      },
    ],
  },
  // Maps & Location
  {
    id: "google-maps",
    name: "Google Maps",
    description: "Maps, geocoding, and places API",
    icon: Map,
    category: "maps",
    fields: [
      {
        label: "API Key",
        placeholder: "AIzaSyxxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
  {
    id: "mapbox",
    name: "Mapbox",
    description: "Custom maps and location services",
    icon: Map,
    category: "maps",
    fields: [
      {
        label: "Access Token",
        placeholder: "pk.xxxxx",
        type: "password",
        key: "accessToken",
      },
    ],
  },
  {
    id: "here-maps",
    name: "HERE Maps",
    description: "Location platform and mapping",
    icon: Map,
    category: "maps",
    fields: [
      {
        label: "API Key",
        placeholder: "xxxxx",
        type: "password",
        key: "apiKey",
      },
    ],
  },
];

const categories: Array<{
  id: IntegrationCategory;
  label: string;
  icon: React.ElementType;
}> = [
  { id: "all", label: "All Integrations", icon: Filter },
  { id: "auth", label: "Authentication", icon: Shield },
  { id: "database", label: "Database", icon: Database },
  { id: "storage", label: "Storage", icon: HardDrive },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "email", label: "Email", icon: Mail },
  { id: "support", label: "Support", icon: MessageCircle },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "cache", label: "Cache", icon: Database },
  { id: "monitoring", label: "Monitoring", icon: Bug },
  { id: "cms", label: "CMS", icon: FileText },
  { id: "search", label: "Search", icon: SearchCheck },
  { id: "realtime", label: "Real-time", icon: Radio },
  { id: "jobs", label: "Background Jobs", icon: Workflow },
  { id: "flags", label: "Feature Flags", icon: Flag },
  { id: "sms", label: "SMS", icon: Phone },
  { id: "maps", label: "Maps", icon: Map },
];

function IntegrationCard({
  integration,
  config,
  onToggle,
  onSave,
}: {
  integration: Integration;
  config: IntegrationConfig;
  onToggle: (enabled: boolean) => void;
  onSave: (config: IntegrationConfig) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const Icon = integration.icon;

  useEffect(() => {
    if (config.config) {
      setFormData(config.config);
    }
  }, [config]);

  const handleSave = () => {
    onSave({
      ...config,
      enabled: true,
      config: formData,
    });
    setExpanded(false);
  };

  return (
    <div className="group rounded-xl border bg-card hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
              <Icon className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight mb-1">
                {integration.name}
              </h3>
            </div>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={onToggle}
            className="rounded-full shrink-0"
          />
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {integration.description}
        </p>

        {config.enabled && (
          <>
            {!expanded ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(true)}
                className="w-full rounded-lg"
              >
                Configure
              </Button>
            ) : (
              <div className="space-y-3 pt-3 border-t">
                {integration.fields.map((field, index) => (
                  <div key={index} className="space-y-1.5">
                    <Label
                      htmlFor={`${integration.id}-${field.key}`}
                      className="text-xs"
                    >
                      {field.label}
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${integration.id}-${field.key}`}
                        type={
                          field.type === "password" &&
                          !showSecrets[field.key || ""]
                            ? "password"
                            : "text"
                        }
                        placeholder={field.placeholder}
                        value={formData[field.key || ""] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [field.key || ""]: e.target.value,
                          }))
                        }
                        className="rounded-lg pr-10 h-8 text-sm"
                      />
                      {field.type === "password" && (
                        <button
                          type="button"
                          onClick={() =>
                            setShowSecrets((prev) => ({
                              ...prev,
                              [field.key || ""]: !prev[field.key || ""],
                            }))
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSecrets[field.key || ""] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpanded(false)}
                    className="flex-1 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="flex-1 rounded-lg"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsModal({
  isOpen,
  onClose,
  projectId,
}: IntegrationsModalProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<IntegrationCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [integrations, setIntegrations] = useState<
    Record<string, IntegrationConfig>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Load integrations
  useEffect(() => {
    if (isOpen) {
      loadIntegrations();
    }
  }, [isOpen]);

  const loadIntegrations = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/integrations`);
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || {});
      }
    } catch (error) {
      console.error("Failed to load integrations:", error);
    }
  };

  const handleToggleIntegration = async (
    integrationId: string,
    enabled: boolean
  ) => {
    setIsSaving(true);
    try {
      const config = integrations[integrationId] || { enabled: false };
      const newConfig = { ...config, enabled };

      const response = await fetch(
        `/api/projects/${projectId}/integrations/${integrationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newConfig),
        }
      );

      if (response.ok) {
        setIntegrations((prev) => ({
          ...prev,
          [integrationId]: newConfig,
        }));
        toast.success(
          enabled ? `${integrationId} enabled` : `${integrationId} disabled`
        );
      } else {
        toast.error("Failed to update integration");
      }
    } catch (error) {
      toast.error("Failed to update integration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIntegration = async (
    integrationId: string,
    config: IntegrationConfig
  ) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/integrations/${integrationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        }
      );

      if (response.ok) {
        setIntegrations((prev) => ({
          ...prev,
          [integrationId]: config,
        }));
        toast.success("Integration configured successfully");
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (error) {
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter integrations
  const filteredIntegrations = integrationsList.filter((integration) => {
    const matchesCategory =
      selectedCategory === "all" || integration.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-background animate-in fade-in duration-200 flex flex-col"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: "inherit",
      }}
    >
      {/* Top Header Bar */}
      <div className="flex-shrink-0 h-16 flex items-center justify-between px-6 bg-background border-b">
        <h1 className="text-xl font-semibold text-foreground">
          Project Integrations
        </h1>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="flex-1 flex overflow-hidden bg-background">
        {/* Left Sidebar - Categories */}
        <div className="w-64 flex-shrink-0 flex flex-col bg-background border-r">
          {/* Search Bar - Fixed at top */}
          <div className="flex-shrink-0 p-4 bg-background border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-lg bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Categories - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon;
                const count =
                  category.id === "all"
                    ? integrationsList.length
                    : integrationsList.filter((i) => i.category === category.id)
                        .length;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                      selectedCategory === category.id
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium flex-1 text-left">
                      {category.label}
                    </span>
                    {count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content Area - Integration Cards */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-2">
                {selectedCategory === "all"
                  ? "All Integrations"
                  : categories.find((c) => c.id === selectedCategory)?.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                Connect external services to enhance this project
              </p>
            </div>

            {filteredIntegrations.length === 0 ? (
              <div className="text-center py-16">
                <Filter className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No integrations found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    config={integrations[integration.id] || { enabled: false }}
                    onToggle={(enabled) =>
                      handleToggleIntegration(integration.id, enabled)
                    }
                    onSave={(config) =>
                      handleSaveIntegration(integration.id, config)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
