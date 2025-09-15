'use client'

import { useCallback } from 'react'

interface UseTrimmedInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}

interface UseTrimmedInputReturn {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
}

/**
 * Hook para sanitização automática de inputs de texto
 * Remove espaços em branco do início e fim quando o usuário sai do campo
 */
export function useTrimmedInput({
  value,
  onChange,
  onBlur: externalOnBlur
}: UseTrimmedInputProps): UseTrimmedInputReturn {

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const trimmedValue = e.target.value.trim()

    // Só atualiza se o valor realmente mudou após o trim
    if (trimmedValue !== value) {
      onChange(trimmedValue)
    }

    // Chama o onBlur externo se existir
    if (externalOnBlur) {
      externalOnBlur()
    }
  }, [value, onChange, externalOnBlur])

  return {
    value,
    onChange: handleChange,
    onBlur: handleBlur
  }
}

/**
 * Variação do hook para uso com textarea
 */
export function useTrimmedTextarea({
  value,
  onChange,
  onBlur: externalOnBlur
}: UseTrimmedInputProps) {

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    const trimmedValue = e.target.value.trim()

    // Só atualiza se o valor realmente mudou após o trim
    if (trimmedValue !== value) {
      onChange(trimmedValue)
    }

    // Chama o onBlur externo se existir
    if (externalOnBlur) {
      externalOnBlur()
    }
  }, [value, onChange, externalOnBlur])

  return {
    value,
    onChange: handleChange,
    onBlur: handleBlur
  }
}