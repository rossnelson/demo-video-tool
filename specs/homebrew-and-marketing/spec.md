# Install demo-video with Homebrew, and a site that explains it

Today the demo video tool runs only from a checkout of this repo, through `bin/demo`, and it finds its Python environment, its key and its example project inside that checkout. This change makes it an installed command, `demo-video`, that works from any folder; adds a `demo-video` formula to the Homebrew tap; and adds a SvelteKit site on GitHub Pages that tells people what the tool does and how to use it.

## Scope

### In scope
- An installed command `demo-video` with the same commands as `bin/demo`, plus `--version`, `setup` and `doctor`.
- Per-user locations for what the checkout held: the beat tracker's Python environment, Playwright with Chromium, and the ElevenLabs key.
- A `demo-video` formula in the Homebrew tap (local clone `~/code/homebrew-tools`).
- A release script that tags a version and writes the formula's `url` and `sha256` for it.
- A SvelteKit static site in `site/`, built and deployed to GitHub Pages by a workflow.
- An Install section in the README.

### Out of scope
- Linux packages, an npm package, a Docker image.
- A custom domain for the site.
- Hosting the rendered demo video itself (the site may link to it later).
- Changes to how a video is made: narration, beats, plan, record and assemble keep their behavior.
- Enabling GitHub Pages in the repo settings and cutting the first release: the user does these (see Follow-up).

## Requirements

### R1 An installed command that works from any folder
The `demo-video` command runs every `bin/demo` command on a project directory given relative to the current folder, with the tool's own files read from where it is installed. `bin/demo` in a checkout keeps working as before.

#### R1.S1 Version and help
- Given `demo-video` is installed
- When the user runs `demo-video --version`
- Then it prints `demo-video` and the version from the repo's `VERSION` file
- And `demo-video --help` lists every command, `setup` and `doctor` included

#### R1.S2 A new project outside the checkout
- Given `demo-video` is installed and the current folder is not the repo
- When the user runs `demo-video new my-video`
- Then `my-video/project.mjs` exists, copied from the installed example project
- And `demo-video show my-video` prints the project with its defaults

#### R1.S3 A symlinked command finds its files
- Given the command is a symlink to `bin/demo` in another folder (as Homebrew links it)
- When the user runs `demo-video themes`
- Then it lists the built-in themes

#### R1.S4 The checkout keeps working
- Given a checkout of the repo with its `.venv` and `.el-key`
- When the user runs `bin/demo narrate projects/example --dry` and `bin/demo show projects/example`
- Then both behave as they did before this change

### R2 Setup and doctor
`demo-video setup` installs what Homebrew cannot: the beat tracker's Python packages and Playwright with Chromium, into a per-user data folder. `demo-video doctor` reports each dependency as present or missing, with what to do.

#### R2.S1 Setup makes the per-user environment
- Given `demo-video` is installed and the data folder is empty
- When the user runs `demo-video setup`
- Then the data folder holds a Python environment with the packages from `requirements.txt`
- And it holds Playwright with a Chromium build
- And running `demo-video setup` again changes nothing and succeeds

#### R2.S2 The commands use the per-user environment
- Given `demo-video setup` ran
- When the user runs `demo-video beats` and `demo-video record` on a project
- Then `beats` uses the data folder's Python environment
- And `record` finds Playwright in the data folder

#### R2.S3 Doctor reports what is missing
- Given ffmpeg is installed but `demo-video setup` has not run and no ElevenLabs key is set
- When the user runs `demo-video doctor`
- Then it lists ffmpeg, ffprobe, node and python as found
- And it lists the beat tracker, Playwright and the ElevenLabs key as missing, each with the command or file that fixes it
- And it exits with a non-zero status

### R3 A per-user ElevenLabs key
Besides `ELEVENLABS_API_KEY` and a project's `.el-key`, `narrate` reads the key from a per-user config file, so an installed command needs no key in its install folder.

#### R3.S1 The key from the config file
- Given no `ELEVENLABS_API_KEY` and no `.el-key` in the project
- And the key is in `~/.config/demo-video/el-key`
- When the user runs `demo-video narrate <project>`
- Then it uses that key
- And when no key is found, the error names the environment variable, the project's `.el-key` and the config file

### R4 A Homebrew formula
The tap has a `demo-video` formula that installs the tool with its runtime dependencies (ffmpeg, node, python) and links `demo-video` onto the PATH.

#### R4.S1 Install from the tap
- Given the formula is in the tap and a release exists for its version
- When the user runs `brew install rossnelson/tools/demo-video`
- Then `demo-video --version` prints that version
- And the formula's test passes under `brew test demo-video`

#### R4.S2 Install from the main branch
- Given the formula is in the tap
- When the user runs `brew install --HEAD rossnelson/tools/demo-video`
- Then `demo-video --version` prints the version from the main branch

