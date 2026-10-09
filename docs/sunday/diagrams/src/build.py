"""All Sunday-pack diagrams. Run from the repo root: python3 docs/sunday/diagrams/src/build.py docs/sunday/diagrams
Then check one diagram at a time with the diagram-design repo scripts (verify-geometry.py, self_check.py)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dd import D

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
ALL = []


def save(d):
    ALL.append(d)
    open(os.path.join(OUT, d.slug + ".svg"), "w").write(d.render())


# ============================================================ 1. People: how they relate (ER, conceptual)
d = D("ana-relations", "How people, houses and records relate",
      "Conceptual model: a house account (used by its team) owns projects with roles, a person shows interest in roles, is added to projects, and accepts credits the house issues.",
      848, 704)
W, H = 176, 92
d.box("house", 40, 40, W, H, "House account", tag="entity", lines=["created by Art and Artist", "team signs in to it"])
d.box("project", 336, 40, W, H, "Project", tag="entity", lines=["private or shared", "working title"])
d.box("role", 632, 40, W, H, "Role", tag="entity", lines=["open, filled, closed", "up to 3 questions"])
d.box("person", 40, 288, W, H, "Person", tag="entity", lines=["one profile, many crafts", "18 or older"])
d.box("assoc", 336, 288, W, H, "On a project", tag="entity", lines=["private, not a credit", "working role"])
d.box("credit", 336, 520, W, H, "Credit", tag="entity", kind="focal", lines=["issued by the house", "public once accepted"])
d.edge([(216, 86), (336, 86)], "owns")
d.edge([(512, 86), (632, 86)], "has")
d.edge([(128, 288), (128, 132)], "team member", dashed=True)
d.edge([(424, 132), (424, 288)], "adds people")
d.edge([(216, 334), (336, 334)], "is on")
d.edge([(424, 380), (424, 520)], "issues credit", accent=True)
d.edge([(160, 380), (160, 566), (336, 566)], "accepts", seg=1)
d.edge([(96, 380), (96, 660), (720, 660), (720, 132)], "shows interest", seg=1)
save(d)

# ============================================================ 2a. IA, as a person (tree)
d = D("ana-ia-person", "Ana as a person: tabs and what they hold",
      "Information architecture tree: after sign-in the app has five tabs, Home, Discover, Create, Inbox and Profile, each listing the screens and sections it holds.",
      1024, 400)
TABS = [
    ("Home", ["City header and tiles", "This week", "Section for why you're here", "From your network", "Events near you", "Film talk", "New work", "People near you", "Notifications"]),
    ("Discover", ["Posts, People", "Opportunities, Projects", "Events, Reviews", "Search everything", "Craft filter", "Saved"]),
    ("Create", ["Post", "Looking for someone", "Open to work", "Event", "Independent project"]),
    ("Inbox", ["Conversations", "New message", "Mute, report, block", "Review interest"]),
    ("Profile", ["Your profile", "Waiting for confirmation", "Projects you're on", "Edit profile", "Saved", "Settings"]),
]
d.box("welcome", 40, 40, 200, 48, "Welcome and sign-up", kind="store")
d.box("root", 412, 40, 200, 48, "Art and Artist", sub="five tabs")
d.edge([(240, 64), (412, 64)], "signed in")
xs = [40 + i * 192 for i in range(5)]
d.edge([(512, 88), (512, 120)], arrow=False)
d.edge([(xs[0] + 88, 120), (xs[4] + 88, 120)], arrow=False)
for i, (name, lines) in enumerate(TABS):
    d.edge([(xs[i] + 88, 120), (xs[i] + 88, 152)])
    d.box("t" + str(i), xs[i], 152, 176, 196, name, tag="tab", kind="focal" if i == 0 else "node", lines=lines)
save(d)

# ============================================================ 2b. IA, acting for a house (tree)
d = D("ana-ia-house", "A house account: what it holds",
      "Information architecture tree: a house team member signs in to the house account, whose Home, Create and Profile hold house tasks; Home leads to each project's private workspace and the house page leads to house settings.",
      816, 548)
d.box("root", 288, 40, 240, 48, "Konark Pictures account", sub="team member signs in", kind="focal")
hx = [40, 296, 552]
d.edge([(408, 88), (408, 120)], arrow=False)
d.edge([(hx[0] + 112, 120), (hx[2] + 112, 120)], arrow=False)
HT = [("Home", ["Needs you", "Your projects", "Open roles", "People for your roles", "Your events", "Your released films"]),
      ("Create", ["Post as the house", "Open a role", "New project", "Event by the house"]),
      ("Profile: house page", ["Now making", "Made by us", "Hiring", "Worked with", "Upcoming events"])]
for i, (name, lines) in enumerate(HT):
    d.edge([(hx[i] + 112, 120), (hx[i] + 112, 152)])
    d.box("h" + str(i), hx[i], 152, 224, 148, name, tag="tab", lines=lines)
d.edge([(152, 300), (152, 352)], "open project")
d.box("ws", 40, 352, 224, 148, "Project workspace", tag="private", kind="store", lines=["Team on this project", "Roles and interest", "Issue or prepare credits", "Trailers", "Share on Ana"])
d.edge([(664, 300), (664, 352)], "settings")
d.box("hs", 552, 352, 224, 148, "House settings", tag="screen", kind="store", lines=["Page and verification", "Who can sign in", "Credit authority", "Notifications", "Sign out"])
save(d)

# ============================================================ 3. Connection map (swimlane)
d = D("ana-connections", "From an open role to a verified credit",
      "Swimlane across the house, the person and everyone else: a role is opened, the person shows interest, the house reviews and closes the role, adds the person, issues a credit, the person accepts and it becomes public.",
      1392, 432)
d.zone(24, 40, 1344, 112, "Production house")
d.zone(24, 168, 1344, 112, "Person")
d.zone(24, 296, 1344, 112, "Everyone else")
cx = lambda i: 48 + 168 * i
HY, PY, EY = 80, 208, 336
B = (128, 56)
d.box("h1", cx(0), HY, *B, "Open a role")
d.box("p1", cx(1), PY, *B, "Show interest", sub="optional note")
d.box("h2", cx(2), HY, *B, "Review interest", sub="message as house")
d.box("h3", cx(3), HY, *B, "Close the role", sub="filled or closed")
d.box("e1", cx(3), EY, *B, "Others told", sub="the outcome")
d.box("h4", cx(4), HY, *B, "Add to project", sub="private")
d.box("h5", cx(5), HY, *B, "Issue credit")
d.box("p2", cx(6), PY, *B, "Accept credit", sub="or something's wrong", kind="focal")
d.box("e2", cx(7), EY, *B, "Public credit", sub="profile, project")
mid = lambda i: cx(i) + 64
d.edge([(cx(0) + 128, 108), (mid(1), 108), (mid(1), PY)], "role open", seg=0)
d.edge([(cx(1) + 128, 236), (mid(2), 236), (mid(2), HY + 56)], "interest", seg=0)
d.edge([(cx(2) + 128, 108), (cx(3), 108)])
d.edge([(mid(3), HY + 56), (mid(3), EY)], "told")
d.edge([(cx(3) + 128, 108), (cx(4), 108)])
d.edge([(cx(4) + 128, 108), (cx(5), 108)])
d.edge([(cx(5) + 128, 108), (mid(6), 108), (mid(6), PY)], "credit", seg=0, accent=True)
d.edge([(cx(6) + 128, 236), (mid(7), 236), (mid(7), EY)], "accepted", seg=0)
save(d)


# ============================================================ 4. Journeys (flowcharts, top-down)
def flow(slug, title, desc, w, h):
    return D(slug, title, desc, w, h)


# J1 New person joins
d = flow("ana-j1", "A new person joins", "Flowchart: first open, intro screens, sign in with Apple, Google or an email code, then existing accounts go Home, unfinished sign-ups resume, and new people agree to the terms and onboard to their first Home.", 760, 712)
M, L, R = 380, 130, 610
d.oval("start", M - 80, 40, 160, 40, "First open")
d.box("intro", M - 100, 112, 200, 48, "Intro screens", sub="shown once")
d.box("auth", M - 120, 192, 240, 64, "Apple, Google or email", sub="email: 6-digit code")
d.diamond("exists", M, 332, 168, 88, "Account\nexists?")
d.oval("home", R - 80, 312, 160, 40, "Home")
d.box("resume", L - 90, 300, 180, 64, "Resume at first", sub="missing step")
d.box("join", M - 110, 452, 220, 56, "Before you join", sub="terms, privacy, 18+")
d.box("onb", M - 110, 540, 220, 56, "Onboarding", sub="you, here for, where, work")
d.oval("first", M - 80, 628, 160, 40, "First Home", kind="focal")
d.edge([(M, 80), (M, 112)])
d.edge([(M, 160), (M, 192)])
d.edge([(M, 256), (M, 288)])
d.edge([(M + 84, 332), (R - 80, 332)], "yes")
d.edge([(M - 84, 332), (L + 90, 332)], "unfinished")
d.edge([(M, 376), (M, 452)], "no")
d.edge([(M, 508), (M, 540)])
d.edge([(L, 364), (L, 568), (M - 110, 568)], "resume", seg=1)
d.edge([(M, 596), (M, 628)], accent=True)
save(d)

# J2 Returning person signs in
d = flow("ana-j2", "A returning person signs in", "Flowchart: sign in with any method; a complete account goes Home, agreeing only to changed terms if needed; an unfinished one resumes onboarding; no account explains and offers to create one.", 800, 640)
M, L, R = 400, 130, 670
d.oval("start", M - 80, 40, 160, 40, "Sign in")
d.box("auth", M - 120, 112, 240, 56, "Apple, Google or email code", sub="matched by ID or verified email")
d.diamond("which", M, 244, 176, 88, "Which\naccount?")
d.box("resume", R - 100, 216, 200, 56, "Resume onboarding", sub="where they stopped")
d.box("none", L - 100, 216, 200, 56, "No account yet", sub="nothing is created")
d.diamond("terms", M, 384, 176, 88, "Terms changed\nsince?")
d.box("agree", R - 100, 356, 200, 56, "Agree to the", sub="updated terms only")
d.oval("home", M - 80, 504, 160, 40, "Home", kind="focal")
d.oval("create", L - 90, 504, 180, 40, "J1: create account")
d.edge([(M, 80), (M, 112)])
d.edge([(M, 168), (M, 200)])
d.edge([(M + 88, 244), (R - 100, 244)], "unfinished")
d.edge([(M - 88, 244), (L + 100, 244)], "not found")
d.edge([(M, 288), (M, 340)], "complete")
d.edge([(M, 428), (M, 504)], "no", accent=True)
d.edge([(M + 88, 384), (R - 100, 384)], "yes")
d.edge([(R, 412), (R, 524), (M + 80, 524)], seg=1)
d.edge([(L, 272), (L, 504)], "create one")
save(d)

# J3 Finding work
d = flow("ana-j3", "A person finds work and shows interest", "Flowchart: from a role page, open roles take interest with an optional note; the person can withdraw, and the house's response leads to a conversation, nothing shown, or the outcome.", 820, 600)
M, L, R = 410, 140, 680
d.box("role", M - 110, 40, 220, 56, "Role page", sub="Home, Discover, project page")
d.diamond("open", M, 176, 168, 80, "Role open?")
d.oval("out", R - 90, 156, 180, 40, "Outcome shown")
d.box("show", M - 110, 256, 220, 56, "Show interest", sub="optional note, short answers", kind="focal")
d.box("wd", L - 100, 256, 200, 56, "Withdrawn", sub="undo for a few seconds", kind="opt")
d.diamond("resp", M, 400, 168, 88, "House\nresponds")
d.oval("conv", M - 90, 512, 180, 40, "In conversation")
d.oval("notnow", R - 90, 380, 180, 40, "Not now: not told")
d.oval("told", L - 90, 380, 180, 40, "Filled or closed: told")
d.edge([(M, 96), (M, 136)])
d.edge([(M + 84, 176), (R - 90, 176)], "no")
d.edge([(M, 216), (M, 256)], "yes")
d.edge([(M - 110, 284), (L + 100, 284)], "withdraw", dashed=True)
d.edge([(M, 312), (M, 356)])
d.edge([(M, 444), (M, 512)], "messages", accent=True)
d.edge([(M + 84, 400), (R - 90, 400)], "not now")
d.edge([(M - 84, 400), (L + 90, 400)], "filled, closed")
save(d)

# J4 House gets onto Ana
d = flow("ana-j4", "A production house gets onto Ana", "Flowchart: Art and Artist's sales team visits a production house; if it agrees, the team checks its documents and creates the house account, a sign-in goes to the house's team member, and they sign in to the house Home. Houses never sign up themselves.", 760, 680)
M, R = 300, 590
d.oval("visit", M - 120, 40, 240, 40, "Sales team visits")
d.diamond("agree", M, 160, 168, 88, "House\nagrees?")
d.oval("no", R - 100, 140, 200, 40, "No account")
d.box("docs", M - 120, 256, 240, 56, "Documents checked", sub="registration or GST, contact")
d.box("create", M - 120, 344, 240, 56, "House account created", sub="by Art and Artist, internally", kind="focal")
d.box("verified", R - 100, 344, 200, 56, "Verified at creation", sub="proposed (B11)", kind="opt")
d.box("invite", M - 120, 432, 240, 56, "Sign-in sent", sub="to the agreed team email")
d.box("sign", M - 120, 520, 240, 48, "Team member signs in")
d.oval("home", M - 100, 600, 200, 40, "House Home")
d.edge([(M, 80), (M, 116)])
d.edge([(M + 84, 160), (R - 100, 160)], "no")
d.edge([(M, 204), (M, 256)], "yes")
d.edge([(M, 312), (M, 344)])
d.edge([(M + 120, 372), (R - 100, 372)], dashed=True)
d.edge([(M, 400), (M, 432)])
d.edge([(M, 488), (M, 520)])
d.edge([(M, 568), (M, 600)], accent=True)
save(d)

# J5 House hires
d = flow("ana-j5", "A house hires: publish a role and review interest", "Flowchart: a role is opened on a project; unverified houses keep it private; published roles receive interest, the house reviews and messages, then closes the role as filled (final) or closed (can reopen).", 840, 660)
M, L, R = 400, 140, 690
d.box("open", M - 120, 40, 240, 56, "Open a role", sub="pick project, add details")
d.diamond("ver", M, 176, 176, 80, "House verified?")
d.oval("priv", R - 100, 156, 200, 40, "Saved privately")
d.box("pub", M - 120, 256, 240, 56, "Published", sub="Discover, Home, project page")
d.box("review", M - 120, 344, 240, 56, "Review interest", sub="message as the house", kind="focal")
d.diamond("close", M, 480, 176, 88, "Close the\nrole")
d.box("filled", M - 110, 572, 220, 56, "Filled", sub="others told, can't reopen")
d.box("closed", R - 100, 452, 200, 56, "Closed", sub="others told")
d.box("new", L - 110, 572, 220, 56, "Open a new role", sub="filled one stays on record", kind="opt")
d.edge([(M, 96), (M, 136)])
d.edge([(M + 88, 176), (R - 100, 176)], "no")
d.edge([(M, 216), (M, 256)], "yes")
d.edge([(M, 312), (M, 344)])
d.edge([(M, 400), (M, 436)])
d.edge([(M, 524), (M, 572)], "filled")
d.edge([(M + 88, 480), (R - 100, 480)], "not needed")
d.edge([(R, 452), (R, 284), (M + 120, 284)], "reopen", seg=1, dashed=True)
d.edge([(M - 110, 600), (L + 110, 600)])
save(d)

# J6 Team and credits
d = flow("ana-j6", "From added to a verified credit", "Flowchart: the house adds a person privately, issues a credit (or prepares one when the member lacks authority), the person accepts or asks for a correction, and an accepted credit becomes public.", 820, 640)
M, L, R = 400, 140, 670
d.box("add", M - 120, 40, 240, 56, "Add person to project", sub="private, not a credit")
d.diamond("auth", M, 176, 176, 88, "Can issue\ncredits?")
d.box("prep", R - 100, 148, 200, 56, "Prepared", sub="waits for authority", kind="opt")
d.box("issue", M - 120, 268, 240, 48, "Credit issued")
d.box("wait", M - 120, 348, 240, 56, "Waiting for your", sub="confirmation (person)")
d.diamond("dec", M, 484, 176, 88, "Person\ndecides")
d.oval("acc", M - 100, 580, 200, 40, "Accepted: public", kind="focal")
d.box("corr", L - 110, 456, 220, 56, "Something's wrong", sub="with a reason")
d.box("fix", L - 110, 348, 220, 56, "Corrected credit", sub="same record")
d.edge([(M, 96), (M, 132)])
d.edge([(M + 88, 176), (R - 100, 176)], "no")
d.edge([(R, 204), (R, 292), (M + 120, 292)], "issued later", seg=1)
d.edge([(M, 220), (M, 268)], "yes")
d.edge([(M, 316), (M, 348)])
d.edge([(M, 404), (M, 440)])
d.edge([(M, 528), (M, 580)], "accept", accent=True)
d.edge([(M - 88, 484), (L + 110, 484)], "correct")
d.edge([(L, 456), (L, 404)])
d.edge([(L + 110, 376), (M - 120, 376)])
save(d)

# J7 Posting
d = flow("ana-j7", "A person posts work or says they're available", "Flowchart: from Create, a post goes through picking media, arranging it and publishing to the feed and profile; Open to work updates availability; Looking for someone makes a collaboration post.", 840, 560)
M, L, R = 420, 150, 690
d.oval("create", M - 80, 40, 160, 40, "Create")
d.diamond("what", M, 160, 176, 88, "What")
d.box("pick", M - 120, 256, 240, 48, "Pick photos or video", sub="from the device")
d.box("arr", M - 120, 336, 240, 56, "Arrange", sub="order, position, cover, caption")
d.box("pub", M - 120, 424, 240, 48, "Publish", sub="fails: kept, try again")
d.oval("feed", M - 110, 504, 220, 40, "Feed and profile", kind="focal")
d.box("avail", R - 100, 132, 200, 56, "Availability", sub="shown on profile")
d.box("collab", L - 110, 132, 220, 56, "Collaboration post", sub="looking for someone")
d.edge([(M, 80), (M, 116)])
d.edge([(M, 204), (M, 256)], "post")
d.edge([(M, 304), (M, 336)])
d.edge([(M, 392), (M, 424)])
d.edge([(M, 472), (M, 504)], accent=True)
d.edge([(M + 88, 160), (R - 100, 160)], "open to work")
d.edge([(M - 88, 160), (L + 110, 160)], "looking")
save(d)

# J8 Messaging
d = flow("ana-j8", "Messaging between a person and a house", "Flowchart: a conversation starts from a profile, a house page or New message; sent messages are delivered or retried; a block from either side closes the conversation while keeping its history.", 800, 520)
M, L, R = 400, 140, 660
d.box("start", M - 130, 40, 260, 56, "Message or New message", sub="profile, house page, Inbox")
d.box("conv", M - 120, 128, 240, 48, "Conversation", sub="house replies as the house")
d.box("send", M - 120, 208, 240, 48, "Send")
d.diamond("ok", M, 336, 176, 88, "Delivered?")
d.oval("done", M - 100, 432, 200, 40, "Other side notified", kind="focal")
d.box("retry", R - 100, 308, 200, 56, "Not delivered", sub="tap to retry")
d.box("block", L - 110, 124, 220, 56, "Blocked either way", sub="closed, history kept", kind="opt")
d.edge([(M, 96), (M, 128)])
d.edge([(M, 176), (M, 208)])
d.edge([(M, 256), (M, 292)])
d.edge([(M + 88, 336), (R - 100, 336)], "no")
d.edge([(M, 380), (M, 432)], "yes", accent=True)
d.edge([(M - 120, 152), (L + 110, 152)], dashed=True)
d.edge([(R, 308), (R, 232), (M + 120, 232)], "retry", seg=1, dashed=True)
save(d)

# J9 Report and block
d = flow("ana-j9", "Staying safe: report and block", "Flowchart: from any profile, house, project, role or post, a person reports with a reason, which goes to the moderation console, and is offered to block; blocking hides both sides everywhere while keeping records.", 820, 520)
M, R = 300, 620
d.box("more", M - 130, 40, 260, 56, "More (…)", sub="profile, house, project, role, post")
d.diamond("act", M, 176, 168, 80, "Report or\nblock")
d.box("reason", M - 110, 256, 220, 56, "Reason and detail", sub="Ana reviews; you aren't named")
d.box("mod", M - 110, 344, 220, 56, "Moderation console", sub="dismiss, warn, restrict, suspend", kind="store")
d.box("confirm", R - 110, 148, 220, 56, "Confirm block", sub="says what it does")
d.oval("hidden", R - 130, 268, 260, 40, "Hidden both ways", kind="focal")
d.edge([(M, 96), (M, 136)])
d.edge([(M, 216), (M, 256)], "report")
d.edge([(M, 312), (M, 344)])
d.edge([(M + 84, 176), (R - 110, 176)], "block")
d.edge([(M + 110, 284), (420, 284), (420, 236), (R - 40, 236), (R - 40, 204)], "offer to block", seg=2, dashed=True)
d.edge([(R + 40, 204), (R + 40, 268)])
save(d)


# ============================================================ 5. Lifecycles (state machines, left to right)
def st(d, key, x, y, w, name, sub=None, kind="node"):
    d.box(key, x, y, w, 52 if sub else 44, name, sub=sub, kind=kind)


d = D("ana-l-project", "Project lifecycle", "State machine: a house creates a private project and shares it once verified; cancelling and unsharing are proposed, not built.", 760, 300)
d.start("s", 40, 80)
st(d, "priv", 96, 58, 152, "Private", "house creates")
st(d, "shared", 352, 58, 152, "Shared", "public page", kind="focal")
st(d, "canc", 352, 196, 152, "Cancelled", "proposed", kind="opt")
d.edge([(46, 80), (96, 80)])
d.edge([(248, 72), (352, 72)], "share (verified)", seg=0)
d.edge([(352, 96), (248, 96)], "unshare", side="below", dashed=True)
d.edge([(172, 110), (172, 222), (352, 222)], "cancel", seg=1, dashed=True)
d.edge([(428, 110), (428, 196)], "cancel", dashed=True)
save(d)

d = D("ana-l-role", "Role lifecycle", "State machine: a published role is open; it can be edited, filled (final, through Art and Artist or another way) or closed (no longer needed or paused), and a closed role can reopen.", 760, 300)
d.start("s", 40, 92)
st(d, "open", 96, 70, 152, "Open", "verified house")
st(d, "filled", 400, 70, 152, "Filled", "final", kind="focal")
st(d, "closed", 400, 204, 152, "Closed", "not needed, paused")
d.end("e", 680, 96)
d.edge([(46, 92), (96, 92)])
d.edge([(248, 96), (400, 96)], "fill")
d.edge([(552, 96), (672, 96)], "new role")
d.edge([(212, 122), (212, 222), (400, 222)], "close", seg=1)
d.edge([(400, 238), (132, 238), (132, 122)], "reopen", seg=0, side="below")
d.edge([(140, 70), (140, 40), (204, 40), (204, 70)], "edit", seg=1)
save(d)

d = D("ana-l-interest", "Interest lifecycle", "State machine: interest starts New; the person can withdraw and show interest again; the house can message (In conversation) or mark Not now and move it back. Interest is never deleted.", 760, 320)
d.start("s", 40, 140)
st(d, "new", 96, 118, 152, "New", "person shows interest")
st(d, "wd", 400, 32, 152, "Withdrawn", "house sees it greyed")
st(d, "conv", 400, 118, 152, "In conversation", "house messaged", kind="focal")
st(d, "nn", 400, 228, 152, "Not now", "person not told")
d.edge([(46, 140), (96, 140)])
d.edge([(156, 118), (156, 52), (400, 52)], "withdraw", seg=1)
d.edge([(400, 72), (212, 72), (212, 118)], "show again", seg=0, side="below")
d.edge([(248, 144), (400, 144)], "message")
d.edge([(212, 170), (212, 248), (400, 248)], "not now", seg=1)
d.edge([(400, 268), (156, 268), (156, 170)], "move back", seg=0, side="below")
save(d)

d = D("ana-l-credit", "Credit lifecycle", "State machine: a credit is prepared or issued by the house; the person accepts it or asks for a correction, which the house reissues as the same record; an accepted credit can only change through an amendment the person accepts.", 820, 320)
d.start("s", 40, 140)
st(d, "prep", 96, 32, 152, "Prepared", "member, no authority")
st(d, "prop", 96, 118, 152, "Proposed", "waiting for person")
st(d, "acc", 400, 118, 152, "Accepted", "public", kind="focal")
st(d, "corr", 96, 228, 152, "Correction", "person gave a reason")
st(d, "amend", 640, 118, 152, "Amending", "house revises or keeps")
d.edge([(46, 140), (96, 140)])
d.edge([(172, 84), (172, 118)], "issue")
d.edge([(248, 144), (400, 144)], "accept", accent=True)
d.edge([(140, 170), (140, 228)], "wrong", side="left")
d.edge([(204, 228), (204, 170)], "reissue")
d.edge([(552, 132), (640, 132)], "ask")
d.edge([(640, 156), (552, 156)], "resolved", side="below")
save(d)

d = D("ana-l-verify", "House verification", "State machine: a house account is created by Art and Artist and is pending until verified (or verified at creation, which is open); restricting and revoking verification are proposed, not built.", 760, 300)
d.start("s", 40, 92)
st(d, "pend", 96, 70, 152, "Pending", "account created")
st(d, "ver", 352, 70, 152, "Verified", "public roles, credits", kind="focal")
st(d, "res", 352, 208, 152, "Restricted", "proposed", kind="opt")
st(d, "rev", 584, 70, 152, "Revoked", "proposed", kind="opt")
d.edge([(46, 92), (96, 92)])
d.edge([(248, 96), (352, 96)], "Ana approves")
d.edge([(504, 96), (584, 96)], "revoke", dashed=True)
d.edge([(412, 122), (412, 208)], "restrict", side="left", dashed=True)
d.edge([(444, 208), (444, 122)], "ends", dashed=True)
save(d)

d = D("ana-l-account", "Person account", "State machine: a person signs up and onboards to an active account; moderators can suspend it (reinstating is proposed); the person can delete it, after which accepted credits stay on films as their name.", 820, 280)
d.start("s", 40, 92)
st(d, "onb", 96, 70, 152, "Onboarding", "signed up")
st(d, "act", 328, 70, 152, "Active", kind="focal")
st(d, "sus", 328, 196, 152, "Suspended", "by a moderator")
st(d, "del", 576, 70, 152, "Deleted", "credits keep name")
d.end("e", 776, 96)
d.edge([(46, 92), (96, 92)])
d.edge([(248, 96), (328, 96)], "finished")
d.edge([(480, 96), (576, 96)], "delete")
d.edge([(728, 96), (768, 96)])
d.edge([(388, 114), (388, 196)], "suspend", side="left")
d.edge([(420, 196), (420, 114)], "reinstate", dashed=True)
save(d)

# preview page
pv = ['<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet"><body style="margin:0;background:#f6f4f0;font-family:sans-serif">']
for x in ALL:
    pv.append(f'<h3 style="margin:24px">{x.slug}</h3><div style="overflow-x:auto">' + x.render() + '</div>')
if os.environ.get("DD_PREVIEW"):
    open(os.path.join(OUT, "_preview.html"), "w").write("\n".join(pv))
print(len(ALL), "diagrams")
