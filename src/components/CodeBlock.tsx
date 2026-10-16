import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

export function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const lang = (() => {
    const c = Array.isArray(children) ? children[0] : children;
    const cls = (c as { props?: { className?: string } })?.props?.className ?? "";
    return cls.replace("language-", "") || "shell";
  })();
  return (
    <div className="group relative my-4 overflow-hidden rounded-md border border-border bg-code">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 font-mono text-xs text-muted-foreground">
        <span>{lang}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(textOf(children).replace(/\n$/, ""));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 rounded px-2 py-0.5 transition-colors hover:bg-muted hover:text-primary"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[0.82rem] leading-relaxed">{children}</pre>
    </div>
  );
}
