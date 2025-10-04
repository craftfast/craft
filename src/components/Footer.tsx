import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            © 2025 Nextcrafter Labs (OPC) Private Limited. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
            >
              Terms
            </Link>
            <Link
              href="/refunds"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
            >
              Refunds
            </Link>
            <Link
              href="/help"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
            >
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
