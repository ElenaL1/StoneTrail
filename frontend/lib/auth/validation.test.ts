import { describe, expect, test } from "vitest"
import { AUTH_MESSAGES } from "@/lib/auth/constants"
import type { ProfileUpdateInput, RegisterInput } from "@/lib/auth/types"
import {
  getPasswordStrength,
  validateEmailValue,
  validatePassword,
  validatePasswordConfirmation,
  validateProfileInput,
  validateRegisterInput,
} from "@/lib/auth/validation"

const validRegister: RegisterInput = {
  nickname: "StoneMaster",
  email: "ivan@company.ru",
  password: "StoneTrail1",
  termsAccepted: true,
  marketingConsent: false,
}

const validProfile: ProfileUpdateInput = {
  nickname: "StoneMaster",
  firstName: "",
  lastName: "",
  company: "",
  position: "",
  activityType: "",
  country: "",
  city: "",
  bio: "",
  website: "",
  phone: "",
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
  test("принимает регистрацию без имени, фамилии и подтверждения пароля", () => {
    expect(validateRegisterInput(validRegister)).toEqual({})
  })

  test("требует принятие условий", () => {
    const errors = validateRegisterInput({
      ...validRegister,
      termsAccepted: false,
    })
    expect(errors.termsAccepted).toBe(AUTH_MESSAGES.termsRequired)
  })
})

describe("validateProfileInput", () => {
  test("принимает пустые имя и фамилию", () => {
    expect(validateProfileInput(validProfile)).toEqual({})
  })

  test("отклоняет имя из одного символа", () => {
    const errors = validateProfileInput({ ...validProfile, firstName: "И" })
    expect(errors.firstName).toBe(AUTH_MESSAGES.firstNameMin)
  })
})

describe("validatePasswordConfirmation", () => {
  test("сообщает, если подтверждение не совпадает", () => {
    expect(validatePasswordConfirmation("StoneTrail1", "StoneTrail2")).toBe(
      AUTH_MESSAGES.passwordMismatch,
    )
  })
})
