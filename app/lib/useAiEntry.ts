import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/apiClient'

/**
 * useAiEntry
 *
 * 役割:
 * - AIへのリクエスト処理をコンポーネントから分離する
 * - データ取得・ローディング状態・エラー状態を一括管理する
 *
 * なぜ必要か:
 * - WordPage と LexicalUnitPage の両方で
 *   同じ「AI呼び出しロジック」が存在するため
 * - UIとデータ取得ロジックを分離し、
 *   メンテナンス性と可読性を上げるため
 *
 * 設計思想:
 * - コンポーネントは「表示だけ」に集中させる
 * - 副作用（fetch）は hook に閉じ込める
 *
 * ジェネリック<T>について:
 * - Word用のレスポンス型と
 *   LexicalUnit用のレスポンス型が異なるため
 * - 呼び出し側で型を指定できるようにしている
 *
 * 使用例:
 * const { data, loading, error } = useAiEntry<AiResponse>({
 *   prompt: wordPrompt(word)
 * })
 */

type UseAiEntryParams = {
  prompt: string
}

export function useAiEntry<T>({ prompt }: UseAiEntryParams) {
  // AIから返ってきたデータ
  const [data, setData] = useState<T | null>(null)

  // 通信中かどうか
  const [loading, setLoading] = useState(true)

  // エラーが起きたかどうか
  const [error, setError] = useState<string | null>(null)

  /**
   * prompt が変わったら再取得する
   *
   * useEffect は「副作用」
   * ＝レンダリング以外の処理（今回はfetch）を行う場所
   */
  useEffect(() => {
    if (!prompt) return

    setLoading(true)
    setError(null)

    const run = async () => {
      try {
        const res = await apiRequest('/chat', {
          method: 'POST',
          body: JSON.stringify({ prompt }),
        })

        setData(res)
      } catch (err) {
        setError('FAILED')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [prompt])

  /**
   * コンポーネント側に返すもの
   *
   * data    → AIの結果
   * loading → ローディング表示制御
   * error   → エラー表示制御
   */
  return { data, loading, error }
}
