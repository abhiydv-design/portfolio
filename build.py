"""Generates index.html and work/*.html from content.json. Run: python3 build.py"""
import json, html
from pathlib import Path

C = json.loads(Path("content.json").read_text())
e = html.escape

ALT = {
    "map": "A map drawn as filled and hollow squares with scattered cross marks for water.",
    "ring": "A circular chart built from hundreds of small outlined circles.",
    "stitch": "A leafy branch in cross-stitch on a visible grid.",
    "land": "Two mountain ridges and a moon drawn in short horizontal lines.",
}
MARK = {
    "square": '<rect width="10" height="10" style="fill:var(--accent)"/>',
    "circle": '<circle cx="5" cy="5" r="4" style="fill:none;stroke:var(--accent)" stroke-width="1.4"/>',
    "cross": '<path d="M1 1L9 9M9 1L1 9" style="stroke:var(--accent)" stroke-width="1.6"/>',
    "dash": '<rect y="4" width="10" height="2" style="fill:var(--accent)"/>',
}
LAYOUT = [("span-7", ""), ("span-5", " drop"), ("span-5", ""), ("span-7", "")]

LOGO = ('<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect width="5" height="5" style="fill:var(--accent)"/>'
        '<rect x="6.5" y="6.5" width="5" height="5" style="fill:var(--accent)"/><rect x="13" width="5" height="5" style="fill:var(--accent)"/>'
        '<rect y="13" width="5" height="5" style="fill:var(--accent)"/><rect x="13.5" y="13.5" width="4" height="4" style="fill:none;stroke:var(--accent)"/></svg>')

def mark(m): return f'<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">{MARK[m]}</svg>'

def head(title, desc, root):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#F7F7F2" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1B1621" media="(prefers-color-scheme: dark)">
<script>
  try {{ var t = localStorage.getItem('theme'); if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t); }} catch (e) {{}}
  window.themeColors = function () {{
    var s = getComputedStyle(document.documentElement), g = function (n) {{ return s.getPropertyValue('--' + n).trim(); }};
    return {{ page: g('page'), ink: g('ink'), meta: g('meta'), field: g('field'), mark: g('mark'), soft: g('soft'), deep: g('deep'),
      accent: g('accent'), night: g('night'), footer: g('footer-bg'), ta: g('t-a'), tb: g('t-b'), tc: g('t-c'), td: g('t-d'), dark: g('scheme') === 'dark' }};
  }};
</script>
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:image" content="/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap">
<link rel="stylesheet" href="{root}assets/styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
"""

def nav(home):
    pre = "" if home else "/"
    return f"""<header class="nav" id="nav">
  <a class="logo" href="/">{LOGO}{e(C['name'])}</a>
  <nav class="nav-links" aria-label="Main">
    <a href="{pre}#work">Work</a>
    <a href="{pre}#about">About</a>
    <a href="/resume">Resume</a>
    <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch colour theme">
      <svg class="sun" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="6" y="6" width="6" height="6" fill="currentColor"/><rect x="8" y="0" width="2" height="3" fill="currentColor"/><rect x="8" y="15" width="2" height="3" fill="currentColor"/><rect x="0" y="8" width="3" height="2" fill="currentColor"/><rect x="15" y="8" width="3" height="2" fill="currentColor"/><rect x="2" y="2" width="2" height="2" fill="currentColor"/><rect x="14" y="2" width="2" height="2" fill="currentColor"/><rect x="2" y="14" width="2" height="2" fill="currentColor"/><rect x="14" y="14" width="2" height="2" fill="currentColor"/></svg>
      <svg class="moon" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M7 1h5v2H9v2H7v8h2v2h3v2H7v-2H5v-2H3V5h2V3h2z" fill="currentColor"/><rect x="12" y="11" width="4" height="2" fill="currentColor"/><rect x="14" y="9" width="2" height="2" fill="currentColor"/></svg>
    </button>
    <a class="btn-line" href="{pre}#contact">Get in touch</a>
  </nav>
</header>
"""

def footer(root):
    socials = "\n".join(f'        <a href="{e(u)}" rel="me">{e(n)}</a>' for n, u in C["socials"])
    return f"""<div class="band"><canvas data-pattern="band" data-instant aria-hidden="true"></canvas></div>
<footer class="footer" id="contact">
  <div>
    <h2>Have a project in mind?</h2>
    <a class="email" href="mailto:{e(C['email'])}">{e(C['email_label'])}</a>
  </div>
  <div class="foot-row">
    <div class="socials">
{socials}
    </div>
    <div class="socials">
      <button class="linkbtn" type="button" data-voice-open>Talk to my AI</button>
      <a href="/resume">Resume</a>
      <a href="/play">Play</a>
      <button class="linkbtn" type="button" data-open-snake>Snake</button>
      <span class="hint">or type <kbd>play</kbd> anywhere</span>
    </div>
    <span>© 2026 {e(C['full_name'])}</span>
  </div>
