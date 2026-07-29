---
name: Cognitive Edge
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464652'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777683'
  outline-variant: '#c7c5d4'
  surface-tint: '#4f54b4'
  primary: '#15157d'
  on-primary: '#ffffff'
  primary-container: '#2e3192'
  on-primary-container: '#9da1ff'
  inverse-primary: '#c0c1ff'
  secondary: '#0056c6'
  on-secondary: '#ffffff'
  secondary-container: '#006df8'
  on-secondary-container: '#fefcff'
  tertiary: '#002f1e'
  on-tertiary: '#ffffff'
  tertiary-container: '#004830'
  on-tertiary-container: '#22c087'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#04006d'
  on-primary-fixed-variant: '#373a9b'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b0c6ff'
  on-secondary-fixed: '#001945'
  on-secondary-fixed-variant: '#00429c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
---

## Brand & Style
The design system is built on a foundation of **Modern Academic Professionalism**. It balances the rigor of traditional scholarship with the efficiency of cutting-edge technology. The visual direction follows a **Corporate / Modern** aesthetic with elements of **Minimalism** to ensure the user's cognitive load is reserved for learning, not navigating.

The emotional response should be one of focused calm and "intellectual empowerment." By using wide margins and a structured grid, the interface feels organized and dependable. Subtle high-tech accents, like vibrant glows on active states, provide an encouraging sense of momentum and progress.

## Colors
The palette uses depth and vibrancy to signal hierarchy and success.
- **Deep Indigo (#2E3192):** Used for primary branding, navigation sidebars, and high-level headers to establish authority and focus.
- **Electric Blue (#0070FF):** Reserved for primary actions, links, and interactive states. It provides a "high-tech" spark against the academic indigo.
- **Emerald Green (#10B981):** Strictly used for progress indicators, success states, and completed milestones to provide positive reinforcement.
- **Slate Grays:** A range of soft grays are used for secondary text and background layering to maintain high contrast without the harshness of pure black on white.

## Typography
This design system utilizes **Inter** for all roles to maintain a systematic and utilitarian feel. The focus is on exceptional legibility and a clear information hierarchy.
- **Headlines:** Use a tighter letter-spacing and heavier weights to create a sense of grounded authority.
- **Body Text:** Uses a generous line height (1.5 - 1.6) to facilitate long-form reading and minimize eye strain during study sessions.
- **Labels:** Small caps or medium weights are used for metadata and utility labels to differentiate them from prose.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a maximum container width for desktop to prevent line lengths from becoming unreadable.
- **Desktop:** 12-column grid with 24px gutters. Use wide 40px margins to create a "canvas" feel that breathes.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px gutters.
Spacing is strictly based on an **8px linear scale**. Use larger gaps (48px+) between distinct content sections to visually group related study materials and reduce cognitive clutter.

## Elevation & Depth
Depth is achieved through **Tonal Layers** and **Ambient Shadows**. 
- **The Base:** The lowest layer is the Slate Gray background (#F8FAFC).
- **Cards & Containers:** White (#FFFFFF) surfaces sit on top with a very subtle, highly diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.05)).
- **Interactive Depth:** On hover, cards should lift slightly by increasing the shadow spread and adding a 1px border of Electric Blue at 10% opacity.
- **Modals:** Use a heavy backdrop blur (12px) to focus the student's attention entirely on the task at hand.

## Shapes
The shape language is **Rounded**, conveying an approachable and modern academic environment. 
- **Standard Elements:** 0.5rem (8px) for buttons, inputs, and small widgets.
- **Large Containers:** 1rem (16px) for cards and report modules.
- **Bubbles:** 1.5rem (24px) for chat-style interview bubbles to distinguish them as human-centric or AI-conversational elements.

## Components
- **Buttons:** Primary buttons use the Electric Blue fill with white text. Secondary buttons use a transparent background with a 1px Slate Gray border.
- **Progress Trackers:** Horizontal bars using Emerald Green for the filled portion. Use a subtle pulse animation for "active" steps.
- **File Upload Zones:** Dashed borders in Slate Gray. On drag-over, the border transitions to a solid Electric Blue with a light blue tinted background.
- **Interview Bubbles:** Left-aligned (System/AI) bubbles use a light Slate Gray tint; right-aligned (Student) bubbles use the Deep Indigo with white text.
- **Report Cards:** Use a structured layout with heavy use of `label-sm` for data categories and `headline-md` for scores. Include a 4px left-accent border in Emerald Green for high-performing metrics.
- **Checkboxes:** Square with a 4px corner radius. When checked, use the Electric Blue fill with a white checkmark.