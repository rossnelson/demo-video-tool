# Plan: Install demo-video with Homebrew, and a site that explains it

## Approach

**One entry point, made location-proof.** `bin/demo` stays the only entry point. It resolves its own path through symlinks (a portable `readlink` loop, because the macOS `readlink` has no `-f` on every version), so the repo root is right whether it runs from a checkout, through a symlink, or from Homebrew's `libexec`. It gains `--version` (reads `VERSION`), `setup` and `doctor`. The installed name `demo-video` is only the name Homebrew writes into its `bin`; no file in the repo is renamed, so `bin/demo` in a checkout works as before. The usage text names the command by the name it was called with.

**A per-user data folder for what Homebrew cannot install.** `bin/demo` computes `DEMO_VIDEO_HOME` (default `${XDG_DATA_HOME:-$HOME/.local/share}/demo-video`) and exports it. `lib/setup.sh` makes `$DEMO_VIDEO_HOME/venv` from `requirements.txt` and installs Playwright with npm into `$DEMO_VIDEO_HOME` (a `package.json` there), then runs its Chromium install. `lib/doctor.sh` checks each dependency and prints what fixes a missing one. `beats` uses the checkout's `.venv` first (a developer's checkout keeps its environment), then `$DEMO_VIDEO_HOME/venv`, then `python3`. `lib/playwright.mjs` tries `PLAYWRIGHT_DIR`, then the module path, then `$DEMO_VIDEO_HOME`. This keeps `librosa` and Chromium out of the formula: Homebrew would need dozens of Python resources for them, and the formula would break on each `librosa` update. Reason for setup over a `post_install` hook: `post_install` runs in Homebrew's sandbox, and a user-level folder is the right owner of a browser build.

