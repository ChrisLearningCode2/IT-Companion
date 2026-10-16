import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Apple, Book, Download, Eye, FileText, Monitor, Network, Package, Pencil, Plus, RotateCcw,
  Search, Shield, Smartphone, Tag, Terminal, Trash2, Upload, Wrench, Mail, Folder, X,
} from "lucide-react";
import { seedKB } from "@/data/seed";
import { downloadKB, isKB, loadKB, saveKB, uid, type KB, type Notebook } from "@/lib/kb";
import { CodeBlock } from "./CodeBlock";

const ICONS: Record<string, typeof Book> = {
  monitor: Monitor, apple: Apple, smartphone: Smartphone, network: Network, shield: Shield,
  mail: Mail, package: Package, terminal: Terminal, book: Book, wrench: Wrench, folder: Folder,
};

type Sel = { nb: string; sec: string; page: string };

function firstSel(kb: KB): Sel {
  const nb = kb.notebooks[0];
  const sec = nb?.sections[0];
  return { nb: nb?.id ?? "", sec: sec?.id ?? "", page: sec?.pages[0]?.id ?? "" };
}

export function KnowledgeBase() {
  const [kb, setKb] = useState<KB | null>(null);
  const [sel, setSel] = useState<Sel>({ nb: "", sec: "", page: "" });
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const k = loadKB(seedKB);
    setKb(k);
    setSel(firstSel(k));
  }, []);

  useEffect(() => {
    if (kb) saveKB(kb);
  }, [kb]);

  const update = (fn: (draft: KB) => void) =>
    setKb((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  const notebook = kb?.notebooks.find((n) => n.id === sel.nb);
  const section = notebook?.sections.find((s) => s.id === sel.sec);
  const page = section?.pages.find((p) => p.id === sel.page);

  const results = useMemo(() => {
    if (!kb || !query.trim()) return [];
    const q = query.toLowerCase();
    const out: { nb: Notebook; secId: string; secName: string; pageId: string; title: string; snippet: string; tags: string[] }[] = [];
    for (const nb of kb.notebooks)
      for (const s of nb.sections)
        for (const p of s.pages) {
          const idx = p.content.toLowerCase().indexOf(q);
          const tags = p.tags ?? [];
          const tagHit = tags.some((t) => t.toLowerCase().includes(q));
          if (p.title.toLowerCase().includes(q) || idx >= 0 || tagHit) {
            const snippet = idx >= 0 ? p.content.slice(Math.max(0, idx - 30), idx + 70).replace(/\n/g, " ") : "";
            out.push({ nb, secId: s.id, secName: s.name, pageId: p.id, title: p.title, snippet, tags });
          }
        }
    return out;
  }, [kb, query]);

  if (!kb) return <div className="flex h-screen items-center justify-center font-mono text-muted-foreground">loading kb_</div>;

  const findNb = (d: KB) => d.notebooks.find((n) => n.id === sel.nb);
  const findSec = (d: KB) => findNb(d)?.sections.find((s) => s.id === sel.sec);

  const addNotebook = () => {
    const name = prompt("Notebook name");
    if (!name) return;
    const nbId = uid(), secId = uid(), pId = uid();
    update((d) => d.notebooks.push({ id: nbId, name, icon: "folder", sections: [{ id: secId, name: "General", pages: [{ id: pId, title: "Untitled page", content: "# Untitled page\n", updated: Date.now() }] }] }));
    setSel({ nb: nbId, sec: secId, page: pId });
    setEditing(true);
  };
  const addSection = () => {
    const name = prompt("Section name");
    if (!name || !notebook) return;
    const secId = uid(), pId = uid();
    update((d) => findNb(d)?.sections.push({ id: secId, name, pages: [{ id: pId, title: "Untitled page", content: "# Untitled page\n", updated: Date.now() }] }));
    setSel({ nb: sel.nb, sec: secId, page: pId });
    setEditing(true);
  };
  const addPage = () => {
    if (!section) return;
    const pId = uid();
    update((d) => findSec(d)?.pages.push({ id: pId, title: "Untitled page", content: "# Untitled page\n", updated: Date.now() }));
    setSel({ ...sel, page: pId });
    setEditing(true);
  };
  const rename = (kind: "nb" | "sec", current: string) => {
    const name = prompt("Rename", current);
    if (!name) return;
    update((d) => {
      if (kind === "nb") { const n = findNb(d); if (n) n.name = name; }
      else { const s = findSec(d); if (s) s.name = name; }
    });
  };
  const remove = (kind: "nb" | "sec" | "page") => {
    if (!confirm(`Delete this ${kind === "nb" ? "notebook" : kind === "sec" ? "section" : "page"}?`)) return;
    let next: KB | null = null;
    update((d) => {
      if (kind === "nb") d.notebooks = d.notebooks.filter((n) => n.id !== sel.nb);
      else if (kind === "sec") { const n = findNb(d); if (n) n.sections = n.sections.filter((s) => s.id !== sel.sec); }
      else { const s = findSec(d); if (s) s.pages = s.pages.filter((p) => p.id !== sel.page); }
      next = d;
    });
    setTimeout(() => {
      if (!next) return;
      const k = next as KB;
      if (kind === "nb") setSel(firstSel(k));
      else {
        const n = k.notebooks.find((x) => x.id === sel.nb);
        const s = kind === "sec" ? n?.sections[0] : n?.sections.find((x) => x.id === sel.sec);
        setSel({ nb: sel.nb, sec: s?.id ?? "", page: s?.pages[0]?.id ?? "" });
      }
    });
  };
  const editPage = (patch: { title?: string; content?: string }) =>
    update((d) => {
      const p = findSec(d)?.pages.find((x) => x.id === sel.page);
      if (p) Object.assign(p, patch, { updated: Date.now() });
    });

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._+-]/g, "").slice(0, 24);
    if (!tag) return;
    update((d) => {
      const p = findSec(d)?.pages.find((x) => x.id === sel.page);
      if (p) p.tags = [...new Set([...(p.tags ?? []), tag])];
    });
  };
  const removeTag = (tag: string) =>
    update((d) => {
      const p = findSec(d)?.pages.find((x) => x.id === sel.page);
      if (p) p.tags = (p.tags ?? []).filter((t) => t !== tag);
    });

  const onImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!isKB(data)) throw new Error();
      if (!confirm("Replace your current knowledge base with this file? (Export first if you want a backup.)")) return;
      setKb(data);
      setSel(firstSel(data));
    } catch {
      alert("That file isn't a valid knowledge base export.");
    }
  };
  const onReset = () => {
    if (!confirm("Restore the original starter articles? Your changes will be lost.")) return;
    const k = seedKB();
    setKb(k);
    setSel(firstSel(k));
  };

  const pageCount = kb.notebooks.reduce((a, n) => a + n.sections.reduce((b, s) => b + s.pages.length, 0), 0);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-panel px-4">
        <div className="flex items-center gap-2 font-mono text-sm font-bold text-primary">
          <Terminal className="h-4 w-4" /> it-kb<span className="animate-pulse">_</span>
        </div>
        <div className="relative ml-2 max-w-md flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${pageCount} pages…`}
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-8 font-mono text-sm outline-none focus:border-ring"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <TopBtn onClick={() => downloadKB(kb)} icon={Download} label="Export" />
          <TopBtn onClick={() => fileRef.current?.click()} icon={Upload} label="Import" />
          <TopBtn onClick={onReset} icon={RotateCcw} label="Reset" />
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Notebooks */}
        <aside className="flex w-14 shrink-0 flex-col border-r border-border bg-panel md:w-56">
          <PaneHead title="Notebooks" onAdd={addNotebook} />
          <nav className="flex-1 overflow-y-auto p-1.5">
            {kb.notebooks.map((n) => {
              const Icon = ICONS[n.icon] ?? Folder;
              const active = n.id === sel.nb;
              return (
                <button
                  key={n.id}
                  title={n.name}
                  onClick={() => { const s = n.sections[0]; setSel({ nb: n.id, sec: s?.id ?? "", page: s?.pages[0]?.id ?? "" }); setEditing(false); setQuery(""); }}
                  className={`mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden truncate md:inline">{n.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Sections + pages / search results */}
        <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-panel-2 max-sm:hidden">
          {query ? (
            <>
              <div className="border-b border-border px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">{results.length} results</div>
              <div className="flex-1 overflow-y-auto p-1.5">
                {results.map((r) => (
                  <button
                    key={r.pageId}
                    onClick={() => { setSel({ nb: r.nb.id, sec: r.secId, page: r.pageId }); setEditing(false); }}
                    className={`mb-1 w-full rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted ${r.pageId === sel.page ? "bg-muted" : ""}`}
                  >
                    <div className="truncate text-sm text-foreground">{r.title}</div>
                    <div className="truncate font-mono text-[0.68rem] text-primary/80">{r.nb.name} / {r.secName}</div>
                    {r.snippet && <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">…{r.snippet}…</div>}
                    {r.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded bg-muted px-1 font-mono text-[0.62rem] text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
                {!results.length && (
                  <div className="px-2 py-3 font-mono text-xs text-muted-foreground">
                    nothing matched "{query}"<br />try a shorter word
                  </div>
                )}
              </div>
            </>
          ) : notebook ? (
            <>
              <div className="flex items-center gap-1 border-b border-border px-3 py-2.5">
                <span className="flex-1 truncate font-mono text-sm font-semibold">{notebook.name}</span>
                <IconBtn icon={Pencil} onClick={() => rename("nb", notebook.name)} label="Rename notebook" />
                <IconBtn icon={Trash2} onClick={() => remove("nb")} label="Delete notebook" danger />
              </div>
              <div className="flex flex-wrap gap-1 border-b border-border p-2">
                {notebook.sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSel({ nb: sel.nb, sec: s.id, page: s.pages[0]?.id ?? "" }); setEditing(false); }}
                    onDoubleClick={() => rename("sec", s.name)}
                    className={`rounded px-2 py-1 font-mono text-xs transition-colors ${s.id === sel.sec ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    {s.name}
                  </button>
                ))}
                <button onClick={addSection} title="Add section" className="rounded border border-dashed border-border px-2 py-1 font-mono text-xs text-muted-foreground hover:border-primary hover:text-primary">+ section</button>
              </div>
              {section && (
                <>
                  <div className="flex items-center gap-1 px-3 pt-2 pb-1">
                    <span className="flex-1 font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground">Pages</span>
                    <IconBtn icon={Pencil} onClick={() => rename("sec", section.name)} label="Rename section" />
                    <IconBtn icon={Trash2} onClick={() => remove("sec")} label="Delete section" danger />
                    <IconBtn icon={Plus} onClick={addPage} label="Add page" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-1.5 pt-0">
                    {section.pages.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSel({ ...sel, page: p.id }); setEditing(false); }}
                        className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${p.id === sel.page ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{p.title}</span>
                        {(p.tags?.length ?? 0) > 0 && <Tag className="ml-auto h-3 w-3 shrink-0 text-primary/60" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">Create a notebook to begin.</div>
          )}
        </aside>

        {/* Page */}
        <main className="flex min-w-0 flex-1 flex-col">
          {page ? (
            <>
              <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-5">
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {notebook?.name} <span className="text-primary">/</span> {section?.name} <span className="text-primary">/</span> {page.title}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => setEditing((e) => !e)}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 font-mono text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    {editing ? <><Eye className="h-3.5 w-3.5" /> view</> : <><Pencil className="h-3.5 w-3.5" /> edit</>}
                  </button>
                  <IconBtn icon={Trash2} onClick={() => remove("page")} label="Delete page" danger />
                </div>
              </div>
              <TagBar
                key={page.id}
                tags={page.tags ?? []}
                onAdd={addTag}
                onRemove={removeTag}
                onPick={(t) => { setQuery(t); setEditing(false); }}
              />
              {editing ? (
                <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
                  <input
                    value={page.title}
                    onChange={(e) => editPage({ title: e.target.value })}
                    className="rounded-md border border-input bg-panel px-3 py-2 text-lg font-semibold outline-none focus:border-ring"
                    placeholder="Page title"
                  />
                  <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
                    <textarea
                      value={page.content}
                      onChange={(e) => editPage({ content: e.target.value })}
                      spellCheck={false}
                      className="min-h-[300px] resize-none rounded-md border border-input bg-code p-4 font-mono text-sm leading-relaxed outline-none focus:border-ring"
                    />
                    <div className="hidden overflow-y-auto rounded-md border border-border p-5 lg:block">
                      <Article content={page.content} />
                    </div>
                  </div>
                  <p className="font-mono text-[0.7rem] text-muted-foreground">
                    Markdown: # heading · **bold** · - list · ``` for code blocks · | tables | · auto-saved to this device
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
                  <Article content={page.content} />
                  {page.updated > 0 && (
                    <p className="mt-10 font-mono text-[0.7rem] text-muted-foreground">last edited {new Date(page.updated).toLocaleString()}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="font-mono text-sm">no page selected</p>
              {section && <button onClick={addPage} className="font-mono text-sm text-primary hover:underline">+ new page</button>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Article({ content }: { content: string }) {
  return (
    <article className="kb-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: ({ children }) => <CodeBlock>{children}</CodeBlock> }}>
        {content}
      </ReactMarkdown>
    </article>
  );
}

function TagBar({ tags, onAdd, onRemove, onPick }: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; onPick: (t: string) => void }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  };
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-panel-2 px-5 py-1.5">
      <Tag className="h-3 w-3 shrink-0 text-muted-foreground" />
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.68rem] text-muted-foreground">
          <button onClick={() => onPick(t)} title={`Search for everything tagged ${t}`} className="hover:text-primary">{t}</button>
          <button onClick={() => onRemove(t)} title="Remove tag" aria-label={`Remove tag ${t}`} className="opacity-50 hover:text-destructive hover:opacity-100">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
        onBlur={commit}
        placeholder="+ tag"
        aria-label="Add tag to this page"
        className="w-24 bg-transparent font-mono text-[0.68rem] text-foreground outline-none placeholder:text-muted-foreground/60"
      />
      {!tags.length && (
        <span className="font-mono text-[0.68rem] text-muted-foreground/60">
          tags are extra words search will find — type one above and press Enter
        </span>
      )}
    </div>
  );
}

function PaneHead({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
      <span className="hidden font-mono text-xs uppercase tracking-wider text-muted-foreground md:inline">{title}</span>
      <IconBtn icon={Plus} onClick={onAdd} label={`Add ${title.toLowerCase().slice(0, -1)}`} />
    </div>
  );
}

function IconBtn({ icon: Icon, onClick, label, danger }: { icon: typeof Book; onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded p-1 text-muted-foreground transition-colors hover:bg-muted ${danger ? "hover:text-destructive" : "hover:text-primary"}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function TopBtn({ icon: Icon, onClick, label }: { icon: typeof Book; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-primary">
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
