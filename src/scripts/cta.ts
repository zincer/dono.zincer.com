export type StoreCta = { readonly kind: 'store'; readonly href: string } | { readonly kind: 'soon' }

export interface CtaView {
  readonly store: StoreCta
  readonly testflight: string | null
}

/** An empty value means "not yet"; anything else must be an https link, or the build fails. */
function link(name: string, value: string): string | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  let protocol = ''
  try {
    protocol = new URL(trimmed).protocol
  } catch {
    protocol = ''
  }
  if (protocol !== 'https:') throw new Error(`${name} must be an https:// link, got "${trimmed}" (src/config.ts)`)
  return trimmed
}

/** What the call to action shows for the configured App Store and TestFlight links. */
export function ctaView(appStoreUrl: string, testflightUrl: string): CtaView {
  const store = link('APP_STORE_URL', appStoreUrl)
  return {
    store: store === null ? { kind: 'soon' } : { kind: 'store', href: store },
    testflight: link('TESTFLIGHT_URL', testflightUrl),
  }
}
