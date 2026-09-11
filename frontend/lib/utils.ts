import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(value: string): string {
  if (!value) return ''
  
  // Remove non-digits
  let digits = value.replace(/\D/g, '')
  
  // Ensure starts with 7
  if (digits.length > 0 && digits[0] !== '7') {
    digits = '7' + digits
  }
  
  if (digits.length === 0) return ''
  
  const len = digits.length
  if (len === 1) return `+7`
  if (len <= 4) return `+7 (${digits.slice(1)}`
  if (len <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`
  if (len <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}
