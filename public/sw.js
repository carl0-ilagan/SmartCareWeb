// Service Worker for Smart Care PWA
const CACHE_NAME = 'smart-care-v5'
const STATIC_CACHE = 'smart-care-static-v5'
const DYNAMIC_CACHE = 'smart-care-dynamic-v5'
const API_CACHE = 'smart-care-api-v5'

// Runtime branding icon (sent from client when admin changes logo)
let latestBrandingIcon = null

// Static assets to cache on install (for all roles: patient, doctor, admin)
const urlsToCache = [
  // Landing page and public pages
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/information',
  '/privacy',
  '/terms',
  
  // Patient (Dashboard) pages - ALL routes
  '/dashboard',
  '/dashboard/appointments',
  '/dashboard/messages',
  '/dashboard/prescriptions',
  '/dashboard/records',
  '/dashboard/notifications',
  '/dashboard/settings',
  '/dashboard/profile',
  '/dashboard/doctors',
  '/dashboard/feedback',
  '/dashboard/calls',
  // Patient dynamic routes will be cached on visit
  
  // Doctor pages - ALL routes
  '/doctor/dashboard',
  '/doctor/appointments',
  '/doctor/appointments/new',
  '/doctor/chat',
  '/doctor/patients',
  '/doctor/prescriptions',
  '/doctor/prescriptions/new',
  '/doctor/records',
  '/doctor/notifications',
  '/doctor/settings',
  '/doctor/profile',
  '/doctor/calls',
  '/doctor/feedback',
  // Note: Dynamic routes like /doctor/patients/[id] will be cached automatically when visited
  
  // Admin pages - ALL routes
  '/admin/dashboard',
  '/admin/patients',
  '/admin/doctors',
  '/admin/appointments',
  '/admin/settings',
  '/admin/profile',
  '/admin/analytics',
  '/admin/feedback',
  '/admin/information-pages',
  '/admin/logs',
  '/admin/pending-accounts',
  '/admin/reports',
  '/admin/roles',
  '/admin/welcome-editor',
  '/admin/architecture',
  '/admin/messages',
  
  // Assets
  '/SmartCare.png',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
  '/placeholder-user.jpg',
]

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
}

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Use individual cache.add() calls instead of addAll() to handle failures gracefully
      // This way, if one URL fails, others can still be cached
      const cachePromises = urlsToCache.map((url) => {
        return cache.add(url).catch((err) => {
          // Log but don't fail - some routes might not exist in development
          console.log(`[SW] Failed to cache ${url}:`, err.message)
          return null // Return null so Promise.all doesn't fail
        })
      })
      
      return Promise.all(cachePromises).then(() => {
        console.log('[SW] Static cache populated (some resources may have failed in development)')
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => 
            cacheName !== CACHE_NAME && 
            cacheName !== STATIC_CACHE && 
            cacheName !== DYNAMIC_CACHE && 
            cacheName !== API_CACHE
          )
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  return self.clients.claim()
})

// Helper: map Next.js data route to its page HTML (for offline fallback)
function mapDataRouteToPage(pathname) {
  // Example: /_next/data/<build-id>/doctor/dashboard.json -> /doctor/dashboard
  try {
    const parts = pathname.split('/').filter(Boolean) // ["_next","data","<build>","doctor","dashboard.json"]
    if (parts.length >= 4 && parts[0] === '_next' && parts[1] === 'data') {
      const pageParts = parts.slice(3)
      if (pageParts.length === 1 && pageParts[0] === 'index.json') return '/'
      const last = pageParts[pageParts.length - 1]
      if (last && last.endsWith('.json')) {
        pageParts[pageParts.length - 1] = last.replace(/\.json$/, '')
      }
      return '/' + pageParts.join('/')
    }
  } catch (e) {
    // no-op
  }
  return null
}

