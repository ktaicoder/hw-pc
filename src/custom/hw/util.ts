export function createNumberArray(size: number, initFn: (array: number[]) => void) {
  const arr = new Array(size).fill(0)
  initFn(arr)
  return arr
}

export function clamp(v: number, min: number, max: number): number {
  if (v > max) return max
  if (v < min) return min
  return v
}

export function atMost(v: number, max: number): number {
  if (v > max) return max
  return v
}

export function atLeast(v: number, min: number): number {
  if (v < min) return min
  return v
}

export async function sleepAsync(milli: number): Promise<void> {
  if (milli <= 0) return
  await new Promise((resolve) => {
    setTimeout(resolve, milli)
  })
}

export async function sleepAsyncSafe(milli: number): Promise<void> {
  if (milli <= 0) return
  await sleepAsync(milli).catch(() => {
    /*  ignore */
  })
}
