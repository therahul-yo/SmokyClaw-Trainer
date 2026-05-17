import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export function LessonRenderer({ body }: { body: string }) {
  return (
    <div className="prose-lesson max-w-3xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true }]]}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
