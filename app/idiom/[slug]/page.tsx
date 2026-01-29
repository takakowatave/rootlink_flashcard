// app/idiom/[slug]/page.tsx

export default function IdiomPage({
    params,
    }: {
        params: { slug: string }
    }) {
        return (
        <main>
            <h1>{params.slug}</h1>
    
            <p>meaning (dummy)</p>
            <p>scene (dummy)</p>
            <p>example (dummy)</p>
        </main>
        )
    }
    