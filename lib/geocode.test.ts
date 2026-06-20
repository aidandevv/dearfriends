import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { geocodeAddress, isUsMailableAddress } from './geocode'

describe('isUsMailableAddress', () => {
  it('treats missing country as US', () => {
    expect(isUsMailableAddress(null)).toBe(true)
    expect(isUsMailableAddress('')).toBe(true)
  })

  it('recognises common US country names', () => {
    expect(isUsMailableAddress('US')).toBe(true)
    expect(isUsMailableAddress('United States')).toBe(true)
  })

  it('rejects non-US countries', () => {
    expect(isUsMailableAddress('Canada')).toBe(false)
    expect(isUsMailableAddress('GB')).toBe(false)
  })
})

describe('geocodeAddress', () => {
  const originalKey = process.env.GOOGLE_GEOCODING_API_KEY

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    process.env.GOOGLE_GEOCODING_API_KEY = 'test-key'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env.GOOGLE_GEOCODING_API_KEY = originalKey
  })

  it('returns lat/lng on Google OK response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        results: [{ geometry: { location: { lat: 40.7128, lng: -74.006 } } }],
      }),
    } as Response)

    const result = await geocodeAddress('123 Main St', 'New York', 'NY', '10001')
    expect(result).toEqual({ lat: 40.7128, lng: -74.006 })
  })

  it('returns null when both Google and Census have no match', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { addressMatches: [] } }),
      } as Response)

    expect(await geocodeAddress('1 Nowhere Ln', 'Faketown', 'ZZ', '00000')).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('returns null when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'))
    expect(await geocodeAddress('123 Main St', 'New York', 'NY', '10001')).toBeNull()
  })

  it('builds the correct Google API URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        results: [{ geometry: { location: { lat: 1, lng: 2 } } }],
      }),
    } as Response)

    await geocodeAddress('456 Oak Ave', 'Austin', 'TX', '78701')
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('maps.googleapis.com/maps/api/geocode/json')
    expect(calledUrl).toContain('456%20Oak%20Ave')
    expect(calledUrl).toContain('Austin')
    expect(calledUrl).toContain('key=test-key')
    expect(calledUrl).toContain('TX')
    expect(calledUrl).toContain('78701')
    expect(calledUrl).toContain('address=')
  })

  it('falls back to Census when Google key is not set', async () => {
    delete process.env.GOOGLE_GEOCODING_API_KEY
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: {
          addressMatches: [{ coordinates: { x: -97.7448, y: 30.2626 } }],
        },
      }),
    } as Response)

    const result = await geocodeAddress('1 Congress Ave', 'Austin', 'TX', '78701')
    expect(result).toEqual({ lat: 30.2626, lng: -97.7448 })

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('geocoding.geo.census.gov/geocoder/locations/address')
    expect(calledUrl).toContain('street=1+Congress+Ave')
    expect(calledUrl).toContain('city=Austin')
    expect(calledUrl).toContain('state=TX')
    expect(calledUrl).toContain('zip=78701')
    expect(calledUrl).toContain('benchmark=Public_AR_Current')
  })

  it('falls back to Census when Google returns no match', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            addressMatches: [{ coordinates: { x: -97.7448, y: 30.2626 } }],
          },
        }),
      } as Response)

    const result = await geocodeAddress('1 Congress Ave', 'Austin', 'TX', '78701')
    expect(result).toEqual({ lat: 30.2626, lng: -97.7448 })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('skips Census for non-US international addresses without Google', async () => {
    delete process.env.GOOGLE_GEOCODING_API_KEY
    expect(await geocodeAddress('10 Downing St', 'London', 'LDN', 'SW1A 2AA', 'United Kingdom')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns null when Census has no address matches', async () => {
    delete process.env.GOOGLE_GEOCODING_API_KEY
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: { addressMatches: [] } }),
    } as Response)

    expect(await geocodeAddress('1 Congress Ave', 'Austin', 'TX', '78701')).toBeNull()
  })
})
