# Command palette intro video

These scripts make the command palette intro video and its splash image. The video is a screen recording of Cloud UI with ElevenLabs narration, SVG transitions and a music bed. The cuts fall on the music's downbeats.

## What you need

- A Cloud UI checkout with the palette. The scripts load Playwright from it. Set `CLOUD_UI_DIR` if it is not at `~/code/cloud-ui/dev-palette`.
- Cloud UI running at `http://localhost:3000`, or set `BASE_URL`.
- A Chrome profile that is signed in to that Cloud UI. The recorder uses `.profile/`, or set `PROFILE_DIR`. On the first run, sign in to the window that opens.
- A namespace to record in. Set `NAMESPACE`.
- An ElevenLabs API key in `ELEVENLABS_API_KEY`, or in `.el-key` (git ignores it).
- The music track. Set `MUSIC`, or put it at `~/Downloads/above-the-next-wave.mp3`.
- `ffmpeg`, `ffprobe`, Node and Python 3. Install the beat tracker with `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`.

## Make the video

Run these from `video/`:

1. Edit the narration in `lines.json`. Each entry is `[clip name, text]`.
2. `python3 narrate.py` makes `audio/<clip>.mp3` with ElevenLabs and writes `durations.json`.
3. `../.venv/bin/python beats.py "$MUSIC"` finds the beats and downbeats and writes `beats.json`.
4. `python3 plan.py` puts each clip on the downbeats and writes `plan.json`.
5. `node record.mjs > record.log` records the screen. `overlay.js` draws the transitions and key hints in the page. The log shows when each scene ends against the plan. "late: none" means every cut lands on its downbeat.
6. `python3 assemble.py` mixes the narration and the music, and writes `command-palette-demo.mp4`.
7. `python3 check_audio.py` measures the loudness of each narration window in the video.

The recorder starts a demo workflow for the workflow scenes. If a run stops early, `node terminate.mjs` terminates it.

## Make the splash image

Run `node splash/render.mjs`. It renders `splash/splash.html` to `splash/command-palette-splash.png`.

## Settings

- Voice: ElevenLabs `cBTYF7NiJbR8Bvmdeuse`. Set `VOICE_ID` to use another voice.
- Model: `eleven_multilingual_v2`, with stability 0.45, similarity 0.8, style 0.35 and speaker boost on.
- Mix: each narration clip at -16 LUFS, and the music at -27 LUFS. The music ducks under the voice and fades over the last two bars.
