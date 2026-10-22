export type SignupResult = 'success' | 'error'

export const SIGNUP_MESSAGES = {
  sending: 'Sending…',
  success: "You're on the list.",
  error: "That didn't go through. Try again or write to hi@zincer.com.",
} as const

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Posts one email to a Formspree-style endpoint. Never resolves `success` unless the service said ok. */
export async function sendSignup(endpoint: string, email: string, fetchFn: typeof fetch = fetch): Promise<SignupResult> {
  if (endpoint === '' || !isValidEmail(email)) return 'error'
  const body = new FormData()
  body.set('email', email.trim())
  try {
    const response = await fetchFn(endpoint, { method: 'POST', body, headers: { Accept: 'application/json' } })
    return response.ok ? 'success' : 'error'
  } catch (error) {
    console.error('Waitlist signup failed:', error)
    return 'error'
  }
}

/** Submits every `form[data-signup]` that has an endpoint with fetch, showing the result in place. */
export function enhanceSignupForms(root: ParentNode = document): void {
  root.querySelectorAll<HTMLFormElement>('form[data-signup]').forEach((form) => {
    const endpoint = form.dataset.endpoint ?? ''
    const input = form.querySelector<HTMLInputElement>('input[type="email"]')
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')
    const status = form.querySelector<HTMLElement>('[data-status]')
    if (endpoint === '' || !input || !button || !status) return

    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      button.disabled = true
      status.textContent = SIGNUP_MESSAGES.sending
      const result = await sendSignup(endpoint, input.value)
      status.textContent = SIGNUP_MESSAGES[result]
      if (result === 'success') form.reset()
      button.disabled = false
    })
  })
}
