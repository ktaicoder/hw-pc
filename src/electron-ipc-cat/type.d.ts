declare module 'errio' {
    export function parse(error: Error): Error
    export function stringify(error: Error): string
    export function register(error: ErrorConstructor): void
}

declare module 'threads-plugin' {
    const value: any
    export default value
}

declare module 'webpack2-externals-plugin' {
    const value: any
    export default value
}

declare module '*.png' {
    const value: string
    export default value
}

declare module '*.svg' {
    const value: string
    export default value
}
