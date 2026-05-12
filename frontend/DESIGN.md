# General Intelligence Company — Style Reference
> Architectural Night Sky

**Theme:** light

General Intelligence Company employs a sophisticated aesthetic, blending an evocative, illustrative dark hero with a predominantly minimalist, architectural light UI. Typography is restrained and elegant, utilizing a serif for headlines that conveys gravitas and a clean sans-serif for body text. Surfaces are layered with subtle translucency and soft, multi-layered shadows, creating depth without heaviness. The overall impression is one of calm authority and advanced technology, articulated through precise achromatic forms punctuated by a singular, cool blue accent for interactive elements.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Night Sky | `#1f1f29` | `--color-night-sky` | Dark base for hero sections |
| Cofounder Blue | `#0081c0` | `--color-cofounder-blue` | Accent for featured content and active states |
| Action Azure | `#41a1cf` | `--color-action-azure` | Border color for ghost buttons and interactive elements |
| Pitch Black | `#000000` | `--color-pitch-black` | Primary text headings |
| Canvas White | `#ffffff` | `--color-canvas-white` | Main page background |
| Off White | `#fefffc` | `--color-off-white` | Secondary section backgrounds and cards |
| Ash Gray | `#f9faf7` | `--color-ash-gray` | Input fields and navigation elements |
| Cool Gray | `#eef1ed` | `--color-cool-gray` | Subtle borders |
| Steel Gray | `#dee2de` | `--color-steel-gray` | Hairline borders |
| Dark Charcoal | `#171717` | `--color-dark-charcoal` | Primary body text |
| Charcoal | `#2c2c2c` | `--color-charcoal` | Secondary text |
| Rich Black | `#282834` | `--color-rich-black` | Nav hover states |
| Slate Gray | `#444141` | `--color-slate-gray` | Placeholder text |
| Medium Gray | `#646464` | `--color-medium-gray` | Helper descriptions |
| Light Gray | `#b4b8b4` | `--color-light-gray` | Subtle dividers |

## Tokens — Typography

### PPMondwest → Instrument Serif (substitute)
- Weights: 400, 500
- Sizes: 40px, 48px, 54px
- Line height: 1.10
- Letter spacing: -0.0200em

### af → Onest (substitute)
- Weights: 400, 500, 600, 700
- Sizes: 13px, 15px, 16px, 18px
- Letter spacing: -0.0120em

## Components

- Ghost Button: transparent bg, #444141 text
- Solid Dark Button: #1f1f29 bg, #ffffff text, 8px radius
- Outlined Action Button: transparent bg, #41a1cf border, 4px radius
- Blurred Nav Item: rgba(255,255,255,0.06) bg, 50.496px radius, backdrop-blur
- Elevated Content Card: #fefffc bg, 12px radius, shadow-subtle-2
- Hero Overlay Card: rgba(222,226,222,0.16) bg, 24px radius

## Layout

Full-bleed dark hero → contained max-width light sections → alternating white/off-white backgrounds. Nav is sticky with blur. Max content width: 1200px.
