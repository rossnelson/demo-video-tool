<script lang="ts">
	import '../app.css';
	import { asset } from '$app/paths';
	import { page } from '$app/state';
	import { link, nav } from '#lib/links.ts';
	import { repo } from '#lib/install.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const current = (href: string) => page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href={asset('favicon.svg')} />
</svelte:head>

<a class="skip" href="#main">Skip to the content</a>

<header class="top">
	<a class="brand" href={link('/')}>
		<svg viewBox="0 0 22 16" aria-hidden="true">
			<rect x="0" y="1" width="2" height="14" rx="1" />
			<rect x="6" y="5" width="2" height="6" rx="1" />
			<rect x="12" y="5" width="2" height="6" rx="1" />
			<rect class="cut" x="18" y="0" width="2.5" height="16" rx="1.25" />
		</svg>
		demo-video
	</a>
	<nav aria-label="Site">
		{#each nav as item (item.route)}
			{@const href = link(item.route)}
			<a {href} aria-current={current(href) ? 'page' : undefined}>{item.label}</a>
		{/each}
		<a href={repo}>GitHub</a>
	</nav>
</header>

<main id="main">
	{@render children()}
</main>

<footer class="foot">
	<p>demo-video makes narrated product videos from a browser, cut on the beat.</p>
	<p>
		<a href={link('/guide')}>Guide</a>
		<a href={link('/reference/commands')}>Reference</a>
		<a href={repo}>Source on GitHub</a>
	</p>
</footer>

<style>
	.skip {
		position: absolute;
		left: var(--gutter);
		top: -3rem;
		padding: 0.4rem 0.7rem;
		background: var(--ink);
		color: var(--bg);
		border-radius: 6px;
		z-index: 2;
	}

	.skip:focus {
		top: 0.6rem;
	}

	.top {
		max-width: var(--page);
		margin: 0 auto;
		padding: 1.1rem var(--gutter);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem 1.5rem;
		border-bottom: 1px solid var(--rule);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		font-family: var(--mono);
		font-weight: 600;
		font-size: 0.98rem;
		color: var(--ink);
		text-decoration: none;
		letter-spacing: -0.01em;
	}

	.brand svg {
		width: 22px;
		height: 16px;
		fill: var(--ink);
	}

	.brand .cut {
		fill: var(--cut);
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem 1.25rem;
		font-size: 0.94rem;
	}

	nav a {
		color: var(--ink-2);
		text-decoration: none;
		padding: 0.15rem 0;
		border-bottom: 1.5px solid transparent;
		transition:
			color 160ms ease-out,
			border-color 160ms ease-out;
	}

	nav a:hover {
		color: var(--ink);
	}

	nav a[aria-current='page'] {
		color: var(--ink);
		border-bottom-color: var(--cut);
	}

	main {
		max-width: var(--page);
		margin: 0 auto;
		padding: 0 var(--gutter) 5rem;
	}

	.foot {
		max-width: var(--page);
		margin: 0 auto;
		padding: 2rem var(--gutter) 3rem;
		border-top: 1px solid var(--rule);
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem 2rem;
		font-size: 0.9rem;
		color: var(--ink-3);
	}

	.foot p {
		margin: 0;
	}

	.foot a {
		margin-right: 1.1rem;
	}
</style>
