/** Writes a default value the way it would look in a project.mjs. */
export function formatValue(v: unknown): string {
	if (v === null) return 'null';
	if (typeof v === 'string') return `'${v}'`;
	if (typeof v === 'number') {
		if (Number.isInteger(v)) return String(v);
		for (const d of [3, 6, 7, 9]) {
			const n = v * d;
			if (Math.abs(n - Math.round(n)) < 1e-9 && !Number.isInteger(v * 2)) return `${Math.round(n)} / ${d}`;
		}
		return String(v);
	}
	if (Array.isArray(v)) return v.length ? `[${v.map(formatValue).join(', ')}]` : '[]';
	if (typeof v === 'object') {
		const entries = Object.entries(v as Record<string, unknown>);
		return entries.length ? `{ ${entries.map(([k, x]) => `${k}: ${formatValue(x)}`).join(', ')} }` : '{}';
	}
	return String(v);
}

export const isGroup = (v: unknown): v is Record<string, unknown> =>
	!!v && typeof v === 'object' && !Array.isArray(v);
