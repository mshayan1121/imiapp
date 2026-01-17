import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'IMI - Interactive Mathematics Interface'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #2563eb, #1e3a8a)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div
          style={{
            fontSize: 128,
            fontWeight: 'bold',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          IMI
        </div>
        <div
          style={{
            fontSize: 48,
            display: 'flex',
            alignItems: 'center',
            opacity: 0.9,
          }}
        >
          Interactive Mathematics Interface
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
