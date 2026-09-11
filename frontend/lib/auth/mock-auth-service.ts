import {
  AUTH_MESSAGES,
  AVATAR_MAX_BYTES,
  FORGOT_MAX_ATTEMPTS,
  FORGOT_WINDOW_MS,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  MOCK_NETWORK_DELAY_MS,
  REGISTER_MAX_ATTEMPTS,
  REGISTER_WINDOW_MS,
  RESEND_COOLDOWN_MS,
  RESET_TOKEN_TTL_MS,
  SESSION_TTL_MS,
  STORAGE_KEYS,
  VERIFY_TOKEN_TTL_MS,
} from "@/lib/auth/constants"
import { createId, hashPassword, randomToken, sha256, verifyPassword } from "@/lib/auth/crypto"
import type {
  AuthFailure,
  AuthResult,
  LoginInput,
  MockInboxItem,
  PasswordResetRequestResult,
  PasswordResetResult,
  ProfileUpdateInput,
  PublicUser,
  RegisterInput,
  ResendResult,
  UserRole,
} from "@/lib/auth/types"
import {
  firstFieldError,
  normalizeEmail,
  normalizeWebsite,
  validateEmailValue,
  validatePassword,
  validatePasswordConfirmation,
  validateProfileInput,
  validateRegisterInput,
} from "@/lib/auth/validation"

type StoredUser = PublicUser & {
  passwordHash: string
}

type SessionRecord = {
  userId: string
  createdAt: number
}

type TokenRecord = {
  id: string
  type: "verify" | "reset"
  userId: string
  tokenHash: string
  expiresAt: number
  usedAt: number | null
}

type RateBucket = {
  count: number
  windowStart: number
  lockedUntil?: number
}

type Store = {
  users: StoredUser[]
  session: SessionRecord | null
  tokens: TokenRecord[]
  rate: Record<string, RateBucket>
  inbox: MockInboxItem | null
}

const emptyStore = (): Store => ({
  users: [],
  session: null,
  tokens: [],
  rate: {},
  inbox: null,
})

function delay(ms = MOCK_NETWORK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function fail(partial: Omit<AuthFailure, "ok">): AuthFailure {
  return { ok: false, ...partial }
}

function toPublicUser(user: StoredUser): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user
  return {
    ...publicUser,
    name: publicUser.nickname,
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function assertOnline() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw Object.assign(new Error("offline"), { code: "network" as const })
  }
}

function toAuthFailure(error: unknown): AuthFailure {
  if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "network") {
    return fail({ message: AUTH_MESSAGES.network, code: "network" })
  }
  return fail({ message: AUTH_MESSAGES.server })
}

function now() {
  return Date.now()
}

function checkRate(store: Store, key: string, max: number, windowMs: number): number | null {
  const bucket = store.rate[key]
  const current = now()
  if (!bucket) return null
  if (bucket.lockedUntil && bucket.lockedUntil > current) {
    return Math.ceil((bucket.lockedUntil - current) / 1000)
  }
  if (current - bucket.windowStart > windowMs) {
    delete store.rate[key]
    return null
  }
  if (bucket.count >= max) {
    const lockedUntil = bucket.windowStart + windowMs
    store.rate[key] = { ...bucket, lockedUntil }
    return Math.ceil((lockedUntil - current) / 1000)
  }
  return null
}

function hitRate(store: Store, key: string, max: number, windowMs: number) {
  const current = now()
  const bucket = store.rate[key]
  if (!bucket || current - bucket.windowStart > windowMs) {
    store.rate[key] = { count: 1, windowStart: current }
    return
  }
  const nextCount = bucket.count + 1
  store.rate[key] = {
    count: nextCount,
    windowStart: bucket.windowStart,
    lockedUntil: nextCount >= max ? bucket.windowStart + windowMs : bucket.lockedUntil,
  }
}

function clearRate(store: Store, key: string) {
  delete store.rate[key]
}