// Helper function to determine cache strategy based on request type
function getCacheStrategy(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Static assets - cache first
  if (
    pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i) ||
    pathname.startsWith('/_next/static/')
  ) {
    return CACHE_STRATEGIES.CACHE_FIRST
  }

  // Next.js data routes - cache first with fallback to page HTML
  if (pathname.startsWith('/_next/data/')) {
    return CACHE_STRATEGIES.CACHE_FIRST
  }

  // Manifest can be served cache-first as we return dynamic content
  if (pathname === '/manifest.json') {
    return CACHE_STRATEGIES.CACHE_FIRST
  }

  // API calls - network first with cache fallback
  if (pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.NETWORK_FIRST
  }

  // HTML pages - stale while revalidate for offline support
  // This includes all pages: landing, dashboard, doctor, admin, profile, etc.
  // Enable offline caching for ALL role pages
  if (
    request.mode === 'navigate' || 
    request.headers.get('accept')?.includes('text/html') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/doctor') ||
    pathname.startsWith('/admin') ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup'
  ) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE
  }

  // Default: network first
  return CACHE_STRATEGIES.NETWORK_FIRST
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) {
    return cached
  }
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // If offline and no cache, try route-specific fallbacks for navigation
    if (request.mode === 'navigate') {
      const url = new URL(request.url)
      const pathname = url.pathname
      
      // For dashboard routes, try smart fallback hierarchy
      if (pathname.startsWith('/dashboard')) {
        // Try exact parent route first (e.g., /dashboard/doctors for /dashboard/doctors/123)
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common dashboard routes in order of preference
        const fallbackRoutes = [
          '/dashboard',
          '/dashboard/appointments',
          '/dashboard/messages',
          '/dashboard/prescriptions',
          '/dashboard/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      } else if (pathname.startsWith('/doctor')) {
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common doctor routes in order of preference
        const fallbackRoutes = [
          '/doctor/dashboard',
          '/doctor/appointments',
          '/doctor/patients',
          '/doctor/prescriptions',
          '/doctor/chat',
          '/doctor/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      } else if (pathname.startsWith('/admin')) {
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        const adminPage = await cache.match('/admin/dashboard')
        if (adminPage) return adminPage
      }
      
      // Final fallback: landing page
      const offlinePage = await cache.match('/')
      if (offlinePage) return offlinePage
    }
    throw error
  }
}

