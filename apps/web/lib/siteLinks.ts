/** Kaptan paneli ayrı bir uygulama (apps/captain). Ortam değişkeni yoksa canlı adres kullanılır. */
export const CAPTAIN_APP_URL = process.env.NEXT_PUBLIC_CAPTAIN_URL ?? 'https://appcaptain-captain.vercel.app'

export const CAPTAIN_SIGNUP_URL = `${CAPTAIN_APP_URL}/signup`
export const CAPTAIN_LOGIN_URL = `${CAPTAIN_APP_URL}/login`
