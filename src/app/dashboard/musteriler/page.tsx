export default function Page() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: 54, background: 'var(--s1)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 22px' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Müşteriler</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13 }}>
        Bu sayfa geliştiriliyor...
      </div>
    </div>
  )
}
