'use client'

import React, { forwardRef, useState, useEffect } from 'react'
import { Input } from './input'

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, placeholder = "0,00", className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')

    // Função para formatar valor como moeda brasileira
    const formatCurrency = (value: string): string => {
      // Remove tudo que não é número
      const numericValue = value.replace(/\D/g, '')
      
      if (numericValue === '') return ''
      
      // Converte para centavos
      const cents = parseInt(numericValue, 10)
      const reais = cents / 100
      
      // Formata com vírgula e duas casas decimais
      return reais.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    // Função para converter valor formatado para número
    const parseCurrency = (formattedValue: string): number => {
      if (!formattedValue) return 0
      
      // Remove pontos e substitui vírgula por ponto para conversão
      const numericString = formattedValue.replace(/\./g, '').replace(',', '.')
      return parseFloat(numericString) || 0
    }

    // Atualiza display quando value muda externamente
    useEffect(() => {
      if (value !== undefined && value !== null) {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
        if (numValue > 0) {
          setDisplayValue(formatCurrency((numValue * 100).toString()))
        } else {
          setDisplayValue('')
        }
      } else {
        setDisplayValue('')
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const formattedValue = formatCurrency(inputValue)
      
      setDisplayValue(formattedValue)
      
      // Cria um novo evento com o valor numérico
      const numericValue = parseCurrency(formattedValue)
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: numericValue.toString()
        }
      } as React.ChangeEvent<HTMLInputElement>
      
      onChange(syntheticEvent)
    }

    const handleBlur = () => {
      // Garante que o valor está formatado corretamente ao sair do campo
      if (displayValue && parseCurrency(displayValue) > 0) {
        setDisplayValue(formatCurrency((parseCurrency(displayValue) * 100).toString()))
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        {...props}
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
