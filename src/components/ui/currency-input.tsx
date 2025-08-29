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
  ({ value, onChange, placeholder = "0,00 ou 0.00", className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    // Função para limpar entrada, permitindo números, ponto e vírgula
    const cleanInput = (value: string): string => {
      // Remove tudo que não é número, ponto ou vírgula
      let cleaned = value.replace(/[^\d.,]/g, '')
      
      // Converte ponto para vírgula para padronizar
      cleaned = cleaned.replace(/\./g, ',')
      
      // Garante apenas uma vírgula
      const commaIndex = cleaned.indexOf(',')
      if (commaIndex !== -1) {
        const beforeComma = cleaned.substring(0, commaIndex)
        const afterComma = cleaned.substring(commaIndex + 1).replace(/,/g, '').substring(0, 2)
        cleaned = beforeComma + ',' + afterComma
      }
      
      return cleaned
    }

    // Função para formatar valor como moeda brasileira (aceita ponto e vírgula)
    const formatCurrency = (value: string): string => {
      const cleanValue = cleanInput(value)
      
      if (cleanValue === '') return ''
      
      // Se tem vírgula (convertida do ponto), separa parte inteira e decimal
      if (cleanValue.includes(',')) {
        const parts = cleanValue.split(',')
        const integerPart = parts[0] || '0'
        const decimalPart = parts[1] || '00'
        
        const reais = parseFloat(`${integerPart}.${decimalPart.padEnd(2, '0')}`)
        return reais.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      } else {
        // Sem vírgula, trata como reais inteiros
        const reais = parseInt(cleanValue, 10)
        return reais.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      }
    }

    // Função para converter valor formatado para número
    const parseCurrency = (formattedValue: string): number => {
      if (!formattedValue) return 0
      
      // Remove pontos de milhares e substitui vírgula decimal por ponto para conversão
      const numericString = formattedValue.replace(/\./g, '').replace(',', '.')
      return parseFloat(numericString) || 0
    }

      // Atualiza display quando value muda externamente
  useEffect(() => {
    if (value !== undefined && value !== null) {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
      if (numValue > 0) {
        setDisplayValue(numValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }))
      } else {
        setDisplayValue('')
      }
    } else {
      setDisplayValue('')
    }
  }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const cleanedValue = cleanInput(inputValue)
      
      setIsTyping(true)
      setDisplayValue(cleanedValue)
      
      // Não envia o valor para o componente pai durante a digitação
      // Só envia quando o campo perde o foco (onBlur)
    }

    const handleBlur = () => {
      setIsTyping(false)
      
      // Formata o valor quando sai do campo
      if (displayValue) {
        const formattedValue = formatCurrency(displayValue)
        setDisplayValue(formattedValue)
        
        // Envia o valor numérico para o componente pai
        let numericValue = 0
        if (displayValue) {
          if (displayValue.includes(',')) {
            const parts = displayValue.split(',')
            const integerPart = parts[0] || '0'
            const decimalPart = parts[1] || '00'
            numericValue = parseFloat(`${integerPart}.${decimalPart.padEnd(2, '0')}`)
          } else {
            numericValue = parseInt(displayValue, 10) || 0
          }
        }
        
        const syntheticEvent = {
          target: {
            value: numericValue.toString()
          }
        } as React.ChangeEvent<HTMLInputElement>
        
        onChange(syntheticEvent)
      }
    }

    const handleFocus = () => {
      setIsTyping(true)
      
      // Remove formatação quando entra no campo para permitir edição
      if (displayValue) {
        const numericValue = parseCurrency(displayValue)
        if (numericValue > 0) {
          // Converte de volta para formato de entrada
          if (numericValue % 1 === 0) {
            // Número inteiro
            setDisplayValue(numericValue.toString())
          } else {
            // Número com decimais
            setDisplayValue(numericValue.toString().replace('.', ','))
          }
        }
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={className}
        {...props}
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
