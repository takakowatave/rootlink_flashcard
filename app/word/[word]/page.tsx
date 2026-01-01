import type { Metadata } from "next";

type Props = {
  params: Promise<{ word: string }>;
};

// ✅ SEO用
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { word } = await params;

  return {
    title: `${word} | RootLink`,
    description: `${word} を覚えやすく学ぶページ`,
  };
}

// ✅ 画面表示用
export default async function Page({ params }: Props) {
  const { word } = await params;

  return (
    <main style={{ padding: 24 }}>
      <h1>{word}</h1>
    </main>
  );
}
