import { existsSync } from 'node:fs'
import { delimiter } from 'node:path'
import { spawnSync } from 'node:child_process'

const macOSDockerBin = '/Applications/Docker.app/Contents/Resources/bin'
const env = { ...process.env }

// Docker Desktop stores its credential helper outside the shell PATH on some
// macOS installations. The Supabase CLI pulls local test images through Docker,
// so make that standard location discoverable without changing other platforms.
if (process.platform === 'darwin' && existsSync(`${macOSDockerBin}/docker-credential-desktop`)) {
  env.PATH = `${macOSDockerBin}${delimiter}${env.PATH ?? ''}`
}

const result = spawnSync('supabase', process.argv.slice(2), {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
