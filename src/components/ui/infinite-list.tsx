import { ReactNode } from 'react'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface InfiniteListProps {
  children: ReactNode
  onLoadMore: () => void
  hasMore: boolean
  isLoadingMore: boolean
  className?: string
}

export function InfiniteList({
  children,
  onLoadMore,
  hasMore,
  isLoadingMore,
  className = ""
}: InfiniteListProps) {
  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading: isLoadingMore,
    threshold: 200
  })

  return (
    <div className={className}>
      {children}
      
      {/* Elemento de referência para scroll infinito */}
      {hasMore && (
        <div ref={loadMoreRef} className="h-4" />
      )}
    </div>
  )
}
