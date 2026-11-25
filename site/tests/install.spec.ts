import { expect, test } from '@playwright/test';
import { formula, install, tap } from '../src/lib/install.ts';

// The site's install command must name the Homebrew formula and tap.
test('the install command names the demo-video formula in the rossnelson tools tap', () => {
	expect(formula).toBe('demo-video');
	expect(tap).toBe('rossnelson/tools');
	expect(install).toBe('brew install rossnelson/tools/demo-video');
});
