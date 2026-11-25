// The site's share image: the picture a link preview shows (og:image).
// demo-video makes it with its own splash command, from ./splash.html.
//   site/scripts/share-image.sh   -> site/static/share.png
export default {
  name: 'share',
  title: 'Product videos that cut on the beat.',
  subtitle: 'demo-video makes a narrated product video from a browser: a screen recording, narration, title cards and a music bed.',
  url: 'brew install rossnelson/tools/demo-video',
  music: { path: null },
  splash: { width: 1200, height: 630, scale: 1, file: './splash.html' },
  scenes: [],
};
