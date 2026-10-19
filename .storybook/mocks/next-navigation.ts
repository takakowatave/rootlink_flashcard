// Storybook (react-vite) には Next.js の App Router がないため、useRouter などを空実装で差し替える
const noop = () => {}
export const useRouter = () => ({ push: noop, replace: noop, back: noop, forward: noop, refresh: noop, prefetch: noop })
export const usePathname = () => '/'
export const useSearchParams = () => new URLSearchParams()
export const useParams = () => ({})
export const redirect = noop
export const notFound = noop
