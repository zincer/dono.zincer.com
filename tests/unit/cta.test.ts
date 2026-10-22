import { describe, expect, it } from 'vitest'
import { ctaView } from '../../src/scripts/cta'

const STORE = 'https://apps.apple.com/app/ake/id0000000000'
const TESTFLIGHT = 'https://testflight.apple.com/join/AbCdEfGh'

describe('ctaView', () => {
  it('says coming soon and hides TestFlight while both links are empty', () => {
    expect(ctaView('', '')).toEqual({ store: { kind: 'soon' }, testflight: null })
    expect(ctaView('  ', ' ')).toEqual({ store: { kind: 'soon' }, testflight: null })
  })
  it('links the App Store badge once the listing exists', () => {
    expect(ctaView(STORE, '')).toEqual({ store: { kind: 'store', href: STORE }, testflight: null })
  })
  it('shows TestFlight on its own, before the App Store link exists', () => {
    expect(ctaView('', TESTFLIGHT)).toEqual({ store: { kind: 'soon' }, testflight: TESTFLIGHT })
  })
  it('trims pasted whitespace', () => {
    expect(ctaView(` ${STORE}\n`, '').store).toEqual({ kind: 'store', href: STORE })
  })
  it('fails the build on a link that is not https', () => {
    expect(() => ctaView('apps.apple.com/app/ake/id1', '')).toThrow('APP_STORE_URL must be an https:// link')
    expect(() => ctaView('http://apps.apple.com/app/ake/id1', '')).toThrow('APP_STORE_URL must be an https:// link')
    expect(() => ctaView('', 'testflight.apple.com/join/x')).toThrow('TESTFLIGHT_URL must be an https:// link')
  })
})
