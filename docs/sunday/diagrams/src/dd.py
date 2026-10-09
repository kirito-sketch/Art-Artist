"""Diagram Design (cathrynlavery/diagram-design) primitives for the Ana Sunday pack.

Skin: Ana's own tokens mapped to the skill's semantic roles (paper, ink, muted, soft, rule, accent).
Rules followed: orthogonal connectors with r=8 elbows, arrows before nodes, label masks 8px off their
stroke, rx=6 nodes with rx=2 type tags, Geist / Geist Mono / Instrument Serif, 4px grid, accent on 1-2
elements, accessible <svg role=img> with prefixed title/desc. Each SVG carries light and dark skins.
"""
import html

FONT_SANS = "'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif"
FONT_MONO = "'Geist Mono', ui-monospace, Menlo, monospace"

LIGHT = dict(paper="#f6f4f0", node="#ffffff", ink="#1f2422", muted="#55605b", soft="#6f7974",
             rule="rgba(31,36,34,0.14)", accent="#275c50", tint="rgba(39,92,80,0.08)",
             opt="rgba(31,36,34,0.02)", optstroke="rgba(31,36,34,0.32)", store="rgba(31,36,34,0.05)", lane="rgba(31,36,34,0.025)")
DARK = dict(paper="#171a19", node="#1f2321", ink="#eef0ee", muted="#a9b2ad", soft="#8f9993",
            rule="rgba(238,240,238,0.14)", accent="#7cc3ae", tint="rgba(124,195,174,0.12)",
            opt="rgba(238,240,238,0.03)", optstroke="rgba(238,240,238,0.34)", store="rgba(238,240,238,0.06)", lane="rgba(238,240,238,0.03)")


def skin_css(t):
    return (f".dd-paper{{fill:{t['paper']}}}.dd-mask{{fill:{t['paper']}}}"
            f".dd-node{{fill:{t['node']};stroke:{t['ink']}}}.dd-focal{{fill:{t['tint']};stroke:{t['accent']}}}"
            f".dd-opt{{fill:{t['opt']};stroke:{t['optstroke']}}}.dd-store{{fill:{t['store']};stroke:{t['muted']}}}"
            f".dd-lane{{fill:{t['lane']};stroke:{t['rule']}}}.dd-rule{{stroke:{t['rule']}}}"
            f".dd-name{{fill:{t['ink']}}}.dd-sub{{fill:{t['muted']}}}.dd-soft{{fill:{t['soft']}}}"
            f".dd-acc{{fill:{t['accent']}}}.dd-tag{{stroke:{t['muted']}}}.dd-tagt{{fill:{t['muted']}}}"
            f".dd-edge{{stroke:{t['muted']}}}.dd-edge-acc{{stroke:{t['accent']}}}"
            f".dd-mk{{fill:{t['muted']}}}.dd-mk-acc{{fill:{t['accent']}}}.dd-dot{{fill:{t['ink']}}}.dd-ring{{stroke:{t['ink']}}}")


def style_block(slug):
    def scoped(t, prefixes):
        out = []
        for rule in skin_css(t).split("}"):
            if not rule:
                continue
            sel, body = rule.split("{")
            out.append(",".join(p + sel for p in prefixes) + "{" + body + "}")
        return "".join(out)
    light = scoped(LIGHT, [f"#{slug} "])
    # Dark: the viewer's OS setting (unless the page pins light), or an explicit data-theme="dark" on the page.
    # "svg:root" makes the same rules work when the file is opened on its own (GitHub, an <img>).
    media = "@media (prefers-color-scheme: dark){" + scoped(DARK, [f":root:not([data-theme='light']) #{slug} ", f"svg#{slug}:root "]) + "}"
    attr = scoped(DARK, [f":root[data-theme='dark'] #{slug} "])
    return "<style>" + light + media + attr + "</style>"


