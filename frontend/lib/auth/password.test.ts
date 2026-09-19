import { afterEach, describe, expect, test, vi } from "vitest"
import { generatePassword, offerStorePassword } from "@/lib/auth/password"
import { validatePassword } from "@/lib/auth/validation"

describe("generatePassword", () => {
  test("даёт 16 символов из букв и цифр через crypto.getRandomValues", () => {
    const spy = vi.spyOn(crypto, "getRandomValues")
    const password = generatePassword()
    expect(password).toMatch(/^[A-Za-z0-9]{16}$/)
    expect(/[A-Za-z]/.test(password)).toBe(true)
    expect(/\d/.test(password)).toBe(true)
    expect(validatePassword(password)).toBeUndefined()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe("offerStorePassword", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test("ошибка store не пробрасывается", async () => {
    const store = vi.fn().mockRejectedValue(new Error("denied"))
    class PasswordCredential {
      id: string
      password: string
      name?: string
      constructor(data: { id: string; password: string; name?: string }) {
        this.id = data.id
        this.password = data.password
        this.name = data.name
      }
    }
    vi.stubGlobal("PasswordCredential", PasswordCredential)
    vi.stubGlobal("navigator", { credentials: { store } })

    await expect(
      offerStorePassword({ email: "ivan@company.ru", password: "StoneTrail1", nickname: "Stone" }),
    ).resolves.toBeUndefined()
    expect(store).toHaveBeenCalledOnce()
  })

  test("без PasswordCredential ничего не делает", async () => {
    const store = vi.fn()
    vi.stubGlobal("PasswordCredential", undefined)
    vi.stubGlobal("navigator", { credentials: { store } })
    await offerStorePassword({ email: "ivan@company.ru", password: "StoneTrail1", nickname: "Stone" })
    expect(store).not.toHaveBeenCalled()
  })
})
