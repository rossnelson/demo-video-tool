# A share image for the site's link preview

When someone pastes a link to the site in Slack, iMessage, X or LinkedIn, the preview shows a grey placeholder where the picture should be, so the link does not draw people in. The site gets a share image in its own look, made by demo-video's own `splash` command, and every page gets the Open Graph and Twitter card tags that make a link preview show that image large, with the page's own title and description.

## Scope

### In scope
- One share image for the whole site, 1200 × 630, in the site's look: the dark ink, the cream paper and the red cut mark of the logo, the headline "Product videos that cut on the beat." and a beat ruler with a cut on a downbeat.
- The image is made by demo-video's `splash` command from a small project in the site folder, with its own splash page. A script makes it again and puts it in the site's static files.
- On every page: `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:image` with its width, height and alt text, and `twitter:card` set to `summary_large_image`.
- The title and description of the preview are the page's own `<title>` and meta description.
- Tests that check the tags on every page, and the image file.

### Out of scope
- A different image for each page.
- A share button or a native share sheet (`navigator.share`) on the site.
- Changes to the `splash` command or to the themes.
- Making the image in CI. The image is a committed file.

## Requirements

### R1 Every page has link preview tags
Each page of the site has the Open Graph and Twitter card tags, so that a link preview shows a large image, the page's title and the page's description.

#### R1.S1 The home page preview
- Given the built site
- When a crawler reads the home page
- Then the page has `og:title` "demo-video: narrated product videos, cut on the beat"
- And `og:description` is the same text as the page's meta description
- And `og:url` is `https://rossnelson.github.io/demo-video-tool/`
- And `og:type` is `website` and `og:site_name` is `demo-video`
- And `twitter:card` is `summary_large_image`

#### R1.S2 Each page has its own title, description and URL
- Given the built site
- When a crawler reads the guide, the commands, the project file or the themes page
- Then `og:title` is the same as the page's `<title>`
- And `og:description` is the same as the page's meta description
- And `og:url` is the page's full URL on `https://rossnelson.github.io/demo-video-tool/`, with the trailing slash

#### R1.S3 Every page points at the share image with a full URL
- Given the built site
- When a crawler reads any page
- Then `og:image` is `https://rossnelson.github.io/demo-video-tool/share.png`
- And `og:image:width` is 1200 and `og:image:height` is 630
- And `og:image:alt` says what the image shows

### R2 The share image
The site serves a share image of 1200 × 630 in the site's look, which tells a person what demo-video makes.

#### R2.S1 The image is served with the site
- Given the built site
- When a client gets `/demo-video-tool/share.png`
- Then it gets a PNG image whose size is 1200 × 630, or a multiple of it
- And the file is smaller than 1 MB

#### R2.S2 The image is in the site's look
- Given the share image
- When a person looks at it
- Then it shows the demo-video mark and name, the headline "Product videos that cut on the beat.", a beat ruler with a red cut on a downbeat, and the install command
- And its colours are the site's ink, paper and cut colours

### R3 demo-video makes its own share image
The share image is made by demo-video's `splash` command, and one script makes it again.

#### R3.S1 The script makes the image again
- Given a checkout with demo-video's Playwright set up
- When a developer runs the share image script in the site folder
- Then the script runs demo-video's `splash` command on the site's share project
- And it writes the result to the site's static `share.png`

## Edge cases

- A page that sets no meta description: none exists today. The tag component requires a description, so a new page cannot leave it out.
- The base path `/demo-video-tool` is in every URL: `og:url` and `og:image` use the full site URL, because crawlers do not resolve relative URLs in these tags.
- Slack and other services cache a preview. A link that was shared before the change keeps the old preview until the cache expires.

## Assumptions

- "Share sheet" means the link preview card that Slack and other apps show for a pasted link, as in the screenshot from the user: the card had no image. It does not mean a share button.
- One image serves every page. The preview text still changes per page.
- The site URL is `https://rossnelson.github.io/demo-video-tool/`, from the README and the base path in `vite.config.ts`.
- The image is 1200 × 630, the size that Open Graph, X and LinkedIn all show large. The splash renders it at scale 1 to keep the file small.
- The image is committed, not made in CI, because the site's build job does not install the tool's Playwright, and the image changes rarely.
