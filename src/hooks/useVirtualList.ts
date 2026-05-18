import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'

export type VirtualListKey = string | number
export type VirtualListAlign = 'start' | 'center' | 'end'

export interface UseVirtualListOptions<T> {
  items: T[]
  itemHeight: number
  overscan?: number
  enabled?: boolean
  getItemKey?: (item: T, index: number) => VirtualListKey
}

export interface VirtualListItem<T> {
  item: T
  index: number
  key: VirtualListKey
  start: number
  size: number
}

export interface UseVirtualListReturn<T> {
  containerRef: RefObject<HTMLDivElement | null>
  virtualItems: VirtualListItem<T>[]
  totalSize: number
  scrollToIndex: (index: number, align?: VirtualListAlign) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function useVirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  enabled = true,
  getItemKey,
}: UseVirtualListOptions<T>): UseVirtualListReturn<T> {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const safeItemHeight = Math.max(1, itemHeight)
  const safeOverscan = Math.max(0, overscan)
  const totalSize = items.length * safeItemHeight

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    const updateViewportHeight = () => {
      setViewportHeight(container.clientHeight)
    }

    updateViewportHeight()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(updateViewportHeight)
    observer.observe(container)

    return () => observer.disconnect()
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    handleScroll()
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => container.removeEventListener('scroll', handleScroll)
  }, [enabled])

  const virtualItems = useMemo(() => {
    const listItems: VirtualListItem<T>[] = []

    if (!enabled) {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index]
        if (item === undefined) continue

        listItems.push({
          item,
          index,
          key: getItemKey?.(item, index) ?? index,
          start: index * safeItemHeight,
          size: safeItemHeight,
        })
      }

      return listItems
    }

    const startIndex = clamp(
      Math.floor(scrollTop / safeItemHeight) - safeOverscan,
      0,
      items.length,
    )
    const endIndex = clamp(
      Math.ceil((scrollTop + viewportHeight) / safeItemHeight) + safeOverscan,
      startIndex,
      items.length,
    )

    for (let index = startIndex; index < endIndex; index += 1) {
      const item = items[index]
      if (item === undefined) continue

      listItems.push({
        item,
        index,
        key: getItemKey?.(item, index) ?? index,
        start: index * safeItemHeight,
        size: safeItemHeight,
      })
    }

    return listItems
  }, [
    enabled,
    getItemKey,
    items,
    safeItemHeight,
    safeOverscan,
    scrollTop,
    viewportHeight,
  ])

  const scrollToIndex = useCallback(
    (index: number, align: VirtualListAlign = 'start') => {
      const container = containerRef.current
      if (!container) return

      const clampedIndex = clamp(index, 0, Math.max(0, items.length - 1))
      const itemStart = clampedIndex * safeItemHeight
      const itemEnd = itemStart + safeItemHeight
      const maxScrollTop = Math.max(0, totalSize - container.clientHeight)
      let nextScrollTop = itemStart

      if (align === 'center') {
        nextScrollTop =
          itemStart - (container.clientHeight - safeItemHeight) / 2
      }

      if (align === 'end') {
        nextScrollTop = itemEnd - container.clientHeight
      }

      container.scrollTo({
        top: clamp(nextScrollTop, 0, maxScrollTop),
        behavior: 'smooth',
      })
    },
    [items.length, safeItemHeight, totalSize],
  )

  return {
    containerRef,
    virtualItems,
    totalSize,
    scrollToIndex,
  }
}
