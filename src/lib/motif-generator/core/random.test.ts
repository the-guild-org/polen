import { describe, expect, it } from 'vitest'
import { SeededRandom } from './random.ts'

describe('SeededRandom', () => {
  it('should generate deterministic values from same seed', () => {
    const random1 = new SeededRandom('test-seed')
    const random2 = new SeededRandom('test-seed')

    expect(random1.next()).toBe(random2.next())
    expect(random1.next()).toBe(random2.next())
    expect(random1.next()).toBe(random2.next())
  })

  it('should generate different values from different seeds', () => {
    const random1 = new SeededRandom('seed1')
    const random2 = new SeededRandom('seed2')

    expect(random1.next()).not.toBe(random2.next())
  })

  it('should generate values between 0 and 1', () => {
    const random = new SeededRandom('test')

    for (let i = 0; i < 100; i++) {
      const value = random.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('should generate integers in range', () => {
    const random = new SeededRandom('test')

    for (let i = 0; i < 100; i++) {
      const value = random.int(5, 10)
      expect(value).toBeGreaterThanOrEqual(5)
      expect(value).toBeLessThanOrEqual(10)
      expect(Number.isInteger(value)).toBe(true)
    }
  })

  it('should pick random elements from array', () => {
    const random = new SeededRandom('test')
    const array = ['a', 'b', 'c', 'd']

    const picks = new Set()
    for (let i = 0; i < 20; i++) {
      const pick = random.pick(array)
      expect(array).toContain(pick)
      picks.add(pick)
    }

    // Should eventually pick all elements
    expect(picks.size).toBeGreaterThan(1)
  })

  it('should shuffle arrays deterministically', () => {
    const random1 = new SeededRandom('shuffle-test')
    const random2 = new SeededRandom('shuffle-test')

    const array = [1, 2, 3, 4, 5]

    const shuffled1 = random1.shuffle(array)
    const shuffled2 = random2.shuffle(array)

    expect(shuffled1).toEqual(shuffled2)
    expect(shuffled1).not.toBe(array) // Should be a copy
  })

  it('should generate gaussian distribution', () => {
    const random = new SeededRandom('gaussian')
    const values = []

    for (let i = 0; i < 1000; i++) {
      values.push(random.gaussian(0, 1))
    }

    const mean = values.reduce((a, b) => a + b) / values.length
    expect(Math.abs(mean)).toBeLessThan(0.1) // Should be close to 0
  })

  it('should fork with subseed', () => {
    const random = new SeededRandom('main')
    const fork1 = random.fork('sub1')
    const fork2 = random.fork('sub1')
    const fork3 = random.fork('sub2')

    expect(fork1.next()).toBe(fork2.next())
    expect(fork1.next()).not.toBe(fork3.next())
  })

  it('should reset to original state', () => {
    const random = new SeededRandom('reset-test')

    const value1 = random.next()
    const value2 = random.next()

    random.reset()

    expect(random.next()).toBe(value1)
    expect(random.next()).toBe(value2)
  })
})