#### R4.S3 The caveats say what comes next
- Given the formula installed
- When the install finishes
- Then Homebrew prints caveats that say to run `demo-video setup` and how to set the ElevenLabs key

### R5 A release script
`scripts/release.sh <version>` writes `VERSION`, commits, tags `v<version>`, pushes the tag, and writes the tag's archive `url` and `sha256` into the formula of a local tap checkout.

#### R5.S1 A release updates the formula
- Given a clean main branch and a tap checkout at `$TAP_DIR` (default `../homebrew-tools`)
- When the user runs `scripts/release.sh 0.2.0`
- Then the repo has the tag `v0.2.0` with `VERSION` at `0.2.0`
- And the tap's formula has the `url` of the `v0.2.0` archive and its `sha256`

#### R5.S2 A bad version stops the release
- Given any repo state
- When the user runs `scripts/release.sh` with no version, or with `v0.2` or `0.2.0` on a dirty tree
- Then it exits with a non-zero status and changes nothing

### R6 A site that explains the tool
A SvelteKit static site in `site/` explains what the tool makes, how to install it and how to make a first video, with a reference of the commands, the project file and the themes. A workflow builds it on each pull request and deploys it to GitHub Pages from main.

#### R6.S1 The home page
- Given the site is built
- When a visitor opens the home page
- Then it says what the tool makes in one sentence
- And it shows the install command `brew install rossnelson/tools/demo-video` with a button that copies it
- And it links to the guide and the reference pages and to the GitHub repo

#### R6.S2 A first video
- Given the site is built
- When a visitor opens the guide page
- Then it lists the steps from install through `demo-video setup`, `demo-video new`, `demo-video all <project> --dry` to a video with narration

#### R6.S3 The reference
- Given the site is built
- When a visitor opens the reference pages
- Then they list every `demo-video` command with what it does, every project field with its default, and every built-in theme

#### R6.S4 It works under the Pages path
- Given the site is built with the base path `/demo-video-tool`
- When a visitor follows any link on any page
- Then the link opens a page or file of the site, with no 404

#### R6.S5 It reads on a phone
- Given a 375 px wide window
- When a visitor opens any page
- Then the page has no horizontal scroll and the code blocks scroll inside themselves

#### R6.S6 The workflow builds and deploys
- Given a pull request that changes `site/`
- When the workflow runs
- Then it builds the site and fails on a build or check error
- And on a push to main it deploys the build to GitHub Pages

### R7 The README says how to install
The README starts its setup with the Homebrew install and `demo-video setup`, and keeps the checkout steps for people who work on the tool.

#### R7.S1 Install in the README
- Given the README
- When a reader opens "What you need"
- Then they see `brew install rossnelson/tools/demo-video` and `demo-video setup` first, and a link to the site

## Edge cases
- A project path with spaces: every command quotes it.
- `demo-video new` on a folder that exists: it stops with an error, as `bin/demo new` does.
- `DEMO_VIDEO_HOME` set: setup and the commands use that folder in place of the default data folder.
- `PLAYWRIGHT_DIR` set: it still wins over the data folder, as now.
- Homebrew's Python changes version: `demo-video doctor` reports the broken environment and `demo-video setup` makes it again.
- The site's install command and the formula name must match; a test checks the site's text against the formula name.

## Assumptions
- The tap: a new public repo, `rossnelson/homebrew-tools` (local clone `~/code/homebrew-tools`), so the install is `brew install rossnelson/tools/demo-video`. The user chose this name so that the old `rossnelson/homebrew-tap` redirect to the Spec Studio tap keeps working.
- The command is `demo-video`, not `demo`, because `demo` is too generic for a PATH. The formula has the same name.
- The data folder is `${XDG_DATA_HOME:-~/.local/share}/demo-video`, overridden by `DEMO_VIDEO_HOME`; the key file is `${XDG_CONFIG_HOME:-~/.config}/demo-video/el-key`.
- `setup` installs Playwright with npm into the data folder and runs its Chromium install. Homebrew cannot do this in the formula without a long list of resources, and `librosa` has heavy dependencies.
- The first version is `0.1.0`.
- The site lives in this repo under `site/`, uses the same stack as the user's Spec Studio site (SvelteKit with adapter-static, Svelte 5), and deploys to `https://rossnelson.github.io/demo-video-tool/`.
- The tap PR merges after this repo's PR and after the first release, because the formula's `sha256` needs the release tag.

## Follow-up for the user
- Enable GitHub Pages with the source "GitHub Actions" in the repo settings.
- After the tool's PR merges: run `scripts/release.sh 0.1.0`, push the tap branch, and merge the tap PR.
