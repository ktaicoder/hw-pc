const isDev = process.env.NODE_ENV === 'development'
// const isDev = MAIN_WINDOW_WEBPACK_ENTRY.startsWith('http')

export const fixWebPath = (src: string | undefined): string | undefined => {
    if (!src) return undefined
    if (isDev) {
        return `/main_window${src.startsWith('/') ? '' : '/'}${src}`
    } else {
        return src
    }
}
