import { afterEach, describe, expect, it, vi } from 'vitest'
import { isValidEmail, sendSignup } from '../../src/scripts/signup'

afterEach(() => vi.restoreAllMocks())

const respond = (ok: boolean) => vi.fn(async () => new Response('{}', { status: ok ? 200 : 422 }))

describe('isValidEmail', () => {
  it('accepts ordinary addresses and trims spaces', () => {
    expect(isValidEmail('you@email.com')).toBe(true)
    expect(isValidEmail('  you@email.com ')).toBe(true)
  })
  it('rejects anything without a user, an @ and a dotted domain', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('you@email')).toBe(false)
    expect(isValidEmail('you email@x.com')).toBe(false)
    expect(isValidEmail('@email.com')).toBe(false)
  })
})

describe('sendSignup', () => {
  it('posts the trimmed email as form data and asks for JSON', async () => {
    const fetchFn = respond(true)
    await expect(sendSignup('https://forms.example/f/abc', ' you@email.com ', fetchFn)).resolves.toBe('success')
    expect(fetchFn).toHaveBeenCalledTimes(1)
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://forms.example/f/abc')
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('Accept')).toBe('application/json')
    expect((init.body as FormData).get('email')).toBe('you@email.com')
  })
  it('reports an error when the service refuses', async () => {
    await expect(sendSignup('https://forms.example/f/abc', 'you@email.com', respond(false))).resolves.toBe('error')
  })
  it('reports an error when the network fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const fetchFn = vi.fn(async () => { throw new TypeError('Failed to fetch') })
    await expect(sendSignup('https://forms.example/f/abc', 'you@email.com', fetchFn)).resolves.toBe('error')
    expect(console.error).toHaveBeenCalled()
  })
  it('never calls the network without an endpoint or with a bad email', async () => {
    const fetchFn = respond(true)
    await expect(sendSignup('', 'you@email.com', fetchFn)).resolves.toBe('error')
    await expect(sendSignup('https://forms.example/f/abc', 'nope', fetchFn)).resolves.toBe('error')
    expect(fetchFn).not.toHaveBeenCalled()
  })
})
