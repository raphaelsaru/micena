import { useState, useEffect, useCallback, useRef } from 'react'
import { getLastPrice, insertPriceHistory } from '@/lib/services'
import { LastPriceResult } from '@/types/database'

interface PriceCache {
  [key: string]: {
    price: LastPriceResult | null
    timestamp: number
  }
}

interface UsePriceHistoryReturn {
  getLastPriceForItem: (itemType: 'service' | 'material', itemId: string) => Promise<LastPriceResult | null>
  insertPriceForItem: (itemType: 'service' | 'material', itemId: string, price: number) => Promise<void>
  clearCache: () => void
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
const DEBOUNCE_DELAY = 300 // 300ms

export function usePriceHistory(): UsePriceHistoryReturn {
  const [priceCache, setPriceCache] = useState<PriceCache>({})
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({})

  // Função para gerar chave do cache
  const getCacheKey = (itemType: string, itemId: string) => `${itemType}:${itemId}`

  // Função para verificar se o cache ainda é válido
  const isCacheValid = (timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION
  }

  // Função para buscar último preço com cache
  const getLastPriceForItem = useCallback(async (
    itemType: 'service' | 'material',
    itemId: string
  ): Promise<LastPriceResult | null> => {
    const cacheKey = getCacheKey(itemType, itemId)
    const cached = priceCache[cacheKey]

    // Se temos cache válido, retornar do cache
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.price
    }

    // Limpar timer de debounce se existir
    if (debounceTimers.current[cacheKey]) {
      clearTimeout(debounceTimers.current[cacheKey])
    }

    // Aplicar debounce
    return new Promise((resolve) => {
      debounceTimers.current[cacheKey] = setTimeout(async () => {
        try {
          const price = await getLastPrice(itemType, itemId)
          
          // Atualizar cache
          setPriceCache(prev => ({
            ...prev,
            [cacheKey]: {
              price,
              timestamp: Date.now()
            }
          }))

          resolve(price)
        } catch (error) {
          console.error('Erro ao buscar último preço:', error)
          resolve(null)
        }
      }, DEBOUNCE_DELAY)
    })
  }, [priceCache])

  // Função para inserir preço no histórico
  const insertPriceForItem = useCallback(async (
    itemType: 'service' | 'material',
    itemId: string,
    price: number
  ): Promise<void> => {
    try {
      await insertPriceHistory(itemType, itemId, price)
      
      // Atualizar cache com o novo preço
      const cacheKey = getCacheKey(itemType, itemId)
      setPriceCache(prev => ({
        ...prev,
        [cacheKey]: {
          price: {
            price_numeric: price,
            created_at: new Date().toISOString()
          },
          timestamp: Date.now()
        }
      }))
    } catch (error) {
      console.error('Erro ao inserir preço no histórico:', error)
      throw error
    }
  }, [])

  // Função para limpar cache
  const clearCache = useCallback(() => {
    setPriceCache({})
    
    // Limpar todos os timers de debounce
    Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer))
    debounceTimers.current = {}
  }, [])

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer))
    }
  }, [])

  return {
    getLastPriceForItem,
    insertPriceForItem,
    clearCache
  }
}
