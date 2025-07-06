/**
 * Unit tests for tooltip state management hook
 *
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTooltipState } from './use-tooltip-state.js'

describe('useTooltipState', () => {
  it('shows tooltip after hover delay', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTooltipState({ showDelay: 300 }))

    act(() => {
      result.current.onHoverStart('field-1')
    })
    expect(result.current.isOpen('field-1')).toBe(false)

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.isOpen('field-1')).toBe(true)
    vi.useRealTimers()
  })

  it('hides tooltip after hover end delay', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTooltipState())

    // Show tooltip
    act(() => {
      result.current.onHoverStart('field-1')
      vi.advanceTimersByTime(300)
    })

    // Trigger hide
    act(() => {
      result.current.onHoverEnd('field-1')
    })
    expect(result.current.isOpen('field-1')).toBe(true) // Still open during delay

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.isOpen('field-1')).toBe(false)
    vi.useRealTimers()
  })

  it('pins and unpins tooltip on toggle', () => {
    const { result } = renderHook(() => useTooltipState())

    act(() => {
      result.current.onTogglePin('field-1')
    })
    expect(result.current.isPinned('field-1')).toBe(true)

    act(() => {
      result.current.onTogglePin('field-1')
    })
    expect(result.current.isPinned('field-1')).toBe(false)
  })

  it('allows multiple pins when enabled', () => {
    const { result } = renderHook(() => useTooltipState())

    act(() => {
      result.current.onTogglePin('field-1')
      result.current.onTogglePin('field-2')
    })

    expect(result.current.isPinned('field-1')).toBe(true)
    expect(result.current.isPinned('field-2')).toBe(true)
  })
})
