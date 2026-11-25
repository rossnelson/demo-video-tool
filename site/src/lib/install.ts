// The one place the install command lives. The formula name must match the
// Homebrew formula in the tap (tests/install.spec.ts checks it).
export const formula = 'demo-video';
export const tap = 'rossnelson/tools';
export const install = `brew install ${tap}/${formula}`;
export const repo = 'https://github.com/rossnelson/demo-video-tool';
