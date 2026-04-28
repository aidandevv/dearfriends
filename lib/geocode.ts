type GeocodeResult = { lat: number; lng: number } | null

type GoogleGeocodeResponse = {
  status: string
  results: Array<{
    geometry: { location: { lat: number; lng: number } }
  }>
}

export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip: string,
): Promise<GeocodeResult> {
  const key = process.env.GOOGLE_GEOCODING_API_KEY
  if (!key) return null

  const query = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)
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