function createPublicFields(partial: Partial<PublicUser> & Pick<PublicUser, "email" | "nickname" | "firstName" | "lastName">): PublicUser {
  const timestamp = new Date().toISOString()
  return {
    id: partial.id ?? createId(),
    email: partial.email,
    nickname: partial.nickname.trim(),
    name: partial.nickname.trim(),
    firstName: partial.firstName.trim(),
    lastName: partial.lastName.trim(),
    company: partial.company?.trim() ?? "",
    position: partial.position?.trim() ?? "",
    activityType: partial.activityType ?? "",
    avatar: partial.avatar ?? "",
    country: partial.country ?? "",
    city: partial.city?.trim() ?? "",
    bio: partial.bio?.trim() ?? "",
    website: partial.website ?? "",
    phone: partial.phone ?? "",
    emailVerified: partial.emailVerified ?? false,
    role: (partial.role ?? "user") as UserRole,
    marketingConsent: partial.marketingConsent ?? false,
    createdAt: partial.createdAt ?? timestamp,
    updatedAt: partial.updatedAt ?? timestamp,
    lastLoginAt: partial.lastLoginAt ?? null,
  }
}

class MockAuthService {
  private store: Store = emptyStore()
  private initialized = false

  async initialize() {
    if (this.initialized || typeof window === "undefined") return
    this.store = {
      users: readJson<StoredUser[]>(STORAGE_KEYS.users, []),
      session: readJson<SessionRecord | null>(STORAGE_KEYS.session, null),
      tokens: readJson<TokenRecord[]>(STORAGE_KEYS.tokens, []),
      rate: readJson<Record<string, RateBucket>>(STORAGE_KEYS.rate, {}),
      inbox: readJson<MockInboxItem | null>(STORAGE_KEYS.inbox, null),
    }

    if (this.store.users.length === 0) {
      await this.seedOccupiedAccount()
    }

    if (this.store.session) {
      const expired = now() - this.store.session.createdAt > SESSION_TTL_MS
      const user = this.store.users.find((item) => item.id === this.store.session?.userId)
      if (expired || !user) {
        this.store.session = null
        this.persist()
      }
    }

    this.initialized = true
  }

  getSession(): PublicUser | null {
    if (!this.store.session) return null
    const user = this.store.users.find((item) => item.id === this.store.session?.userId)
    return user ? toPublicUser(user) : null
  }

  getInbox(): MockInboxItem | null {
    return this.store.inbox
  }

  getResendAvailableAt(userId: string): number {
    const bucket = this.store.rate[`resend:${userId}`]
    if (!bucket) return 0
    return bucket.windowStart + RESEND_COOLDOWN_MS
  }

  async register(input: RegisterInput): Promise<AuthResult<PublicUser & { demoVerificationPath: string }>> {
    try {
      await delay()
      assertOnline()
      await this.initialize()

      const retryAfterSeconds = checkRate(this.store, "register:global", REGISTER_MAX_ATTEMPTS, REGISTER_WINDOW_MS)
      if (retryAfterSeconds) {
        return fail({ message: AUTH_MESSAGES.rateLimited, code: "rate_limited", retryAfterSeconds })
      }

      const fieldErrors = validateRegisterInput(input)
      if (Object.keys(fieldErrors).length > 0) {
        return fail({
          message: firstFieldError(fieldErrors) ?? AUTH_MESSAGES.server,
          fieldErrors,
          code: "validation",
        })
      }

      const email = normalizeEmail(input.email)
      const existing = this.store.users.find((user) => user.email === email)
      if (existing) {
        hitRate(this.store, "register:global", REGISTER_MAX_ATTEMPTS, REGISTER_WINDOW_MS)
        this.persist()
        return fail({
          message: AUTH_MESSAGES.emailTaken,
          fieldErrors: { email: AUTH_MESSAGES.emailTaken },
          code: "email_taken",
        })
      }

      hitRate(this.store, "register:global", REGISTER_MAX_ATTEMPTS, REGISTER_WINDOW_MS)

      const publicFields = createPublicFields({
        email,
        nickname: input.nickname,
        firstName: input.firstName,
        lastName: input.lastName,
        company: input.company,
        position: input.position,
        activityType: input.activityType,
        marketingConsent: input.marketingConsent,
        role: "user",
        emailVerified: false,
      })

      const stored: StoredUser = {
        ...publicFields,
        passwordHash: await hashPassword(input.password),
      }

      this.store.users.push(stored)
      this.store.session = { userId: stored.id, createdAt: now() }
      const demoVerificationPath = await this.issueToken(stored.id, "verify", email)
      this.persist()

      return { ok: true, data: { ...toPublicUser(stored), demoVerificationPath } }
    } catch (error) {
      return toAuthFailure(error)
    }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    try {
      await delay()
      assertOnline()
      await this.initialize()

      const email = normalizeEmail(input.email)
      const emailError = validateEmailValue(input.email)
      if (emailError || !input.password) {
        return fail({
          message: AUTH_MESSAGES.loginFailed,
          fieldErrors: {
            ...(emailError ? { email: emailError } : {}),
            ...(!input.password ? { password: AUTH_MESSAGES.passwordRequired } : {}),
          },
          code: "validation",
        })
      }

      const rateKey = `login:${email}`
      const retryAfterSeconds = checkRate(this.store, rateKey, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)
      if (retryAfterSeconds) {
        return fail({ message: AUTH_MESSAGES.rateLimited, code: "rate_limited", retryAfterSeconds })
      }

      const user = this.store.users.find((item) => item.email === email)
      const passwordOk = user ? await verifyPassword(input.password, user.passwordHash) : false

      if (!user || !passwordOk) {
        hitRate(this.store, rateKey, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)
        this.persist()
        return fail({ message: AUTH_MESSAGES.loginFailed, code: "invalid_credentials" })
      }

      clearRate(this.store, rateKey)
      user.lastLoginAt = new Date().toISOString()
      user.updatedAt = user.lastLoginAt
      this.store.session = { userId: user.id, createdAt: now() }
      this.persist()
      return { ok: true, data: toPublicUser(user) }
    } catch (error) {
      return toAuthFailure(error)
    }
  }

