import { Palette } from '@mui/material'

const FONT_FAMILIES = [
    'Noto Sans KR',
    'sans-serif',
    'Do Hyeon',
    'Nanum Gothic Coding',
    'Black Han Sans',
    'Jua',
    'Nanum Pen Script',
]

const typography = (palette: Palette) => ({
    fontFamily: FONT_FAMILIES.map((it) => `'${it}'`).join(','),
    h1: {
        color: palette.text.primary,
        fontWeight: 600,
        fontSize: '2.4rem',
        letterSpacing: '-0.24px',
        lineHeight: '2.6rem',
    },
    h2: {
        color: palette.text.primary,
        fontWeight: 600,
        fontSize: '2.0rem',
        letterSpacing: '-0.24px',
        lineHeight: '2.2rem',
    },
    h3: {
        color: palette.text.primary,
        fontWeight: 600,
        fontSize: '1.7rem',
        letterSpacing: '0.5px',
        lineHeight: '1.95rem',
    },
    h4: {
        color: palette.text.primary,
        fontWeight: 600,
        fontSize: '1.5rem',
        letterSpacing: '0.5px',
        lineHeight: '1.75rem',
    },
    h5: {
        color: palette.text.primary,
        fontWeight: 600,
        fontSize: '1.3rem',
        letterSpacing: '0.5px',
        lineHeight: '1.6rem',
    },
    h6: {
        color: palette.text.primary,
        fontWeight: 600,
        fontSize: '1.2rem',
        letterSpacing: '0.5px',
        lineHeight: '1.6rem',
    },
    subtitle1: {
        fontSize: '1.2rem',
        letterSpacing: '0.5px',
        lineHeight: '1.5rem',
    },
    subtitle2: {
        fontSize: '1.05rem',
        letterSpacing: 0,
        lineHeight: '1.2rem',
    },
    body1: {
        fontSize: '0.95rem',
        // letterSpacing: '-0.05px',
        lineHeight: '1.45rem',
    },
    body2: {
        fontSize: '0.85rem',
        letterSpacing: '-0.04px',
        lineHeight: '0.875rem',
    },
    button: {
        color: palette.text.primary,
        fontSize: '0.875rem',
    },
    caption: {
        color: palette.text.disabled,
        fontSize: '0.75rem',
        letterSpacing: '0.3px',
        lineHeight: '1rem',
    },
})

export default typography
