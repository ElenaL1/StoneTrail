import { validateEmail } from "@/lib/utils"
import {
  AUTH_MESSAGES,
  NAME_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/auth/constants"
import type { AuthFieldErrors, ProfileUpdateInput, RegisterInput } from "@/lib/auth/types"

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function hasLetter(value: string): boolean {
  return /[A-Za-zА-Яа-яЁё]/.test(value)
}

export function hasDigit(value: string): boolean {
  return /\d/.test(value)
}

export type PasswordStrength = "empty" | "weak" | "medium" | "strong"

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "empty"
  const longEnough = password.length >= PASSWORD_MIN_LENGTH
  const letter = hasLetter(password)
  const digit = hasDigit(password)
  if (!longEnough) return "weak"
  if (letter && digit && password.length >= 12) return "strong"
  if (letter && digit) return "medium"
  return "weak"
}

export function validatePersonName(
  value: string,
  field: "firstName" | "lastName" | "nickname",
  required = true,
): string | undefined {
  const trimmed = value.trim()
  if (field === "nickname") {
    if (!trimmed) return AUTH_MESSAGES.nicknameRequired
    if (trimmed.length < NAME_MIN_LENGTH) return AUTH_MESSAGES.nicknameMin
    return undefined
  }
  if (field === "firstName") {
    if (!trimmed) return required ? AUTH_MESSAGES.firstNameRequired : undefined
    if (trimmed.length < NAME_MIN_LENGTH) return AUTH_MESSAGES.firstNameMin
    return undefined
  }
  if (!trimmed) return required ? AUTH_MESSAGES.lastNameRequired : undefined
  if (trimmed.length < NAME_MIN_LENGTH) return AUTH_MESSAGES.lastNameMin
  return undefined
}

export function validateEmailValue(email: string, required = true): string | undefined {
  const normalized = normalizeEmail(email)
  if (!normalized) return required ? AUTH_MESSAGES.emailRequired : undefined
  if (!validateEmail(normalized)) return AUTH_MESSAGES.emailInvalid
  return undefined
}

export function validatePassword(password: string): string | undefined {
  if (!password) return AUTH_MESSAGES.passwordRequired
  if (password.length < PASSWORD_MIN_LENGTH) return AUTH_MESSAGES.passwordMin
  if (!hasLetter(password)) return AUTH_MESSAGES.passwordLetter
  if (!hasDigit(password)) return AUTH_MESSAGES.passwordDigit
  return undefined
}

export function validatePasswordConfirmation(password: string, confirmPassword: string): string | undefined {
  if (confirmPassword !== password) return AUTH_MESSAGES.passwordMismatch
  return undefined
}

export function validateWebsite(website: string): string | undefined {
  const value = website.trim()
  if (!value) return undefined
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
    const url = new URL(withProtocol)
    if (!["http:", "https:"].includes(url.protocol)) return AUTH_MESSAGES.websiteInvalid
    return undefined
  } catch {
    return AUTH_MESSAGES.websiteInvalid
  }
}

export function normalizeWebsite(website: string): string {
  const value = website.trim()
  if (!value) return ""
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

export function validateRegisterInput(input: RegisterInput): AuthFieldErrors {
  const errors: AuthFieldErrors = {}
  const nickname = validatePersonName(input.nickname, "nickname")
  const email = validateEmailValue(input.email)
  const password = validatePassword(input.password)

  if (nickname) errors.nickname = nickname
  if (email) errors.email = email
  if (password) errors.password = password
  if (!input.termsAccepted) errors.termsAccepted = AUTH_MESSAGES.termsRequired
  return errors
}

export function validateProfileInput(input: ProfileUpdateInput): AuthFieldErrors {
  const errors: AuthFieldErrors = {}
  const nickname = validatePersonName(input.nickname, "nickname")
  const firstName = validatePersonName(input.firstName, "firstName", false)
  const lastName = validatePersonName(input.lastName, "lastName", false)
  const website = validateWebsite(input.website)

  if (nickname) errors.nickname = nickname
  if (firstName) errors.firstName = firstName
  if (lastName) errors.lastName = lastName
  if (website) errors.website = website
  return errors
}

export function firstFieldError(errors: AuthFieldErrors): string | undefined {
  return Object.values(errors).find(Boolean)
}
