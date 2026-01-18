import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Improve ME Institute App'
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
            fontSize: 96,
            fontWeight: 'bold',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          Improve ME Institute App
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
