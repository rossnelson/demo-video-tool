<script lang="ts">
	import { highlight, type Lang } from './highlight';

	let {
		code,
		lang = 'sh',
		copy = false,
		title = '',
		prompt = false,
		testid = undefined
	}: { code: string; lang?: Lang; copy?: boolean; title?: string; prompt?: boolean; testid?: string } = $props();

	let state = $state<'idle' | 'copied' | 'failed'>('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function onCopy() {
		try {
			await navigator.clipboard.writeText(code);
			state = 'copied';
		} catch {
			state = 'failed';
		}
		clearTimeout(timer);
		timer = setTimeout(() => (state = 'idle'), 1800);
	}

	const html = $derived(highlight(code, lang));
</script>

<figure class="block" class:has-copy={copy} data-testid={testid}>
	{#if title}<figcaption>{title}</figcaption>{/if}
	<div class="body">
		<pre class:prompt class:wrap={copy}><code>{@html html}</code></pre>
		{#if copy}
			<button type="button" class="copy" onclick={onCopy} aria-label="Copy the command">
				<svg viewBox="0 0 16 16" aria-hidden="true">
					{#if state === 'copied'}
						<path d="M3 8.5l3 3 7-7" />
					{:else}
						<rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
						<path d="M10.5 3.5v-.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5" />
					{/if}
				</svg>
				<span>{state === 'copied' ? 'Copied' : state === 'failed' ? 'Failed' : 'Copy'}</span>
			</button>
			<span class="visually-hidden" role="status">{state === 'copied' ? 'Copied to the clipboard.' : state === 'failed' ? 'The copy failed.' : ''}</span>
		{/if}
	</div>
</figure>

<style>
	.block {
		container-type: inline-size;
		margin: 1.25rem 0 1.5rem;
		border: 1px solid var(--rule);
		border-radius: 10px;
		background: var(--code);
		min-width: 0;
		overflow: hidden;
	}

	figcaption {
		font-family: var(--mono);
		font-size: 0.75rem;
		color: var(--ink-3);
		padding: 0.55rem 1rem;
		border-bottom: 1px solid var(--rule);
	}

	.body {
		display: flex;
		align-items: flex-start;
		min-width: 0;
	}

	pre {
		flex: 1;
		min-width: 0;
		margin: 0;
		padding: 0.95rem 1rem;
		overflow-x: auto;
		line-height: 1.6;
		font-size: 0.86rem;
		tab-size: 2;
	}

	pre.prompt code::before {
		content: '$ ';
		color: var(--ink-3);
		user-select: none;
	}

	pre :global(.t-com) {
		color: var(--ink-3);
	}

	pre :global(.t-str) {
		color: var(--ink-2);
		font-style: italic;
	}

	pre :global(.t-cmd) {
		color: var(--cut);
	}

	.copy {
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		width: 6.25rem;
		margin: 0.5rem 0.5rem 0.5rem 0;
		padding: 0.45rem 0.6rem;
		font: 500 0.8rem/1 var(--sans);
		color: var(--ink);
		background: var(--bg);
		border: 1px solid var(--rule-strong);
		border-radius: 7px;
		cursor: pointer;
		transition:
			background-color 160ms ease-out,
			border-color 160ms ease-out;
	}

	.copy:hover {
		border-color: var(--ink-2);
	}

	.copy:active {
		transform: translateY(1px);
	}

	/* In a narrow column a command wraps, and the button keeps only its icon. */
	@container (max-width: 420px) {
		pre.wrap {
			white-space: pre-wrap;
			overflow-wrap: anywhere;
		}

		.copy {
			position: relative;
			width: 2.4rem;
			height: 2.2rem;
			padding: 0;
		}

		.copy span {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}

	.copy svg {
		width: 15px;
		height: 15px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
