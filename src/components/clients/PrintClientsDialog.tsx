'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PrintClientsList } from './PrintClientsList'
import { Client } from '@/types/database'
import { getClients } from '@/lib/clients'

interface PrintClientsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrintClientsDialog({ open, onOpenChange }: PrintClientsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [clientsToPrint, setClientsToPrint] = useState<Client[] | null>(null)
  const printTriggered = useRef(false)

  useEffect(() => {
    if (!open) {
      setClientsToPrint(null)
      printTriggered.current = false
      return
    }

    const loadClients = async () => {
      try {
        setIsLoading(true)
        const allClients = await getClients()
        if (allClients.length === 0) {
          alert('Nenhum cliente encontrado para impressão.')
          onOpenChange(false)
          return
        }
        setClientsToPrint(allClients)
      } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error)
        alert('Erro ao carregar clientes para impressão.')
        onOpenChange(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadClients()
  }, [open, onOpenChange])

  // Acionar impressão após clientes carregados e renderizados
  useEffect(() => {
    if (!clientsToPrint || printTriggered.current) return
    printTriggered.current = true

    let hiddenElements: HTMLElement[] = []

    const restoreDOM = () => {
      const portal = document.getElementById('clients-print-portal')
      if (portal) portal.style.display = ''
      hiddenElements.forEach(el => { el.style.display = '' })
      hiddenElements = []
    }

    const cleanup = () => {
      restoreDOM()
      setClientsToPrint(null)
      onOpenChange(false)
    }

    setTimeout(() => {
      // Força visibilidade via JS (mais confiável no mobile do que @media print)
      const portal = document.getElementById('clients-print-portal')
      if (portal) {
        portal.style.display = 'block'
        // Esconde todos os outros filhos do body
        hiddenElements = Array.from(document.body.children)
          .filter((el): el is HTMLElement => el instanceof HTMLElement && el !== portal)
        hiddenElements.forEach(el => { el.style.display = 'none' })
      }

      let cleanupCalled = false
      const safeCleanup = () => {
        if (cleanupCalled) return
        cleanupCalled = true
        cleanup()
      }

      window.addEventListener('afterprint', safeCleanup, { once: true })
      window.print()
      // Fallback: se afterprint não disparar (alguns browsers mobile)
      setTimeout(safeCleanup, 5000)
    }, 500)
  }, [clientsToPrint, onOpenChange])

  if (open && isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando todos os clientes para impressão...</p>
        </div>
      </div>
    )
  }

  if (!clientsToPrint) return null

  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        #clients-print-portal {
          display: none;
        }
        @media print {
          #clients-print-portal {
            display: block !important;
          }
        }
      `}} />
      <div id="clients-print-portal">
        <PrintClientsList
          clients={clientsToPrint}
          printColor="#1f2937"
          printColumns="1"
          printFont="Arial"
          printFontSize="12px"
        />
      </div>
    </>,
    document.body
  )
}
