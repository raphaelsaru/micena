'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTrimmedInput, useTrimmedTextarea } from '@/hooks/useTrimmedInput'
import { cn } from '@/lib/utils'

export interface TrimmedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'> {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}

/**
 * Input component com sanitização automática de espaços em branco
 * Remove espaços do início e fim quando o usuário sai do campo
 */
const TrimmedInput = React.forwardRef<HTMLInputElement, TrimmedInputProps>(
  ({ className, value, onChange, onBlur: externalOnBlur, ...props }, ref) => {
    const inputProps = useTrimmedInput({
      value,
      onChange,
      onBlur: externalOnBlur
    })

    return (
      <Input
        className={cn(className)}
        ref={ref}
        {...props}
        {...inputProps}
      />
    )
  }
)
TrimmedInput.displayName = 'TrimmedInput'

export interface TrimmedTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'onBlur'> {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}

/**
 * Textarea component com sanitização automática de espaços em branco
 * Remove espaços do início e fim quando o usuário sai do campo
 */
const TrimmedTextarea = React.forwardRef<HTMLTextAreaElement, TrimmedTextareaProps>(
  ({ className, value, onChange, onBlur: externalOnBlur, ...props }, ref) => {
    const textareaProps = useTrimmedTextarea({
      value,
      onChange,
      onBlur: externalOnBlur
    })

    return (
      <Textarea
        className={cn(className)}
        ref={ref}
        {...props}
        {...textareaProps}
      />
    )
  }
)
TrimmedTextarea.displayName = 'TrimmedTextarea'

export { TrimmedInput, TrimmedTextarea }