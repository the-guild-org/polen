/**
 * State management for GraphQL document tooltips
 *
 * Handles hover delays, pinning, and multiple tooltip coordination
 */

import { React } from '#dep/react/index'

export interface TooltipState {
  /** Currently visible tooltip (via hover) */
  hoveredId: string | null
  /** Set of pinned tooltip IDs */
  pinnedIds: Set<string>
  /** ID pending show (waiting for delay) */
  pendingShowId: string | null
  /** ID pending hide (waiting for grace period) */
  pendingHideId: string | null
}

export interface UseTooltipStateOptions {
  /** Delay before showing tooltip on hover (ms) */
  showDelay?: number
  /** Delay before hiding tooltip on mouse leave (ms) */
  hideDelay?: number
  /** Whether to allow multiple pinned tooltips */
  allowMultiplePins?: boolean
}

export interface UseTooltipStateReturn {
  /** Check if a tooltip should be visible */
  isOpen: (id: string) => boolean
  /** Check if a tooltip is pinned */
  isPinned: (id: string) => boolean
  /** Handle hover start */
  onHoverStart: (id: string) => void
  /** Handle hover end */
  onHoverEnd: (id: string) => void
  /** Handle click (toggle pin) */
  onTogglePin: (id: string) => void
  /** Handle tooltip content hover (cancels hide) */
  onTooltipHover: (id: string) => void
  /** Unpin a specific tooltip */
  unpin: (id: string) => void
  /** Unpin all tooltips */
  unpinAll: () => void
}

export const useTooltipState = (options: UseTooltipStateOptions = {}): UseTooltipStateReturn => {
  const {
    showDelay = 300,
    hideDelay = 200,
    allowMultiplePins = true,
  } = options

  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  const [pinnedIds, setPinnedIds] = React.useState<Set<string>>(new Set())
  const [pendingShowId, setPendingShowId] = React.useState<string | null>(null)
  const [pendingHideId, setPendingHideId] = React.useState<string | null>(null)

  // Timer refs
  const showTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const hideTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Clear any pending timers
  const clearTimers = React.useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    setPendingShowId(null)
    setPendingHideId(null)
  }, [])

  // Check if tooltip should be visible
  const isOpen = React.useCallback((id: string): boolean => {
    return hoveredId === id || pinnedIds.has(id)
  }, [hoveredId, pinnedIds])

  // Check if tooltip is pinned
  const isPinned = React.useCallback((id: string): boolean => {
    return pinnedIds.has(id)
  }, [pinnedIds])

  // Handle hover start
  const onHoverStart = React.useCallback((id: string) => {
    // Don't show if already pinned
    if (pinnedIds.has(id)) return

    // Cancel any pending hide for this ID
    if (pendingHideId === id) {
      clearTimeout(hideTimerRef.current!)
      hideTimerRef.current = null
      setPendingHideId(null)
      return
    }

    // Clear any other pending operations
    clearTimers()

    // Schedule show
    setPendingShowId(id)
    showTimerRef.current = setTimeout(() => {
      setHoveredId(id)
      setPendingShowId(null)
    }, showDelay)
  }, [pinnedIds, pendingHideId, clearTimers, showDelay])

  // Handle hover end
  const onHoverEnd = React.useCallback((id: string) => {
    // Don't hide if pinned
    if (pinnedIds.has(id)) return

    // Cancel pending show if still waiting
    if (pendingShowId === id) {
      clearTimeout(showTimerRef.current!)
      showTimerRef.current = null
      setPendingShowId(null)
      return
    }

    // Only hide if currently showing this tooltip
    if (hoveredId === id) {
      setPendingHideId(id)
      hideTimerRef.current = setTimeout(() => {
        // First set hovered to null to trigger close animation
        setHoveredId(null)
        setPendingHideId(null)
      }, hideDelay)
    }
  }, [pinnedIds, pendingShowId, hoveredId, hideDelay])

  // Handle tooltip content hover (cancels hide)
  const onTooltipHover = React.useCallback((id: string) => {
    if (pendingHideId === id) {
      clearTimeout(hideTimerRef.current!)
      hideTimerRef.current = null
      setPendingHideId(null)
    }
  }, [pendingHideId])

  // Toggle pin state
  const onTogglePin = React.useCallback((id: string) => {
    clearTimers()

    setPinnedIds((prev: Set<string>) => {
      const next = new Set(prev)
      if (next.has(id)) {
        // Unpin
        next.delete(id)
        setHoveredId(null) // Also clear hover state
      } else {
        // Pin
        if (!allowMultiplePins) {
          next.clear() // Clear other pins
        }
        next.add(id)
        setHoveredId(null) // Clear hover state since it's now pinned
      }
      return next
    })
  }, [clearTimers, allowMultiplePins])

  // Unpin specific tooltip
  const unpin = React.useCallback((id: string) => {
    setPinnedIds((prev: Set<string>) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // Unpin all tooltips
  const unpinAll = React.useCallback(() => {
    setPinnedIds(new Set())
  }, [])

  return {
    isOpen,
    isPinned,
    onHoverStart,
    onHoverEnd,
    onTogglePin,
    onTooltipHover,
    unpin,
    unpinAll,
  }
}
