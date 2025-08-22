/**
 * Utilitários para formatação de campos
 */

// Remove todos os caracteres não numéricos
export function onlyNumbers(value: string): string {
  return value.replace(/\D/g, '')
}

// Formata CPF: 123.456.789-01
export function formatCPF(value: string): string {
  const numbers = onlyNumbers(value)
  
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
}

// Formata CNPJ: 12.345.678/0001-01
export function formatCNPJ(value: string): string {
  const numbers = onlyNumbers(value)
  
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
}

// Formata documento (CPF ou CNPJ automaticamente)
export function formatDocument(value: string): string {
  const numbers = onlyNumbers(value)
  
  if (numbers.length <= 11) {
    return formatCPF(value)
  } else {
    return formatCNPJ(value)
  }
}

// Formata telefone: (11) 99999-9999 ou (11) 9999-9999
export function formatPhone(value: string): string {
  const numbers = onlyNumbers(value)
  
  if (numbers.length <= 2) return `(${numbers}`
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

// Formata CEP: 12345-678
export function formatCEP(value: string): string {
  const numbers = onlyNumbers(value)
  
  if (numbers.length <= 5) return numbers
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
}

// Validações
export function isValidCPF(cpf: string): boolean {
  const numbers = onlyNumbers(cpf)
  
  if (numbers.length !== 11) return false
  if (/^(\d)\1{10}$/.test(numbers)) return false // Todos os dígitos iguais
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numbers.charAt(9))) return false
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numbers.charAt(10))) return false
  
  return true
}

export function isValidCNPJ(cnpj: string): boolean {
  const numbers = onlyNumbers(cnpj)
  
  if (numbers.length !== 14) return false
  if (/^(\d)\1{13}$/.test(numbers)) return false // Todos os dígitos iguais
  
  // Validação do primeiro dígito verificador
  let sum = 0
  let weight = 2
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(numbers.charAt(i)) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  if (digit1 !== parseInt(numbers.charAt(12))) return false
  
  // Validação do segundo dígito verificador
  sum = 0
  weight = 2
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(numbers.charAt(i)) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder
  if (digit2 !== parseInt(numbers.charAt(13))) return false
  
  return true
}

export function isValidDocument(document: string): boolean {
  const numbers = onlyNumbers(document)
  
  if (numbers.length === 11) {
    return isValidCPF(document)
  } else if (numbers.length === 14) {
    return isValidCNPJ(document)
  }
  
  return false
}

export function isValidPhone(phone: string): boolean {
  const numbers = onlyNumbers(phone)
  return numbers.length >= 10 && numbers.length <= 11
}

// Formata data para exibição: dd/mm/aaaa
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  
  try {
    // Se a data já está no formato YYYY-MM-DD, criar uma data local
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number)
      // Criar data no fuso horário local para evitar problemas de UTC
      const localDate = new Date(year, month - 1, day, 12, 0, 0) // Meio-dia para evitar problemas de fuso
      return localDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
    
    // Para outros formatos, usar o comportamento padrão
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCurrencyInput(value: string): string {
  // Remove tudo exceto números e vírgula
  const cleanValue = value.replace(/[^\d,]/g, '')
  
  // Se não há vírgula, adiciona uma no final
  if (!cleanValue.includes(',')) {
    return cleanValue + ',00'
  }
  
  // Se há vírgula, garante que há pelo menos 2 dígitos após
  const parts = cleanValue.split(',')
  if (parts[1]?.length === 1) {
    return parts[0] + ',' + parts[1] + '0'
  }
  
  return cleanValue
}

export function formatMonthlyFeeInput(value: string): string {
  // Remove tudo exceto números e vírgula
  const cleanValue = value.replace(/[^\d,]/g, '')
  
  // Não adiciona zeros automaticamente - deixa o usuário digitar livremente
  return cleanValue
}

