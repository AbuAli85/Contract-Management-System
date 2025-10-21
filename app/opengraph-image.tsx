import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Contract Management System';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 'bold',
              letterSpacing: '-0.02em',
            }}
          >
            Contract Management
          </div>
          <div
            style={{
              fontSize: 48,
              opacity: 0.9,
            }}
          >
            Professional contract generation & management
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

