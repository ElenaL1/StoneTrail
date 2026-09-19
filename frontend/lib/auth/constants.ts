export const AUTH_MESSAGES = {
  nicknameRequired: "Укажите ник, который будет отображаться на сайте.",
  nicknameMin: "Ник должен содержать не менее 2 символов.",
  firstNameRequired: "Укажите имя.",
  firstNameMin: "Имя должно содержать не менее 2 символов.",
  lastNameRequired: "Укажите фамилию.",
  lastNameMin: "Фамилия должна содержать не менее 2 символов.",
  emailRequired: "Укажите email.",
  emailInvalid: "Укажите корректный адрес email.",
  emailTaken: "Аккаунт с этим email уже существует. Войти в аккаунт",
  passwordRequired: "Введите пароль.",
  passwordMin: "Пароль должен содержать не менее 8 символов.",
  passwordLetter: "Добавьте в пароль хотя бы одну букву.",
  passwordDigit: "Добавьте в пароль хотя бы одну цифру.",
  passwordHint: "Используйте не менее 8 символов, включая буквы и цифры.",
  passwordMismatch: "Пароли не совпадают",
  termsRequired: "Примите Пользовательское соглашение и Политику конфиденциальности.",
  loginFailed: "Не удалось войти. Проверьте email и пароль.",
  rateLimited: "Слишком много попыток. Подождите немного и попробуйте снова.",
  network: "Не удалось выполнить запрос. Проверьте подключение к сети и попробуйте снова.",
  server: "Не удалось выполнить запрос. Попробуйте ещё раз.",
  verifyExpired: "Ссылка для подтверждения недействительна или устарела.",
  verifyUsed: "Эта ссылка уже использована. Запросите новое письмо.",
  resetExpired: "Ссылка для восстановления пароля недействительна или устарела.",
  resetUsed: "Эта ссылка уже использована. Запросите новую.",
  resetGeneric: "Если аккаунт с таким email существует, мы отправили инструкции по восстановлению пароля.",
  websiteInvalid: "Укажите корректный адрес сайта.",
  avatarTooLarge: "Размер фото не должен превышать 1 МБ.",
  avatarInvalid: "Загрузите изображение в формате JPG, PNG или WebP.",
  resendWait: (seconds: number) =>
    seconds > 0
      ? `Повторная отправка будет доступна через ${seconds} с.`
      : "Письмо отправлено повторно.",
} as const

export const PASSWORD_MIN_LENGTH = 8
export const NAME_MIN_LENGTH = 2
export const AVATAR_MAX_BYTES = 1_000_000
export const AVATAR_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

export const COUNTRIES = [
  "Россия",
  "Беларусь",
  "Казахстан",
  "Армения",
  "Грузия",
  "Узбекистан",
  "Азербайджан",
  "Кыргызстан",
  "Таджикистан",
  "Другая",
] as const
