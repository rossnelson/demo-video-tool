import { expect, test } from '@playwright/test';
import { pages } from './helpers.ts';

// R6.S5
test.describe('at 375 px', () => {
	test.use({ viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true });

	for (const path of pages) {
		test(`${path} has no horizontal scroll`, async ({ page }) => {
			await page.goto(path);
			const { scroll, client } = await page.evaluate(() => ({
				scroll: document.documentElement.scrollWidth,
				client: document.documentElement.clientWidth
			}));
			expect(scroll).toBeLessThanOrEqual(client);
		});
	}
});
