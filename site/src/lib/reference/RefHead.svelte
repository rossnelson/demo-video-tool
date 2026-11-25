<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { link, type Route } from '#lib/links.ts';

	let { title, children }: { title: string; children: Snippet } = $props();

	const tabs: { route: Route; label: string }[] = [
		{ route: '/reference/commands', label: 'Commands' },
		{ route: '/reference/project', label: 'Project file' },
		{ route: '/reference/themes', label: 'Themes' }
	];
</script>

<header class="head">
	<nav aria-label="Reference">
		{#each tabs as t (t.route)}
			{@const href = link(t.route)}
			<a {href} aria-current={page.url.pathname === href ? 'page' : undefined}>{t.label}</a>
		{/each}
	</nav>
	<h1>{title}</h1>
	<p class="lead">{@render children()}</p>
</header>

<style>
	.head {
		padding: clamp(2rem, 5vw, 3.5rem) 0 0.5rem;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 2rem;
	}

	nav a {
		font-size: 0.85rem;
		padding: 0.3rem 0.7rem;
		border: 1px solid var(--rule);
		border-radius: 999px;
		color: var(--ink-2);
		text-decoration: none;
		transition: border-color 160ms ease-out;
	}

	nav a:hover {
		border-color: var(--rule-strong);
	}

	nav a[aria-current='page'] {
		color: var(--ink);
		border-color: var(--ink);
	}

	h1 {
		margin-bottom: 1rem;
	}

	.lead {
		max-width: 60ch;
		font-size: 1.08rem;
	}
</style>
