import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useState } from "react";
import { MemoryTraceVisualizer } from "./MemoryTraceVisualizer";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function CopyCode({ source }: { source: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(source)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          })
          .catch(() => {});
      }}
      className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-mono transition-colors hover:brightness-110"
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-bright)",
        color: copied ? "var(--color-accent)" : "var(--color-text-dim)",
      }}
      title="copy code"
    >
      {copied ? "✓ copied" : "[ copy ]"}
    </button>
  );
}

type Props = {
  body: string;
  withHeadingIds?: boolean;
};

export function LessonRenderer({ body, withHeadingIds = false }: Props) {
  return (
    <div className="prose-lesson max-w-3xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true }]]}
        components={{
          h2: ({ children, ...rest }) => {
            const text = String(
              Array.isArray(children) ? children.join("") : children,
            );
            const id = withHeadingIds ? slugify(text) : undefined;
            return (
              <h2 id={id} {...rest}>
                {children}
              </h2>
            );
          },
          h3: ({ children, ...rest }) => {
            const text = String(
              Array.isArray(children) ? children.join("") : children,
            );
            const id = withHeadingIds ? slugify(text) : undefined;
            return (
              <h3 id={id} {...rest}>
                {children}
              </h3>
            );
          },
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            if (match && match[1] === "memory-trace") {
              const content = String(children).trim();
              return <MemoryTraceVisualizer json={content} />;
            }
            return <code className={className} {...props}>{children}</code>;
          },
          pre: ({ children }) => {
            // Find the inner code text for the copy button.
            let source = "";
            try {
              const code = Array.isArray(children) ? children[0] : children;
              if (
                code &&
                typeof code === "object" &&
                "props" in code &&
                code.props &&
                typeof code.props === "object" &&
                "children" in code.props
              ) {
                const inner = (code.props as { children: unknown }).children;
                if (typeof inner === "string") source = inner;
                else if (Array.isArray(inner)) source = inner.join("");
              }
            } catch {
              // ignore
            }
            return (
              <div className="relative group">
                <pre>{children}</pre>
                {source && <CopyCode source={source} />}
              </div>
            );
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
