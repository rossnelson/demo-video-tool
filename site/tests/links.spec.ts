import { expect, test } from '@playwright/test';
import { pages } from './helpers.ts';

// R6.S4: crawl from the home page; every internal link and asset answers 200.
test('every internal link of every page opens', async ({ page, request, baseURL }) => {
	const base = new URL(baseURL!);
	const seen = new Set<string>();
	const queue = pages.map((p) => new URL(p, base).href);
	const broken: string[] = [];
	while (queue.length) {
		const url = queue.shift()!;
		if (seen.has(url)) continue;
		seen.add(url);
		const res = await request.get(url, { maxRedirects: 0 });
		if (res.status() !== 200) {
			broken.push(`${res.status()} ${url}`);
			continue;
		}
		if (!(res.headers()['content-type'] ?? '').includes('text/html')) continue;
		await page.goto(url);
		const found = await page.evaluate(() => [
			...[...document.querySelectorAll('a[href]')].map((a) => (a as HTMLAnchorElement).href),
			...[...document.querySelectorAll('link[href]')].map((l) => (l as HTMLLinkElement).href),
			...[...document.querySelectorAll('script[src], img[src]')].map((s) => (s as HTMLImageElement).src)
		]);
		for (const href of found) {
			const u = new URL(href);
			u.hash = '';
			if (u.origin === base.origin && !seen.has(u.href)) queue.push(u.href);
		}
	}
	expect(broken).toEqual([]);
	expect(seen.size).toBeGreaterThanOrEqual(pages.length);
	for (const url of seen) expect(new URL(url).pathname.startsWith('/demo-video-tool/'), url).toBe(true);
});
