import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router'

interface Entry {
  schema: any
  parent: any | null
  revisions: Array<{ date: string; [key: string]: any }>
}

export const useChangelogScroll = (entries: Entry[]) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentPosition, setCurrentPosition] = useState<{
    version: string
    revision: string
  } | undefined>()
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get version from entry
  const getVersion = (entry: Entry) => {
    if (entry?.schema?.version) {
      const version = entry.schema.version
      // Version might be an object with value property (from Effect Schema)
      return typeof version === 'object' && (version as any).value 
        ? (version as any).value 
        : version
    }
    return 'main'
  }
  
  // Build version map for navigation
  const versionMap = new Map(
    entries.map(entry => [getVersion(entry), entry])
  )
  
  // Find parent version
  const getParentVersion = (version: string) => {
    const entry = versionMap.get(version)
    if (entry?.parent?.version) {
      const parentVer = entry.parent.version
      return typeof parentVer === 'object' && (parentVer as any).value 
        ? (parentVer as any).value 
        : parentVer
    }
    return null
  }
  
  // Find child version
  const getChildVersion = (version: string) => {
    return entries.find(entry => {
      if (entry.parent?.version) {
        const parentVer = entry.parent.version
        const parentVersion = typeof parentVer === 'object' && (parentVer as any).value 
          ? (parentVer as any).value 
          : parentVer
        return parentVersion === version
      }
      return false
    })
  }
  
  // Update URL without triggering navigation
  const updateURL = useCallback((version: string, revision: string) => {
    const newPath = `/changelog/version/${version}/revision/${revision}`
    if (location.pathname !== newPath) {
      // Use replace to avoid cluttering history
      window.history.replaceState(null, '', newPath)
    }
  }, [location.pathname])
  
  // Handle node click from Railway
  const handleNodeClick = useCallback((version: string, revision: string) => {
    const element = document.getElementById(`${version}-${revision}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setCurrentPosition({ version, revision })
      updateURL(version, revision)
    }
  }, [updateURL])
  
  // Handle scroll to detect current revision
  useEffect(() => {
    if (!scrollContainerRef.current) return
    
    // Set up Intersection Observer
    const options = {
      root: scrollContainerRef.current,
      rootMargin: '-40% 0px -40% 0px', // Focus on middle of viewport
      threshold: 0,
    }
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (isScrollingRef.current) return
      
      const visibleEntry = entries.find(entry => entry.isIntersecting)
      if (visibleEntry) {
        const [version, ...dateParts] = visibleEntry.target.id.split('-')
        const revision = dateParts.join('-')
        
        if (version && revision) {
          setCurrentPosition({ version, revision })
          
          // Debounce URL updates
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
          }
          scrollTimeoutRef.current = setTimeout(() => {
            updateURL(version, revision)
          }, 300)
        }
      }
    }, options)
    
    // Observe all revision cards
    entries.forEach(entry => {
      const version = getVersion(entry)
      entry.revisions.forEach(revision => {
        const element = document.getElementById(`${version}-${revision.date}`)
        if (element) {
          observerRef.current?.observe(element)
        }
      })
    })
    
    return () => {
      observerRef.current?.disconnect()
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [entries, updateURL, getVersion])
  
  // Handle version boundary scrolling
  const handleScroll = useCallback(() => {
    if (!currentPosition || !scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const { scrollTop, scrollHeight, clientHeight } = container
    
    const currentEntry = versionMap.get(currentPosition.version)
    if (!currentEntry) return
    
    const currentRevisionIndex = currentEntry.revisions.findIndex(
      r => r.date === currentPosition.revision
    )
    
    // Check if at version boundaries
    const atVersionTop = currentRevisionIndex === 0 && scrollTop < 100
    const atVersionBottom = 
      currentRevisionIndex === currentEntry.revisions.length - 1 && 
      scrollTop + clientHeight > scrollHeight - 100
    
    if (atVersionBottom) {
      // Jump to parent version
      const parentVersion = getParentVersion(currentPosition.version)
      if (parentVersion) {
        const parentEntry = versionMap.get(parentVersion)
        if (parentEntry && parentEntry.revisions.length > 0) {
          isScrollingRef.current = true
          const firstRevision = parentEntry.revisions[0]
          if (firstRevision) {
            handleNodeClick(parentVersion, firstRevision.date)
            setTimeout(() => { isScrollingRef.current = false }, 500)
          }
        }
      }
    } else if (atVersionTop) {
      // Jump to child version
      const childEntry = getChildVersion(currentPosition.version)
      if (childEntry) {
        const childVersion = getVersion(childEntry)
        const lastRevision = childEntry.revisions[childEntry.revisions.length - 1]
        if (lastRevision) {
          isScrollingRef.current = true
          handleNodeClick(childVersion, lastRevision.date)
          setTimeout(() => { isScrollingRef.current = false }, 500)
        }
      }
    }
  }, [currentPosition, versionMap, getParentVersion, getChildVersion, handleNodeClick, getVersion])
  
  // Handle deep linking on mount
  useEffect(() => {
    const pathMatch = location.pathname.match(/\/changelog\/version\/([^\/]+)\/revision\/(.+)/)
    if (pathMatch) {
      const [, version, revision] = pathMatch
      if (version && revision) {
        const element = document.getElementById(`${version}-${revision}`)
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'auto', block: 'center' })
            setCurrentPosition({ version, revision })
          }, 100)
        }
      }
    }
  }, [location.pathname])
  
  return {
    scrollContainerRef,
    currentPosition,
    handleNodeClick,
    handleScroll,
  }
}