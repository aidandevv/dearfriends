#!/usr/bin/env node
/**
 * Backfill lat/lng for contacts missing coordinates.
 * Usage: node scripts/backfill-geocodes.mjs
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const lines = readFileSync('.env.local', 'utf8').split('\n')
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue
    const index = line.indexOf('=')
    let value = line.slice(index + 1)
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[line.slice(0, index)] = value
  }
}

const US_COUNTRY_ALIASES = new Set([
  'us', 'usa', 'u.s.', 'u.s.a.', 'united states', 'united states of america',
])

function isUsMailableAddress(country) {
  if (!country?.trim()) return true
  return US_COUNTRY_ALIASES.has(country.trim().toLowerCase())
}

async function geocodeWithCensus(address, city, state, zip) {
  const params = new URLSearchParams({
    street: address,
    city,
    state,
    zip,
    benchmark: 'Public_AR_Current',
    format: 'json',
  })
  const res = await fetch(`https://geocoding.geo.census.gov/geocoder/locations/address?${params}`)
  if (!res.ok) return null
  const json = await res.json()
  const coords = json.result?.addressMatches?.[0]?.coordinates
  if (!coords) return null
  return { lat: coords.y, lng: coords.x }
}

async function geocodeAddress(address, city, state, zip, country) {
  const key = process.env.GOOGLE_GEOCODING_API_KEY
  if (key) {
    const query = encodeURIComponent([address, city, state, zip, country].filter(Boolean).join(', '))
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${key}`)
    const json = await res.json()
    const loc = json.results?.[0]?.geometry?.location
    if (loc) return { lat: loc.lat, lng: loc.lng }
  }
  if (!isUsMailableAddress(country)) return null
  return geocodeWithCensus(address, city, state, zip)
}

loadEnv()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const { data: contacts, error } = await supabase
  .from('contacts')
  .select('id, address_line_1, city, state, zip, country, is_international, lat, lng')
  .or('lat.is.null,lng.is.null')

if (error) {
  console.error(error.message)
  process.exit(1)
}

let updated = 0
for (const contact of contacts ?? []) {
  const coords = await geocodeAddress(
    contact.address_line_1,
    contact.city,
    contact.state,
    contact.zip,
    contact.is_international ? contact.country : null,
  )
  if (!coords) {
    console.log(`skip ${contact.id}`)
    continue
  }
  const { error: updateError } = await supabase
    .from('contacts')
    .update({ lat: coords.lat, lng: coords.lng })
    .eq('id', contact.id)
  if (updateError) {
    console.error(updateError.message)
    continue
  }
  updated++
  console.log(`updated ${contact.id} -> ${coords.lat}, ${coords.lng}`)
}

console.log(`Done. Updated ${updated} contact(s).`)
