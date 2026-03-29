# Design System Specification: Dark Mode & High-End Editorial

## 1. Overview & Creative North Star: "The Midnight Observatory"
This design system moves away from the "SaaS-standard" look toward a high-end, editorial aesthetic titled **The Midnight Observatory**. The goal is to create an environment that feels like a premium, nocturnal data center—sophisticated, deep, and quiet.

We break the "template" look through **intentional asymmetry** and **tonal depth**. Instead of rigid, boxed-in grids, we use expansive breathing room and layered surfaces. This is not just a "dark mode"; it is a cinematic experience where data points emerge from the shadows like stars in a night sky.

---

## 2. Color & Atmospheric Layering
The palette is rooted in deep slates (`#0c1324`) and vibrant, bio-luminescent greens. We prioritize optical comfort in low-light environments.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts. For example, a `surface_container_low` section sitting on a `surface` background creates a clean, sophisticated break without the visual clutter of a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of smoked glass. 
- **Base Layer:** `surface` (`#0c1324`)
- **Inset Layer:** `surface_container_lowest` (`#070d1f`) for recessed areas like search bars.
- **Card/Content Layer:** `surface_container` (`#191f31`) for standard content blocks.
- **Floating Layer:** `surface_bright` (`#33394c`) for elements requiring immediate attention.

### The Glass & Gradient Rule
Floating elements (modals, popovers) must use **Glassmorphism**. Apply `surface_variant` at 60% opacity with a `20px` backdrop-blur. 
- **Signature Texture:** Use a subtle linear gradient on primary CTAs transitioning from `primary` (`#62df7d`) to `primary_container` (`#1ca64d`) at a 135° angle. This adds a "jewel-toned" depth that flat colors lack.

---

## 3. Typography: Editorial Authority
We pair the technical precision of **Inter** with the architectural character of **Space Grotesk**.

*   **Display & Headlines (Space Grotesk):** These are your "Hero" moments. Use `display-lg` (3.5rem) with tighter letter-spacing (-0.02em) to create an authoritative, editorial feel. 
*   **Body & Labels (Inter):** High-readability sans-serif. In dark mode, ensure `body-md` uses `on_surface_variant` (`#bdcaba`) for secondary text to reduce eye strain from pure white-on-black contrast.
*   **The Contrast Rule:** Use `primary` (`#62df7d`) sparingly for text—only for high-priority labels or active states to maintain the premium, "low-noise" atmosphere.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too heavy for this aesthetic. We achieve lift through light, not shadow.

*   **The Layering Principle:** Stack `surface_container_low` on top of `surface_container_lowest` to create a soft, natural lift.
*   **Ambient Shadows:** If a floating effect is required (e.g., a hovering card), use a diffuse shadow: `0 20px 40px rgba(7, 13, 31, 0.5)`. The shadow color must be a darker version of the background, never a neutral gray.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline_variant` at 15% opacity. **Never use 100% opaque borders.**
*   **Glassmorphism:** For tooltips and menus, use `surface_container_highest` with a `blur(12px)` and a `0.5px` stroke of `outline` at 10% opacity to simulate the edge of a glass pane.

---

## 5. Components & Interaction

### Cards & Lists
*   **No Dividers:** Forbid the use of horizontal lines. Use the **Spacing Scale** (specifically `spacing.8` or `spacing.12`) to create "Active Negative Space."
*   **Card Styling:** Apply `roundedness.xl` (0.75rem). Cards should use `surface_container` on a `surface` background.

### Data Visualization (Optimized for Dark Mode)
*   **Primary Data:** `primary` (#62df7d)
*   **Secondary Data (Blue):** `secondary` (#7bd0ff)
*   **Tertiary Data (Orange/Gold):** `tertiary` (#ffb95f)
*   **Alerts/Errors:** `error` (#ffb4ab)
*   *Note: Use 70% opacity for grid lines in charts to keep the focus on the data glow.*

### Buttons
*   **Primary:** Gradient fill (Primary to Primary Container), `roundedness.full`, white text (`on_primary`).
*   **Secondary:** `surface_container_highest` fill with `primary` text. No border.
*   **Tertiary/Ghost:** No background. `on_surface` text with an icon.

### Inputs
*   Use `surface_container_lowest` for the field background to create an "etched into the interface" look. 
*   Active state: A `1px` "Ghost Border" using `primary` at 40% opacity.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts (e.g., a left-aligned headline with a right-shifted data visualization).
*   **Do** leverage the `surface_container` tiers to create hierarchy.
*   **Do** use `spaceGrotesk` for all numerical data to emphasize the "Observatory" theme.
*   **Do** ensure a minimum contrast ratio of 4.5:1 for all functional text.

### Don’t:
*   **Don’t** use `#000000` for backgrounds; it kills the sense of depth. Use `surface` (`#0c1324`).
*   **Don’t** use 1px dividers or "boxes within boxes."
*   **Don’t** use standard drop shadows. If it doesn't look like light or glass, rethink it.
*   **Don’t** crowd the interface. If in doubt, add `spacing.12` of padding.