import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml from "js-yaml";

// Configure gray-matter to use js-yaml 4.x with yaml.load instead of deprecated safeLoad
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const matterOptions: any = {
    engines: {
        yaml: {
            parse: (str: string) => yaml.load(str),
            stringify: (data: object) => yaml.dump(data),
        },
    },
};

export interface BlogPost {
    slug: string;
    title: string;
    description: string;
    date: string;
    readTime: string;
    category: string;
    author: {
        name: string;
        avatar?: string;
    };
    image?: string;
    featured?: boolean;
    content: string;
}

export interface BlogPostMeta {
    slug: string;
    title: string;
    description: string;
    date: string;
    readTime: string;
    category: string;
    author: {
        name: string;
        avatar?: string;
    };
    image?: string;
    featured?: boolean;
}

const BLOG_CONTENT_PATH = path.join(process.cwd(), "src/content/blog");

/**
 * Calculate read time based on word count
 */
function calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}

/**
 * Get all blog post slugs
 */
export function getAllBlogSlugs(): string[] {
    if (!fs.existsSync(BLOG_CONTENT_PATH)) {
        return [];
    }

    const files = fs.readdirSync(BLOG_CONTENT_PATH);
    return files
        .filter((file) => file.endsWith(".mdx"))
        .map((file) => file.replace(/\.mdx$/, ""));
}

/**
 * Get a single blog post by slug
 */
export function getBlogPost(slug: string): BlogPost | null {
    const filePath = path.join(BLOG_CONTENT_PATH, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
        return null;
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents, matterOptions);

    return {
        slug,
        title: data.title || "Untitled",
        description: data.description || "",
        date: data.date || new Date().toISOString(),
        readTime: data.readTime || calculateReadTime(content),
        category: data.category || "General",
        author: data.author || { name: "Craft Team" },
        image: data.image,
        featured: data.featured || false,
        content,
    };
}

/**
 * Get all blog posts metadata (for listing pages)
 */
export function getAllBlogPosts(): BlogPostMeta[] {
    const slugs = getAllBlogSlugs();

    const posts = slugs
        .map((slug) => {
            const post = getBlogPost(slug);
            if (!post) return null;

            // Return only metadata, not content
            const { content: _, ...meta } = post;
            return meta;
        })
        .filter((post): post is BlogPostMeta => post !== null);

    // Sort by date, newest first
    return posts.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

/**
 * Get featured blog post
 */
export function getFeaturedPost(): BlogPostMeta | null {
    const posts = getAllBlogPosts();
    return posts.find((post) => post.featured) || posts[0] || null;
}

/**
 * Get posts by category
 */
export function getPostsByCategory(category: string): BlogPostMeta[] {
    const posts = getAllBlogPosts();
    if (category === "All") return posts;
    return posts.filter((post) => post.category === category);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
    const posts = getAllBlogPosts();
    const categories = new Set(posts.map((post) => post.category));
    return ["All", ...Array.from(categories)];
}
