"""Draws the landing illustrations as SVG line art (no photos).

Run from the project root: python3 tools/landing/draw_art.py
Writes landing/assets/art/*.svg. Every file carries its own palette:
  - "stage" files are always on the dark stage background.
  - "theme" files follow prefers-color-scheme, matching the page tokens.
Line style: hairline strokes (non-scaling, 1.2px), one accent (felt red), occluding fills
in the background color so shapes can overlap like a technical drawing.
"""
import math, os

OUT = 'landing/assets/art'

PALETTES = {
    # name: (ink, accent, occlude, black key) for light, then for dark (None = single palette)
    'stage': (('#f4f2ee', '#ff5d3d', '#0e0e10', '#2a2a30'), None),
    'page': (('#141416', '#e4492b', '#f3f3f1', '#141416'), ('#ecece8', '#ff5d3d', '#0f0f11', '#2a2a30')),
    'band': (('#141416', '#e4492b', '#e9e9e6', '#141416'), ('#ecece8', '#ff5d3d', '#16161a', '#2a2a30')),
    'panel': (('#141416', '#e4492b', '#fbfbfa', '#141416'), ('#ecece8', '#ff5d3d', '#18181c', '#2a2a30')),
}


def style(pal):
    def rules(ink, acc, occ, key):
        return (f'.l,.l2,.l3,.o,.ao{{fill:none;stroke-width:1.2;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}}'
                f'.l{{stroke:{ink}}}.l2{{stroke:{ink};stroke-opacity:.5}}.l3{{stroke:{ink};stroke-opacity:.22}}'
                f'.o{{fill:{occ};stroke:{ink}}}.a{{fill:{acc}}}.ao{{stroke:{acc};stroke-width:1.6}}.d{{fill:{ink}}}.k{{fill:{key};stroke:{ink};stroke-width:1.2;vector-effect:non-scaling-stroke}}'
                f'.dash{{stroke-dasharray:3 5}}')
    light, dark = PALETTES[pal]
    css = rules(*light)
    if dark:
        css += '@media (prefers-color-scheme:dark){' + rules(*dark) + '}'
    return f'<style>{css}</style>'


