'use client'

import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '@/lib/apiClient'
import { idiomPrompt } from '@/prompts/idiom'
import type { Idiom } from '@/types/Idiom'

async function fetchFromAI(prompt: string): Promise<Idiom> {
    return apiRequest('/chat', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    })
    }

    export default function IdiomPageClient({ slug }: { slug: string }) {
    const [idiom, setIdiom] = useState<Idiom | null>(null)
    const [error, setError] = useState<string | null>(null)

    const hasGeneratedRef = useRef(false)

    // slug → phrase
    const phrase = slug.replace(/-/g, ' ')

    useEffect(() => {
        setIdiom(null)
        setError(null)
        hasGeneratedRef.current = false
    }, [slug])

    useEffect(() => {
        if (hasGeneratedRef.current) return
        hasGeneratedRef.current = true

        const run = async () => {
        try {
            const prompt = idiomPrompt(phrase)
            const result = await fetchFromAI(prompt)

            setIdiom({
            phrase,
            meaning: result.meaning,
            examples: result.examples.slice(0, 3),
            })
        } catch (e) {
            console.error(e)
            setError('Failed to generate idiom')
        }
        }

        run()
    }, [phrase])

    if (error) return <p className="text-red-500">{error}</p>
    if (!idiom) return null

    return (
        <main className="space-y-4">
        <h1 className="text-xl font-bold">{idiom.phrase}</h1>

        <p>{idiom.meaning}</p>

        <ul className="space-y-2">
            {idiom.examples.map((ex, i) => (
            <li key={i}>
                <div>{ex.sentence}</div>
                <div className="text-sm text-gray-600">{ex.translation}</div>
            </li>
            ))}
        </ul>
        </main>
    )
}