  logout() {
    this.store.session = null
    this.persist()
  }

  async loginDemo(): Promise<PublicUser> {
    await this.initialize()
    const email = "demo@stonetrail.ru"
    let user = this.store.users.find((item) => item.email === email)
    if (!user) {
      const publicFields = createPublicFields({
        email,
        nickname: "Профессионал",
        firstName: "Иван",
        lastName: "Камневой",
        company: "StoneTrail",
        position: "Камнеобработчик",
        activityType: "Камнеобработчик",
        country: "Россия",
        city: "Москва",
        emailVerified: true,
        role: "user",
      })
      user = {
        ...publicFields,
        passwordHash: await hashPassword("StoneTrail1"),
      }
      this.store.users.push(user)
    }
    user.lastLoginAt = new Date().toISOString()
    this.store.session = { userId: user.id, createdAt: now() }
    this.persist()
    return toPublicUser(user)
  }

  async updateProfile(input: ProfileUpdateInput): Promise<AuthResult> {
    try {
      await delay()
      assertOnline()
      const current = this.requireUser()
      if (!current.ok) return current

      const fieldErrors = validateProfileInput(input)
      if (input.avatar && input.avatar.length > AVATAR_MAX_BYTES * 1.4) {
        fieldErrors.avatar = AUTH_MESSAGES.avatarTooLarge
      }
      if (Object.keys(fieldErrors).length > 0) {
        return fail({
          message: firstFieldError(fieldErrors) ?? AUTH_MESSAGES.server,
          fieldErrors,
          code: "validation",
        })
      }

      const user = this.store.users.find((item) => item.id === current.data.id)
      if (!user) return fail({ message: AUTH_MESSAGES.server })

      user.nickname = input.nickname.trim()
      user.name = user.nickname
      user.firstName = input.firstName.trim()
      user.lastName = input.lastName.trim()
      user.company = input.company.trim()
      user.position = input.position.trim()
      user.activityType = input.activityType
      user.country = input.country
      user.city = input.city.trim()
      user.bio = input.bio.trim()
      user.website = input.website ? normalizeWebsite(input.website) : ""
      user.phone = input.phone.trim()
      user.marketingConsent = input.marketingConsent
      if (input.avatar !== undefined) user.avatar = input.avatar
      user.updatedAt = new Date().toISOString()
      this.persist()
      return { ok: true, data: toPublicUser(user) }
    } catch (error) {
      return toAuthFailure(error)
    }
  }

