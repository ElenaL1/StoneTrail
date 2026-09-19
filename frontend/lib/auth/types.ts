export type UserRole = "user" | "professional" | "moderator" | "editor" | "admin"

export const ACTIVITY_TYPES = [
  "Архитектор",
  "Дизайнер",
  "Камнеобработчик",
  "Поставщик",
  "Производитель",
  "Строительная компания",
  "Монтажная компания",
  "Реставратор",
  "Другое",
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export type PublicUser = {
  id: string
  email: string
  nickname: string
  /** Публичное имя в сообществе — то же, что nickname. Нужно существующему UI. */
  name: string
  firstName: string
  lastName: string
  company: string
  position: string
  activityType: string
  avatar: string
  country: string
  city: string
  bio: string
  website: string
  phone: string
  emailVerified: boolean
  role: UserRole
  marketingConsent: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export type RegisterInput = {
  nickname: string
  email: string
  password: string
  termsAccepted: boolean
  marketingConsent: boolean
}

export type LoginInput = {
  email: string
  password: string
}

export type ProfileUpdateInput = {
  nickname: string
  firstName: string
  lastName: string
  company: string
  position: string
  activityType: string
  country: string
  city: string
  bio: string
  website: string
  phone: string
  avatar?: string
  marketingConsent: boolean
}

export type AuthErrorCode =
  | "email_taken"
  | "nickname_taken"
  | "invalid_credentials"
  | "rate_limited"
  | "unverified"
  | "token_expired"
  | "token_used"
  | "token_invalid"
  | "network"
  | "validation"

export type AuthFieldErrors = Partial<Record<string, string>>

export type AuthFailure = {
  ok: false
  message: string
  fieldErrors?: AuthFieldErrors
  code?: AuthErrorCode
  retryAfterSeconds?: number
}

export type AuthSuccess<T> = {
  ok: true
  data: T
}

export type AuthResult<T = PublicUser> = AuthSuccess<T> | AuthFailure

export type ResendResult = {
  resendAvailableAt: number
  demoVerificationPath?: string | null
}

export type PasswordResetRequestResult = {
  submitted: true
  demoResetPath?: string | null
}

export type PasswordResetResult = {
  completed: true
}

export type MockInboxItem = {
  type: "verify" | "reset"
  email: string
  path: string
  createdAt: string
}
