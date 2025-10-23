import * as Sentry from '@sentry/nextjs'
import './sentry.client.config'

// Capture router transitions for performance monitoring
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
