"""
Glyph builders — per-character drawing functions for Nayana shapes.

Each function takes a fontforge font and the source font as a reference for
metrics. Functions allocate a glyph at the appropriate IPA Unicode codepoint
(or replace an existing one) and draw the Nayana-designed shape.

Shape decisions are recorded in docs/font-glyph-checklist.md. This file
is the implementation of those decisions; if a shape changes, update both.

Coordinate system: 1000-UPM. Comic Neue's metrics:
  - baseline = 0
  - x-height ≈ 493
  - cap / ascender height ≈ 681-688
  - descender bottom ≈ -184
"""


def _ensure_empty_glyph(font, codepoint, glyphname):
    """Get-or-create a glyph at codepoint; clear any existing contents."""
    try:
        g = font[codepoint]
    except (KeyError, TypeError):
        g = font.createChar(codepoint, glyphname)
    g.glyphname = glyphname
    g.clear()
    return g


def _copy_splines(font, src_name, dst_glyph):
    """Copy splines from a source glyph onto dst_glyph and inherit its width."""
    src = font[src_name]
    font.selection.select(src_name)
    font.copy()
    font.selection.select(dst_glyph.glyphname)
    font.paste()
    dst_glyph.width = src.width


# ---- Clone-style glyphs ---------------------------------------------------

def build_ae(font):
    """æ (U+00E6) → render as Latin `a` shape. Replaces Comic Neue's æ ligature."""
    g = _ensure_empty_glyph(font, 0x00E6, "ae")
    _copy_splines(font, "a", g)


def build_esh(font):
    """ʃ (U+0283) → render as `s` with acute accent (Sanskrit IAST ś)."""
    g = _ensure_empty_glyph(font, 0x0283, "esh")
    _copy_splines(font, "sacute", g)


def build_eth(font):
    """ð (U+00F0) → render as Greek small δ.

    Drawn from scratch: a closed oval bowl in the lower half of the
    x-height, with a curl-stroke arching from the top of the bowl up
    and to the right (the open hook of δ).
    """
    g = _ensure_empty_glyph(font, 0x00F0, "eth")

    pen = g.glyphPen()
    # Bowl: oval centered at (240, 200), width 380, height 380.
    # Use four cubic curves to approximate an ellipse.
    cx, cy = 240, 200
    rx, ry = 180, 180
    k = 0.5523  # cubic-bezier circle approximation factor
    # Outer contour, clockwise
    pen.moveTo((cx + rx, cy))
    pen.curveTo((cx + rx, cy + ry * k), (cx + rx * k, cy + ry), (cx, cy + ry))
    pen.curveTo((cx - rx * k, cy + ry), (cx - rx, cy + ry * k), (cx - rx, cy))
    pen.curveTo((cx - rx, cy - ry * k), (cx - rx * k, cy - ry), (cx, cy - ry))
    pen.curveTo((cx + rx * k, cy - ry), (cx + rx, cy - ry * k), (cx + rx, cy))
    pen.closePath()

    # Hook curl: from top of bowl, up and right, then back down to meet bowl.
    # Drawn as a thin sliver outline.
    pen.moveTo((cx + 30, cy + ry - 10))
    pen.curveTo((cx + 60, cy + ry + 120), (cx + 200, cy + ry + 200), (cx + 220, cy + ry + 80))
    pen.curveTo((cx + 240, cy + ry + 20), (cx + 180, cy + ry - 20), (cx + 120, cy + ry - 30))
    pen.lineTo((cx + 30, cy + ry - 10))
    pen.closePath()

    g.removeOverlap()
    g.round()
    g.width = 480


