import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./config/sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./config/sentry.edge.config')
  }
}

// Capture request errors from React Server Components
export const onRequestError = Sentry.captureRequestError
