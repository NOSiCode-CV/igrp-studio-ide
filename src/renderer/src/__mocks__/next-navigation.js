// Mock for next/navigation (Electron app has no Next.js router)
const noop = () => {}
const empty = () => ({})

export function useRouter() {
  return {
    back: noop,
    forward: noop,
    refresh: noop,
    push: noop,
    replace: noop,
    prefetch: noop
  }
}

export function usePathname() {
  return typeof window !== 'undefined' ? window.location.pathname : '/'
}

export function useSearchParams() {
  return typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams()
}

export function useParams() {
  return {}
}

export function notFound() {
  noop()
}

export function redirect() {
  noop()
}
