# Voice assistant: how it works and your options

## How it works now (automatic)

1. A visitor presses **Talk to my portfolio**.
2. The site tries the **ElevenLabs agent** first (best quality, natural voice, can answer anything).
3. If ElevenLabs can't connect, for example because the credits have run out, the site switches to the
   **quick assistant** automatically. No error is shown.
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
| **D. Browser voice + Gemini free tier** | Free, within Google's daily limits | Smart answers, device voice | Get a Gemini API key, add it in Vercel |

### Stretching ElevenLabs credits
- Roughly 400 to 700 credits per minute (estimate; check your agent's call history for the exact rate).
  20,000 credits is about 30 to 50 minutes of calls.
- Set the maximum call length to 2 minutes.
- Choose a cheaper model ("flash" or "mini") in the agent's LLM setting.
- Keep the domain allowlist on, so nobody else can use your agent.

### Upgrading to option D later
Needs a small server function on Vercel and a Gemini API key saved in Vercel's environment variables
(never in the code). The call bar and knowledge base stay the same; Gemini would replace the fixed answers,
and the fixed answers would stay as the safety net.

## To do
- [ ] Update the ElevenLabs agent's system prompt: it still describes RoarINK as a project and doesn't know
      about Waffle or FarMart Dashak.
