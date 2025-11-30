import HeaderNav from "@/components/HeaderNav";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

export default function BlogPage() {
  const featuredPost = {
    title: "Introducing Craft: AI-Powered App Development for Everyone",
    description:
      "We're excited to announce the launch of Craft, a revolutionary tool that lets you build apps and websites through natural conversation with AI. No coding experience required.",
    date: "November 28, 2025",
    readTime: "5 min read",
    category: "Announcements",
    author: {
      name: "Craft Team",
      avatar: "/craft-avatar.png",
    },
    image: "/blog/featured.jpg",
  };

  const posts = [
    {
      title: "5 Tips for Writing Better AI Prompts",
      description:
        "Learn how to communicate effectively with Craft to get exactly the results you want. Master the art of prompt engineering.",
      date: "November 25, 2025",
      readTime: "8 min read",
      category: "Tips & Tricks",
    },
    {
      title: "Building a Complete E-commerce Store in Under an Hour",
      description:
        "A step-by-step walkthrough of creating a fully functional online store using Craft's AI-powered development.",
      date: "November 22, 2025",
      readTime: "12 min read",
      category: "Tutorials",
    },
    {
      title: "The Future of No-Code Development",
      description:
        "How AI is transforming the way we build software and what it means for developers and non-developers alike.",
      date: "November 18, 2025",
      readTime: "6 min read",
      category: "Industry",
    },
    {
      title: "Understanding Craft's Template System",
      description:
        "Deep dive into how Craft generates and manages project templates for maximum flexibility and customization.",
      date: "November 15, 2025",
      readTime: "10 min read",
      category: "Technical",
    },
    {
      title: "Community Spotlight: Amazing Projects Built with Craft",
      description:
        "Showcasing some of the incredible projects our community has created using Craft's AI-powered development tools.",
      date: "November 12, 2025",
      readTime: "7 min read",
      category: "Community",
    },
    {
      title: "Best Practices for Deploying Your Craft Projects",
      description:
        "Everything you need to know about taking your projects from development to production.",
      date: "November 8, 2025",
      readTime: "9 min read",
      category: "Tutorials",
    },
  ];

  const categories = [
    "All",
    "Announcements",
    "Tutorials",
    "Tips & Tricks",
    "Technical",
    "Community",
    "Industry",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <div className="relative flex items-center justify-between">
            <Logo
              variant="extended"
              className="text-white dark:text-white"
              href="/"
            />
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center py-12 sm:py-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              Blog
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Stories, updates, and insights
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              The latest news, tutorials, and insights from the Craft team and
              community.
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  index === 0
                    ? "bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured Post */}
          <div className="mb-16">
            <Link
              href="#"
              className="block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors duration-200 group"
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="aspect-video md:aspect-auto bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-neutral-400 dark:text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="p-6 sm:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full">
                      {featuredPost.category}
                    </span>
                    <span className="text-sm text-neutral-500">
                      {featuredPost.date}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    {featuredPost.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        C
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {featuredPost.author.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {featuredPost.readTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {posts.map((post, index) => (
              <Link
                key={index}
                href="#"
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors duration-200 group flex flex-col"
              >
                <div className="aspect-video bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-neutral-400 dark:text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 flex-1">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Stay up to date
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
              Subscribe to our newsletter for the latest updates, tutorials, and
              insights delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-foreground placeholder-neutral-500 focus:border-neutral-600 dark:focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 rounded-full transition-all duration-200"
              />
              <button className="px-8 py-3 bg-foreground text-background hover:bg-neutral-800 dark:hover:bg-neutral-700 rounded-full transition-colors duration-200 font-medium whitespace-nowrap">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-4">
              No spam, unsubscribe at any time.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
