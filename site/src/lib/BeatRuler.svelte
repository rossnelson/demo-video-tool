<script lang="ts">
	// Four bars of a music bed, with the scenes of a small video laid on them.
	// The playhead runs once; each scene starts as it crosses a downbeat.
	const beat = 30;
	const bar = beat * 4;
	const run = 4.8; // seconds for the playhead to cross four bars
	const scenes = [
		{ label: 'intro', from: 0, to: 1 },
		{ label: '01  Add a note', from: 1, to: 3 },
		{ label: 'end', from: 3, to: 4 }
	];
	const width = bar * 4;
	const at = (bars: number) => (bars * bar * run) / width;
</script>

<figure class="ruler">
	<svg viewBox="-2 0 {width + 4} 92" role="img" aria-labelledby="ruler-title">
		<title id="ruler-title">Three scenes over four bars of music. Each cut falls on a downbeat.</title>
		{#each scenes as s (s.label)}
			{@const x = s.from * bar + (s.from ? 2 : 0)}
			{@const w = (s.to - s.from) * bar - (s.from ? 2 : 0) - (s.to < 4 ? 2 : 0)}
			<g class="scene" style="--delay: {at(s.from)}s; --dur: {at(s.to - s.from)}s">
				<rect class="fill" {x} y="20" width={w} height="34" rx="5" />
				<text x={x + 10} y="41.5">{s.label}</text>
			</g>
		{/each}
		{#each Array.from({ length: 17 }, (_, i) => i) as i (i)}
			{@const down = i % 4 === 0}
			<line class:down x1={i * beat} x2={i * beat} y1={down ? 62 : 66} y2="76" />
		{/each}
		{#each [1, 3] as b (b)}
			<g class="cut" style="--delay: {at(b)}s">
				<line x1={b * bar} x2={b * bar} y1="12" y2="76" />
				<path d="M{b * bar - 5} 6h10l-5 6z" />
			</g>
		{/each}
		{#each [0, 1, 2, 3] as b (b)}
			<text class="bar" x={b * bar + 3} y="89">{b + 1}</text>
		{/each}
		<line class="head" style="--run: {run}s" x1="0" x2="0" y1="14" y2="78" />
	</svg>
	<figcaption>Scenes end on the first downbeat after their narration. <span>Red marks a cut.</span></figcaption>
</figure>

<style>
	.ruler {
		margin: 0;
		min-width: 0;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.fill {
		fill: var(--raised);
		stroke: var(--rule-strong);
		stroke-width: 1;
	}

	.scene text {
		font: 500 11.5px var(--mono);
		fill: var(--ink);
		white-space: pre;
	}

	line {
		stroke: var(--rule-strong);
		stroke-width: 1;
	}

	line.down {
		stroke: var(--ink-2);
		stroke-width: 1.5;
	}

	.cut line {
		stroke: var(--cut);
		stroke-width: 1.5;
	}

	.cut path {
		fill: var(--cut);
	}

	.bar {
		font: 10px var(--mono);
		fill: var(--ink-3);
	}

	.head {
		stroke: var(--cut);
		stroke-width: 1.5;
		opacity: 0;
	}

	figcaption {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: var(--ink-3);
	}

	figcaption span {
		color: var(--cut);
	}

	/* The figure shrinks on a phone; the labels grow to stay readable. */
	@media (max-width: 560px) {
		.scene text {
			font-size: 15px;
		}

		.bar {
			font-size: 14px;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.scene .fill {
			transform-box: fill-box;
			transform-origin: left center;
			animation: grow var(--dur) linear var(--delay) both;
		}

		.scene text {
			animation: show 240ms cubic-bezier(0.16, 1, 0.3, 1) var(--delay) both;
		}

		.cut {
			animation: show 200ms cubic-bezier(0.16, 1, 0.3, 1) var(--delay) both;
		}

		.head {
			animation: sweep var(--run) linear 0.3s both;
		}

		.scene .fill,
		.scene text,
		.cut {
			animation-delay: calc(var(--delay) + 0.3s);
		}
	}

	@keyframes grow {
		from {
			transform: scaleX(0);
		}
	}

	@keyframes show {
		from {
			opacity: 0;
			transform: translateY(3px);
		}
	}

	@keyframes sweep {
		0% {
			opacity: 1;
			transform: translateX(0);
		}
		96% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateX(480px);
		}
	}
</style>
