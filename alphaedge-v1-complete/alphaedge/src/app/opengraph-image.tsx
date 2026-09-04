import { ImageResponse } from 'next/og'

export const alt = 'AlphaEdge — AI market analysis, in plain English'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0d12',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 18,
              height: 104,
              marginRight: 32,
              borderRadius: 9,
              backgroundColor: '#00e5a0',
            }}
          />
          <div
            style={{
              fontSize: 128,
              color: '#e8eaf0',
              letterSpacing: -4,
            }}
          >
            AlphaEdge
          </div>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 42,
            color: '#8892a4',
          }}
        >
          AI market analysis, in plain English
        </div>
        <div
          style={{
            marginTop: 56,
            width: 320,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#111620',
          }}
        />
      </div>
    ),
    size
  )
}
