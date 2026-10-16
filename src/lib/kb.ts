export type Page = { id: string; title: string; content: string; updated: number; tags?: string[] };
export type Section = { id: string; name: string; pages: Page[] };
export type Notebook = { id: string; name: string; icon: string; sections: Section[] };
export type KB = { version: 1; notebooks: Notebook[] };

export const STORAGE_KEY = "it-kb-v1";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function loadKB(seed: () => KB): KB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as KB;
      if (Array.isArray(parsed.notebooks)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return seed();
}

export function saveKB(kb: KB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kb));
}

export function isKB(x: unknown): x is KB {
  return !!x && typeof x === "object" && Array.isArray((x as KB).notebooks);
}

export function downloadKB(kb: KB) {
  const blob = new Blob([JSON.stringify(kb, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `it-knowledge-base-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
