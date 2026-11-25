import { defaults } from '../../../../../lib/project.mjs';
import { formatValue, isGroup } from '#lib/format.ts';
import { fieldText, subText } from '#lib/reference/project.ts';

export const prerender = true;

// One row per top-level field of the tool's own defaults, so the page lists
// exactly the fields the tool has.
export function load() {
	const fields = Object.entries(defaults as Record<string, unknown>).map(([key, value]) => ({
		key,
		text: fieldText[key] ?? '',
		value: isGroup(value) ? '' : formatValue(value),
		sub: isGroup(value)
			? Object.entries(value).map(([k, v]) => ({ key: k, value: formatValue(v), text: subText[`${key}.${k}`] ?? '' }))
			: []
	}));
	return { fields };
}
