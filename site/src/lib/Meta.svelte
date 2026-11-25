<script lang="ts">
	// The head of a page: its title and description, and the Open Graph and
	// Twitter card tags that a link preview reads. One component, so the
	// preview always says what the page says.
	import { absolute, share, type Route } from '#lib/links.ts';

	let { title, description, route }: { title: string; description: string; route: Route } = $props();
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="demo-video" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={absolute(route)} />
	<meta property="og:image" content={share.url} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content={String(share.width)} />
	<meta property="og:image:height" content={String(share.height)} />
	<meta property="og:image:alt" content={share.alt} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>
