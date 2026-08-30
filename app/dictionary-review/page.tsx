'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Proposal = {
  id: string
  word: string
  sense_id: string
  deck_id: string | null
  part_of_speech: string | null
  current_meaning_ja: string | null
  current_example_en: string | null
  current_example_ja: string | null
  proposed_meaning_ja: string
  proposed_example_en: string
  proposed_example_ja: string
  status: 'pending' | 'approved' | 'rejected' | 'applied'
  reviewer_note: string | null
  reviewed_at: string | null
  applied_at: string | null
  created_at: string
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'applied' | 'all'

const STATUS_LABEL: Record<Exclude<StatusFilter, 'all'>, string> = {
  pending: '未確認',
  approved: '承認済み',
  rejected: '却下',
  applied: '適用済み',
}

const STATUS_PILL: Record<Exclude<StatusFilter, 'all'>, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  applied: 'bg-sky-100 text-sky-800',
}

function highlightJa(ja: string, meaning: string): React.ReactNode {
  if (!meaning || !ja.includes(meaning)) return ja
  const idx = ja.indexOf(meaning)
  return (
    <>
      {ja.slice(0, idx)}
      <span className="text-orange-500 font-semibold">{meaning}</span>
      {ja.slice(idx + meaning.length)}
    </>
  )
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const meaningChanged = proposal.current_meaning_ja !== proposal.proposed_meaning_ja
  const exampleEnChanged = proposal.current_example_en !== proposal.proposed_example_en
  const exampleJaChanged = proposal.current_example_ja !== proposal.proposed_example_ja
  const jaContainsMeaning = proposal.proposed_example_ja.includes(proposal.proposed_meaning_ja)

  return (
    <div className="bg-white rounded-lg border border-line p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-baseline justify-between mb-3 gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-base font-bold text-gray-950 truncate">{proposal.word}</span>
          {proposal.part_of_speech && (
            <span className="text-xs text-muted">{proposal.part_of_speech}</span>
          )}
          <span className="text-xs text-muted font-mono">.{proposal.sense_id}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_PILL[proposal.status]}`}>
          {STATUS_LABEL[proposal.status]}
        </span>
      </div>

      {!jaContainsMeaning && (
        <div className="mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1">
          警告: proposed_example_ja に proposed_meaning_ja が含まれていません
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-muted uppercase tracking-wide">Current</div>
          <div>
            <div className="text-xs text-muted mb-0.5">意味</div>
            <div className="text-gray-800">{proposal.current_meaning_ja ?? <span className="text-muted italic">（なし）</span>}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-0.5">例文 EN</div>
            <div className="text-gray-800">{proposal.current_example_en ?? <span className="text-muted italic">（なし）</span>}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-0.5">例文 JA</div>
            <div className="text-gray-800">{proposal.current_example_ja ?? <span className="text-muted italic">（なし）</span>}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:border-l md:border-line md:pl-3">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Proposed</div>
          <div>
            <div className="text-xs text-muted mb-0.5">意味</div>
            <div className={`text-gray-950 ${meaningChanged ? 'font-semibold' : ''}`}>{proposal.proposed_meaning_ja}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-0.5">例文 EN</div>
            <div className={`text-gray-950 ${exampleEnChanged ? 'font-semibold' : ''}`}>{proposal.proposed_example_en}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-0.5">例文 JA</div>
            <div className={`text-gray-950 ${exampleJaChanged ? 'font-semibold' : ''}`}>
              {highlightJa(proposal.proposed_example_ja, proposal.proposed_meaning_ja)}
            </div>
          </div>
        </div>
      </div>

      {proposal.reviewer_note && (
        <div className="mt-3 text-xs text-muted border-t border-line pt-2">
          <span className="font-semibold">note:</span> {proposal.reviewer_note}
        </div>
      )}
    </div>
  )
}

export default function DictionaryReviewPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [wordFilter, setWordFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('dictionary_cache_proposals')
        .select('*')
        .order('word', { ascending: true })
        .order('sense_id', { ascending: true })
        .limit(2000)
      if (error) {
        console.error(error)
        setProposals([])
      } else {
        setProposals((data ?? []) as Proposal[])
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const byStatus = statusFilter === 'all' ? proposals : proposals.filter(p => p.status === statusFilter)
    const q = wordFilter.trim().toLowerCase()
    if (!q) return byStatus
    return byStatus.filter(p => p.word.toLowerCase().includes(q))
  }, [proposals, statusFilter, wordFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, Proposal[]>()
    for (const p of filtered) {
      const list = map.get(p.word) ?? []
      list.push(p)
      map.set(p.word, list)
    }
    return Array.from(map.entries())
  }, [filtered])

  const counts = useMemo(() => {
    const c: Record<Exclude<StatusFilter, 'all'>, number> = {
      pending: 0, approved: 0, rejected: 0, applied: 0,
    }
    for (const p of proposals) c[p.status]++
    return c
  }, [proposals])

  const statusTabs: StatusFilter[] = ['pending', 'approved', 'rejected', 'applied', 'all']

  return (
    <div className="bg-surface min-h-screen">
      <div className="flex justify-center w-full">
        <div className="w-full max-w-[812px] px-4 py-6">
          <div className="flex items-baseline justify-between mb-4 gap-3">
            <h1 className="text-xl font-bold text-gray-950">辞書 Proposal レビュー</h1>
            <span className="text-sm text-muted">{filtered.length} / {proposals.length}件</span>
          </div>

          <p className="text-xs text-muted mb-4">
            Claude が生成した meaning_ja / example_en / example_ja の提案を確認する画面。
            承認は口頭で伝えれば `dictionary_cache` に反映されます（この画面から DB は変更されません）。
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {statusTabs.map((s) => {
              const active = statusFilter === s
              const count = s === 'all' ? proposals.length : counts[s]
              const label = s === 'all' ? 'すべて' : STATUS_LABEL[s]
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-sm font-medium px-3 py-1 rounded-full border transition-colors ${
                    active ? 'bg-primary text-white border-primary' : 'border-line text-muted bg-white'
                  }`}
                >
                  {label} <span className="ml-1 opacity-70">{count}</span>
                </button>
              )
            })}
          </div>

          <input
            type="search"
            value={wordFilter}
            onChange={(e) => setWordFilter(e.target.value)}
            placeholder="単語で絞り込み"
            className="w-full h-9 px-3 mb-5 text-sm bg-white border border-line rounded-md focus:outline-none focus:border-primary"
          />

          {loading ? (
            <div className="flex justify-center py-16">
              <svg className="size-6 animate-spin text-muted" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted text-center py-16">該当する proposal がありません</p>
          ) : (
            <div className="flex flex-col gap-6">
              {grouped.map(([word, items]) => (
                <section key={word}>
                  <h2 className="text-sm font-semibold text-gray-700 mb-2 px-1">
                    {word} <span className="text-xs text-muted ml-1">{items.length} sense</span>
                  </h2>
                  <div className="flex flex-col gap-3">
                    {items.map((p) => (
                      <ProposalCard key={p.id} proposal={p} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
