import { Cormorant_Garamond, JetBrains_Mono, Mulish, Onest, Unbounded } from 'next/font/google';
import localFont from 'next/font/local';

// Gilroy is self-hosted from public/font/Gilroy. It covers Latin + Russian Cyrillic,
// but NOT the Uzbek-specific Cyrillic letters қ Қ ғ Ғ ҳ Ҳ — those are handled by the
// Cyrillic-complete fallback stack defined for --font-outfit in globals.css.
export const gilroy = localFont({
  src: [
    { path: '../public/font/Gilroy/Gilroy-Thin_0.ttf', weight: '100', style: 'normal' },
    { path: '../public/font/Gilroy/Gilroy-ThinItalic_0.ttf', weight: '100', style: 'italic' },
    { path: '../public/font/Gilroy/Gilroy-UltraLight_0.ttf', weight: '200', style: 'normal' },
    { path: '../public/font/Gilroy/Gilroy-UltraLightItalic_0.ttf', weight: '200', style: 'italic' },
    { path: '../public/font/Gilroy/Gilroy-Light_0.ttf', weight: '300', style: 'normal' },
    { path: '../public/font/Gilroy/Gilroy-LightItalic_0.ttf', weight: '300', style: 'italic' },
    { path: '../public/font/Gilroy/Gilroy-Regular_0.ttf', weight: '400', style: 'normal' },
    { path: '../public/font/Gilroy/Gilroy-RegularItalic_0.ttf', weight: '400', style: 'italic' },
    { path: '../public/font/Gilroy/Gilroy-Medium_0.ttf', weight: '500', style: 'normal' },
    { path: '../public/font/Gilroy/Gilroy-MediumItalic_0.ttf', weight: '500', style: 'italic' },
    { path: '../public/font/Gilroy/Gilroy-Semibold_0.ttf', weight: '600', style: 'normal' },
    { path: '../public/font/Gilroy/Gilroy-SemiboldItalic_0.ttf', weight: '600', style: 'italic' },
    { path: '../public/font/Gilroy/Gilroy-Bold_0.ttf', weight: '700', style: 'normal' },
    { path: '../public/font/Gilroy/Gilroy-BoldItalic_0.ttf', weight: '700', style: 'italic' },
    { path: '../public/font/Gilroy/Gilroy-Extrabold_0.ttf', weight: '800', style: 'normal' },
    { path: '../public/font/Gilroy/Gilroy-ExtraboldItalic_0.ttf', weight: '800', style: 'italic' },
    { path: '../public/font/Gilroy/Gilroy-Black_0.ttf', weight: '900', style: 'normal' },
    { path: '../public/font/Gilroy/Gilroy-BlackItalic_0.ttf', weight: '900', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-gilroy',
});

// Storefront theme fonts (lib/store-theme). Not preloaded: a shop uses one
// theme, and the browser fetches a font file only when the page actually sets
// text in that family, so only the active theme's fonts ever download. The
// root layout puts just the active theme's variables on <html>. Variable
// fonts, so one file per subset covers every weight. Every family here has
// cyrillic-ext, so the Uzbek letters қ ғ ҳ render in the theme's own font
// (Jost, the mockup's body font, lacks them; Mulish has close metrics).
// next/font needs literal options here, hence the repetition.

/** Jurnal: editorial serif headings. */
export const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-cormorant',
});
/** Jurnal: body. */
export const mulish = Mulish({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-mulish',
});
/** Afisha: poster headings. */
export const unbounded = Unbounded({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-unbounded',
});
/** Afisha: body. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-jetbrains',
});
/** Tungi: headings and body. */
export const onest = Onest({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-onest',
});