</footer>
<div class="voice" data-voice data-agent="{e(C['agent_id'])}" data-email="{e(C['email'])}" data-state="idle">
  <div class="voice-note-wrap">
    <div class="voice-note" data-voice-note hidden role="status"></div>
    <button class="voice-dismiss" type="button" data-voice-dismiss aria-label="Dismiss">×</button>
  </div>
  <p class="voice-caption" data-voice-caption aria-live="polite"></p>
  <button class="voice-pill" type="button" data-voice-start aria-label="Talk to Abhishek's AI voice agent">
    <canvas class="voice-icon" data-voice-icon aria-hidden="true"></canvas><span class="full">Talk to my portfolio</span><span class="short">Talk</span>
  </button>
  <div class="voice-bar" role="group" aria-label="Voice call with Abhishek's AI">
    <canvas class="voice-orb" data-voice-orb aria-hidden="true"></canvas>
    <div class="voice-mid"><span class="voice-status" data-voice-status aria-live="polite"></span><canvas class="voice-wave" data-voice-wave aria-hidden="true"></canvas></div>
    <span class="voice-time" data-voice-time>00:00</span>
    <button class="voice-end" type="button" data-voice-end aria-label="End call"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2"/></svg></button>
  </div>
</div>
<dialog class="snake-dialog" id="snake-dialog" aria-label="Grid Snake">
  <div class="game-bar"><span>Grid Snake</span><button type="button" data-close>Close</button></div>
  <canvas class="snake-canvas"></canvas>
  <div class="game-foot" data-score>Score 0</div>
