export default function DaydreamLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#0c0c10"/>
      {/* Dış D - beyaz dolgu */}
      <path d="M22 16 L22 84 L38 84 C62 84 76 70 76 50 C76 30 62 16 38 16 Z" fill="white"/>
      {/* İlk siyah boşluk */}
      <path d="M30 24 L30 76 L38 76 C56 76 67 65 67 50 C67 35 56 24 38 24 Z" fill="#0c0c10"/>
      {/* İç D - beyaz */}
      <path d="M36 30 L36 70 L40 70 C54 70 62 62 62 50 C62 38 54 30 40 30 Z" fill="white"/>
      {/* D iç boşluk - siyah */}
      <path d="M42 36 L42 64 C52 62 57 57 57 50 C57 43 52 38 42 36 Z" fill="#0c0c10"/>
      {/* Dağ silueti */}
      <polygon points="46,62 53,44 60,62" fill="white"/>
      <polygon points="42,62 48,50 54,62" fill="white"/>
    </svg>
  )
}
