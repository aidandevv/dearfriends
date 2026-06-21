type GeocodeResult = { lat: number; lng: number } | null

type ContactWithCoordinates = {
  id: string
  first_name: string
  city: string | null
  state: string | null
  lat?: number | null
  lng?: number | null
}

export type GeocodedContact = ContactWithCoordinates & {
  coordinates: [number, number]
}

type GoogleGeocodeResponse = {
  status: string
  results: Array<{
    geometry: { location: { lat: number; lng: number } }
  }>
}

type CensusGeocodeResponse = {
  result?: {
    addressMatches?: Array<{
      coordinates?: { x: number; y: number }
    }>
  }
}

const CENSUS_GEOCODER_URL = 'https://geocoding.geo.census.gov/geocoder/locations/address'
const CENSUS_BENCHMARK = 'Public_AR_Current'

const US_COUNTRY_ALIASES = new Set([
  'us',
  'usa',
  'u.s.',
  'u.s.a.',
  'united states',
  'united states of america',
])

export function isUsMailableAddress(country?: string | null): boolean {
  if (!country?.trim()) return true
  return US_COUNTRY_ALIASES.has(country.trim().toLowerCase())
}

async function geocodeWithGoogle(
  address: string,
  city: string,
  state: string,
  zip: string,
  country?: string | null,
): Promise<GeocodeResult> {
  const key = process.env.GOOGLE_GEOCODING_API_KEY
  if (!key) return null

  const query = encodeURIComponent(
    [address, city, state, zip, country].filter(Boolean).join(', '),
  )
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${key}`

  try {
    const res = await fetch(url)
    const json = (await res.json()) as GoogleGeocodeResponse
    if (json.status !== 'OK' || json.results.length === 0) return null
    const loc = json.results[0]?.geometry?.location
    if (!loc) return null
    return { lat: loc.lat, lng: loc.lng }
  } catch {
    return null
  }
}

async function geocodeWithCensus(
  address: string,
  city: string,
  state: string,
  zip: string,
): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    street: address,
    city,
    state,
    zip,
    benchmark: CENSUS_BENCHMARK,
    format: 'json',
  })

  try {
    const res = await fetch(`${CENSUS_GEOCODER_URL}?${params.toString()}`)
    if (!res.ok) return null

    const json = (await res.json()) as CensusGeocodeResponse
    const coords = json.result?.addressMatches?.[0]?.coordinates
    if (coords == null || coords.x == null || coords.y == null) return null

    return { lat: coords.y, lng: coords.x }
  } catch {
    return null
  }
}

export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip: string,
  country?: string | null,
): Promise<GeocodeResult> {
  const googleResult = await geocodeWithGoogle(address, city, state, zip, country)
  if (googleResult) return googleResult

  if (!isUsMailableAddress(country)) return null

  return geocodeWithCensus(address, city, state, zip)
}

export async function geocodeContacts(contacts: ContactWithCoordinates[]): Promise<GeocodedContact[]> {
  return contacts.flatMap(contact => {
    if (contact.lat == null || contact.lng == null) return []

    return [{
      ...contact,
      coordinates: [contact.lat, contact.lng],
    }]
  })
}
