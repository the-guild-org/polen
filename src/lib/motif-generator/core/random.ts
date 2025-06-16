/**
 * Seedable random number generator using MurmurHash3
 */

/**
 * MurmurHash3 implementation for deterministic randomness
 */
function murmurhash3(key: string, seed = 0): number {
  let h1 = seed
  const c1 = 0xcc9e2d51
  const c2 = 0x1b873593
  const r1 = 15
  const r2 = 13
  const m = 5
  const n = 0xe6546b64

  for (let i = 0; i < key.length; i++) {
    let k1 = key.charCodeAt(i)
    k1 = Math.imul(k1, c1)
    k1 = (k1 << r1) | (k1 >>> (32 - r1))
    k1 = Math.imul(k1, c2)

    h1 ^= k1
    h1 = (h1 << r2) | (h1 >>> (32 - r2))
    h1 = Math.imul(h1, m) + n
  }

  h1 ^= key.length
  h1 ^= h1 >>> 16
  h1 = Math.imul(h1, 0x85ebca6b)
  h1 ^= h1 >>> 13
  h1 = Math.imul(h1, 0xc2b2ae35)
  h1 ^= h1 >>> 16

  return h1 >>> 0
}

/**
 * Creates a seeded random number generator
 */
export class SeededRandom {
  private seed: number
  private original: number

  constructor(seed: string | number) {
    this.seed = typeof seed === 'string' ? murmurhash3(seed) : seed
    this.original = this.seed
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0
    return this.seed / 0xffffffff
  }

  /**
   * Random number in range
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /**
   * Random integer in range (inclusive)
   */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }

  /**
   * Random boolean with optional probability
   */
  bool(probability = 0.5): boolean {
    return this.next() < probability
  }

  /**
   * Pick random element from array
   */
  pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array')
    }
    return array[this.int(0, array.length - 1)] as T
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(0, i)
      const iVal = result[i]
      const jVal = result[j]
      if (iVal !== undefined && jVal !== undefined) {
        result[i] = jVal
        result[j] = iVal
      }
    }
    return result
  }

  /**
   * Generate normally distributed random number (Box-Muller transform)
   */
  gaussian(mean = 0, stdDev = 1): number {
    const u1 = this.next()
    const u2 = this.next()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return z0 * stdDev + mean
  }

  /**
   * Perlin-like noise (simplified)
   */
  noise(x: number, y = 0): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)

    const a = this.pseudoRandom(X, Y)
    const b = this.pseudoRandom(X + 1, Y)
    const c = this.pseudoRandom(X, Y + 1)
    const d = this.pseudoRandom(X + 1, Y + 1)

    const u = this.fade(xf)
    const v = this.fade(yf)

    return this.lerp(v, this.lerp(u, a, b), this.lerp(u, c, d))
  }

  private pseudoRandom(x: number, y: number): number {
    const n = x + y * 57
    const nn = (n << 13) ^ n
    return (1.0 - ((nn * (nn * nn * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0) * 0.5 + 0.5
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a)
  }

  /**
   * Reset to original seed
   */
  reset(): void {
    this.seed = this.original
  }

  /**
   * Create a new generator with a sub-seed
   */
  fork(subseed: string | number): SeededRandom {
    const newSeed = typeof subseed === 'string'
      ? murmurhash3(subseed, this.seed)
      : this.seed ^ subseed
    return new SeededRandom(newSeed)
  }
}
