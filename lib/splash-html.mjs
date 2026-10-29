// Fills a theme's (or a project's) splash template with the project's values.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function splashHtml(project) {
  const S = project.splash;
  const keys = project.keys.map((k, i) => `<span class="key k${i + 1}${[...String(k)].length === 1 ? ' glyph' : ''}">${esc(k)}</span>`).join('');
  const chips = S.chips
    .map((c) => (typeof c === 'string' ? `<span class="chip">${esc(c)}</span>` : `<span class="chip"><b>${esc(c.key)}</b> ${esc(c.label)}</span>`))
    .join('\n    ');
  const values = {
    title: esc(project.title), subtitle: esc(project.subtitle), url: esc(project.url), keys, chips, width: S.width, height: S.height,
    ...Object.fromEntries(Object.entries(project.theme.colors).map(([k, v]) => [`colors.${k}`, v])),
    ...Object.fromEntries(Object.entries(project.theme.fonts).map(([k, v]) => [`fonts.${k}`, v])),
  };
  const template = readFileSync(S.file ?? join(project.theme.dir, 'splash.html'), 'utf8');
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) => values[k] ?? m);
}
