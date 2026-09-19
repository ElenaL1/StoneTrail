const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
const DIGITS = "0123456789"
const ALPHABET = `${LETTERS}${DIGITS}`
const PASSWORD_LENGTH = 16

function randomIndex(max: number): number {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return bytes[0]! % max
}

function shuffle(chars: string[]): string[] {
  const bytes = new Uint32Array(chars.length)
  crypto.getRandomValues(bytes)
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = bytes[index]! % (index + 1)
    const current = chars[index]!
    chars[index] = chars[swap]!
    chars[swap] = current
  }
  return chars
}

export function generatePassword(length = PASSWORD_LENGTH): string {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  const chars = Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]!)
  if (!chars.some((char) => LETTERS.includes(char))) {
    chars[0] = LETTERS[randomIndex(LETTERS.length)]!
  }
  if (!chars.some((char) => DIGITS.includes(char))) {
    chars[1] = DIGITS[randomIndex(DIGITS.length)]!
  }
  return shuffle(chars).join("")
}

type PasswordCredentialCtor = new (data: { id: string; password: string; name?: string }) => Credential

export async function offerStorePassword(input: {
  email: string
  password: string
  nickname: string
}): Promise<void> {
  try {
    const PasswordCred = (window as unknown as { PasswordCredential?: PasswordCredentialCtor }).PasswordCredential
    if (!PasswordCred || !navigator.credentials?.store) return
    await navigator.credentials.store(
      new PasswordCred({
        id: input.email,
        password: input.password,
        name: input.nickname,
      }),
    )
  } catch {
    // Registration already succeeded; password managers are best-effort.
  }
}
