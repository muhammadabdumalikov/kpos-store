import {
  Comfortaa,
  Cormorant_Garamond,
  Exo_2,
  Geologica,
  Golos_Text,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  JetBrains_Mono,
  Literata,
  Manrope,
  Mulish,
  Nunito,
  Nunito_Sans,
  Onest,
  Oswald,
  Prata,
  Raleway,
  Rubik,
  Shantell_Sans,
  Sofia_Sans,
  Sofia_Sans_Extra_Condensed,
  Unbounded,
  Yeseva_One,
  Ysabeau,
  Ysabeau_Office,
} from 'next/font/google';
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

// Trade themes (lib/soha-looks). The same rules as above: every family has
// cyrillic-ext, none is preloaded, and only the active theme's variables reach
// <html>. Each theme has a display face of its own, chosen after the real
// shops of its trade; a static family names the weights it needs.

/** Bozor: headings and body. */
export const geologica = Geologica({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-geologica',
});

/** Usta: condensed caps, as on a builders' merchant's signs. */
export const oswald = Oswald({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-oswald',
});

/** Usta and Daftar: body. */
export const golos = Golos_Text({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-golos',
});

/** Guldasta: an upright display serif (one weight). Its body is Mulish. */
export const prata = Prata({
  // No latin-ext subset; the Uzbek apostrophes (U+02BB, U+02BC) are in latin.
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  weight: '400',
  variable: '--font-prata',
});

/** Mayin: a flared sans in the manner of Optima, the cosmetics classic. */
export const ysabeau = Ysabeau({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-ysabeau',
});

/** Mayin: body. */
export const ysabeauOffice = Ysabeau_Office({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-ysabeau-office',
});

/** O'ynoqi: round headings. */
export const comfortaa = Comfortaa({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-comfortaa',
});

/** O'ynoqi: body. */
export const nunito = Nunito({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-nunito',
});

/** Texno: headings and body. */
export const plexSans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-plex',
});

/** Texno: a product's options (128 GB, 45 mm). */
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  weight: ['500'],
  variable: '--font-plex-mono',
});

/** Ro'zg'or: headings and body. */
export const rubik = Rubik({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-rubik',
});

/** Kitob: a book face for headings and body. */
export const literata = Literata({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  style: ['normal', 'italic'],
  variable: '--font-literata',
});

/** Marafon: slanted condensed caps. */
export const sofiaXCondensed = Sofia_Sans_Extra_Condensed({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  style: ['normal', 'italic'],
  variable: '--font-sofia-xcond',
});

/** Marafon: body. */
export const sofia = Sofia_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-sofia',
});

/** Tuhfa: a greeting-card display serif (one weight). */
export const yeseva = Yeseva_One({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  weight: '400',
  variable: '--font-yeseva',
});

/** Tuhfa: body. */
export const nunitoSans = Nunito_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-nunito-sans',
});

/** Uy: light headings and body. */
export const raleway = Raleway({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-raleway',
});

/** Garaj: slanted caps for titles, upright for the body. */
export const exo2 = Exo_2({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  style: ['normal', 'italic'],
  variable: '--font-exo2',
});

/** Daftar: marker headings. */
export const shantell = Shantell_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-shantell',
});

/** Butik: a plain modern grotesque for names, titles and prices. */
export const manrope = Manrope({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  preload: false,
  variable: '--font-manrope',
});
