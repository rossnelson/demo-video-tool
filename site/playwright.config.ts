import { defineConfig, devices } from '@playwright/test';

const port = 4111;

export default defineConfig({
	testDir: 'tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${port}/demo-video-tool/` },
	projects: [{ name: 'chromium' }],
	webServer: {
		command: `./scripts/serve-tests.sh ${port}`,
		url: `http://127.0.0.1:${port}/demo-video-tool/`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});