def build_alpha_ipa(font):
    """ɑ (U+0251) → proportionality sign ∝ (two intertwined loops).

    Comic Neue has no ∝ glyph, so we draw it: two small ovals that share
    a central crossing band, like an infinity sign that's been pinched.
    Sits within the x-height for visual parity with æ, ə, etc.
    """
    g = _ensure_empty_glyph(font, 0x0251, "alphaipa")
    pen = g.glyphPen()

    # Two ovals side by side. Each is a hollow ring (outer + inner counter).
    # Centers at (cx_left, cy) and (cx_right, cy); they share an edge in the middle.
    cy = 240
    rx, ry = 130, 200
    k = 0.5523

    # Left oval
    cx = 160
    pen.moveTo((cx + rx, cy))
    pen.curveTo((cx + rx, cy + ry * k), (cx + rx * k, cy + ry), (cx, cy + ry))
    pen.curveTo((cx - rx * k, cy + ry), (cx - rx, cy + ry * k), (cx - rx, cy))
    pen.curveTo((cx - rx, cy - ry * k), (cx - rx * k, cy - ry), (cx, cy - ry))
    pen.curveTo((cx + rx * k, cy - ry), (cx + rx, cy - ry * k), (cx + rx, cy))
    pen.closePath()
    # Inner counter (ccw)
    irx, iry = rx - 50, ry - 50
    pen.moveTo((cx + irx, cy))
    pen.curveTo((cx + irx, cy - iry * k), (cx + irx * k, cy - iry), (cx, cy - iry))
    pen.curveTo((cx - irx * k, cy - iry), (cx - irx, cy - iry * k), (cx - irx, cy))
    pen.curveTo((cx - irx, cy + iry * k), (cx - irx * k, cy + iry), (cx, cy + iry))
    pen.curveTo((cx + irx * k, cy + iry), (cx + irx, cy + iry * k), (cx + irx, cy))
    pen.closePath()

    # Right oval — overlapping the left so the inner edges merge into a crossing
    cx = 380
    pen.moveTo((cx + rx, cy))
    pen.curveTo((cx + rx, cy + ry * k), (cx + rx * k, cy + ry), (cx, cy + ry))
    pen.curveTo((cx - rx * k, cy + ry), (cx - rx, cy + ry * k), (cx - rx, cy))
    pen.curveTo((cx - rx, cy - ry * k), (cx - rx * k, cy - ry), (cx, cy - ry))
    pen.curveTo((cx + rx * k, cy - ry), (cx + rx, cy - ry * k), (cx + rx, cy))
    pen.closePath()
    # Inner counter (ccw)
    pen.moveTo((cx + irx, cy))
    pen.curveTo((cx + irx, cy - iry * k), (cx + irx * k, cy - iry), (cx, cy - iry))
    pen.curveTo((cx - irx * k, cy - iry), (cx - irx, cy - iry * k), (cx - irx, cy))
    pen.curveTo((cx - irx, cy + iry * k), (cx - irx * k, cy + iry), (cx, cy + iry))
    pen.curveTo((cx + irx * k, cy + iry), (cx + irx, cy + iry * k), (cx + irx, cy))
    pen.closePath()

    g.removeOverlap()
    g.round()
    g.width = 540


# ---- Composed glyphs ------------------------------------------------------

def build_schwa(font):
    """ə (U+0259) → long dash at baseline + shorter dash above.

    Per design feedback: the bottom stroke aligns with the vowel baseline,
    and the top stroke is shorter (e.g. hyphen above en-dash) — visually
    a "long dash + short dash" stack rather than two equal strokes.

    Uses Comic Neue's existing `endash` (bottom, wider) and `hyphen` (top,
    narrower). Both have natural y=214-274; we translate them to the
    target positions.
    """
    g = _ensure_empty_glyph(font, 0x0259, "schwa")
    endash = font["endash"]   # width 600, y=212-274
    hyphen = font["hyphen"]   # width 402, y=214-274
    # Bottom: translate endash so its bottom edge sits at the baseline (y=0)
    g.addReference("endash", (1, 0, 0, 1, 0, -212))
    # Top: translate hyphen up so it sits at y≈140-200
    # hyphen at native y=214-274; want bottom at y=140, so shift dy = 140 - 214 = -74
    # Center hyphen horizontally over the endash (endash w=600, hyphen w=402)
    hy_dx = (endash.width - hyphen.width) / 2
    g.addReference("hyphen", (1, 0, 0, 1, hy_dx, -74))
    g.unlinkRef()
    g.round()
    g.width = endash.width