// Network first strategy - Enhanced for better offline caching
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const staticCache = await caches.open(STATIC_CACHE)
  const dynamicCache = await caches.open(DYNAMIC_CACHE)
  
  try {
    const response = await fetch(request)
    if (response.ok && response.status === 200) {
      // Cache all successful responses (including dynamic routes)
      const url = new URL(request.url)
      const pathname = url.pathname
      
      // Cache role pages in both static and dynamic for redundancy
      if (pathname.startsWith('/dashboard') || 
          pathname.startsWith('/doctor') || 
          pathname.startsWith('/admin') ||
          pathname === '/' ||
          pathname === '/login' ||
          pathname === '/signup') {
        staticCache.put(request, response.clone())
        dynamicCache.put(request, response.clone())
      } else {
        cache.put(request, response.clone())
        dynamicCache.put(request, response.clone())
      }
    }
    return response
  } catch (error) {
    // Try exact cache match first - check all caches
    let cached = await cache.match(request) || 
                 await staticCache.match(request) || 
                 await dynamicCache.match(request)
    if (cached) {
      return cached
    }
    
    // For navigation requests, try route-specific fallbacks
    if (request.mode === 'navigate') {
      const url = new URL(request.url)
      const pathname = url.pathname
      
      // For dashboard routes, try smart fallback hierarchy
      if (pathname.startsWith('/dashboard')) {
        // Try exact parent route first (e.g., /dashboard/doctors for /dashboard/doctors/123)
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common dashboard routes in order of preference
        const fallbackRoutes = [
          '/dashboard',
          '/dashboard/appointments',
          '/dashboard/messages',
          '/dashboard/prescriptions',
          '/dashboard/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      } else if (pathname.startsWith('/doctor')) {
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common doctor routes in order of preference
        const fallbackRoutes = [
          '/doctor/dashboard',
          '/doctor/appointments',
          '/doctor/patients',
          '/doctor/prescriptions',
          '/doctor/chat',
          '/doctor/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      } else if (pathname.startsWith('/admin')) {
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        const adminPage = await cache.match('/admin/dashboard')
        if (adminPage) return adminPage
      }
      
      // Final fallback: landing page
      const offlinePage = await cache.match('/')
      if (offlinePage) return offlinePage
    }
    throw error
  }
}

// Stale while revalidate strategy - Enhanced for better offline support
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const staticCache = await caches.open(STATIC_CACHE)
  const dynamicCache = await caches.open(DYNAMIC_CACHE)
  
  // Check all caches for the request
  let cached = await cache.match(request) || 
               await staticCache.match(request) || 
               await dynamicCache.match(request)
  
  // Fetch fresh content in background (always try to update cache)
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok && response.status === 200) {
      // Cache successful responses in appropriate cache
      const url = new URL(request.url)
      const pathname = url.pathname
      
      // Determine which cache to use
      let targetCache = dynamicCache
      if (pathname.startsWith('/dashboard') || 
          pathname.startsWith('/doctor') || 
          pathname.startsWith('/admin') ||
          pathname === '/' ||
          pathname === '/login' ||
          pathname === '/signup') {
        // Cache role pages in both static and dynamic for redundancy
        staticCache.put(request, response.clone())
        dynamicCache.put(request, response.clone())
      } else {
        dynamicCache.put(request, response.clone())
      }
    }
    return response
  }).catch((error) => {
    // Ignore network errors for background fetch - we'll use cache
    console.log('[SW] Background fetch failed (offline):', request.url)
  })

  // Return cached version immediately if available (for instant offline support)
  if (cached) {
    // Still try to update in background
    fetchPromise.catch(() => {}) // Suppress errors
    return cached
  }

  // If no cache, wait for network
  try {
    return await fetchPromise
  } catch (error) {
    // If offline and navigation, try to find any cached page with smart fallback
    if (request.mode === 'navigate') {
      const url = new URL(request.url)
      const pathname = url.pathname
      
      // For dashboard routes, try smart fallback hierarchy
      if (pathname.startsWith('/dashboard')) {
        // Try exact parent route first (e.g., /dashboard/doctors for /dashboard/doctors/123)
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          // Remove last part (dynamic ID) and try parent route
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common dashboard routes in order of preference
        const fallbackRoutes = [
          '/dashboard',
          '/dashboard/appointments',
          '/dashboard/messages',
          '/dashboard/prescriptions',
          '/dashboard/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      }
      
      // For doctor routes, try smart fallback hierarchy
      if (pathname.startsWith('/doctor')) {
        // Try exact parent route first (e.g., /doctor/patients for /doctor/patients/123)
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        
        // Try common doctor routes in order of preference
        const fallbackRoutes = [
          '/doctor/dashboard',
          '/doctor/appointments',
          '/doctor/patients',
          '/doctor/prescriptions',
          '/doctor/chat',
          '/doctor/records',
        ]
        
        for (const route of fallbackRoutes) {
          const fallbackPage = await cache.match(route)
          if (fallbackPage) return fallbackPage
        }
      }
      
      // For admin routes
      if (pathname.startsWith('/admin')) {
        const pathParts = pathname.split('/').filter(Boolean)
        if (pathParts.length > 2) {
          const parentPath = '/' + pathParts.slice(0, -1).join('/')
          const parentPage = await cache.match(parentPath)
          if (parentPage) return parentPage
        }
        const adminPage = await cache.match('/admin/dashboard')
        if (adminPage) return adminPage
      }
      
      // Final fallback: landing page
      const offlinePage = await cache.match('/')
      if (offlinePage) return offlinePage
    }
    throw error
  }
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip cross-origin requests (except for same origin)
  if (!url.origin || url.origin !== self.location.origin) return

  const pathname = url.pathname

  // Serve manifest dynamically with latest branding icon
  if (pathname === '/manifest.json') {
    event.respondWith(
      (async () => {
        const iconUrl = latestBrandingIcon || '/SmartCare.png'
        const ts = Date.now()
        const manifest = {
          name: 'Smart Care - Healthcare Platform',
          short_name: 'Smart Care',
          description: 'A modern telehealth platform for all your healthcare needs',
          start_url: '/',
          display: 'standalone',
          background_color: '#f5f3f0',
          theme_color: '#f59e0b',
          orientation: 'portrait-primary',
          icons: [
            { src: `${iconUrl}?t=${ts}&size=192`, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: `${iconUrl}?t=${ts}&size=512`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
          categories: ['healthcare', 'medical', 'productivity'],
          screenshots: [],
          shortcuts: [
            { name: 'Book Appointment', short_name: 'Book', description: 'Book a new appointment with a doctor', url: '/dashboard/appointments/new', icons: [{ src: `${iconUrl}?t=${ts}&size=96`, sizes: '96x96' }] },
            { name: 'Messages', short_name: 'Messages', description: 'View your messages', url: '/dashboard/messages', icons: [{ src: `${iconUrl}?t=${ts}&size=96`, sizes: '96x96' }] },
            { name: 'Prescriptions', short_name: 'Prescriptions', description: 'View your prescriptions', url: '/dashboard/prescriptions', icons: [{ src: `${iconUrl}?t=${ts}&size=96`, sizes: '96x96' }] },
          ],
          share_target: {
            action: '/share',
            method: 'POST',
            enctype: 'multipart/form-data',
            params: {
              title: 'title',
              text: 'text',
              url: 'url',
              files: [{ name: 'files', accept: ['image/*', 'application/pdf'] }],
            },
          },
        }
        return new Response(JSON.stringify(manifest), {
          status: 200,
          headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-store' },
        })
      })()
    )
    return
  }

  // Handle Next.js data routes explicitly so we can give offline fallbacks
  if (pathname.startsWith('/_next/data/')) {
    const dataRequest = event.request
    event.respondWith(
      (async () => {
        const cache = await caches.open(DYNAMIC_CACHE)
        const pagePath = mapDataRouteToPage(pathname)

        // Serve cache if available
        const cached = await cache.match(dataRequest)
        if (cached) {
          // Refresh in background
          fetch(dataRequest).then((res) => {
            if (res.ok) cache.put(dataRequest, res.clone())
          }).catch(() => {})
          return cached
        }

        // Try network then cache
        try {
          const res = await fetch(dataRequest)
          if (res.ok) {
            cache.put(dataRequest, res.clone())
          }
          return res
        } catch (err) {
          // Offline fallback to corresponding HTML page
          if (pagePath) {
            const staticCache = await caches.open(STATIC_CACHE)
            const dynamicCache = await caches.open(DYNAMIC_CACHE)
            const fallbackPage = await staticCache.match(pagePath) || await dynamicCache.match(pagePath) || await staticCache.match('/') || await dynamicCache.match('/')
            if (fallbackPage) return fallbackPage
          }
          return new Response('Offline - data unavailable', { status: 200, headers: { 'Content-Type': 'text/plain' } })
        }
      })()
    )
    return
  }

  // Skip other internal Next.js/internal routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/__nextjs') ||
    pathname.includes('/_next/') ||
    pathname.includes('/__nextjs/') ||
    pathname.includes('/node_modules/') ||
    url.searchParams.has('_next') ||
    event.request.headers.get('x-nextjs-data') !== null ||
    event.request.headers.get('next-router-prefetch') !== null ||
    event.request.headers.get('next-router-state-tree') !== null
  ) {
    return // Let Next.js handle its own routes
  }

  // Determine cache strategy
  const strategy = getCacheStrategy(event.request)
  let cacheName = DYNAMIC_CACHE

  // Choose appropriate cache based on request type
  if (strategy === CACHE_STRATEGIES.CACHE_FIRST) {
    cacheName = STATIC_CACHE
  } else if (pathname.startsWith('/api/')) {
    cacheName = API_CACHE
  }

  event.respondWith(
    (async () => {
      try {
        switch (strategy) {
          case CACHE_STRATEGIES.CACHE_FIRST:
            return await cacheFirst(event.request, cacheName)
          case CACHE_STRATEGIES.NETWORK_FIRST:
            return await networkFirst(event.request, cacheName)
          case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return await staleWhileRevalidate(event.request, cacheName)
          default:
            return await networkFirst(event.request, cacheName)
        }
      } catch (error) {
        console.error('[SW] Fetch error:', error)
        // For navigation requests, try to return cached page with smart fallback
        if (event.request.mode === 'navigate') {
          const cache = await caches.open(STATIC_CACHE)
          const dynamicCache = await caches.open(DYNAMIC_CACHE)
          const url = new URL(event.request.url)
          const pathname = url.pathname
          
          // Try exact match in both caches
          let offlinePage = await cache.match(event.request) || await dynamicCache.match(event.request)
          if (offlinePage) return offlinePage
          
          // For dashboard routes, try smart fallback hierarchy
          if (pathname.startsWith('/dashboard')) {
            // Try exact parent route first (e.g., /dashboard/doctors for /dashboard/doctors/123)
            const pathParts = pathname.split('/').filter(Boolean)
            if (pathParts.length > 2) {
              const parentPath = '/' + pathParts.slice(0, -1).join('/')
              offlinePage = await cache.match(parentPath) || await dynamicCache.match(parentPath)
              if (offlinePage) return offlinePage
            }
            
            // Try common dashboard routes in order of preference
            const fallbackRoutes = [
              '/dashboard',
              '/dashboard/appointments',
              '/dashboard/messages',
              '/dashboard/prescriptions',
              '/dashboard/records',
            ]
            
            for (const route of fallbackRoutes) {
              offlinePage = await cache.match(route) || await dynamicCache.match(route)
              if (offlinePage) return offlinePage
            }
          } else if (pathname.startsWith('/doctor')) {
            const pathParts = pathname.split('/').filter(Boolean)
            if (pathParts.length > 2) {
              const parentPath = '/' + pathParts.slice(0, -1).join('/')
              offlinePage = await cache.match(parentPath) || await dynamicCache.match(parentPath)
              if (offlinePage) return offlinePage
            }
            
            // Try common doctor routes in order of preference
            const fallbackRoutes = [
              '/doctor/dashboard',
              '/doctor/appointments',
              '/doctor/patients',
              '/doctor/prescriptions',
              '/doctor/chat',
              '/doctor/records',
            ]
            
            for (const route of fallbackRoutes) {
              offlinePage = await cache.match(route) || await dynamicCache.match(route)
              if (offlinePage) return offlinePage
            }
          } else if (pathname.startsWith('/admin')) {
            const pathParts = pathname.split('/').filter(Boolean)
            if (pathParts.length > 2) {
              const parentPath = '/' + pathParts.slice(0, -1).join('/')
              offlinePage = await cache.match(parentPath) || await dynamicCache.match(parentPath)
              if (offlinePage) return offlinePage
            }
            offlinePage = await cache.match('/admin/dashboard') || await dynamicCache.match('/admin/dashboard')
            if (offlinePage) return offlinePage
          }
          
          // Final fallback: landing page
          offlinePage = await cache.match('/') || await dynamicCache.match('/')
          if (offlinePage) return offlinePage
        }
        // Return offline message as last resort
        return new Response('Offline - Please check your connection', { 
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      }
    })()
  )
})

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Smart Care'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/SmartCare.png',
    badge: '/SmartCare.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle messages from the app (for triggering push notifications and pre-caching)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
    const { payload } = event.data
    
    // Request notification permission if needed
    self.registration.showNotification(payload.title || 'Smart Care', {
      body: payload.body || 'You have a new notification',
      icon: payload.icon || '/SmartCare.png',
      badge: payload.badge || '/SmartCare.png',
      vibrate: [200, 100, 200],
      data: payload.data || {},
      tag: payload.tag || 'appointment-notification',
      requireInteraction: false,
      silent: false,
    }).catch((error) => {
      console.error('Error showing notification:', error)
    })
  }
  
  // Update branding icon for manifest
  if (event.data && event.data.type === 'PWA_ICON_UPDATE') {
    latestBrandingIcon = event.data.iconUrl || null
  }
  
  // Handle pre-cache requests for specific pages
  if (event.data && event.data.type === 'PRE_CACHE') {
    const { urls } = event.data
    if (urls && Array.isArray(urls)) {
      event.waitUntil(
        caches.open(DYNAMIC_CACHE).then((cache) => {
          return Promise.all(
            urls.map((url) => {
              return fetch(url)
                .then((response) => {
                  if (response.ok) {
                    return cache.put(url, response)
                  }
                })
                .catch((error) => {
                  console.log('[SW] Failed to pre-cache:', url, error)
                })
            })
          )
        })
      )
    }
  }
  
  // Handle skip waiting (for service worker updates)
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})

