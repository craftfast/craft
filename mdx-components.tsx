import Link from "next/link";
import { ComponentPropsWithoutRef, ReactNode } from "react";

// MDX Components type
type MDXComponents = {
  [key: string]: React.ComponentType<Record<string, unknown>>;
};

type HeadingProps = ComponentPropsWithoutRef<"h1"> & { children?: ReactNode };
type ParagraphProps = ComponentPropsWithoutRef<"p"> & { children?: ReactNode };
type AnchorProps = ComponentPropsWithoutRef<"a"> & {
  children?: ReactNode;
  href?: string;
};
type ListProps = ComponentPropsWithoutRef<"ul"> & { children?: ReactNode };
type ListItemProps = ComponentPropsWithoutRef<"li"> & { children?: ReactNode };
type CodeProps = ComponentPropsWithoutRef<"code"> & { children?: ReactNode };
type PreProps = ComponentPropsWithoutRef<"pre"> & { children?: ReactNode };
type BlockquoteProps = ComponentPropsWithoutRef<"blockquote"> & {
  children?: ReactNode;
};
type TableProps = ComponentPropsWithoutRef<"table"> & { children?: ReactNode };
type TheadProps = ComponentPropsWithoutRef<"thead"> & { children?: ReactNode };
type ThProps = ComponentPropsWithoutRef<"th"> & { children?: ReactNode };
type TableCellProps = ComponentPropsWithoutRef<"td"> & { children?: ReactNode };
type ImageProps = ComponentPropsWithoutRef<"img">;

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings
    h1: ({ children, ...props }: HeadingProps) => (
      <h1
        className="text-3xl sm:text-4xl font-bold text-foreground mb-6 mt-8 first:mt-0"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: HeadingProps) => {
      const id =
        typeof children === "string"
          ? children.toLowerCase().replace(/\s+/g, "-")
          : undefined;
      return (
        <h2
          id={id}
          className="text-2xl font-semibold text-foreground mb-4 mt-10 scroll-mt-24 group"
          {...props}
        >
          {children}
          {id && (
            <a
              href={`#${id}`}
              className="ml-2 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-opacity"
            >
              #
            </a>
          )}
        </h2>
      );
    },
    h3: ({ children, ...props }: HeadingProps) => {
      const id =
        typeof children === "string"
          ? children.toLowerCase().replace(/\s+/g, "-")
          : undefined;
      return (
        <h3
          id={id}
          className="text-xl font-semibold text-foreground mb-3 mt-8 scroll-mt-24 group"
          {...props}
        >
          {children}
          {id && (
            <a
              href={`#${id}`}
              className="ml-2 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-opacity"
            >
              #
            </a>
          )}
        </h3>
      );
    },
    h4: ({ children, ...props }: HeadingProps) => (
      <h4
        className="text-lg font-semibold text-foreground mb-2 mt-6"
        {...props}
      >
        {children}
      </h4>
    ),

    // Paragraphs and text
    p: ({ children, ...props }: ParagraphProps) => (
      <p
        className="text-neutral-700 dark:text-neutral-300 mb-4 leading-7"
        {...props}
      >
        {children}
      </p>
    ),
    strong: ({ children, ...props }: ParagraphProps) => (
      <strong className="font-semibold text-foreground" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: ParagraphProps) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),

    // Links
    a: ({ href, children, ...props }: AnchorProps) => {
      const isExternal = href?.startsWith("http");
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-900 dark:text-neutral-100 underline decoration-neutral-400 dark:decoration-neutral-500 underline-offset-2 hover:decoration-neutral-600 dark:hover:decoration-neutral-300 transition-colors"
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <Link
          href={href || "#"}
          className="text-neutral-900 dark:text-neutral-100 underline decoration-neutral-400 dark:decoration-neutral-500 underline-offset-2 hover:decoration-neutral-600 dark:hover:decoration-neutral-300 transition-colors"
          {...props}
        >
          {children}
        </Link>
      );
    },

    // Lists
    ul: ({ children, ...props }: ListProps) => (
      <ul
        className="list-disc list-inside mb-4 space-y-2 text-neutral-700 dark:text-neutral-300"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: ListProps) => (
      <ol
        className="list-decimal list-inside mb-4 space-y-2 text-neutral-700 dark:text-neutral-300"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }: ListItemProps) => (
      <li className="leading-7" {...props}>
        {children}
      </li>
    ),

    // Code
    code: ({ children, ...props }: CodeProps) => (
      <code
        className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    ),
    pre: ({ children, ...props }: PreProps) => (
      <pre
        className="p-4 bg-neutral-900 dark:bg-neutral-950 text-neutral-100 rounded-xl overflow-x-auto mb-4 text-sm"
        {...props}
      >
        {children}
      </pre>
    ),

    // Blockquote
    blockquote: ({ children, ...props }: BlockquoteProps) => (
      <blockquote
        className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 py-1 my-4 text-neutral-600 dark:text-neutral-400 italic"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Horizontal rule
    hr: (props: ComponentPropsWithoutRef<"hr">) => (
      <hr
        className="my-8 border-neutral-200 dark:border-neutral-800"
        {...props}
      />
    ),

    // Table
    table: ({ children, ...props }: TableProps) => (
      <div className="overflow-x-auto mb-4">
        <table
          className="w-full border-collapse border border-neutral-200 dark:border-neutral-700 rounded-lg"
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: TheadProps) => (
      <thead className="bg-neutral-100 dark:bg-neutral-800" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }: ThProps) => (
      <th
        className="px-4 py-3 text-left text-sm font-semibold text-foreground border border-neutral-200 dark:border-neutral-700"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: TableCellProps) => (
      <td
        className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
        {...props}
      >
        {children}
      </td>
    ),

    // Images
    img: (props: ImageProps) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="rounded-xl my-4 max-w-full"
        alt={props.alt || ""}
        {...props}
      />
    ),

    ...components,
  };
}