  async resendVerification(): Promise<AuthResult<ResendResult>> {
    try {
      await delay()
      assertOnline()
      const current = this.requireUser()
      if (!current.ok) return current
      if (current.data.emailVerified) {
        return { ok: true, data: { resendAvailableAt: 0, demoVerificationPath: "/verify-email?status=confirmed" } }
      }

      const availableAt = this.getResendAvailableAt(current.data.id)
      const remaining = Math.ceil((availableAt - now()) / 1000)
      if (remaining > 0) {
        return fail({
          message: AUTH_MESSAGES.resendWait(remaining),
          code: "rate_limited",
          retryAfterSeconds: remaining,
        })
      }

      this.store.rate[`resend:${current.data.id}`] = { count: 1, windowStart: now() }
      const demoVerificationPath = await this.issueToken(current.data.id, "verify", current.data.email)
      this.persist()
      return {
        ok: true,
        data: {
          resendAvailableAt: this.getResendAvailableAt(current.data.id),
          demoVerificationPath,
        },
      }
    } catch (error) {
      return toAuthFailure(error)
    }
  }

  async changeEmail(emailValue: string): Promise<AuthResult<ResendResult>> {
    try {
      await delay()
      assertOnline()
      const current = this.requireUser()
      if (!current.ok) return current

      const emailError = validateEmailValue(emailValue)
      if (emailError) {
        return fail({ message: emailError, fieldErrors: { email: emailError }, code: "validation" })
      }

      const email = normalizeEmail(emailValue)
      const taken = this.store.users.some((item) => item.email === email && item.id !== current.data.id)
      if (taken) {
        return fail({
          message: AUTH_MESSAGES.emailTaken,
          fieldErrors: { email: AUTH_MESSAGES.emailTaken },
          code: "email_taken",
        })
      }

      const user = this.store.users.find((item) => item.id === current.data.id)
      if (!user) return fail({ message: AUTH_MESSAGES.server })

      user.email = email
      user.emailVerified = false
      user.updatedAt = new Date().toISOString()
      this.store.rate[`resend:${user.id}`] = { count: 1, windowStart: now() }
      const demoVerificationPath = await this.issueToken(user.id, "verify", email)
      this.persist()
      return {
        ok: true,
        data: {
          resendAvailableAt: this.getResendAvailableAt(user.id),
          demoVerificationPath,
        },
      }
    } catch (error) {
      return toAuthFailure(error)
    }
  }

  async verifyEmail(token: string): Promise<AuthResult> {
    try {
      await delay()
      assertOnline()
      await this.initialize()

      const record = await this.findToken(token, "verify")
      if (!record.ok) {
        return fail({
          message: record.code === "token_used" ? AUTH_MESSAGES.verifyUsed : AUTH_MESSAGES.verifyExpired,
          code: record.code,
        })
      }

      const user = this.store.users.find((item) => item.id === record.data.userId)
      if (!user) return fail({ message: AUTH_MESSAGES.verifyExpired, code: "token_invalid" })

      record.data.usedAt = now()
      user.emailVerified = true
      user.updatedAt = new Date().toISOString()
      this.store.session = { userId: user.id, createdAt: now() }
      this.store.inbox = this.store.inbox?.type === "verify" ? null : this.store.inbox
      this.persist()
      return { ok: true, data: toPublicUser(user) }
    } catch (error) {
      return toAuthFailure(error)
    }
  }

