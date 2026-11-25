export const prerender = true;

type Theme = {
	name?: string;
	description?: string;
	colors?: Record<string, unknown>;
	pad?: string;
	options?: Record<string, unknown>;
	modes?: Record<string, { colors?: Record<string, unknown> }>;
};

// Every theme in lib/themes, read at build time, so the list cannot drift.
const files = import.meta.glob<{ default: Theme }>('../../../../../lib/themes/*/theme.mjs', { eager: true });

const swatches = (colors: Record<string, unknown> = {}) =>
	Object.entries(colors)
		.filter((e): e is [string, string] => typeof e[1] === 'string' && /^#[0-9a-f]{3,8}$/i.test(e[1]))
		.map(([name, value]) => ({ name, value }));

export function load() {
	const themes = Object.entries(files)
		.map(([path, mod]) => {
			const dir = path.split('/').at(-2)!;
			const t = mod.default;
			const modes = Object.entries(t.modes ?? {})
				.filter(([, m]) => m.colors && Object.keys(m.colors).length)
				.map(([mode, m]) => ({ mode, swatches: swatches({ ...t.colors, ...m.colors }) }));
			return {
				dir,
				name: t.name ?? dir,
				description: t.description ?? '',
				swatches: swatches(t.colors),
				options: Object.entries(t.options ?? {}).map(([k, v]) => `${k}: ${JSON.stringify(v).replace(/"/g, "'")}`),
				modes
			};
		})
		.sort((a, b) => a.dir.localeCompare(b.dir));
	return { themes };
}