</dialog>
<script>
  (function () {{
    var root = document.documentElement, mq = window.matchMedia('(prefers-color-scheme: dark)');
    function current() {{ return root.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light'); }}
    function label() {{ var b = document.querySelector('[data-theme-toggle]'); if (b) b.setAttribute('aria-label', current() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); }}
    function changed() {{ label(); window.dispatchEvent(new Event('themechange')); }}
    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) btn.addEventListener('click', function () {{
      var next = current() === 'dark' ? 'light' : 'dark'; root.setAttribute('data-theme', next);
      try {{ localStorage.setItem('theme', next); }} catch (e) {{}}
      changed();
    }});
    mq.addEventListener('change', function () {{ if (!root.getAttribute('data-theme')) changed(); }});
    label();
  }})();
  (function () {{ var n = document.getElementById('nav'); function f() {{ n.classList.toggle('scrolled', window.scrollY > 8); }} f(); window.addEventListener('scroll', f, {{ passive: true }}); }})();
</script>
<script src="{root}assets/patterns.js" defer></script>
<script src="{root}assets/games.js" defer></script>
<script src="{root}assets/portrait-data.js" defer></script>
<script src="{root}assets/voice.js" defer></script>
<script src="{root}assets/portrait.js" defer></script>
</body>
</html>
"""

def index():
    P = C["projects"]
    idx = "\n".join(f'          <a href="/work/{p["slug"]}">{mark(p["mark"])}{e(p["title"])}</a>' for p in P)
    cards = []
    for p, (span, drop) in zip(P, LAYOUT):
        cards.append(f"""      <a class="card {span}{drop}" href="/work/{p['slug']}">
        <div class="card-art" style="view-transition-name: art-{p['slug']}"><canvas data-pattern="{p['pattern']}" role="img" aria-label="{ALT[p['pattern']]}"></canvas></div>
        <div class="card-title"><h3>{e(p['title'])}</h3><span class="meta">{e(p['client'])}, {e(p['year'])}</span></div>
        <p>{e(p['summary'])}</p>
        <span class="more">View case study</span>
      </a>""")
    facts = "\n".join(f'      <div class="fact"><span class="label">{e(k)}</span><span>{e(v)}</span></div>' for k, v in C["facts"])
    body = f"""<main id="main">
  <section class="hero">
    <div class="hero-copy">
      <div class="label">Portfolio, 2026</div>
      <div class="hero-main">
        <h1>{e(C['name'])}</h1>
        <p class="lede">{e(C['lede'])}</p>
        <div class="ctas">
          <a class="btn btn-solid" href="#work">See selected work</a>
          <a class="btn btn-ghost" href="#contact">Get in touch</a>
        </div>
      </div>
      <div class="index">
        <div class="label" style="font-size:11px">Index</div>
        <div class="index-grid">
{idx}
        </div>
      </div>
    </div>
    <div class="hero-art">
      <canvas data-hero role="img" aria-label="A large flower drawn from thousands of dots on a grid; the dots scatter away from the cursor and settle back."></canvas>
      <button class="play-btn" type="button" data-breakout aria-pressed="false">Play Breakout</button>
      <div class="fig">Fig. 1, halftone bloom</div>
    </div>
  </section>

  <section class="work" id="work">
    <div class="section-head"><h2>Selected work</h2><div class="label">Four projects</div></div>
    <div class="work-grid">
{chr(10).join(cards)}
    </div>
  </section>

  <section class="about" id="about">
    <div class="about-side">
      <div class="label">About</div>
      <div class="portrait"><canvas data-portrait role="img" aria-label="Portrait of Abhishek drawn in dots"></canvas></div>
      <button class="portrait-toggle" type="button" data-portrait-toggle aria-pressed="false">Stitch it</button>
    </div>
    <p class="about-text">{e(C['about'])}</p>
    <div class="facts">
{facts}
    </div>
  </section>
</main>
"""
    return head(f"{C['full_name']}, product designer", "Selected work by " + C["full_name"] + ", product designer in Gurugram.", "/") + nav(True) + body + footer("/")

def case(i):
    P = C["projects"]; p = P[i]; nxt = P[(i + 1) % len(P)]
    body = f"""<main id="main">
  <div class="cs-hero" style="view-transition-name: art-{p['slug']}"><canvas data-pattern="{p['pattern']}" data-instant role="img" aria-label="{ALT[p['pattern']]}"></canvas></div>
  <section class="cs-head">
    <a class="back label" href="/#work">Back to work</a>
    <h1>{e(p['title'])}</h1>
    <p class="summary">{e(p['summary'])}</p>
    <div class="cs-meta">
      <div class="fact"><span class="label">Client</span><span>{e(p['client'])}</span></div>
      <div class="fact"><span class="label">Year</span><span>{e(p['year'])}</span></div>
      <div class="fact"><span class="label">Role</span><span>{e(p['role'])}</span></div>
      <div class="fact"><span class="label">Deliverables</span><span>{e(p.get("deliverables","[What you shipped]"))}</span></div>
    </div>
  </section>
  <div class="cs-body">
    <section class="cs-block">
      <div class="label">Overview</div>
      <div class="copy"><p class="big">{e(p.get("overview","[The one-paragraph version of this project.]"))}</p></div>
    </section>
    <section class="cs-block"><div class="figure"><span>[Hero image]</span></div></section>
    <section class="cs-block">
      <div class="label">The problem</div>
      <div class="copy"><p>{e(p.get("problem","[What wasn't working, for whom, and how you knew.]"))}</p></div>
    </section>
    <section class="cs-block">
      <div class="label">Process</div>
      <div class="copy"><p>{e(p.get("process","[Research, directions you explored, and the decision that shaped the rest.]"))}</p></div>
    </section>
    <section class="cs-block"><div class="figure half"><span>[Image]</span></div><div class="figure half"><span>[Image]</span></div></section>
    <section class="cs-block">
      <div class="label">Outcome</div>
      <div class="copy"><p>{e(p.get("outcome","[What shipped and what it achieved. Real numbers if you have them.]"))}</p></div>
    </section>
  </div>
  <a class="next" href="/work/{nxt['slug']}"><span class="label">Next project</span><span class="serif">{e(nxt['title'])}</span></a>
</main>
"""
    return head(f"{p['title']}, {C['name']}", p["summary"], "/") + nav(False) + body + footer("/")

def play():
    threads = [("A", "var(--t-a)", "Petals", '<circle class="sym" cx="11" cy="11" r="3" fill="#fff"/>'),
               ("B", "var(--t-b)", "Petal edges", '<circle class="sym" cx="11" cy="11" r="3" fill="none" stroke="#fff" stroke-width="1.3"/>'),
               ("C", "var(--t-c)", "Heart and stem", '<path class="sym" d="M8 8l6 6M14 8l-6 6" stroke="#fff" stroke-width="1.4"/>'),
               ("D", "var(--t-d)", "Leaves", '<rect class="sym" x="8" y="8" width="6" height="6" fill="none" stroke="#fff"/>')]
    btns = "\n".join(f'          <button class="thread" type="button" data-thread="{k}" aria-pressed="false"><svg class="swatch" viewBox="0 0 22 22" aria-hidden="true"><rect width="22" height="22" style="fill:{c}"/>{sym}</svg>{e(label)}<span class="key">{i+1}</span></button>'
                      for i, (k, c, label, sym) in enumerate(threads))
    body = f"""<main id="main">
  <section class="play-head">
    <a class="label" href="/">Back home</a>
    <h1>Stitch the flower</h1>
    <p>Each cell shows a faint symbol. Pick the thread with the matching symbol, then click or drag across the hoop to stitch. Finish the flower as fast as you can.</p>
  </section>
  <section class="stitch" data-stitch>
    <div class="hoop"><canvas role="img" aria-label="Cross-stitch grid of a flower to fill in"></canvas></div>
    <div class="side">
      <div class="threads" role="group" aria-label="Threads">
{btns}
      </div>
      <div class="stats">
        <div class="fact"><span class="label">Progress</span><span data-progress>0%</span></div>
        <div class="fact"><span class="label">Time</span><span data-time>0.0 s</span></div>
        <div class="fact"><span class="label">Wrong stitches</span><span data-miss>0</span></div>
        <div class="fact"><span class="label">Best time</span><span data-best>None yet</span></div>
      </div>
      <p class="msg" data-msg aria-live="polite"></p>
      <div class="ctas"><button class="btn btn-ghost" type="button" data-clear style="background:none;cursor:pointer;font-family:inherit">Clear the hoop</button></div>
      <div class="more-games">
        <span class="label">More games</span>
        <div class="ctas">
          <a class="btn btn-solid" href="/#top">Halftone Breakout</a>
          <button class="btn btn-ghost" type="button" data-open-snake style="background:none;cursor:pointer;font-family:inherit">Grid Snake</button>
        </div>
      </div>
    </div>
  </section>
</main>
"""
    return head(f"Play, {C['name']}", "Stitch the flower, a small cross-stitch game.", "/") + nav(False) + body + footer("/")

def notfound():
    body = """<main id="main">
  <section class="play-head">
    <span class="label">Error 404</span>
    <h1>This page wandered off the grid.</h1>
    <p>While you're here, have a round of snake. Arrow keys or swipe to move. Or head back to the <a href="/">home page</a>.</p>
  </section>
  <section class="inline-snake" data-snake-inline aria-label="Grid Snake">
    <canvas class="snake-canvas"></canvas>
    <div class="game-foot" data-score>Score 0</div>
  </section>
</main>
"""
    return head(f"Not found, {C['name']}", "Page not found.", "/") + nav(False) + body + footer("/")

def resume():
    R = C["resume"]
    jobs = "\n".join(f"""      <article class="job">
        <div class="job-head"><h3>{e(j['role'])}, {e(j['company'])}</h3><span class="meta">{e(j['dates'])}</span></div>
        <ul>{''.join(f'<li>{e(x)}</li>' for x in j['points'])}</ul>
      </article>""" for j in R["jobs"])
    skills = "\n".join(f'      <div class="skill"><span class="label">{e(k)}</span><p>{e(v)}</p></div>' for k, v in R["skills"])
    edu = "\n".join(f'      <div class="job-head"><h3>{e(a)}, {e(b)}</h3><span class="meta">{e(c)}</span></div>' for a, b, c in R["education"])
    body = f"""<main id="main" class="resume">
  <section class="cs-head">
    <a class="back label" href="/">Back home</a>
    <h1>{e(C['full_name'])}</h1>
    <p class="summary">{e(R['title'])}, Gurugram, Haryana</p>
    <p class="print-only contact-line">{e(C['email'])}   ·   linkedin.com/in/ydvabhishek   ·   portfolio-ruby-kappa-tt8k4o39g1.vercel.app</p>
    <div class="resume-links">
      <a class="btn btn-solid" href="/abhishek-yadav-resume.pdf" download>Download PDF</a>
      <a class="btn btn-ghost" href="mailto:{e(C['email'])}">{e(C['email'])}</a>
      <a class="btn btn-ghost" href="{e(C['linkedin'])}" rel="me">LinkedIn</a>
    </div>
  </section>
  <div class="cs-body">
    <section class="cs-block"><div class="label">Summary</div><div class="copy"><p class="big">{e(R['summary'])}</p></div></section>
    <section class="cs-block"><div class="label">Experience</div><div class="copy jobs">
{jobs}
    </div></section>
    <section class="cs-block"><div class="label">Skills</div><div class="copy skills">
{skills}
    </div></section>
    <section class="cs-block"><div class="label">Education</div><div class="copy">
{edu}
    </div></section>
  </div>
</main>
"""
    return head(f"Resume, {C['full_name']}", f"Resume of {C['full_name']}, product designer in Gurugram.", "/") + nav(False) + body + footer("/")

Path("resume.html").write_text(resume())
Path("index.html").write_text(index())
Path("play.html").write_text(play())
Path("404.html").write_text(notfound())
Path("work").mkdir(exist_ok=True)
for i, p in enumerate(C["projects"]):
    Path(f"work/{p['slug']}.html").write_text(case(i))
print("built", 1 + len(C["projects"]), "pages")
