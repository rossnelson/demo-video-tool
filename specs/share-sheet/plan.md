# Plan: A share image for the site's link preview

## Approach

Two parts, both in the `site/` folder of this repo.

**The tags.** A new component `site/src/lib/Meta.svelte` takes `title`, `description` and `route`. It writes the `<title>`, the meta description and the Open Graph and Twitter tags in one `<svelte:head>`, so the preview text can never drift from the page's own title and description. The site URL (`https://rossnelson.github.io/demo-video-tool`) goes in `site/src/lib/links.ts` next to `link()`, with a function `absolute(route)` that gives a page's full URL with the trailing slash. Each of the five pages (`+page.svelte` for home, guide and the three reference pages) replaces its own `<svelte:head>` title and description with `<Meta>`. The image tags (`og:image`, its width, height and alt) and `og:site_name`, `og:type` and `twitter:card` are the same on every page, so `Meta` writes them too; one component keeps every tag of a page in one place. `og:url` and `og:image` are absolute, because crawlers do not resolve relative URLs there; `asset()`/`resolve()` give paths, not full URLs, in a prerendered static site.

**The image.** A small demo-video project in `site/share/` (a `project.mjs` with `splash: { width: 1200, height: 630, scale: 1, file: './splash.html' }` and the title and install command) and its own splash page, `site/share/splash.html`. The page draws the site's look: paper `#f5f2ec`, ink `#1c1a17`, cut `#b83b1a`, the logo mark and name, the headline "Product videos that cut on the beat.", a beat ruler like `BeatRuler.svelte` (four bars, scenes, a red cut on a downbeat) and the install command. It loads Schibsted Grotesk and JetBrains Mono from `site/node_modules/@fontsource-variable` by a relative file URL, so the image uses the site's fonts. `site/scripts/share-image.sh` runs `bin/demo splash site/share` and copies `site/share/build/share-splash.png` to `site/static/share.png`. The PNG is committed. Using the tool's own `splash` command is the point of a demo tool's share image, and it needs no new dependency; the choice not to make it in CI is because the build job does not install the tool's Playwright, and the image changes rarely. `site/share/build/` is ignored by git.

Scale 1 (1200 × 630) keeps the file well below 1 MB; Slack, X and LinkedIn show this size large.

## Repos
| Repo | Why it changes | Merge order |
|---|---|---|
| demo-video-tool | The site's tags, the share project and the image | 1 |

## Steps
1. demo-video-tool: `site/src/lib/links.ts` gets `site` and `absolute(route)`; new `site/src/lib/Meta.svelte`; the five pages use it. Tests in `site/tests/share.spec.ts`. Covers R1.
2. demo-video-tool: `site/share/project.mjs`, `site/share/splash.html`, `site/scripts/share-image.sh`, a `.gitignore` for `site/share/build/`, and the made `site/static/share.png`. Tests for the image in `site/tests/share.spec.ts`. Covers R2, R3.

## Tests
- R1.S1: `site/tests/share.spec.ts` reads the home page's head and checks `og:title`, `og:description` (equal to the meta description), `og:url`, `og:type`, `og:site_name` and `twitter:card`.
- R1.S2: the same file loops over the pages of `tests/helpers.ts` and checks that `og:title` equals `document.title`, `og:description` equals the meta description, and `og:url` is the site URL plus the page path.
- R1.S3: the same loop checks `og:image`, `og:image:width` 1200, `og:image:height` 630 and a non-empty `og:image:alt`.
- R2.S1: `share.spec.ts` gets `share.png` from the test server, checks the `image/png` type, reads the width and height from the PNG header (1200 × 630 or a multiple) and checks the size is under 1 MB.
- R2.S2: a manual check of the made image, attached to the PR; the colours come from the same tokens as `app.css`.
- R3.S1: run `site/scripts/share-image.sh` in the build and check that it writes `site/static/share.png`; `tests/` in the CLI suite is not touched, since the script needs Chromium and the tool's setup.

## Risks
- Font loading from `node_modules` by a relative file URL fails when `npm ci` has not run: the script checks that the font folder exists and stops with a message.
- A crawler cache keeps the old preview for a link shared before: nothing to do; it is said in the PR.
- `npm run check` (svelte-check) runs on the new component: the build step runs it.
