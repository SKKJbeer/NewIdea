import { ImageResponse } from 'next/og';
import { readArticle, getArticleType, ARTICLE_META, articleLevel, LEVEL_LABEL } from '@/lib/article-generator';

// Dynamisches OG-Bild pro Artikel — Titel + Leitkarte + Level-Badge.
export const alt = 'Artikel — PokéMarket Intelligence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const LEVEL_COLOR: Record<string, string> = {
  einsteiger: '#34d399',
  fortgeschritten: '#fbbf24',
  profi: '#a78bfa',
};

export default async function Image({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const type = getArticleType(date);
  const article = type ? await readArticle(date).catch(() => null) : null;

  const meta = type ? ARTICLE_META[type] : null;
  const title = article?.title || meta?.label || 'PokéMarket Intelligence';
  const level = article && type ? articleLevel(article, type) : null;
  const heroImg = article?.featuredCards?.find((c) => c.imageUrl)?.imageUrl || null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #12122a 0%, #0a0a0f 55%)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '70px',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 26 }}>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2 }}>
              {meta?.category || 'Marktanalyse'}
            </div>
            {level ? (
              <div
                style={{
                  display: 'flex',
                  marginLeft: 18,
                  padding: '4px 14px',
                  borderRadius: 999,
                  fontSize: 20,
                  fontWeight: 700,
                  color: LEVEL_COLOR[level],
                  border: `2px solid ${LEVEL_COLOR[level]}`,
                }}
              >
                {LEVEL_LABEL[level]}
              </div>
            ) : null}
          </div>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, lineHeight: 1.15 }}>{title.slice(0, 110)}</div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 44 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 13, background: '#7c3aed', fontSize: 26, fontWeight: 800, marginRight: 14 }}>P</div>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: '#cbd5e1' }}>
              <span>PokéMarket&nbsp;</span>
              <span style={{ color: '#a78bfa' }}>Intelligence</span>
            </div>
          </div>
        </div>

        {heroImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImg} width={320} height={447} style={{ borderRadius: 18, objectFit: 'contain' }} alt="" />
        ) : null}
      </div>
    ),
    { ...size },
  );
}
