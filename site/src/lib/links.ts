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

/** Where GitHub Pages serves the site. Link previews need full URLs. */
export const site = 'https://rossnelson.github.io/demo-video-tool';

/** The full URL of a page of the site, with the trailing slash the pages use. */
export function absolute(route: Route): string {
	return route === '/' ? `${site}/` : `${site}${route}/`;
}

/** The image a link preview shows, for every page (site/static/share.png). */
export const share = {
	url: `${site}/share.png`,
	width: 1200,
	height: 630,
	alt: 'demo-video: product videos that cut on the beat. A beat ruler with a red cut on a downbeat, and the install command.'
};