class SVG:
    def __init__(self, w, h, pal, title):
        self.w, self.h, self.pal, self.title, self.items = w, h, pal, title, []

    def add(self, s):
        self.items.append(s)

    def save(self, name):
        os.makedirs(OUT, exist_ok=True)
        body = '\n'.join(self.items)
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{self.title}">'
               f'{style(self.pal)}\n{body}\n</svg>\n')
        open(f'{OUT}/{name}.svg', 'w').write(svg)
        print(name, len(svg) // 1024, 'KB')


f = lambda v: f'{v:.1f}'.rstrip('0').rstrip('.')


def line(x1, y1, x2, y2, c='l'):
    return f'<path class="{c}" d="M{f(x1)} {f(y1)}L{f(x2)} {f(y2)}"/>'


def rect(x, y, w, h, c='o', r=0):
    return f'<rect class="{c}" x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}"' + (f' rx="{f(r)}"' if r else '') + '/>'


def circle(x, y, r, c='l'):
    return f'<circle class="{c}" cx="{f(x)}" cy="{f(y)}" r="{f(r)}"/>'


def bez(p0, p1, p2, p3, n=40):
    out = []
    for i in range(n + 1):
        t = i / n
        a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return out


def top_y(poly, x):
    """Smallest y where a vertical line at x crosses the polygon (the far rim)."""
    ys = []
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (x1 - x) * (x2 - x) <= 0 and x1 != x2:
            ys.append(y1 + (y2 - y1) * (x - x1) / (x2 - x1))
    return min(ys) if ys else None


# ---------------------------------------------------------------- grand piano, seen from above
def piano_top(pal='stage', name='piano-top'):
    s = SVG(760, 1000, pal, 'A grand piano seen from above: strings, hammers and keys')
    outer = 'M60 880L60 230C60 120 140 60 230 70C330 82 372 170 400 300C430 440 500 520 600 560C660 585 690 620 690 690L690 880Z'
    inner_pts = ([(78, 870), (78, 232)] + bez((78, 232), (78, 136), (148, 84), (230, 90))[1:]
                 + bez((230, 90), (318, 100), (354, 184), (382, 306))[1:] + bez((382, 306), (412, 450), (486, 536), (588, 576))[1:]
                 + bez((588, 576), (642, 598), (672, 632), (672, 690))[1:] + [(672, 870)])
    inner = 'M' + 'L'.join(f'{f(x)} {f(y)}' for x, y in inner_pts) + 'Z'
    s.add(f'<path class="l" d="{outer}"/>')
    s.add(f'<path class="l2" d="{inner}"/>')
    # hammers (felt, accent) sit under the strings
    for i in range(96):
        x = 92 + i * 5.9
        s.add(rect(x - 1.6, 824, 3.2, 9, 'a', 1.2))
    # strings: treble and tenor straight back, bass overstrung across them
    for i in range(96):
        x = 92 + i * 5.9 + (1.2 if i % 3 == 1 else 0)
        if i < 22:  # bass, crossing to the right at the back
            ex = x + 70 - i * 1.2
            ey = top_y(inner_pts, ex) + 16
            s.add(line(x, 842, ex, ey, 'l2'))
            s.add(circle(ex, ey - 6, 1.2, 'd'))
        else:
            ey = top_y(inner_pts, x) + 14
            s.add(line(x, 842, x, ey, 'l3' if i % 3 else 'l2'))
            s.add(circle(x, ey - 5, 1, 'd'))
    # long bridge following the rim
    br = [(x, top_y(inner_pts, x) + 34) for x in range(180, 664, 6)]
    s.add('<path class="l" d="M' + 'L'.join(f'{f(x)} {f(y)}' for x, y in br) + '"/>')
    # cast iron plate: struts and portholes
    s.add('<path class="l2" d="M210 846C224 620 262 360 236 120"/>')
    s.add('<path class="l2" d="M420 846C426 700 470 590 540 548"/>')
    s.add('<path class="l2" d="M130 846C140 600 150 300 150 140"/>')
    for cx, cy, r in [(186, 300, 30), (312, 470, 28), (430, 640, 24), (186, 520, 22)]:
        s.add(f'<ellipse class="o" cx="{cx}" cy="{cy}" rx="{r}" ry="{r * 1.25:.1f}"/>')
    # dampers over the strings, then the pinblock and tuning pins
    for i in range(30, 96, 2):
        x = 92 + i * 5.9
        s.add(rect(x - 2.4, 784, 4.8, 14, 'o', 1))
    s.add(line(78, 840, 672, 840, 'l'))
    for i in range(96):
        x = 92 + i * 5.9
        s.add(circle(x, 852 + (6 if i % 2 else 0), 1.5, 'd'))
    # keyboard: 52 white keys, black keys in the A0..C8 pattern
    kx0, kx1, ky0, ky1 = 72, 678, 880, 970
    s.add(rect(48, 868, 24, 108, 'o', 4))
    s.add(rect(678, 868, 24, 108, 'o', 4))
    kw = (kx1 - kx0) / 52
    for k in range(52):
        s.add(rect(kx0 + k * kw, ky0, kw, ky1 - ky0, 'o', 1.5))
    letters = 'ABCDEFG'
    for k in range(51):
        if letters[k % 7] in 'ACDFG':
            s.add(rect(kx0 + (k + 1) * kw - 3.6, ky0, 7.2, 52, 'k', 1))
    s.add(line(48, 976, 702, 976, 'l'))
    s.save(name)


# ---------------------------------------------------------------- strings, pins and felt, close up
def strings_close(name='strings', pal='page'):
    W, H = 1680, 720
    s = SVG(W, H, pal, 'Close-up of piano strings, tuning pins and the red felt')
    notes = 26
    sp = (H - 80) / notes
    rows = []
    for n in range(notes):
        y = 40 + n * sp
        for k, dy in enumerate((-3.4, 0, 3.4)):
            px = 92 + k * 46 + (20 if n % 2 else 0)
            rows.append((px, y + dy, k))
    # felt strip under the strings (accent), weaving felt between the unisons
    s.add('<path class="a" d="M330 0C342 180 318 420 338 720L372 720C352 420 378 180 366 0Z"/>')
    # strings
    for px, y, k in rows:
        ey = y + (y - H / 2) * .1
        s.add(line(px + 7, y, W, ey, 'l2' if k == 1 else 'l3'))
    # tuning pins with a coil
    for px, y, k in rows:
        s.add(circle(px, y, 7, 'o'))
        s.add(circle(px, y, 2.2, 'd'))
        s.add(f'<path class="l2" d="M{f(px + 4)} {f(y - 5)}a6 6 0 0 1 0 10"/>')
    # pressure bar with screws
    s.add(rect(430, -10, 26, H + 20, 'o', 3))
    for y in range(30, H, 70):
        s.add(circle(443, y, 5, 'o'))
        s.add(line(439, y - 3, 447, y + 3, 'l2'))
    # dampers resting on the strings
    for n in range(notes):
        y = 40 + n * sp
        ey = lambda x: y + (y - H / 2) * .1 * (x / W)
        s.add(rect(760, ey(760) - 9, 70, 18, 'o', 3))
        s.add(rect(764, ey(760) + 5, 62, 4, 'a', 1.5))
    # cast iron plate with portholes (evenodd keeps the strings visible through the holes)
    plate = 'M1010 -10C1050 200 1190 300 1690 320L1690 -10Z'
    holes = ''.join(f'M{cx - rx} {cy}a{rx} {ry} 0 1 0 {2 * rx} 0a{rx} {ry} 0 1 0 {-2 * rx} 0Z'
                    for cx, cy, rx, ry in [(1250, 120, 84, 58), (1500, 168, 70, 48)])
    s.add(f'<path class="o" fill-rule="evenodd" d="{plate}{holes}"/>')
    s.add('<path class="l3" d="M1040 -10C1078 180 1206 274 1690 292"/>')
    for x, y in [(1120, 120), (1380, 250), (1620, 290)]:
        s.add(circle(x, y, 6, 'o'))
    s.save(name)


# ---------------------------------------------------------------- two hands playing, seen from above
def capsule(x0, y0, length, width, angle, c='o'):
    """Rounded finger from (x0, y0) pointing at angle (degrees, 0 = straight down)."""
    a = math.radians(angle)
    return (f'<rect class="{c}" x="{f(x0 - width / 2)}" y="{f(y0)}" width="{f(width)}" height="{f(length)}" rx="{f(width / 2)}"'
            f' transform="rotate({f(-angle)} {f(x0)} {f(y0)})"/>')


def tip(x0, y0, length, angle):
    a = math.radians(angle)
    return x0 + math.sin(a) * length, y0 + math.cos(a) * length


def hand(s, cx, mirror, pressed):
    m = -1 if mirror else 1
    # forearm and sleeve
    s.add(f'<path class="o" d="M{f(cx - 70)} -20C{f(cx - 66)} 120 {f(cx - 56)} 220 {f(cx - 54)} 300L{f(cx + 54)} 300C{f(cx + 56)} 220 {f(cx + 66)} 120 {f(cx + 70)} -20Z"/>')
    s.add(f'<path class="l2" d="M{f(cx - 67)} 120L{f(cx + 67)} 120"/>')
    s.add(f'<path class="l3" d="M{f(cx - 68)} 100L{f(cx + 68)} 100"/>')
    fingers = [(-54, 168, 26, -6), (-18, 205, 29, -2), (18, 214, 29, 2), (52, 192, 27, 6)]  # pinky..index for a left hand
    tips = []
    for i, (dx, ln, wd, ang) in enumerate(fingers):
        x0 = cx + m * dx
        s.add(capsule(x0, 392, ln, wd, m * ang))
        tx, ty = tip(x0, 392, ln - wd / 2, m * ang)
        tips.append((tx, ty))
        for j in (0.42, 0.7):  # knuckle creases
            kx, ky = tip(x0, 392, ln * j, m * ang)
            s.add(f'<path class="l3" d="M{f(kx - wd * .32)} {f(ky)}q{f(wd * .32)} 4 {f(wd * .64)} 0"/>')
    # thumb
    tx0, ty0 = cx + m * 66, 360  # root sits inside the palm, which is drawn on top
    s.add(capsule(tx0, ty0, 200, 38, m * 22))
    tips.append(tip(tx0, ty0, 181, m * 22))
    # palm over the finger roots
    s.add(f'<path class="o" d="M{f(cx - 56)} 262C{f(cx - 80)} 300 {f(cx - 92)} 360 {f(cx - 86)} 404C{f(cx - 80)} 430 {f(cx - 40)} 438 {f(cx)} 436'
          f'C{f(cx + 40)} 438 {f(cx + 82)} 430 {f(cx + 88)} 404C{f(cx + 94)} 360 {f(cx + 82)} 300 {f(cx + 56)} 262Z"/>')
    s.add(f'<path class="l3" d="M{f(cx - 40)} 340q{f(m * 20 + 40)} 30 {f(80)} 6"/>')
    # pressed keys get small motion marks above the fingertip
    for i in pressed:
        x, y = tips[i]
        s.add(f'<path class="ao" d="M{f(x - 12)} {f(y - 30)}q12 -8 24 0"/>')
    return tips


def hands(name='hands', pal='band'):
    W, H = 800, 1000
    s = SVG(W, H, pal, 'Two hands playing a chord on a piano keyboard')
    n, y0 = 14, 560
    kw = W / n
    letters = 'CDEFGAB'
    # fingertip x positions decide which keys go down (filled accent)
    s_keys = []
    for k in range(n):
        s_keys.append((k * kw, kw))
    # draw hands first on a scratch SVG to learn the fingertip positions
    probe = SVG(W, H, pal, '')
    lt = hand(probe, 210, False, [])
    rt = hand(probe, 590, True, [])
    down = {int(x // kw) for x, _ in [lt[0], lt[2], lt[4], rt[1], rt[3], rt[4]]}
    for k, (x, w) in enumerate(s_keys):
        s.add(rect(x, y0, w, H - y0 + 10, 'a' if k in down else 'o', 3))
        if k in down:
            s.add(rect(x, y0, w, H - y0 + 10, 'l', 3))
    for k in range(n - 1):
        if letters[k % 7] in 'CDFGA':
            s.add(rect((k + 1) * kw - 17, y0, 34, 250, 'k', 3))
    s.add(line(0, y0, W, y0, 'l'))
    hand(s, 210, False, [0, 2, 4])
    hand(s, 590, True, [1, 3, 4])
    s.save(name)


# ---------------------------------------------------------------- grand action, side view: key, hammer, string, damper
def action(name='action', pal='stage'):
    W, H = 800, 600
    s = SVG(W, H, pal, 'Side view of a piano action: the key lifts the hammer into the string')
    # string with tuning pin and bridge
    s.add(line(40, 120, 770, 120, 'l'))
    s.add(circle(56, 120, 9, 'o'))
    s.add(circle(56, 120, 3, 'd'))
    s.add('<path class="o" d="M700 120L716 146L684 146Z"/>')
    # damper lifted off the string
    s.add(rect(560, 46, 58, 52, 'o', 4))
    s.add(rect(564, 92, 50, 8, 'a', 2))
    s.add(line(589, 0, 589, 46, 'l'))
    # hammer at the strike: felt head touching the string, shank to its flange
    s.add(line(436, 168, 250, 318, 'l'))
    s.add(circle(250, 318, 10, 'o'))
    s.add(circle(250, 318, 3, 'd'))
    s.add('<path class="a" d="M408 150C406 128 420 120 438 121C458 122 470 134 468 152C466 170 452 178 436 177C420 176 410 168 408 150Z"/>')
    s.add('<path class="l" d="M416 152C415 138 424 132 437 132C450 133 458 141 457 153C456 165 447 170 437 170C425 169 417 163 416 152Z"/>')
    # resting position, dashed, and the travel arc
    s.add('<path class="l2 dash" d="M250 318L430 266"/>')
    s.add('<path class="l2 dash" d="M402 268C400 250 414 244 432 245C452 246 462 258 460 274C458 290 444 296 430 295C414 294 404 286 402 268Z"/>')
    s.add('<path class="ao" d="M488 262C500 226 496 190 476 160"/>')
    s.add('<path class="ao" d="M470 166l6 -8l4 10"/>')
    # wippen and jack between key and hammer
    s.add('<path class="o" d="M200 372L470 352L476 372L206 394Z"/>')
    s.add(line(330, 362, 318, 316, 'l'))
    s.add(circle(200, 383, 6, 'o'))
    # key lever on its balance rail, pressed at the front
    s.add('<path class="o" d="M40 470L760 430L762 458L42 500Z"/>')
    s.add('<path class="o" d="M400 476L422 514L378 514Z"/>')
    s.add(line(380, 380, 384, 448, 'l2'))
    s.add(line(20, 540, 780, 540, 'l'))
    for x in range(40, 780, 24):
        s.add(line(x, 540, x - 12, 556, 'l3'))
    s.add('<path class="ao" d="M70 380L70 440"/>')
    s.add('<path class="ao" d="M62 430L70 442L78 430"/>')
    s.save(name)


if __name__ == '__main__':
    piano_top()
    strings_close()
    hands()
    action()
