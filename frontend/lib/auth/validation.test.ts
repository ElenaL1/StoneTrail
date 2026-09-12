import { describe, expect, test } from "vitest"
import { AUTH_MESSAGES } from "@/lib/auth/constants"
import type { RegisterInput } from "@/lib/auth/types"
import {
  getPasswordStrength,
  validateEmailValue,
  validatePassword,
  validatePasswordConfirmation,
  validateRegisterInput,
} from "@/lib/auth/validation"

const validRegister: RegisterInput = {
  nickname: "StoneMaster",
  firstName: "Иван",
  lastName: "Петров",
  email: "ivan@company.ru",
  password: "StoneTrail1",
  confirmPassword: "StoneTrail1",
  company: "",
  position: "",
  activityType: "",
  termsAccepted: true,
  marketingConsent: false,
}

describe("validateEmailValue", () => {
  test("принимает корректный email", () => {
    expect(validateEmailValue("ivan@company.ru")).toBeUndefined()
  })

  test("требует email, если поле пустое", () => {
    expect(validateEmailValue("")).toBe(AUTH_MESSAGES.emailRequired)
  })

  test("отклоняет некорректный email", () => {
    expect(validateEmailValue("not-an-email")).toBe(AUTH_MESSAGES.emailInvalid)
  })
})

describe("validatePassword", () => {
  test("принимает пароль с буквами, цифрами и длиной от 8 символов", () => {
    expect(validatePassword("StoneTrail1")).toBeUndefined()
  })

  test("отклоняет короткий пароль", () => {
    expect(validatePassword("Ab1")).toBe(AUTH_MESSAGES.passwordMin)
  })

  test("отклоняет пароль без цифры", () => {
    expect(validatePassword("StoneTrail")).toBe(AUTH_MESSAGES.passwordDigit)
  })
})

describe("getPasswordStrength", () => {
  test("оценивает длинный пароль с буквами и цифрами как strong", () => {
    expect(getPasswordStrength("StoneTrail12")).toBe("strong")
  })
})

describe("validateRegisterInput", () => {
  test("принимает заполненную регистрацию с согласием", () => {
    expect(validateRegisterInput(validRegister)).toEqual({})
  })

  test("требует совпадения паролей", () => {
    const errors = validateRegisterInput({
      ...validRegister,
      confirmPassword: "OtherPass1",
    })
    expect(errors.confirmPassword).toBe(AUTH_MESSAGES.passwordMismatch)
  })

  test("требует принятие условий", () => {
    const errors = validateRegisterInput({
      ...validRegister,
      termsAccepted: false,
    })
    expect(errors.termsAccepted).toBe(AUTH_MESSAGES.termsRequired)
  })
})

describe("validatePasswordConfirmation", () => {
  test("сообщает, если подтверждение не совпадает", () => {
    expect(validatePasswordConfirmation("StoneTrail1", "StoneTrail2")).toBe(
      AUTH_MESSAGES.passwordMismatch,
    )
  })
})
