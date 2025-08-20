import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface LoadMoreButtonProps {
  onClick: () => void
  isLoading: boolean
  hasMore: boolean
  className?: string
}

export function LoadMoreButton({ 
  onClick, 
  isLoading, 
  hasMore, 
  className = "" 
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return null
  }

  return (
    <div className="flex justify-center mt-6">
      <Button
        onClick={onClick}
        disabled={isLoading}
        variant="outline"
        className={`min-w-[200px] ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando...
          </>
        ) : (
          'Carregar Mais'
        )}
      </Button>
    </div>
  )
}

