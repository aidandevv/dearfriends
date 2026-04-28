import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { geocodeAddress } from './geocode'

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

  it('returns lat/lng on OK response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        results: [{ geometry: { location: { lat: 40.7128, lng: -74.006 } } }],
      }),
    } as Response)

    const result = await geocodeAddress('123 Main St', 'New York', 'NY', '10001')
    expect(result).toEqual({ lat: 40.7128, lng: -74.006 })
  })

  it('returns null on ZERO_RESULTS', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
    } as Response)

    expect(await geocodeAddress('1 Nowhere Ln', 'Faketown', 'ZZ', '00000')).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'))
    expect(await geocodeAddress('123 Main St', 'New York', 'NY', '10001')).toBeNull()
  })

  it('returns null when GOOGLE_GEOCODING_API_KEY is not set', async () => {
    delete process.env.GOOGLE_GEOCODING_API_KEY
    expect(await geocodeAddress('123 Main St', 'New York', 'NY', '10001')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('builds the correct API URL', async () => {
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
})