def r4(v):
    return int(-(-v // 4) * 4)


def esc(s):
    return html.escape(s, quote=True)


class D:
    def __init__(self, slug, title, desc, w, h):
        self.slug, self.title, self.desc, self.w, self.h = slug, title, desc, w, h
        self.zones, self.edges, self.labels, self.nodes = [], [], [], []
        self.N = {}

    # ---------------------------------------------------------------- nodes
    def box(self, key, x, y, w, h, name, sub=None, tag=None, kind="node", lines=None):
        self.N[key] = (x, y, w, h)
        self.nodes.append(("box", key, x, y, w, h, name, sub, tag, kind, lines or []))
        return key

    def oval(self, key, x, y, w, h, name, kind="node"):
        self.N[key] = (x, y, w, h)
        self.nodes.append(("oval", key, x, y, w, h, name, None, None, kind, []))

    def diamond(self, key, cx, cy, w, h, name, kind="node"):
        self.N[key] = (cx - w / 2, cy - h / 2, w, h)
        self.nodes.append(("diamond", key, cx - w / 2, cy - h / 2, w, h, name, None, None, kind, []))

    def start(self, key, cx, cy):
        self.N[key] = (cx - 6, cy - 6, 12, 12)
        self.nodes.append(("start", key, cx, cy, 0, 0, "", None, None, "node", []))

    def end(self, key, cx, cy):
        self.N[key] = (cx - 8, cy - 8, 16, 16)
        self.nodes.append(("end", key, cx, cy, 0, 0, "", None, None, "node", []))

    def zone(self, x, y, w, h, label):
        self.zones.append((x, y, w, h, label))

    # ---------------------------------------------------------------- ports
    def p(self, key, side, f=0.5):
        x, y, w, h = self.N[key]
        return {"t": (x + w * f, y), "b": (x + w * f, y + h), "l": (x, y + h * f), "r": (x + w, y + h * f)}[side]

    # ---------------------------------------------------------------- edges
    def edge(self, pts, label=None, seg=None, side=None, accent=False, dashed=False, arrow=True):
        self.edges.append((pts, accent, dashed, arrow))
        if label:
            if seg is None:  # longest segment
                seg = max(range(len(pts) - 1), key=lambda i: abs(pts[i + 1][0] - pts[i][0]) + abs(pts[i + 1][1] - pts[i][1]))
            (x1, y1), (x2, y2) = pts[seg], pts[seg + 1]
            tw = r4(len(label) * 8 * 0.62 + 10)
            if y1 == y2:  # horizontal: mask above (or below) with an 8px gap
                mx = (x1 + x2) / 2
                my = y1 - 8 - 12 if side != "below" else y1 + 8
                self.labels.append((mx - tw / 2, my, tw, label))
            else:  # vertical: mask beside, 8px gap
                my = (y1 + y2) / 2 - 6
                mx = x1 + 8 if side != "left" else x1 - 8 - tw
                self.labels.append((mx, my, tw, label))

    # ---------------------------------------------------------------- render
    def path_d(self, pts, r=8):
        d = f"M{pts[0][0]:g},{pts[0][1]:g}"
        for i in range(1, len(pts) - 1):
            (x0, y0), (x1, y1), (x2, y2) = pts[i - 1], pts[i], pts[i + 1]
            def toward(ax, ay, bx, by, dist):
                dx, dy = bx - ax, by - ay
                L = abs(dx) + abs(dy)
                return ax + dx / L * dist, ay + dy / L * dist
            rr = min(r, (abs(x1 - x0) + abs(y1 - y0)) / 2, (abs(x2 - x1) + abs(y2 - y1)) / 2)
            ax, ay = toward(x1, y1, x0, y0, rr)
            bx, by = toward(x1, y1, x2, y2, rr)
            d += f" L{ax:g},{ay:g} Q{x1:g},{y1:g} {bx:g},{by:g}"
        d += f" L{pts[-1][0]:g},{pts[-1][1]:g}"
        return d

    def text(self, x, y, s, cls, size, weight=None, mono=False, anchor="middle", spacing=None, italic=False):
        fam = FONT_MONO if mono else FONT_SANS
        fill = {"dd-name": LIGHT["ink"], "dd-sub": LIGHT["muted"], "dd-soft": LIGHT["soft"], "dd-acc": LIGHT["accent"], "dd-tagt": LIGHT["muted"]}[cls]
        a = f' font-weight="{weight}"' if weight else ""
        a += f' letter-spacing="{spacing}"' if spacing else ""
        return f'<text x="{x:g}" y="{y:g}" class="{cls}" fill="{fill}" font-size="{size}" font-family="{fam}" text-anchor="{anchor}"{a}>{esc(s)}</text>'

    def render(self):
        o = [f'<svg id="{self.slug}" class="dd" viewBox="0 0 {self.w} {self.h}" width="{self.w}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="{self.slug}-title {self.slug}-desc" style="min-width:{self.w}px;max-width:none">',
             f'<title id="{self.slug}-title">{esc(self.title)}</title><desc id="{self.slug}-desc">{esc(self.desc)}</desc>',
             style_block(self.slug),
             f'<defs><marker id="{self.slug}-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon class="dd-mk" points="0 0, 8 3, 0 6" fill="{LIGHT["muted"]}"/></marker>'
             f'<marker id="{self.slug}-aa" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon class="dd-mk-acc" points="0 0, 8 3, 0 6" fill="{LIGHT["accent"]}"/></marker></defs>',
             f'<rect class="dd-paper" width="100%" height="100%" fill="{LIGHT["paper"]}"/>']
        for x, y, w, h, label in self.zones:
            o.append(f'<rect class="dd-lane" x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{LIGHT["lane"]}" stroke="{LIGHT["rule"]}" stroke-width="1"/>')
            o.append(self.text(x + 12, y + 18, label.upper(), "dd-soft", 8, 500, True, "start", "0.18em"))
        for pts, acc, dashed, arrow in self.edges:
            cls = "dd-edge-acc" if acc else "dd-edge"
            col = LIGHT["accent"] if acc else LIGHT["muted"]
            mk = f' marker-end="url(#{self.slug}-{"aa" if acc else "a"})"' if arrow else ""
            da = ' stroke-dasharray="5,4"' if dashed else ""
            o.append(f'<path class="{cls}" d="{self.path_d(pts)}" fill="none" stroke="{col}" stroke-width="{1.2 if acc else 1}"{da}{mk}/>')
        for x, y, w, s in self.labels:
            o.append(f'<rect class="dd-mask" x="{x:g}" y="{y:g}" width="{w}" height="12" rx="2" fill="{LIGHT["paper"]}"/>')
            o.append(self.text(x + w / 2, y + 9, s.upper(), "dd-soft", 8, None, True, "middle", "0.06em"))
        for kind_, key, x, y, w, h, name, sub, tag, kind, lines in self.nodes:
            cls = {"node": "dd-node", "focal": "dd-focal", "opt": "dd-opt", "store": "dd-store"}[kind]
            fill = {"node": LIGHT["node"], "focal": LIGHT["tint"], "opt": LIGHT["opt"], "store": LIGHT["store"]}[kind]
            stroke = {"node": LIGHT["ink"], "focal": LIGHT["accent"], "opt": LIGHT["optstroke"], "store": LIGHT["muted"]}[kind]
            da = ' stroke-dasharray="4,3"' if kind == "opt" else ""
            sw = 1.2 if kind == "focal" else 1
            if kind_ == "start":
                o.append(f'<circle class="dd-dot" cx="{x}" cy="{y}" r="6" fill="{LIGHT["ink"]}"/>')
                continue
            if kind_ == "end":
                o.append(f'<circle class="dd-ring" cx="{x}" cy="{y}" r="8" fill="none" stroke="{LIGHT["ink"]}" stroke-width="1"/><circle class="dd-dot" cx="{x}" cy="{y}" r="5" fill="{LIGHT["ink"]}"/>')
                continue
            cx = x + w / 2
            if kind_ == "diamond":
                cy = y + h / 2
                o.append(f'<polygon class="dd-mask" points="{cx},{y} {x+w},{cy} {cx},{y+h} {x},{cy}" fill="{LIGHT["paper"]}"/>')
                o.append(f'<polygon class="{cls}" points="{cx},{y} {x+w},{cy} {cx},{y+h} {x},{cy}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{da}/>')
                parts = name.split("\n")
                for i, line in enumerate(parts):
                    o.append(self.text(cx, cy + 4 + (i - (len(parts) - 1) / 2) * 14, line, "dd-name", 11, 600))
                continue
            rx = h / 2 if kind_ == "oval" else 6
            o.append(f'<rect class="dd-mask" x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx:g}" fill="{LIGHT["paper"]}"/>')
            o.append(f'<rect class="{cls}" x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx:g}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{da}/>')
            top = y
            if tag:
                tw = r4(len(tag) * 7 * 0.62 + 10)
                o.append(f'<rect class="dd-tag" x="{x+8}" y="{y+8}" width="{tw}" height="12" rx="2" fill="none" stroke="{LIGHT["muted"]}" stroke-opacity="0.5" stroke-width="0.8"/>')
                o.append(self.text(x + 8 + tw / 2, y + 17, tag.upper(), "dd-tagt", 7, 500, True, "middle", "0.08em"))
                top = y + 20
            if lines:  # list box: name at top, mono lines below
                ny = top + 18
                o.append(self.text(x + 12, ny, name, "dd-acc" if kind == "focal" else "dd-name", 12, 600, False, "start"))
                for i, line in enumerate(lines):
                    o.append(self.text(x + 12, ny + 20 + i * 15, line, "dd-sub", 9, None, True, "start"))
                continue
            parts = name.split("\n")
            body_h = h - (top - y)
            n = len(parts) + (1 if sub else 0)
            base = top + body_h / 2 - (n - 1) * 7.5 + 4
            for i, line in enumerate(parts):
                o.append(self.text(cx, base + i * 15, line, "dd-acc" if kind == "focal" else "dd-name", 12, 600))
            if sub:
                o.append(self.text(cx, base + len(parts) * 15, sub, "dd-sub", 9, None, True))
        o.append("</svg>")
        return "\n".join(o)
