# Voice assistant: how it works and your options

## How it works now (automatic)

1. A visitor presses **Talk to my portfolio**.
2. The site tries each voice in order until one connects (set in `content.json`, `voice_kb.voice_order`):
   1. **Gemini Live** (free tier): natural voice, answers anything from the portfolio prompt.
      Uses `GEMINI_API_KEY` in Vercel. `/api/voice-token` picks the best live voice model for the key and hands
      the browser a single-use token that expires within a minute, so the real key is never exposed.
      Limited to 12 calls per visitor per day.
   2. **ElevenLabs agent**: natural voice, uses monthly credits.
   3. **Quick assistant** (below): always works.
3. A voice that fails is skipped for the rest of that visit. No error is shown.
4. The quick assistant is free and needs no account:
   - **Listening:** the browser's built-in speech recognition (Chrome, Edge, Safari including iPhone; not Firefox).
   - **Answers:** a small knowledge base in `content.json` under `voice_kb` (who you are, FarMart, each project,
     skills, experience, location, resume, contact). Unknown questions get a polite answer pointing to your email.
   - **Speaking:** the device's own voice. The best available English voice is chosen automatically.
   - **Tappable questions** are shown too, so it works even where speech recognition isn't available.
   - Calls are capped at 150 seconds.
5. Once a visitor falls back to the quick assistant, their next call in the same visit goes straight to it.
6. When your ElevenLabs credits refill, calls use ElevenLabs again with no changes needed.

To update what the quick assistant says, edit `voice_kb` in `content.json` and run `python3 build.py`.

## Your options

| Option | Cost | Quality | Setup |
|---|---|---|---|
| **A. Quick assistant only** (already live as the fallback) | Free | Fixed answers, device voice | None |
| **B. ElevenLabs free plan** (current) | Free, monthly credits | Best: natural voice, answers anything | Done |
| **C. ElevenLabs paid plan** | From about $5 a month (check current pricing) | Best, plus your cloned voice | Upgrade in ElevenLabs |
| **D. Gemini Live** (live now, tried first) | Free tier, within Google's daily limits | Natural voice, answers anything | Done: `GEMINI_API_KEY` in Vercel |

### Stretching ElevenLabs credits
- Roughly 400 to 700 credits per minute (estimate; check your agent's call history for the exact rate).
  20,000 credits is about 30 to 50 minutes of calls.
- Set the maximum call length to 2 minutes.
- Choose a cheaper model ("flash" or "mini") in the agent's LLM setting.
- Keep the domain allowlist on, so nobody else can use your agent.

### Gemini settings
- The assistant's whole setup (prompt, captions, turn-taking) is locked into each token on the server, in
  `api/voice-token.js`. The prompt comes from `voice_kb.system_prompt` in `content.json`, so editing that and
  pushing updates what Gemini knows.
- Memory: each visitor's conversation is kept in their own browser for 24 hours (`localStorage`, key
  `voice-memory`), and a new call picks up where the last one left off. Nothing is stored on a server.
- Force a specific model: add `GEMINI_LIVE_MODEL` in Vercel (otherwise the best available one is picked).
- The prompt Gemini uses is `voice_kb.system_prompt` in `content.json`. Keep it in sync with the ElevenLabs prompt.

## Reading what visitors ask
- Every call's text (no audio, no IP addresses) is saved to the Upstash database: the last 1,000 conversations.
- Read them at `/api/voice-log?key=YOUR_KEY`, where `YOUR_KEY` is the `VOICE_ADMIN_KEY` you set in Vercel.
  The page shows the most-asked questions and each conversation, newest first, in IST.
- Visitors see a notice in the call bar that conversations are saved as text.

## To do
- [ ] Paste the updated prompt into the ElevenLabs agent (same text as `voice_kb.system_prompt`).
- [ ] Make a real test call and check it's using Gemini (the status line shows no "quick assistant" label).