def build_wedge(font):
    """ʌ (U+028C) → schwa stack (long dash + short dash) + degree sign above.

    Same long-dash-bottom + short-dash-top as ə, with a degree mark
    centered horizontally above it as the stress mark. The visual encodes
    the ə/ʌ stress pair: same vowel quality, with `°` signaling stress.
    """
    g = _ensure_empty_glyph(font, 0x028C, "turnv")
    endash = font["endash"]
    hyphen = font["hyphen"]
    deg = font["degree"]
    # Bottom long dash at baseline
    g.addReference("endash", (1, 0, 0, 1, 0, -212))
    # Shorter top dash, centered over the long one
    hy_dx = (endash.width - hyphen.width) / 2
    g.addReference("hyphen", (1, 0, 0, 1, hy_dx, -74))
    # Degree centered horizontally above the dashes (above y≈210)
    deg_dx = (endash.width - deg.width) / 2
    deg_dy = -451 + 260  # bring degree's bottom (was 451) down to y=260
    g.addReference("degree", (1, 0, 0, 1, deg_dx, deg_dy))
    g.unlinkRef()
    g.round()
    g.width = endash.width


def build_ezh(font):
    """ʒ (U+0292) → dotless-j with an acute accent on top.

    Uses uni0237 (dotless j) instead of regular j, so the acute doesn't
    collide with j's dot — that visual clash was the v1 bug feedback.
    """
    g = _ensure_empty_glyph(font, 0x0292, "ezh")
    src = font["uni0237"]  # dotless j
    ac = font["acutecomb"]
    _copy_splines(font, "uni0237", g)
    # Position acute centered above the dotless-j stem.
    # uni0237 bbox: x=-93 to x=159, top y=496. Stem is around x=70.
    # acutecomb bbox: x=0 to x=181, y=553-747.
    ac_dx = 70 - 90
    ac_dy = -90  # bring acutecomb's bottom from y=553 down to ~y=463 (above j top)
    g.addReference("acutecomb", (1, 0, 0, 1, ac_dx, ac_dy))
    g.unlinkRef()
    g.round()
    g.width = src.width + 60


# ---- Custom-drawn glyphs --------------------------------------------------

def build_d_as_delta(font):
    """Replace Latin `d` (U+0064) with Greek capital Δ shape.

    A simple equilateral triangle from baseline to cap-height, sized to
    roughly match `d`'s advance width (530) and use the cap-height (≈680)
    for height. Hollow — outer triangle minus inner triangle — to get a
    stroked look that matches Comic Neue's hand-drawn feel.
    """
    # Don't use _ensure_empty_glyph — d already exists at U+0064 in Comic Neue.
    g = font["d"]
    g.clear()
    pen = g.glyphPen()

    # Sized to x-height (~493) so it visually matches æ, ð, ʃ, etc.,
    # not towering above them like an ascender.
    base_y = 0
    apex_y = 493
    base_left_x = 40
    base_right_x = 460
    apex_x = (base_left_x + base_right_x) / 2
    pen.moveTo((base_left_x, base_y))
    pen.lineTo((base_right_x, base_y))
    pen.lineTo((apex_x, apex_y))
    pen.closePath()

    # Inner triangle (counter-clockwise) to hollow out
    stroke = 70  # stroke thickness
    # Inner base sits a bit above the outer base; inner apex a bit below outer apex
    inner_base_left = base_left_x + stroke * 1.6
    inner_base_right = base_right_x - stroke * 1.6
    inner_base_y = base_y + stroke
    # Inner apex is the centroid pulled down from the outer apex
    inner_apex_y = apex_y - stroke * 1.8
    inner_apex_x = apex_x
    pen.moveTo((inner_base_left, inner_base_y))
    pen.lineTo((inner_apex_x, inner_apex_y))
    pen.lineTo((inner_base_right, inner_base_y))
    pen.closePath()

    g.removeOverlap()
    g.round()
    g.width = 530


