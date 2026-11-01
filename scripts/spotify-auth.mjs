import { createServer } from 'node:http'
import { URL } from 'node:url'

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8888/callback'
const scopes = 'user-read-currently-playing user-read-recently-played'

if (!clientId || !clientSecret) {
  console.error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first.')
  process.exit(1)
}

const port = new URL(redirectUri).port || '8888'
const authorizeUrl = new URL('https://accounts.spotify.com/authorize')
authorizeUrl.searchParams.set('client_id', clientId)
authorizeUrl.searchParams.set('response_type', 'code')
authorizeUrl.searchParams.set('redirect_uri', redirectUri)
authorizeUrl.searchParams.set('scope', scopes)

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', redirectUri)
  if (url.pathname !== '/callback') {
    response.writeHead(404).end()
    return
  }
  if (url.searchParams.get('error')) {
    response.writeHead(400, { 'Content-Type': 'text/plain' }).end('Spotify authorization was denied.')
    server.close()
    return
  }
  const code = url.searchParams.get('code')
  if (!code) {
    response.writeHead(400, { 'Content-Type': 'text/plain' }).end('Missing authorization code.')
    return
  }

  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
    })
    const token = await tokenResponse.json()
    if (!tokenResponse.ok || !token.refresh_token) {
      response.writeHead(500, { 'Content-Type': 'text/plain' }).end('Could not exchange the Spotify authorization code.')
      return
    }
    response.writeHead(200, { 'Content-Type': 'text/plain' })
    response.end(`Spotify refresh token:\n\n${token.refresh_token}\n\nAdd it to .env.local as SPOTIFY_REFRESH_TOKEN.`)
    console.log('\nSPOTIFY_REFRESH_TOKEN=' + token.refresh_token)
    console.log('Add the token to .env.local, then restart the app.')
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain' }).end('Spotify token exchange failed.')
  } finally {
    server.close()
  }
})

server.listen(Number(port), '127.0.0.1', () => {
  console.log('Add this exact redirect URI to your Spotify app:')
  console.log(`  ${redirectUri}\n`)
  console.log('Open this URL in your browser:')
  console.log(`  ${authorizeUrl.toString()}\n`)
})
