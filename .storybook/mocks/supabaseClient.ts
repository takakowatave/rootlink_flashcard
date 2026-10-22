// Storybook 用: 未ログイン状態を返すだけの supabase 代替。画面の見た目確認用で、通信はしない
type Result = { data: null; error: null }
const empty: Result = { data: null, error: null }
const chain: Record<string, unknown> = {}
for (const k of ['select', 'eq', 'is', 'not', 'ilike', 'in', 'order', 'limit', 'insert', 'update', 'delete', 'upsert']) {
  chain[k] = () => chain
}
chain.maybeSingle = async () => empty
chain.single = async () => empty
chain.then = (resolve: (r: Result) => void) => resolve(empty)
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => chain,
}
