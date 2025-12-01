import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const headingBase = "text-white font-semibold tracking-tight";

const components: Components = {
  h1({ className, children, ...props }) {
    return (
      <h1
        {...props}
        className={cn(`${headingBase} text-4xl leading-tight`, className)}
      >
        {children}
      </h1>
    );
  },
  h2({ className, children, ...props }) {
    return (
      <h2 {...props} className={cn(`${headingBase} text-3xl mt-8`, className)}>
        {children}
      </h2>
    );
  },
  h3({ className, children, ...props }) {
    return (
      <h3 {...props} className={cn(`${headingBase} text-2xl mt-6`, className)}>
        {children}
      </h3>
    );
  },
  p({ className, children, ...props }) {
    return (
      <p {...props} className={cn("text-base leading-relaxed text-white/80", className)}>
        {children}
      </p>
    );
  },
  ul({ className, children, ...props }) {
    return (
      <ul {...props} className={cn("list-disc space-y-2 pl-6 text-white/80", className)}>
        {children}
      </ul>
    );
  },
  ol({ className, children, ...props }) {
    return (
      <ol {...props} className={cn("list-decimal space-y-2 pl-6 text-white/80", className)}>
        {children}
      </ol>
    );
  },
  li({ className, children, ...props }) {
    return (
      <li {...props} className={cn("leading-relaxed", className)}>
        {children}
      </li>
    );
  },
  code({ className, children, ...props }) {
    return (
      <code
        {...props}
        className={cn(
          "rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-purple-200",
          className,
        )}
      >
        {children}
      </code>
    );
  },
  pre({ className, children, ...props }) {
    return (
      <pre
        {...props}
        className={cn(
          "overflow-x-auto rounded-2xl border border-white/10 bg-black/50 p-4 text-sm text-white/80",
          className,
        )}
      >
        {children}
      </pre>
    );
  },
  table({ className, children, ...props }) {
    return (
      <div className="overflow-x-auto">
        <table {...props} className={cn("w-full border-collapse text-sm text-white/80", className)}>
          {children}
        </table>
      </div>
    );
  },
  thead({ className, children, ...props }) {
    return (
      <thead {...props} className={cn("bg-white/5 text-white", className)}>
        {children}
      </thead>
    );
  },
  tbody({ className, children, ...props }) {
    return (
      <tbody {...props} className={cn("divide-y divide-white/5", className)}>
        {children}
      </tbody>
    );
  },
  tr({ className, children, ...props }) {
    return (
      <tr {...props} className={cn("border-b border-white/5 last:border-0", className)}>
        {children}
      </tr>
    );
  },
  th({ className, children, ...props }) {
    return (
      <th {...props} className={cn("px-3 py-2 text-left font-semibold text-white/90", className)}>
        {children}
      </th>
    );
  },
  td({ className, children, ...props }) {
    return (
      <td {...props} className={cn("px-3 py-2 align-top", className)}>
        {children}
      </td>
    );
  },
  blockquote({ className, children, ...props }) {
    return (
      <blockquote
        {...props}
        className={cn("border-l-4 border-purple-400/70 pl-4 text-white/70", className)}
      >
        {children}
      </blockquote>
    );
  },
  a({ className, href, children, ...props }) {
    return (
      <a
        {...props}
        href={href}
        className={cn(
          "text-purple-300 underline underline-offset-2 hover:text-purple-100",
          className,
        )}
      >
        {children}
      </a>
    );
  },
};

interface MarkdownRendererProps {
  markdown: string;
}

export function MarkdownRenderer({ markdown }: MarkdownRendererProps) {
  return (
    <div className="space-y-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
