import { ReactNode } from 'react'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { LoadMoreButton } from './load-more-button'

interface InfiniteListProps {
  children: ReactNode
  onLoadMore: () => void
  hasMore: boolean
  isLoadingMore: boolean
  enableInfiniteScroll?: boolean
  className?: string
}

export function InfiniteList({
  children,
  onLoadMore,
  hasMore,
  isLoadingMore,
  enableInfiniteScroll = false,
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
      {enableInfiniteScroll && hasMore && (
        <div ref={loadMoreRef} className="h-4" />
      )}
      
      {/* Botão "Carregar Mais" (sempre visível se não for scroll infinito) */}
      {!enableInfiniteScroll && (
        <LoadMoreButton
          onClick={onLoadMore}
          isLoading={isLoadingMore}
          hasMore={hasMore}
        />
      )}
    </div>
  )
}