**Files the tool writes go next to the user, not the install.** `demo-video theme <name>` writes its previews into `./build/themes/` of the current folder (or the project's `build/themes/` when a project is given), because Homebrew's `libexec` is not a place to write. `narrate` reads the key from `ELEVENLABS_API_KEY`, the project's `.el-key`, the checkout's `.el-key`, then `${XDG_CONFIG_HOME:-$HOME/.config}/demo-video/el-key`.

**The formula** lives in the tap as `Formula/demo-video.rb`. It installs the repo into `libexec` and writes `bin/demo-video` with `write_env_script`, which puts Homebrew's `python@3.12` first on the PATH (so `setup` makes the venv with a known Python), and depends on `ffmpeg`, `node` and `python@3.12`. It has a `head` on `main`, caveats that point to `setup` and the key file, and a test that runs `--version`, `new` and `show`. The stable `url` and `sha256` come from `scripts/release.sh`, which tags `v<version>`, pushes the tag, downloads the tag's archive, and writes both into the tap checkout's formula. The tap PR therefore merges after this repo's PR and the first release.

**The site** is SvelteKit with `adapter-static` and Svelte 5 in `site/`, the same stack and config shape as the user's Spec Studio site, with `paths.base` `/demo-video-tool`. Pages: home (`/`), guide (`/guide`), and reference (`/reference/commands`, `/reference/project`, `/reference/themes`). The content comes from the README; the theme list is read at build time from `lib/themes/*/theme.mjs` descriptions so it cannot drift. The install command is one constant in `site/src/lib/install.ts`, and a test checks it against the formula name. Playwright tests check the pages, the links under the base path, the copy button and the 375 px layout. `.github/workflows/site.yml` checks, tests and builds on pull requests that touch `site/`, and deploys to Pages from `main`, the same three jobs as the Spec Studio site.

## Repos
| Repo | Why it changes | Merge order |
|---|---|---|
| demo-video-tool | The CLI, setup, doctor, release script, site, README | 1 |
| homebrew-tools | The `demo-video` formula and its README (a new tap) | 2 |

## Steps
1. demo-video-tool: `bin/demo` resolves its root through symlinks, adds `VERSION` (0.1.0), `--version`, `setup` and `doctor` in the usage, quotes every path, and names itself by `$0`'s base name; `lib/theme-preview.mjs` writes into the current folder's or the project's `build/themes/`. Covers R1.
2. demo-video-tool: `DEMO_VIDEO_HOME` in `bin/demo`; `lib/setup.sh`, `lib/doctor.sh`; `beats` picks its Python from the checkout's `.venv`, then the data folder; `lib/playwright.mjs` looks in the data folder after the module path. Covers R2.
3. demo-video-tool: `lib/narrate.py` reads the key from the config file and names all places in its error. Covers R3.
4. demo-video-tool: `tests/cli_test.sh` (bash, no framework) runs the CLI scenarios in a temp HOME, through a symlink, and `.github/workflows/cli.yml` runs it on Ubuntu and macOS. Covers R1, R2, R3.
5. demo-video-tool: `scripts/release.sh <version>` with `TAP_DIR`, its checks, and its test in `tests/release_test.sh` against a temp git repo and a temp tap. Covers R5.
6. demo-video-tool: the SvelteKit site in `site/`, its Playwright tests, and `.github/workflows/site.yml`. Covers R6.
7. demo-video-tool: the README starts "What you need" with the Homebrew install, `demo-video setup`, `demo-video doctor` and the site link. Covers R7.
8. homebrew-tools: `Formula/demo-video.rb` and a row in the tap's README. Covers R4.

## Tests
- R1.S1: `tests/cli_test.sh` runs `bin/demo --version` and `--help` through a symlink named `demo-video` and checks the version and the `setup` and `doctor` lines.
- R1.S2: `tests/cli_test.sh` runs `demo-video new my-video` in a temp folder, then `demo-video show my-video`, and checks the project name in the output.
- R1.S3: `tests/cli_test.sh` runs `demo-video themes` through the symlink from a temp folder and checks that `slant` and `paper` are listed.
- R1.S4: `tests/cli_test.sh` runs `bin/demo show projects/example` and `bin/demo narrate projects/example --dry` in the checkout (skips narrate with a note when ffmpeg is missing).
- R2.S1: run `demo-video setup` twice with `DEMO_VIDEO_HOME` in the scratchpad during the build, and check the venv imports `librosa` and Playwright reports a Chromium path; CI runs it in `cli.yml` on Ubuntu.
- R2.S2: `tests/cli_test.sh` puts a stub `venv/bin/python` in a temp `DEMO_VIDEO_HOME` and checks that `demo-video beats` calls it; a node one-liner checks `lib/playwright.mjs` resolves Playwright from a temp `DEMO_VIDEO_HOME` with a stub `node_modules/playwright`.
- R2.S3: `tests/cli_test.sh` runs `demo-video doctor` with an empty `DEMO_VIDEO_HOME` and no key, and checks the missing lines and the non-zero exit.
- R3.S1: `tests/cli_test.sh` writes a key to a temp `XDG_CONFIG_HOME` and checks `narrate` gets past the key check (a stub `ELEVENLABS` URL is not called: the test uses a project with no scenes to narrate); with no key, it checks the error names all three places.
- R4.S1: after the first release, `brew install rossnelson/tools/demo-video` and `brew test demo-video`; during the build, `brew style` and `brew audit --formula` on the formula, and an install from a local copy of the tap with a formula pointed at a local archive.
- R4.S2: during the build, `brew install --HEAD` from a local tap whose `head` points at the worktree, then `demo-video --version`.
- R4.S3: the caveats show after the local install; `brew info` prints them.
- R5.S1: `tests/release_test.sh` runs the script against a temp clone with a bare remote and a temp tap, with the archive download pointed at a local `git archive` file, and checks the tag, `VERSION`, the `url` and the `sha256`.
- R5.S2: `tests/release_test.sh` checks the exit status and an unchanged tree for no version, `v0.2` and a dirty tree.
- R6.S1: `site/tests/site.spec.ts` checks the home page sentence, the install command and the copy button (clipboard permission granted), and the links.
- R6.S2: `site/tests/site.spec.ts` checks the guide lists setup, new, `all <project> --dry` and narrate in order.
- R6.S3: `site/tests/site.spec.ts` checks every command from `bin/demo`'s usage, every field of `lib/project.mjs`'s defaults and every theme in `lib/themes` appear on the reference pages.
- R6.S4: `site/tests/site.spec.ts` crawls every internal link of the built site under `/demo-video-tool` and checks each returns 200.
- R6.S5: `site/tests/site.spec.ts` opens every page at 375 px and checks `scrollWidth <= clientWidth`.
- R6.S6: the `site.yml` workflow runs on the PR; the deploy job runs only on `main`.
- R7.S1: read the README diff; `tests/cli_test.sh` greps the README for the install command.

## Risks
- `librosa` may not install on the newest Python Homebrew ships: the formula pins `python@3.12`, and `setup` uses the Python first on the PATH, which the env script sets.
- Playwright's Chromium download is large and fails offline: `setup` prints the failed step, and `doctor` reports it.
- The tap is a new repo, `rossnelson/homebrew-tools`, which the user chose; the formula first went to `spec-studio-app/homebrew-tap` and that PR was closed.
- The site's base path breaks links if a page uses a bare `/`: every link goes through `resolve()` from `$app/paths`, and the crawl test catches a miss.
- GitHub Pages is off until the user enables it: the deploy job fails until then, and the summary says so.
- The repo has no LICENSE; the formula leaves out `license`, and the summary asks the user to choose one.
