# Gyaini Voice Frontend — No Lip Sync + Professional Login

This is the updated frontend based directly on the uploaded project.

## Changes made

### Removed lip-sync completely
Removed:
- mouth duplicate image layer
- mouth clipping
- mouth scaling / shifting
- Web Audio analyser
- audio-level callback
- portrait scaling driven by audio

The Qwen audio still plays normally through WebRTC.

A simple waveform/status can still show when the assistant response is active.
That state now comes from Qwen `response.created` / `response.done` events,
not from audio-level analysis.

### Professional login redesign
The authentication behavior is unchanged, but the login UI now includes:
- enterprise-style two-column layout
- refined Gyaini branding
- secure-session messaging
- voice + security benefit indicators
- polished glass/dark card
- password show/hide button
- responsive mobile layout
- clearer validation/error presentation

## Existing functionality preserved

- Node-RED authentication
- bearer session token
- protected voice page
- Qwen WebRTC audio conversation
- transcript updates
- appointment summary extraction
- mute/end controls
- sign out

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Keep Node-RED running at:

```text
http://127.0.0.1:1880
```