  async requestPasswordReset(emailValue: string): Promise<AuthResult<PasswordResetRequestResult>> {
    try {
      await delay()
      assertOnline()
      await this.initialize()

      const emailError = validateEmailValue(emailValue)
      if (emailError) {
        return fail({ message: emailError, fieldErrors: { email: emailError }, code: "validation" })
      }

      const email = normalizeEmail(emailValue)
      const retryAfterSeconds = checkRate(this.store, `forgot:${email}`, FORGOT_MAX_ATTEMPTS, FORGOT_WINDOW_MS)
      if (retryAfterSeconds) {
        return fail({ message: AUTH_MESSAGES.rateLimited, code: "rate_limited", retryAfterSeconds })
      }

      hitRate(this.store, `forgot:${email}`, FORGOT_MAX_ATTEMPTS, FORGOT_WINDOW_MS)
      const user = this.store.users.find((item) => item.email === email)
      if (user) {
        await this.issueToken(user.id, "reset", email)
      } else {
        this.store.inbox = {
          type: "reset",
          email,
          path: `/reset-password?token=${randomToken(32)}`,
          createdAt: new Date().toISOString(),
        }
      }
      this.persist()
      return { ok: true, data: { submitted: true } }
    } catch (error) {
      return toAuthFailure(error)
    }
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<AuthResult<PasswordResetResult>> {
    try {
      await delay()
      assertOnline()
      await this.initialize()

      const passwordError = validatePassword(password)
      const confirmError = validatePasswordConfirmation(password, confirmPassword)
      if (passwordError || confirmError) {
        return fail({
          message: passwordError ?? confirmError ?? AUTH_MESSAGES.server,
          fieldErrors: {
            ...(passwordError ? { password: passwordError } : {}),
            ...(confirmError ? { confirmPassword: confirmError } : {}),
          },
          code: "validation",
        })
      }

      const record = await this.findToken(token, "reset")
      if (!record.ok) {
        return fail({
          message: record.code === "token_used" ? AUTH_MESSAGES.resetUsed : AUTH_MESSAGES.resetExpired,
          code: record.code,
        })
      }

      const user = this.store.users.find((item) => item.id === record.data.userId)
      if (!user) return fail({ message: AUTH_MESSAGES.resetExpired, code: "token_invalid" })

      record.data.usedAt = now()
      user.passwordHash = await hashPassword(password)
      user.updatedAt = new Date().toISOString()
      this.store.session = null
      this.store.inbox = this.store.inbox?.type === "reset" ? null : this.store.inbox
      this.persist()
      return { ok: true, data: { completed: true } }
    } catch (error) {
      return toAuthFailure(error)
    }
  }

  private requireUser(): AuthResult {
    const user = this.getSession()
    if (!user) {
      return fail({ message: AUTH_MESSAGES.loginFailed, code: "invalid_credentials" })
    }
    return { ok: true, data: user }
  }

  private async issueToken(userId: string, type: "verify" | "reset", email: string): Promise<string> {
    this.store.tokens = this.store.tokens.filter((token) => !(token.userId === userId && token.type === type && !token.usedAt))
    const raw = randomToken(32)
    const tokenHash = await sha256(raw)
    const ttl = type === "verify" ? VERIFY_TOKEN_TTL_MS : RESET_TOKEN_TTL_MS
    this.store.tokens.push({
      id: createId(),
      type,
      userId,
      tokenHash,
      expiresAt: now() + ttl,
      usedAt: null,
    })
    const path = type === "verify" ? `/verify-email?token=${raw}` : `/reset-password?token=${raw}`
    this.store.inbox = {
      type,
      email,
      path,
      createdAt: new Date().toISOString(),
    }
    return path
  }

  private async findToken(raw: string, type: "verify" | "reset"): Promise<
    | { ok: true; data: TokenRecord }
    | { ok: false; code: "token_expired" | "token_used" | "token_invalid" }
  > {
    if (!raw) return { ok: false, code: "token_invalid" }
    const tokenHash = await sha256(raw)
    const record = this.store.tokens.find((token) => token.type === type && token.tokenHash === tokenHash)
    if (!record) return { ok: false, code: "token_invalid" }
    if (record.usedAt) return { ok: false, code: "token_used" }
    if (record.expiresAt < now()) return { ok: false, code: "token_expired" }
    return { ok: true, data: record }
  }

  private async seedOccupiedAccount() {
    const publicFields = createPublicFields({
      email: "occupied@stonetrail.ru",
      nickname: "Каменщик",
      firstName: "Алексей",
      lastName: "Петров",
      company: "Ателье камня",
      position: "Технолог",
      activityType: "Камнеобработчик",
      country: "Россия",
      city: "Москва",
      emailVerified: true,
      role: "user",
    })
    this.store.users.push({
      ...publicFields,
      passwordHash: await hashPassword("StoneTrail1"),
    })
  }

  private persist() {
    if (typeof window === "undefined") return
    writeJson(STORAGE_KEYS.users, this.store.users)
    writeJson(STORAGE_KEYS.session, this.store.session)
    writeJson(STORAGE_KEYS.tokens, this.store.tokens)
    writeJson(STORAGE_KEYS.rate, this.store.rate)
    writeJson(STORAGE_KEYS.inbox, this.store.inbox)
  }
}

export const mockAuth = new MockAuthService()
