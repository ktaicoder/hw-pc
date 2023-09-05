const removeTrailingSlash = (str: string) => {
  if (str.endsWith('/')) {
    return str.replace(/\/+$/, '')
  }
  return str
}

const removeStartingSlash = (str: string) => {
  if (str.startsWith('/')) {
    return str.replace(/^\/+/, '')
  }
  return str
}

const ensurePathPrefix = (prefix: string, str: string) => {
  if (str.startsWith(prefix)) return str
  return prefix + removeStartingSlash(str)
}

export const fixWebPath = (src: string | undefined): string | undefined => {
  if (!src) return undefined
  return ensurePathPrefix('local://', src)
}
