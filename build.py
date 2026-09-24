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
    "square": '<rect width="10" height="10" fill="#315BEF"/>',
    "circle": '<circle cx="5" cy="5" r="4" fill="none" stroke="#315BEF" stroke-width="1.4"/>',
    "cross": '<path d="M1 1L9 9M9 1L1 9" stroke="#315BEF" stroke-width="1.6"/>',
    "dash": '<rect y="4" width="10" height="2" fill="#315BEF"/>',
}
LAYOUT = [("span-7", ""), ("span-5", " drop"), ("span-5", ""), ("span-7", "")]

LOGO = ('<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect width="5" height="5" fill="#315BEF"/>'
        '<rect x="6.5" y="6.5" width="5" height="5" fill="#315BEF"/><rect x="13" width="5" height="5" fill="#315BEF"/>'
        '<rect y="13" width="5" height="5" fill="#315BEF"/><rect x="13.5" y="13.5" width="4" height="4" fill="none" stroke="#315BEF"/></svg>')

def mark(m): return f'<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">{MARK[m]}</svg>'

def head(title, desc, root):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#F7F7F2">
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
    <a class="btn-line" href="{pre}#contact">Get in touch</a>
  </nav>
</header>
"""

def footer(root):
    socials = "\n".join(f'        <a href="{e(u)}">{e(n)}</a>' for n, u in C["socials"])
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
    <span>© 2026 {e(C['name'])}</span>
  </div>
</footer>
<script>
  (function () {{ var n = document.getElementById('nav'); function f() {{ n.classList.toggle('scrolled', window.scrollY > 8); }} f(); window.addEventListener('scroll', f, {{ passive: true }}); }})();
</script>
<script src="{root}assets/patterns.js" defer></script>
</body>
</html>
"""

def index():
    P = C["projects"]
    idx = "\n".join(f'          <a href="/work/{p["slug"]}">{mark(p["mark"])}{e(p["title"])}</a>' for p in P)
    cards = []
    for p, (span, drop) in zip(P, LAYOUT):
        cards.append(f"""      <a class="card {span}{drop}" href="/work/{p['slug']}">
        <div class="card-art"><canvas data-pattern="{p['pattern']}" role="img" aria-label="{ALT[p['pattern']]}"></canvas></div>
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
    <div class="label">About</div>
    <p class="about-text">{e(C['about'])}</p>
    <div class="facts">
{facts}
    </div>
  </section>
</main>
"""
    return head(f"{C['name']}, portfolio", "Selected work by " + C["name"], "/") + nav(True) + body + footer("/")

def case(i):
    P = C["projects"]; p = P[i]; nxt = P[(i + 1) % len(P)]
    body = f"""<main id="main">
  <div class="cs-hero"><canvas data-pattern="{p['pattern']}" data-instant role="img" aria-label="{ALT[p['pattern']]}"></canvas></div>
  <section class="cs-head">
    <a class="back label" href="/#work">Back to work</a>
    <h1>{e(p['title'])}</h1>
    <p class="summary">{e(p['summary'])}</p>
    <div class="cs-meta">
      <div class="fact"><span class="label">Client</span><span>{e(p['client'])}</span></div>
      <div class="fact"><span class="label">Year</span><span>{e(p['year'])}</span></div>
      <div class="fact"><span class="label">Role</span><span>{e(p['role'])}</span></div>
      <div class="fact"><span class="label">Deliverables</span><span>[What you shipped]</span></div>
    </div>
  </section>
  <div class="cs-body">
    <section class="cs-block">
      <div class="label">Overview</div>
      <div class="copy"><p class="big">[The one-paragraph version of this project: what it was, why it mattered, and what changed because of it.]</p></div>
    </section>
    <section class="cs-block"><div class="figure"><span>[Hero image]</span></div></section>
    <section class="cs-block">
      <div class="label">The problem</div>
      <div class="copy"><p>[What wasn't working, for whom, and how you knew.]</p></div>
    </section>
    <section class="cs-block">
      <div class="label">Process</div>
      <div class="copy"><p>[Research, directions you explored, and the decision that shaped the rest.]</p></div>
    </section>
    <section class="cs-block"><div class="figure half"><span>[Image]</span></div><div class="figure half"><span>[Image]</span></div></section>
    <section class="cs-block">
      <div class="label">Outcome</div>
      <div class="copy"><p>[What shipped and what it achieved. Real numbers if you have them.]</p></div>
    </section>
  </div>
  <a class="next" href="/work/{nxt['slug']}"><span class="label">Next project</span><span class="serif">{e(nxt['title'])}</span></a>
</main>
"""
    return head(f"{p['title']}, {C['name']}", p["summary"], "/") + nav(False) + body + footer("/")

Path("index.html").write_text(index())
Path("work").mkdir(exist_ok=True)
for i, p in enumerate(C["projects"]):
    Path(f"work/{p['slug']}.html").write_text(case(i))
print("built", 1 + len(C["projects"]), "pages")
