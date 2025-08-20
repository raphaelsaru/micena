import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza texto removendo acentos e convertendo para minúsculas
 * Exemplo: "João" -> "joao", "São Paulo" -> "sao paulo"
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Formata um número para sempre ter pelo menos 2 dígitos, adicionando zero à esquerda se necessário
 * @param num - O número a ser formatado
 * @returns O número formatado como string com zero à esquerda se necessário
 */
export function formatRouteNumber(num: number): string {
  return num.toString().padStart(2, '0')
}

/**
 * Converte uma data para o formato YYYY-MM-DD preservando o fuso horário local
 * Esta função resolve o problema de datas que aparecem com um dia a menos
 * @param dateString - String de data no formato YYYY-MM-DD
 * @returns String de data no formato YYYY-MM-DD sem conversão de fuso horário
 */
export function formatDateForDatabase(dateString: string): string {
  if (!dateString) return ''
  
  // Criar uma data no fuso horário local (sem conversão UTC)
  const [year, month, day] = dateString.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  
  // Formatar para YYYY-MM-DD preservando o dia original
  const formattedYear = localDate.getFullYear()
  const formattedMonth = String(localDate.getMonth() + 1).padStart(2, '0')
  const formattedDay = String(localDate.getDate()).padStart(2, '0')
  
  return `${formattedYear}-${formattedMonth}-${formattedDay}`
}

/**
 * Converte uma data do banco para exibição no formato local
 * @param dateString - String de data do banco no formato YYYY-MM-DD
 * @returns String de data formatada para exibição
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Converte uma data do banco para o formato HTML input date (YYYY-MM-DD)
 * Esta função resolve o problema de fuso horário ao carregar datas do banco
 * @param dateString - String de data do banco
 * @returns String de data no formato YYYY-MM-DD para inputs HTML
 */
export function formatDateForInput(dateString: string): string {
  if (!dateString) return ''
  
  // Se a data já está no formato correto, retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }
  
  // Se a data tem informações de hora, extrair apenas a data
  if (dateString.includes('T')) {
    return dateString.split('T')[0]
  }
  
  // Tentar parsear a data e formatar
  try {
    const date = new Date(dateString + 'T00:00:00') // Adicionar hora para evitar problemas de fuso
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  } catch {
    return dateString
  }
}
