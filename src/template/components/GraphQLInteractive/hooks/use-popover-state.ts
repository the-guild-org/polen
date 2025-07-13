/**
 * State management for GraphQL token popovers
 *
 * Handles hover delays, pinning, and multiple popover coordination
 */

import { React as ReactHooks } from '#dep/react/index'

export interface PopoverState {
  /** Currently visible popover (via hover) */
  hoveredId: string | null
  /** Set of pinned popover IDs */
  pinnedIds: Set<string>
  /** ID pending show (waiting for delay) */
  pendingShowId: string | null
  /** ID pending hide (waiting for grace period) */
  pendingHideId: string | null
}

export interface UsePopoverStateOptions {
  /** Delay before showing popover on hover (ms) */
  showDelay?: number
  /** Delay before hiding popover on mouse leave (ms) */
  hideDelay?: number
  /** Whether to allow multiple pinned popovers */
  allowMultiplePins?: boolean
}

export interface UsePopoverStateReturn {
  /** Check if a popover should be visible */
  isOpen: (id: string) => boolean
  /** Check if a popover is pinned */
  isPinned: (id: string) => boolean
  /** Handle hover start */
  onHoverStart: (id: string) => void
  /** Handle hover end */
  onHoverEnd: (id: string) => void
  /** Handle click (toggle pin) */
  onTogglePin: (id: string) => void
  /** Handle popover content hover (cancels hide) */
  onPopoverHover: (id: string) => void
  /** Handle popover content leave (starts hide timer) */
  onPopoverLeave: (id: string) => void
  /** Unpin a specific popover */
  unpin: (id: string) => void
  /** Unpin all popovers */
  unpinAll: () => void
}

export const usePopoverState = (options: UsePopoverStateOptions = {}): UsePopoverStateReturn => {
  const {
    showDelay = 300,
    hideDelay = 200,
    allowMultiplePins = true,
  } = options

  const [hoveredId, setHoveredId] = ReactHooks.useState<string | null>(null)
  const [pinnedIds, setPinnedIds] = ReactHooks.useState<Set<string>>(new Set())
  const [pendingShowId, setPendingShowId] = ReactHooks.useState<string | null>(null)
  const [pendingHideId, setPendingHideId] = ReactHooks.useState<string | null>(null)

  // Timer refs
  const showTimerRef = ReactHooks.useRef<NodeJS.Timeout | null>(null)
  const hideTimerRef = ReactHooks.useRef<NodeJS.Timeout | null>(null)

  // Clear any pending timers
  const clearTimers = ReactHooks.useCallback(() => {
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

  // Check if popover should be visible
  const isOpen = ReactHooks.useCallback((id: string): boolean => {
    return hoveredId === id || pinnedIds.has(id)
  }, [hoveredId, pinnedIds])

  // Check if popover is pinned
  const isPinned = ReactHooks.useCallback((id: string): boolean => {
    return pinnedIds.has(id)
  }, [pinnedIds])

  // Handle hover start
  const onHoverStart = ReactHooks.useCallback((id: string) => {
    // Don't show if already pinned
    if (pinnedIds.has(id)) return

    // Cancel any pending hide for this ID
    if (pendingHideId === id) {
      clearTimeout(hideTimerRef.current!)
      hideTimerRef.current = null
      setPendingHideId(null)
      return
    }

    // Clear any existing timers
    clearTimers()

    // Set pending show
    setPendingShowId(id)

    // Start show timer
    showTimerRef.current = setTimeout(() => {
      setHoveredId(id)
      setPendingShowId(null)
      showTimerRef.current = null
    }, showDelay)
  }, [pinnedIds, pendingHideId, clearTimers, showDelay])

  // Handle hover end
  const onHoverEnd = ReactHooks.useCallback((id: string) => {
    // Don't hide if pinned
    if (pinnedIds.has(id)) return

    // Cancel any pending show
    if (pendingShowId === id) {
      clearTimeout(showTimerRef.current!)
      showTimerRef.current = null
      setPendingShowId(null)
      return
    }

    // Only hide if currently hovered
    if (hoveredId === id) {
      setPendingHideId(id)

      hideTimerRef.current = setTimeout(() => {
        setHoveredId(null)
        setPendingHideId(null)
        hideTimerRef.current = null
      }, hideDelay)
    }
  }, [pinnedIds, pendingShowId, hoveredId, hideDelay])

  // Handle popover content hover (cancels hide)
  const onPopoverHover = ReactHooks.useCallback((id: string) => {
    if (pendingHideId === id) {
      clearTimeout(hideTimerRef.current!)
      hideTimerRef.current = null
      setPendingHideId(null)
    }
  }, [pendingHideId])

  // Handle popover content leave (starts hide timer)
  const onPopoverLeave = ReactHooks.useCallback((id: string) => {
    // Don't hide if pinned
    if (pinnedIds.has(id)) return

    // Only hide if currently hovered
    if (hoveredId === id) {
      setPendingHideId(id)

      hideTimerRef.current = setTimeout(() => {
        setHoveredId(null)
        setPendingHideId(null)
        hideTimerRef.current = null
      }, hideDelay)
    }
  }, [pinnedIds, hoveredId, hideDelay])

  // Toggle pin state
  const onTogglePin = ReactHooks.useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev)

      if (next.has(id)) {
        // Unpin
        next.delete(id)
      } else {
        // Pin
        if (!allowMultiplePins) {
          // Clear other pins if multiple not allowed
          next.clear()
        }
        next.add(id)

        // Clear any hover state for this ID
        if (hoveredId === id) {
          setHoveredId(null)
        }

        // Clear any pending operations
        if (pendingShowId === id) {
          clearTimeout(showTimerRef.current!)
          showTimerRef.current = null
          setPendingShowId(null)
        }
        if (pendingHideId === id) {
          clearTimeout(hideTimerRef.current!)
          hideTimerRef.current = null
          setPendingHideId(null)
        }
      }

      return next
    })
  }, [allowMultiplePins, hoveredId, pendingShowId, pendingHideId])

  // Unpin specific popover
  const unpin = ReactHooks.useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // Unpin all popovers
  const unpinAll = ReactHooks.useCallback(() => {
    setPinnedIds(new Set())
  }, [])

  // Cleanup timers on unmount and when dependencies change
  ReactHooks.useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  // Clear timers when delay options change to prevent stale timers
  ReactHooks.useEffect(() => {
    clearTimers()
  }, [showDelay, hideDelay, clearTimers])

  return {
    isOpen,
    isPinned,
    onHoverStart,
    onHoverEnd,
    onTogglePin,
    onPopoverHover,
    onPopoverLeave,
    unpin,
    unpinAll,
  }
}
