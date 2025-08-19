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