def build_eng(font):
    """ŋ (U+014B) → `n` with a `b`-shaped tail dropping below baseline.

    Strategy: copy the `n` splines, then attach a small bowl (an oval) at
    the right edge of the n, hanging below the baseline. This visually
    reads as 'n's right stroke continues into a `b`-bowl below the line'.
    """
    g = _ensure_empty_glyph(font, 0x014B, "eng")
    _copy_splines(font, "n", g)
    pen = g.glyphPen(replace=False)  # IMPORTANT: don't wipe the n splines
    # Bowl hangs from the right stroke of n. n's right edge is around x=485.
    # Place an oval centered at (510, -90), radii (80, 90) — drops below baseline.
    cx, cy = 510, -90
    rx, ry = 80, 90
    k = 0.5523
    pen.moveTo((cx + rx, cy))
    pen.curveTo((cx + rx, cy + ry * k), (cx + rx * k, cy + ry), (cx, cy + ry))
    pen.curveTo((cx - rx * k, cy + ry), (cx - rx, cy + ry * k), (cx - rx, cy))
    pen.curveTo((cx - rx, cy - ry * k), (cx - rx * k, cy - ry), (cx, cy - ry))
    pen.curveTo((cx + rx * k, cy - ry), (cx + rx, cy - ry * k), (cx + rx, cy))
    pen.closePath()
    # Inner counter, ccw
    irx, iry = 38, 48
    pen.moveTo((cx + irx, cy))
    pen.curveTo((cx + irx, cy - iry * k), (cx + irx * k, cy - iry), (cx, cy - iry))
    pen.curveTo((cx - irx * k, cy - iry), (cx - irx, cy - iry * k), (cx - irx, cy))
    pen.curveTo((cx - irx, cy + iry * k), (cx - irx * k, cy + iry), (cx, cy + iry))
    pen.curveTo((cx + irx * k, cy + iry), (cx + irx, cy + iry * k), (cx + irx, cy))
    pen.closePath()
    g.removeOverlap()
    g.round()
    # Extend advance width to make room for the dangling bowl
    g.width = max(font["n"].width, 620)


def build_er_stressed(font):
    """ɝ (U+025D) → two V-shapes stacked vertically with a gap.

    Top V is `∨` (arms up, point down toward the gap).
    Bottom V is `∧` (arms down, point up toward the gap).
    Equivalent: `x` cut in half horizontally, middle removed.
    """
    g = _ensure_empty_glyph(font, 0x025D, "rhookschwastressed")
    pen = g.glyphPen()

    # Geometry
    left_x, right_x = 80, 380
    mid_x = (left_x + right_x) / 2
    top_y = 540
    upper_gap_y = 320
    lower_gap_y = 240
    bottom_y = 20
    stroke = 50

    # Top V (∨): arms from (left_x, top_y) and (right_x, top_y) meeting at (mid_x, upper_gap_y)
    # Drawn as two strokes (left arm + right arm), each a thin parallelogram
    def draw_arm(x1, y1, x2, y2):
        # Perpendicular offset to give the line thickness
        dx, dy = x2 - x1, y2 - y1
        length = (dx * dx + dy * dy) ** 0.5
        nx, ny = -dy / length * stroke / 2, dx / length * stroke / 2
        pen.moveTo((x1 + nx, y1 + ny))
        pen.lineTo((x2 + nx, y2 + ny))
        pen.lineTo((x2 - nx, y2 - ny))
        pen.lineTo((x1 - nx, y1 - ny))
        pen.closePath()

    # Top V
    draw_arm(left_x, top_y, mid_x, upper_gap_y)
    draw_arm(right_x, top_y, mid_x, upper_gap_y)
    # Bottom V (∧): arms from (mid_x, lower_gap_y) up... wait, bottom V (∧)
    # has its point UP, arms going DOWN. So point at (mid_x, lower_gap_y),
    # arms going down to (left_x, bottom_y) and (right_x, bottom_y).
    draw_arm(mid_x, lower_gap_y, left_x, bottom_y)
    draw_arm(mid_x, lower_gap_y, right_x, bottom_y)

    g.removeOverlap()
    g.round()
    g.width = 460


