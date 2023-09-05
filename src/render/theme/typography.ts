import { Palette } from '@mui/material'

const FONT_FAMILIES = [
  'Noto Sans KR', //
  'sans-serif',
  '맑은 고딕',
  'Nanum Gothic',
  'Do Hyeon',
  'Nanum Gothic Coding',
  'Jua',
  'Nanum Pen Script',
]

const typography = (palette: Palette) => ({
  fontFamily: FONT_FAMILIES.map((it) => `'${it}'`).join(','),
  h1: {
    fontWeight: 600,
    fontSize: '2.188rem',
    letterSpacing: '-0.24px',
    lineHeight: '2.5rem',
  },
  h2: {
    fontWeight: 600,
    fontSize: '1.813rem',
    letterSpacing: '-0.24px',
    lineHeight: '2rem',
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.5rem',
    letterSpacing: '0.5px',
    lineHeight: '1.75rem',
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.25rem',
    letterSpacing: '0.5px',
    lineHeight: '1.5rem',
  },
  h5: {
    fontWeight: 600,
    fontSize: '1rem',
    letterSpacing: '0.5px',
    lineHeight: '1.313rem',
  },
  h6: {
    fontWeight: 600,
    fontSize: '0.875rem',
    letterSpacing: '0.5px',
    lineHeight: '1.313rem',
  },
  subtitle1: {
    fontSize: '1rem',
    letterSpacing: '0.5px',
    lineHeight: '1.563rem',
  },
  subtitle2: {
    fontSize: '0.875rem',
    letterSpacing: 0,
    lineHeight: '1rem',
  },
  body1: {
    fontSize: '0.80rem',
    // letterSpacing: '-0.05px',
    lineHeight: '1.313rem',
  },
  body2: {
    fontSize: '0.75rem',
    letterSpacing: '-0.04px',
    lineHeight: '0.95rem',
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
