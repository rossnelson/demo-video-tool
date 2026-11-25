import { resolve } from '$app/paths';

export type Route = '/' | '/guide' | '/reference/commands' | '/reference/project' | '/reference/themes';

/** A link to a page of the site, under the base path, with the trailing slash the pages use. */
export function link(route: Route): string {
	const path = resolve(route);
	return path.endsWith('/') ? path : `${path}/`;
}

export const nav: { route: Route; label: string }[] = [
	{ route: '/guide', label: 'Guide' },
	{ route: '/reference/commands', label: 'Commands' },
	{ route: '/reference/project', label: 'Project file' },
	{ route: '/reference/themes', label: 'Themes' }
];
