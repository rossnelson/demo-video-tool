import { expect, test, type Page } from '@playwright/test';
import { pages } from './helpers.ts';

const site = 'https://rossnelson.github.io/demo-video-tool/';

const head = (page: Page) =>
	page.evaluate(() => {
		const tags: Record<string, string> = {};
		for (const m of document.head.querySelectorAll('meta[property], meta[name]')) {
			const key = m.getAttribute('property') ?? m.getAttribute('name')!;
			tags[key] = m.getAttribute('content') ?? '';
		}
		return { title: document.title, tags };
	});

// R1.S1
test('the home page preview has the title, description and a large image card', async ({ page }) => {
	await page.goto('./');
	const { tags } = await head(page);
	expect(tags['og:title']).toBe('demo-video: narrated product videos, cut on the beat');
	expect(tags['og:description']).toBe(tags['description']);
	expect(tags['og:description']).toContain('demo-video makes a narrated product video from a browser');
	expect(tags['og:url']).toBe(site);
	expect(tags['og:type']).toBe('website');
	expect(tags['og:site_name']).toBe('demo-video');
	expect(tags['twitter:card']).toBe('summary_large_image');
});

for (const path of pages) {
	// R1.S2, R1.S3
	test(`the preview of ${path} has the page's own title, description and URL, and the share image`, async ({ page }) => {
		await page.goto(path);
		const { title, tags } = await head(page);
		expect(tags['og:title']).toBe(title);
		expect(tags['og:description']).toBeTruthy();
		expect(tags['og:description']).toBe(tags['description']);
		expect(tags['og:url']).toBe(new URL(path, site).href);
		expect(tags['og:url']).toMatch(/\/$/);
		expect(tags['og:image']).toBe(`${site}share.png`);
		expect(tags['og:image:width']).toBe('1200');
		expect(tags['og:image:height']).toBe('630');
		expect(tags['og:image:alt']).toMatch(/cut on the beat/);
		expect(tags['twitter:card']).toBe('summary_large_image');
	});
}

// R2.S1
test('the site serves the share image, 1200 × 630, under 1 MB', async ({ request }) => {
	const res = await request.get('share.png');
	expect(res.status()).toBe(200);
	expect(res.headers()['content-type']).toBe('image/png');
	const png = await res.body();
	expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
	const width = png.readUInt32BE(16);
	const height = png.readUInt32BE(20);
	expect(width % 1200).toBe(0);
	expect(height * 1200).toBe(width * 630);
	expect(png.length).toBeLessThan(1024 * 1024);
});