def build_er_unstressed(font):
    """ɚ (U+025A) → two hollow circles stacked vertically with a gap.

    Lighter pair to ɝ's V-stack: same vertical-gap structure, hollow circles
    (degree-symbol size) instead of solid V's.
    """
    g = _ensure_empty_glyph(font, 0x025A, "schwarhotic")
    pen = g.glyphPen()

    cx = 180
    radius = 95
    stroke = 30
    upper_cy = 400
    lower_cy = 130
    k = 0.5523

    def draw_ring(cx, cy, ro, ri):
        # Outer circle (cw)
        pen.moveTo((cx + ro, cy))
        pen.curveTo((cx + ro, cy + ro * k), (cx + ro * k, cy + ro), (cx, cy + ro))
        pen.curveTo((cx - ro * k, cy + ro), (cx - ro, cy + ro * k), (cx - ro, cy))
        pen.curveTo((cx - ro, cy - ro * k), (cx - ro * k, cy - ro), (cx, cy - ro))
        pen.curveTo((cx + ro * k, cy - ro), (cx + ro, cy - ro * k), (cx + ro, cy))
        pen.closePath()
        # Inner circle (ccw, to subtract)
        pen.moveTo((cx + ri, cy))
        pen.curveTo((cx + ri, cy - ri * k), (cx + ri * k, cy - ri), (cx, cy - ri))
        pen.curveTo((cx - ri * k, cy - ri), (cx - ri, cy - ri * k), (cx - ri, cy))
        pen.curveTo((cx - ri, cy + ri * k), (cx - ri * k, cy + ri), (cx, cy + ri))
        pen.curveTo((cx + ri * k, cy + ri), (cx + ri, cy + ri * k), (cx + ri, cy))
        pen.closePath()

    draw_ring(cx, upper_cy, radius, radius - stroke)
    draw_ring(cx, lower_cy, radius, radius - stroke)

    g.removeOverlap()
    g.round()
    g.width = 360


def build_length_mark(font):
    """ː (U+02D0) → triangular colon: two small triangles, points facing.

    Used as the long-vowel marker after iː uː ɔː ɑː. Sits centered around
    mid-x-height; relatively narrow.
    """
    g = _ensure_empty_glyph(font, 0x02D0, "lengthmark")
    pen = g.glyphPen()
    cx = 125
    half_w = 80
    # Upper triangle: point down at (cx, 230), base at top y=400
    pen.moveTo((cx - half_w, 400))
    pen.lineTo((cx + half_w, 400))
    pen.lineTo((cx, 230))
    pen.closePath()
    # Lower triangle: point up at (cx, 200), base at y=20
    pen.moveTo((cx - half_w, 20))
    pen.lineTo((cx, 200))
    pen.lineTo((cx + half_w, 20))
    pen.closePath()
    g.removeOverlap()
    g.round()
    g.width = 250


# ---- Ligature target glyphs -----------------------------------------------

def build_c_ligature(font):
    """tʃ ligature target — Latin `c` shape under a private glyph name.

    The OpenType GSUB ligature substitution will map the t+esh sequence
    to this glyph. We use the existing `c` shape verbatim.
    """
    g = font.createChar(-1, "tesh.lig")
    _copy_splines(font, "c", g)
    g.width = font["c"].width


def build_j_ligature(font):
    """dʒ ligature target — dotless-j shape under a private glyph name.

    Per design feedback: bare `j` collides visually with /ʒ/ (which is
    j+acute), so the ligature uses dotless-j to keep dʒ visually distinct
    from ʒ. Reader sees: bare-stem-with-no-dot = /dʒ/; dotless-j-with-acute = /ʒ/.
    """
    g = font.createChar(-1, "dezh.lig")
    _copy_splines(font, "uni0237", g)
    g.width = font["uni0237"].width
