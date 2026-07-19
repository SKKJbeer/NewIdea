import { ImageResponse } from 'next/og';
import { fetchCardById, displayPrice } from '@/lib/pokemon-api';

// Dynamisches OG-Bild pro Karte — Kartenmotiv + Name + Preis. Macht geteilte
// Kartenlinks (WhatsApp/Discord/X) sofort attraktiv statt nackter Text.
export const alt = 'Pokémon Karte — PokéMarket Intelligence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await fetchCardById(id).catch(() => null);

  const name = card?.nameDe || card?.name || 'Pokémon Karte';
  const setName = card?.set || '';
  const price = card ? displayPrice(card) : 0;
  const priceText = price > 0 ? `${price.toFixed(2).replace('.', ',')} €` : null;
  const img = card?.imageUrl || null;

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
        {/* Text-Spalte */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 52,
                height: 52,
                borderRadius: 15,
                background: '#7c3aed',
                fontSize: 30,
                fontWeight: 800,
                marginRight: 16,
              }}
            >
              P
            </div>
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: '#cbd5e1' }}>
              <span>PokéMarket&nbsp;</span>
              <span style={{ color: '#a78bfa' }}>Intelligence</span>
            </div>
          </div>
          <div style={{ display: 'flex', fontSize: 58, fontWeight: 800, lineHeight: 1.1 }}>{name}</div>
          {setName ? (
            <div style={{ display: 'flex', fontSize: 30, color: '#94a3b8', marginTop: 18 }}>{setName}</div>
          ) : null}
          {priceText ? (
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 40 }}>
              <div style={{ display: 'flex', fontSize: 22, color: '#64748b', marginRight: 14 }}>Marktpreis</div>
              <div style={{ display: 'flex', fontSize: 56, fontWeight: 800, color: '#34d399' }}>{priceText}</div>
            </div>
          ) : null}
        </div>

        {/* Kartenbild */}
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} width={340} height={475} style={{ borderRadius: 18, objectFit: 'contain' }} alt="" />
        ) : null}
      </div>
    ),
    { ...size },
  );
}
