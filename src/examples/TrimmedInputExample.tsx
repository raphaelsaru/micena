// Exemplo de uso dos componentes com sanitização automática
// Este arquivo é apenas para documentação e pode ser removido

import { useState } from 'react'
import { TrimmedInput, TrimmedTextarea } from '@/components/ui/trimmed-input'
import { useTrimmedInput } from '@/hooks/useTrimmedInput'

export function TrimmedInputExample() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [customInput, setCustomInput] = useState('')

  // Exemplo 1: Usando o componente TrimmedInput diretamente
  const handleNameChange = (value: string) => {
    setName(value)
    console.log('Nome:', value) // Será automaticamente trimmed no onBlur
  }

  // Exemplo 2: Usando o componente TrimmedTextarea
  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    console.log('Descrição:', value) // Será automaticamente trimmed no onBlur
  }

  // Exemplo 3: Usando o hook useTrimmedInput com input customizado
  const customInputProps = useTrimmedInput({
    value: customInput,
    onChange: setCustomInput,
    onBlur: () => console.log('Input customizado perdeu o foco')
  })

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Exemplos de Sanitização Automática</h2>

      {/* Exemplo 1: TrimmedInput */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Nome (TrimmedInput)</label>
        <TrimmedInput
          placeholder="Digite seu nome (espaços serão removidos automaticamente)"
          value={name}
          onChange={handleNameChange}
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Valor atual: "{name}" (length: {name.length})
        </p>
      </div>

      {/* Exemplo 2: TrimmedTextarea */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Descrição (TrimmedTextarea)</label>
        <TrimmedTextarea
          placeholder="Digite uma descrição (espaços no início e fim serão removidos)"
          value={description}
          onChange={handleDescriptionChange}
          rows={3}
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Valor atual: "{description}" (length: {description.length})
        </p>
      </div>

      {/* Exemplo 3: Hook customizado */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Input Customizado (useTrimmedInput hook)</label>
        <input
          type="text"
          placeholder="Usando o hook useTrimmedInput"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          {...customInputProps}
        />
        <p className="text-xs text-gray-500">
          Valor atual: "{customInput}" (length: {customInput.length})
        </p>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Como funciona:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Digite texto com espaços no início ou fim</li>
          <li>• Clique fora do campo (evento onBlur)</li>
          <li>• Os espaços em branco serão automaticamente removidos</li>
          <li>• O valor é atualizado apenas se realmente houver mudança</li>
        </ul>
      </div>
    </div>
  )
}