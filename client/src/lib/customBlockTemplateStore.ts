const TEMPLATES_KEY = "ascend_custom_block_templates";

export interface BlockTemplate {
  id: string;
  name: string;
  color: string;
  icon: string;
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  description?: string;
  savedAt: number;
}

export function loadTemplates(): BlockTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BlockTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(t: BlockTemplate): void {
  try {
    const existing = loadTemplates().filter((x) => x.id !== t.id);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify([...existing, t]));
  } catch {}
}

export function deleteTemplate(id: string): void {
  try {
    const existing = loadTemplates().filter((x) => x.id !== id);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(existing));
  } catch {}
}
