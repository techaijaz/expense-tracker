# Design System Specification: High-End Financial Editorial

## 1. Overview & Creative North Star: "The Financial Architect"
The objective of this design system is to pivot away from the generic "SaaS dashboard" aesthetic and toward a sophisticated, high-end editorial experience. We are building **"The Financial Architect"**—a system that feels like a bespoke Swiss banking application mixed with a modern data-journalism aesthetic. 

We break the "template" look through **intentional tonal layering** and **asymmetric information density**. Rather than using a rigid, boxed-in grid, we utilize generous breathing room and overlapping surfaces to guide the eye. This system isn't just about showing data; it’s about curating a professional narrative of wealth management.

---

## 2. Colors & Atmospheric Depth
Our palette is rooted in a deep, nocturnal foundation. It is designed to feel authoritative and calm, utilizing the Material Design convention to ensure a systematic logic across all states.

### Core Palette
- **Primary (`#c3c0ff` / `#4f46e5`):** Our "Action Indigo." Use the `primary_container` (#4f46e5) for high-intent actions and the `primary` (#c3c0ff) for high-contrast accents in dark mode.
- **Surface & Background (`#0c1322`):** A custom deep-space navy. This is the foundation of the experience.
- **Tertiary (`#ffb695`):** An "Economic Amber" used sparingly for high-priority alerts, goals, or "pro" features to break the monochromatic blue tones.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts or tonal transitions.
*   *Instead of a border:* Place a `surface_container_low` card on a `surface` background.
*   *Instead of a divider:* Use a 32px or 48px vertical gap to signify a new section.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials. Use the `surface_container` tiers to create depth:
1.  **Level 0 (Base):** `surface` (#0c1322) - The canvas.
2.  **Level 1 (Sections):** `surface_container_low` (#141b2b) - For secondary content areas.
3.  **Level 2 (Cards):** `surface_container` (#191f2f) - The primary interactive layer.
4.  **Level 3 (Popovers/Modals):** `surface_container_highest` (#2e3545) - Elements closest to the user.

### The "Glass & Gradient" Rule
Main CTAs and Hero Data Points (like "Total Net Worth") should utilize a linear gradient from `primary` to `primary_container`. For floating navigation or header bars, use **Glassmorphism**: `surface_container` at 80% opacity with a `backdrop-filter: blur(12px)`.

---

## 3. Typography: Editorial Authority
We utilize a dual-font approach to balance data-driven precision with high-end editorial flair.

*   **Display & Headlines (Manrope):** Chosen for its geometric modernism. Use `display-lg` and `headline-md` for large monetary balances and section titles. The wide apertures of Manrope convey openness and trust.
*   **Body & UI (Inter):** The workhorse. Use `body-md` for all transaction details and `label-sm` for metadata. Inter provides maximum legibility for complex financial figures.

**Hierarchy as Identity:**
- **The Power of Scale:** Use a significant jump between `headline-lg` (2rem) and `body-md` (0.875rem) to create an "Editorial" look. Small text should be paired with generous tracking (+0.02em) to look premium.
- **Data Weighting:** Large currency symbols should be set in `label-md` (smaller) next to a `display-md` (large) amount to emphasize the value over the currency.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often "dirty." In this system, depth is achieved through light and material.

*   **The Layering Principle:** Stacking `surface_container_lowest` cards on a `surface_container_low` section creates a natural "lift" through contrast rather than shadow.
*   **Ambient Shadows:** When an element must float (e.g., a modal), use a shadow tinted with `surface_tint`.
    *   *Spec:* `0px 20px 40px rgba(7, 14, 29, 0.4)` — large, diffused, and almost invisible.
*   **The "Ghost Border":** If a boundary is required for accessibility (e.g., Input Fields), use the `outline_variant` token at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components & Primitive Logic

### Buttons: The Weighted Action
- **Primary:** Gradient fill (`primary_container` to `primary`), `md` (0.75rem) rounded corners. Text is `label-md` uppercase with 0.05em tracking.
- **Secondary:** `surface_container_high` background. No border.
- **Tertiary:** Text-only using `primary` color. Reserved for "Cancel" or "Back" actions.

### Data Cards & Lists
- **Rule:** Forbid the use of divider lines between list items.
- **Logic:** Use a `surface_container` background for the card. For individual list items (e.g., transactions), use a 12px vertical spacing. Differentiate items by using a `surface_bright` hover state.
- **Micro-interactions:** Cards should subtly scale (1.02x) on hover to provide a tactile, premium feel.

### Form Inputs (Radix-Inspired)
- **Background:** `surface_container_lowest`.
- **Focus State:** No thick rings. Use a 1px `primary` Ghost Border (20% opacity) and a subtle `primary` inner glow.
- **Validation:** Errors use `error` (#ffb4ab) for text, but the input background shifts to a very faint `error_container` (10% opacity) to maintain the dark-mode aesthetic.

### Additional Signature Component: "The Insights Rail"
A vertical, asymmetric component used to display AI-driven financial advice. It should use `tertiary_container` with a glassmorphism blur to separate it from the "manual" data entry parts of the app.

---

## 6. Do’s and Don'ts

### Do
*   **Do** use `surface_container` variations to group related financial data.
*   **Do** use `manrope` for any number larger than 24px.
*   **Do** allow for "dead space." High-end design requires room to breathe.
*   **Do** use `on_surface_variant` for secondary labels to create a clear visual hierarchy.

### Don’t
*   **Don't** use `#000000` for shadows; always tint them with your background navy.
*   **Don't** use 1px dividers to separate transactions; use whitespace.
*   **Don't** use standard "Success Green." Stick to the `primary` indigo and use the `tertiary` amber for emphasis; trust is built through a cohesive, professional palette, not a rainbow of status colors.
*   **Don't** use sharp 0px corners. Financial apps should feel secure and "approachable," not aggressive. Stick to the `md` (0.75rem) standard.