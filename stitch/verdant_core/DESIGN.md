# Design System Specification: Editorial Agronomy

## 1. Overview & Creative North Star
The "Digital Cultivator" is the Creative North Star for this design system. We are moving away from the "utilitarian spreadsheet" look of traditional AgTech. Instead, we treat soil data and crop health with the reverence of a high-end editorial magazine. 

By leveraging **Organic Brutalism**, we combine the precision of data with the soft, fluid nature of the environment. We break the standard mobile "template" by using intentional asymmetry—where images might bleed off the edge of a card—and high-contrast typography scales that make headlines feel like a statement of authority. The result is a system that feels premium, trustworthy, and deeply connected to the earth.

## 2. Colors & Surface Architecture
Color is not just for branding; it is for environmental storytelling. We use a palette that mirrors the vitality of a healthy crop cycle.

### The Palette
*   **Primary (The Growth Core):** `primary` (#006b2c) and `primary_container` (#00873a). Use these for high-intent actions and to signify healthy data states.
*   **Secondary & Tertiary (Data Spectrum):** `secondary` (#006398) for hydration/water and `tertiary` (#825100) for soil/pH levels.
*   **Neutrals (The Canvas):** `surface` (#f8f9fa) and `on_surface` (#191c1d).

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. To separate a card from the background, use `surface_container_low` sitting on a `surface` background. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
1.  **Base:** `surface` (The field).
2.  **Sectioning:** `surface_container` (The plot).
3.  **Interaction:** `surface_container_lowest` (The focal point/card).
Nesting these tiers creates depth without the visual "noise" of lines.

### Signature Textures & Glass
*   **The Signature Gradient:** For main CTAs, use a linear gradient from `primary` to `primary_container` at a 135° angle. This adds "visual soul" and depth.
*   **Glassmorphism:** Floating action buttons or navigation overlays must use `surface` with 80% opacity and a `backdrop-blur` of 12px. This ensures the UI feels integrated with the data flowing beneath it.

## 3. Typography: The Editorial Voice
We use a dual-typeface system to balance technical precision with human warmth.

*   **Display & Headlines (Manrope):** Use `display-lg` to `headline-sm` for data summaries and section headers. Manrope’s geometric yet open nature feels modern and authoritative.
*   **Body & Labels (Inter):** Use `body-lg` to `label-sm` for all reading utility. Inter is optimized for legibility in the field under high-glare conditions.
*   **Editorial Hierarchy:** Always lead with a strong `headline-md`. Ensure there is a significant "jump" between headlines and body text to create a clear visual path for the user’s eye.

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "digital." We use **Tonal Layering** to mimic natural light hitting a matte surface.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` background. This creates a soft, natural "lift" through color value alone.
*   **Ambient Shadows:** For elements that truly float (like Modals), use a shadow with a blur of `32px`, an offset of `y: 8`, and the color `on_surface` at only **4% opacity**. It should feel like a whisper, not a smudge.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.

## 5. Component Logic

### Buttons (The Tactile Root)
*   **Primary:** Rounded at `md` (1.5rem) or `full` (9999px). Uses the Signature Gradient.
*   **Secondary:** No background. Use a `title-sm` font weight with `primary` color.
*   **States:** On press, transition to `primary_fixed_dim`.

### Input Fields (The Data Portal)
*   **Styling:** Forgo the box. Use a `surface_container_high` background with a `full` radius. 
*   **Labels:** Always use `label-md` in `on_surface_variant`, floating 8px above the input.

### Cards & Lists (The Plot View)
*   **No Dividers:** Forbid the use of divider lines. Separate list items using `8px` (spacing-2) of vertical white space or by alternating between `surface` and `surface_container_low`.
*   **Asymmetry:** In cards, icons (leaf, water drop) should be oversized and slightly cropped by the card edge to create a custom, high-end feel.

### Specialized Ag-Components
*   **Sensor Chips:** Small, rounded `sm` (0.5rem) containers using `secondary_container` or `tertiary_container` to categorize soil vs. weather data.
*   **The "Health Meter":** A custom progress bar using a gradient transition from `error` to `primary` to visualize soil health.

## 6. Do’s and Don’ts

### Do
*   **Do** use extreme white space. If you think it's enough, add 8px more.
*   **Do** use `primary_fixed` for background accents to highlight positive data trends.
*   **Do** ensure all icons are a minimum of 24x24px for easy "gloved-hand" interaction.

### Don't
*   **Don't** use pure black (#000). Use `on_surface` (#191c1d) to maintain a premium, soft-contrast look.
*   **Don't** use standard Material shadows. They are too heavy for this "light-as-air" system.
*   **Don't** cram multiple data points into one card. Break them into a horizontally scrolling carousel of `surface_container_lowest` cards.