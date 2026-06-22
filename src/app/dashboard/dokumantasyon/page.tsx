'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'
import {
  BookOpen, Users, CheckSquare, CalendarDays, FileText,
  Activity, ShieldCheck, Receipt, BarChart2, TrendingUp,
  UserCog, SlidersHorizontal, ChevronRight, ChevronDown,
  LayoutDashboard, AlertCircle, Search, Bell, Workflow
} from 'lucide-react'

// ─────────────────────────────────────────────────────────
// VERİ
// ─────────────────────────────────────────────────────────

const ROLES = [
  {
    avatar: 'EA', name: 'Emir Alp', title: 'Founder / Admin',
    color: 'var(--ac)', bg: 'var(--ac2)',
    desc: 'Sistemin tam yöneticisi. Her sayfayı görür, her kararı onaylayabilir. Final onay ve müşteri ilişkileri yetkisi Emir\'dedir.',
    pages: ['Dashboard','Müşteriler','Görevler','Takvim (Tüm Ekip)','İçerik','Operasyon','Gecikmeler','Onay','Muhasebe','Finans','Performans','Kullanıcılar','Otomasyonlar','Ayarlar','Kılavuz'],
    tips: [
      'Kullanıcılar sayfasından ekip rollerini ve şifrelerini değiştirebilirsin',
      'Onay sayfasında "İç Onay → Müşteriye Gönder → Müşteri Onayı" 4 adımlı akışı yönetirsin',
      'Performans sayfasında ekip bazlı verimlilik skorlarını görebilirsin',
      'Otomasyonlar sayfasından geciken görev SMS bildirimlerini aktive edebilirsin',
    ]
  },
  {
    avatar: 'ME', name: 'Mert', title: 'Operations Manager',
    color: 'var(--blue)', bg: 'var(--blue2)',
    desc: 'Ajansın trafik yöneticisi. İşlerin doğru kişiye, doğru tarihe, doğru dosyayla müşteriye gitmesini sağlar. Yaratıcı karar vermez — koordinasyon yapar.',
    pages: ['Dashboard','Müşteriler','Görevler','Takvim (Tüm Ekip)','İçerik','Operasyon','Gecikmeler','Onay','Muhasebe','Finans','Performans','Otomasyonlar','Ayarlar','Kılavuz'],
    tips: [
      'Operasyon sayfası senin ana çalışma alandır — ACİL 3 İŞ, pipeline durumu, ekip yükü',
      'Takvimde "Tüm Ekip / Sadece Benim" toggle ile görünümü değiştirebilirsin',
      'Gecikmeler sayfasında geciken görevleri direkt "Tamamlandı" yapabilirsin',
      'Müşteriler → Proje → "Müşteri Paneli" butonu ile portal linki üretip WhatsApp\'tan gönderebilirsin',
    ]
  },
  {
    avatar: 'ÜY', name: 'Ekip Üyeleri', title: 'Member',
    color: 'var(--green)', bg: 'var(--green2)',
    desc: 'Aslı, Gizem, Yasin, Caner, Batuhan, Kerem gibi ekip üyeleri bu role sahiptir. Her biri sadece kendine atanmış içerik ve görevleri görür.',
    pages: ['Dashboard (Sadece kendi verileri)','Görevler (Sadece kendine atananlar)','Takvim (Sadece kendi)','İçerik (Sadece kendine atananlar)','Onay (Kendi talepleri)','Ayarlar','Kılavuz'],
    tips: [
      'Görevler sayfasında sadece sana atanmış görevler görünür',
      'Görevi "Devam"a aldığında süre otomatik sayılmaya başlar',
      'İçeriği onaya göndermek için İçerik → Detay → "Onaya Gönder" butonunu kullan',
      'Kendi şifreni Ayarlar → Güvenlik sekmesinden değiştirebilirsin',
    ]
  },
]

const PAGES = [
  {
    icon: LayoutDashboard, name: 'Dashboard', color: 'var(--ac)', who: 'Herkes',
    desc: 'Sistemin ana ekranı. KPI kartları, gelir trendi, görev durumu, geciken görevler ve müşteri kararları anlık gösterilir.',
    features: [
      'KPI kartlarına tıklayarak ilgili sayfaya geçebilirsin',
      'Müşteri Kararları kartı — onaylayan veya revizyon isteyen müşteriler listelenir',
      'Özel günler bandı — haftaya giren pazarlama günleri üstte gösterilir',
      'Veri gerçek zamanlı güncellenir — F5\'e gerek yok',
      'Member rolü sadece kendi görevlerini ve verilerini görür',
    ],
  },
  {
    icon: Users, name: 'Müşteriler', color: 'var(--blue)', who: 'Emir, Mert',
    desc: 'Müşteri yönetimi ve proje takibinin tek sayfadan yapıldığı yerdir. Müşteri ekle, proje oluştur, aşama tanımla, dosya yükle — hepsi burada.',
    features: [
      'Sol listeden müşteriyi seç → 4 sekme: Projeler, Görevler, İçerik, Finans',
      'Projeler sekmesi: Sol listeden proje seç → Detay, Aşamalar, Görevler (kanban), Dosyalar',
      'Proje üst kısmındaki "Portal" butonu ile proje bazlı link oluşturulur',
      '"Müşteri Paneli" butonu (müşteri header\'ında) — tüm projeleri kapsayan kalıcı link üretir',
      'WhatsApp butonu: Müşterinin kayıtlı telefon numarasına otomatik mesaj gönderir',
      'Müşteri eklenince portal tokeni otomatik oluşturulur',
    ],
    note: 'Müşteriye link gönderirken "Müşteri Paneli" linkini kullan — tüm proje geçmişini görür. Proje bazlı link sadece o projeyi gösterir.',
  },
  {
    icon: CheckSquare, name: 'Görevler', color: 'var(--ac)', who: 'Herkes (rol bazlı)',
    desc: 'Kanban tahtası. Bekliyor → Devam → Kontrol → Tamam sütunları. Göreve tıklayınca detay paneli açılır.',
    features: [
      'Yeni görev: Firma → Proje → Sorumlu → Öncelik → Deadline sırasıyla doldur',
      'Göreve tıkla → Detay, Yorumlar, Süre Takibi sekmeleri',
      'Süre takibi otomatik — "Devam"a alınınca başlar, statü değişince durur',
      'Realtime: Başka sayfadan görev eklenince kanban anında güncellenir',
      'Süre Takibi: Görev "Devam"a alınınca sayaç otomatik başlar, başka statüye geçince kapanır',
      'Görev "Tamam"a alınınca tamamlanma zamanı otomatik kaydedilir',
      'Süre sekmesi: Her çalışma oturumu ayrı ayrı listelenir, toplam süre gösterilir',
      'Member: Sadece kendi görevi; sadece Bekliyor→Devam ve Devam→Kontrol geçişi yapabilir',
      'Admin/Manager: Tüm geçişler ve silme yetkisi',
    ],
  },
  {
    icon: CalendarDays, name: 'Takvim', color: 'var(--blue)', who: 'Herkes (rol bazlı)',
    desc: 'Görev deadline\'larını aylık takvim üzerinde gösterir. İçerik yayın tarihleri de takvimde görünür.',
    features: [
      'Member: Sadece kendine atanmış görevler',
      'Admin/Manager: Tüm ekip görünür, toggle ile "Sadece Benim" filtrelenebilir',
      'Güne tıkla → Sağ panelde o günün görevleri listelenir',
      'Bu Hafta özeti: tamamlanan / devam eden / bekleyen sayılar',
      'Sarı etiket: Yayın tarihi olan içerikler',
    ],
  },
  {
    icon: FileText, name: 'İçerik', color: 'var(--amber)', who: 'Herkes (rol bazlı)',
    desc: '5 aşamalı içerik üretim workflow\'u. Taslak → İç Onay → Müşteri Onayı → Revizyon → Yayında.',
    features: [
      'Workflow şeridi üstte her aşamada kaç içerik olduğunu gösterir',
      'Karta tıkla → Sağ panelde durum değiştir, müşteri ata, onaya gönder',
      '"Onaya Gönder" butonu: Taslak içeriklerde görünür, Onay sayfasına talep düşer',
      'Müşteri bazlı filtreleme: Her müşterinin içeriklerini ayrı listele',
      'Member: Sadece kendi içerikleri; sadece Taslak → Onay geçişi yapabilir',
    ],
  },
  {
    icon: Activity, name: 'Operasyon', color: 'var(--ac)', who: 'Emir, Mert',
    desc: 'Mert\'in ana çalışma ekranı. Anlık iş durumu, ekip yükü, müşteri pipeline\'ı ve gün sonu checklist.',
    features: [
      'ACİL 3 İŞ: Kritik/yüksek öncelikli gecikmiş görevler kırmızı bannerda',
      'İçerik Pipeline: Hangi aşamada kaç içerik olduğu görülür',
      'Ekip Yükü: Her kişinin taşıdığı aktif iş sayısı ve gecikme oranı',
      'Müşteri Durumu: Her müşteri için açık/geciken/tamamlanan özet',
      'Gün Sonu Kapanış Checklist: 6 maddelik kontrol listesi',
    ],
  },
  {
    icon: AlertCircle, name: 'Gecikmeler', color: 'var(--red)', who: 'Emir, Mert',
    desc: 'Deadline\'ı geçmiş tüm görevler. Öncelik sırasına göre listelenir. Buradan direkt "Tamamlandı" yapılabilir.',
    features: [
      'Kaç gün geciktiği her görevde belirtilir',
      'Müşteri adı ve sorumlu kişi görünür',
      '"Tamamlandı" butonu ile görev kapatılır',
      'Otomasyonlar aktifse geciken görevler için SMS gönderilir',
    ],
  },
  {
    icon: ShieldCheck, name: 'Onay', color: 'var(--amber)', who: 'Herkes (kısıtlı)',
    desc: '4 adımlı onay akışı: Talep Oluştur → İç Onay → Müşteriye Gönder → Müşteri Onayı.',
    features: [
      '1. Talep Oluştur — herkes açabilir (İçerik sayfasından da otomatik düşer)',
      '2. İç Onay — Emir veya Mert "Onayla" / "Reddet" eder; talebi açana bildirim gider',
      '3. Müşteriye Gönder — "Portal Linki Oluştur" butonuyla link kopyalanır',
      '4. Müşteri Onayı — Müşterinin portal kararı (onay/revizyon/not) burada görünür',
      'Müşteri karar verince admin+manager\'a push + in-app bildirim gönderilir',
      'Revizyon gelince ilgili içerik otomatik "Revizyon" durumuna çekilir',
    ],
    note: 'İç onay olmadan "Portal Linki Oluştur" butonu aktif olmaz. Akış sırayı takip eder.',
  },
  {
    icon: Receipt, name: 'Muhasebe', color: 'var(--green)', who: 'Emir, Mert',
    desc: 'Gelir ve gider kayıtları. Müşteri ve proje bazlı filtrelenebilir.',
    features: [
      'Gelir / Gider sekmeli görünüm',
      'Ödendi / Bekliyor / Gecikti durumları',
      'Müşteri ve proje bağlantısı kurulabilir',
      'Kayıt silinince liste anında güncellenir',
    ],
  },
  {
    icon: BarChart2, name: 'Finans', color: 'var(--green)', who: 'Emir, Mert',
    desc: 'Gelir-gider grafikleri ve finansal özet.',
    features: [
      'Son 6 aylık gelir bar chart',
      'Net kâr / tahsilat bekleyen özeti',
      'Son işlemler listesi',
    ],
  },
  {
    icon: TrendingUp, name: 'Performans', color: 'var(--ac)', who: 'Emir, Mert',
    desc: 'Ekip performans skorları, müşteri bazlı içerik timeline ve tüm sistem aktivite logu.',
    features: [
      'Her ekip üyesi için performans skoru (tamamlanan/geciken oranı)',
      'Müşteri bazlı içerik durumu: taslak/yayın/revizyon sayıları',
      '"Kim Ne Zaman Ne Yaptı" — tüm işlemler loglanır',
    ],
  },
  {
    icon: Bell, name: 'Bildirimler', color: 'var(--ac)', who: 'Herkes',
    desc: 'Sağ üstteki çan ikonu. Tıklayınca ilgili sayfaya yönlendirir.',
    features: [
      'Onay talebiniz onaylandı/reddedildi → size bildirim',
      'Müşteri onayladı veya revizyon istedi → admin+manager\'a bildirim',
      'Görev gecikti → size ve admin+manager\'a bildirim',
      'Push bildirimi: Telefon/tarayıcıya, uygulama kapalıyken bile gelir',
    ],
  },
  {
    icon: UserCog, name: 'Kullanıcılar', color: 'var(--ac)', who: 'Sadece Emir',
    desc: 'Ekip üyelerini yönet. Rol, departman, telefon güncelle. Şifre sıfırla. Yeni kullanıcı davet et.',
    features: [
      'Kullanıcı rolünü değiştir: Admin / Manager / Member',
      '"Şifre Değiştir" butonu — seçili kullanıcının şifresini sıfırla',
      '"Sayfa Erişimi" sekmesi — o kullanıcının görebileceği sayfaları listeler',
      'Yeni kullanıcı daveti: E-posta gönderilir, kişi /login\'den giriş yapar',
      'Kendi rolünü değiştiremezsin',
    ],
  },
  {
    icon: Workflow, name: 'Otomasyonlar', color: 'var(--blue)', who: 'Emir, Mert',
    desc: 'Otomatik SMS/e-posta kuralları. Cron her saat çalışır.',
    features: [
      'Tetikleyiciler: Görev geciktiğinde / Onay 24 saat bekleyince / Proje tamamlandığında',
      'Aksiyonlar: SMS (Netgsm) / E-posta / Her ikisi',
      'Mesaj şablonunda {{gorev}}, {{sorumlu}}, {{musteri}}, {{tarih}} placeholder\'ları kullanılabilir',
      'Her kural açılıp kapatılabilir (aktif/pasif)',
      'SMS Test butonu ile sistemin çalışıp çalışmadığını anlık test et',
    ],
    note: 'Otomasyonlar çalışması için Ayarlar → Netgsm SMS bölümünden API bilgilerinin girilmiş olması gerekir.',
  },
  {
    icon: Bell, name: 'Destek', color: 'var(--ac)', who: 'Herkes oluşturur, Emir+Mert görür',
    desc: 'Ekip içi destek talebi sistemi. Her kullanıcı sağ alttaki mor 🛟 butonuyla talep açabilir. Sadece Emir ve Mert listeyi görür.',
    features: [
      'Sağ alttaki 🛟 butonu her sayfada görünür — tüm kullanıcılar erişebilir',
      'Talep türleri: 💡 Öneri / 🐛 Hata / 😤 Şikayet / 💬 Diğer',
      'Başlık + detay notu eklenebilir, tarih otomatik kaydedilir',
      'Talep açılınca Emir ve Mert\'e in-app bildirim düşer',
      'Emir/Mert: Destek sayfasından tüm talepleri listeler, durumu günceller (Açık → İnceleniyor → Çözüldü)',
      'Dashboard\'da "Destek Talepleri" kartı — açık talepler anlık görünür',
    ],
  },
  {
    icon: SlidersHorizontal, name: 'Ayarlar', color: 'var(--tx2)', who: 'Herkes (kısıtlı)',
    desc: 'Kişisel profil ve sistem yapılandırması.',
    features: [
      'Profil: Ad, telefon, departman güncelleme',
      'Güvenlik: Kendi şifreni değiştirme',
      'Netgsm SMS: API bilgileri + test gönderimi (Emir/Mert)',
      'Bildirimler: Push bildirimini aktive et (tarayıcı izni gerekir)',
      'Şirket bilgileri: Firma adı ve iletişim (Emir/Mert)',
    ],
  },
]

const WORKFLOWS = [
  {
    title: 'İçerik Üretim Akışı', color: 'var(--amber)',
    steps: [
      { who: 'Emir / Mert', action: 'Müşteriden brief alınır, proje/görev sisteme girilir' },
      { who: 'Sorumlu Ekip', action: 'İçerik Sayfası → "İçerik Ekle" → Taslak oluşturulur, kişi atanır' },
      { who: 'Sorumlu Kişi', action: 'İçerik hazırlanır → Detay paneli → "Onaya Gönder" tıklanır' },
      { who: 'Emir / Mert', action: 'Onay sayfasında "Onayla" veya "Reddet" — talebi açana bildirim gider' },
      { who: 'Mert', action: 'Onaylandıktan sonra "Portal Linki Oluştur" → Müşteriye WhatsApp/link gönderilir' },
      { who: 'Müşteri', action: 'Portalde "Onaylıyorum" veya "Revizyon" — ekibe anlık bildirim düşer' },
      { who: 'Mert / Emir', action: 'Dashboard → Müşteri Kararları kartında yanıtı görürler' },
    ]
  },
  {
    title: 'Proje Teslim Akışı', color: 'var(--blue)',
    steps: [
      { who: 'Emir / Mert', action: 'Müşteriler → Müşteri seç → Projeler → "Yeni Proje" oluştur' },
      { who: 'Mert', action: 'Proje → Aşamalar sekmesi → Aşamalar tanımla, gerekirse "Onay gerekiyor" işaretle' },
      { who: 'Mert', action: 'Proje → Görevler sekmesi → Görev ekle, ekip üyelerine ata' },
      { who: 'Ekip', action: 'Görevler sayfasında kanban üzerinden ilerletir: Devam → Kontrol → Tamam' },
      { who: 'Ekip', action: 'Müşteriler → Proje → Dosyalar → Teslim dosyası yüklenir' },
      { who: 'Mert', action: '"Müşteri Paneli" butonu → Link kopyala → WhatsApp\'tan gönder' },
      { who: 'Müşteri', action: 'Portalde tüm projeleri, dosyaları, onay geçmişini görebilir ve indirebilir' },
    ]
  },
  {
    title: 'Bildirim Akışı', color: 'var(--amber)',
    steps: [
      { who: 'Sistem (Otomatik)', action: 'Her 10 dakikada cron çalışır — deadline, gecikme, onay kontrolü yapar' },
      { who: 'Sistem', action: 'Deadline yarin: Sorumluya + Admin/Manager push + in-app bildirim (8 saatte bir)' },
      { who: 'Sistem', action: 'Deadline gecti: Sorumluya + Admin/Manager in-app + SMS (2 saatte bir)' },
      { who: 'Sistem', action: 'Onay 24 saat bekliyor: Admin ve Manager hatirlatma (24 saatte bir)' },
      { who: 'Kullanici', action: 'Can ikonuna tiklar, ilgili sayfaya yonlendirilir (Gorevler, Onay, Icerik vs.)' },
      { who: 'Kullanici', action: 'Push bildirimi almak icin: Ayarlar → Bildirimler → Izin Ver' },
    ]
  },
  {
    title: 'Süre Takibi Akışı', color: 'var(--blue)',
    steps: [
      { who: 'Admin/Manager/Member', action: 'Gorev kanban uzerinden Devama alinir' },
      { who: 'Sistem (Otomatik)', action: 'DB trigger ile time_logs tablosuna kayit acilir, saat damgasi baslar' },
      { who: 'Kullanici', action: 'Gorev baska statue tasinirsa otomatik kapanir, dakika hesaplanir' },
      { who: 'Sistem (Otomatik)', action: 'Tamama alindiginda completed_at set edilir, acik loglar kapanir' },
      { who: 'Admin/Manager', action: 'Gorev detayi - Sure sekmesi: her oturumu, kimin ne kadar calistigini gorur' },
      { who: 'Admin/Manager', action: 'Detay sekmesinde Olusturuldu / Tamamlandi / Harcanan Sure ozeti gorunur' },
    ]
  },
  {
    title: 'Yeni Kullanıcı Ekleme Akışı', color: 'var(--green)',
    steps: [
      { who: 'Emir', action: 'Kullanıcılar sayfası → "Kullanıcı Ekle" → E-posta ile davet gönderilir' },
      { who: 'Yeni Kullanıcı', action: 'panelson.vercel.app/login adresine gider, e-posta ile giriş yapar' },
      { who: 'Emir', action: 'Kullanıcılar sayfasından kişiyi seç → Rol ata (Member/Manager/Admin)' },
      { who: 'Emir', action: '"Şifre Değiştir" ile geçici şifre belirlenir ve kişiye iletilir' },
      { who: 'Yeni Kullanıcı', action: 'Ayarlar → Güvenlik → Kendi şifresini değiştirir' },
    ]
  },
]

const TIPS = [
  { emoji: '🔴', q: 'Geciken görev nasıl takip edilir?', a: 'Dashboard → "Geciken Görev" kartına tıkla → Gecikmeler sayfası açılır. Buradan direkt "Tamamlandı" yapabilirsin.' },
  { emoji: '📤', q: 'Müşteriye içerik nasıl gönderilir?', a: 'Onay → Talep oluştur → İç onay al → "Portal Linki Oluştur" → Kopyala ve müşteriye ilet. Veya Müşteriler → "Müşteri Paneli" ile kalıcı link.' },
  { emoji: '📁', q: 'Müşteri portali ne gösterir?', a: 'Müşteriye ait tüm projeler, her projenin aşamaları, yüklenmiş dosyalar ve onay geçmişi. Dosyaları oradan indirebilir.' },
  { emoji: '📲', q: 'Push bildirimi gelmiyor?', a: 'Ayarlar → Bildirimler sekmesi → "Bildirimlere İzin Ver" tıkla. Tarayıcı izin sorar, kabul et.' },
  { emoji: '📱', q: 'SMS bildirimi çalışmıyor?', a: 'Ayarlar → Netgsm SMS → API bilgilerini kontrol et → "Test SMS Gönder" ile dene.' },
  { emoji: '🔐', q: 'Kullanıcı şifresini unuttum?', a: 'Emir → Kullanıcılar → İlgili kişiyi seç → "Şifre Değiştir" butonu ile sıfırlar.' },
  { emoji: '👤', q: 'Neden bazı sayfaları göremiyorum?', a: 'Rol kısıtlaması. Member rolündekiler Müşteriler, Finans, Operasyon gibi sayfalara giremez. Emir rolünü değiştirebilir.' },
  { emoji: '🔄', q: 'Veri güncellendi mi nasıl anlarım?', a: 'Sağ üstteki "Canlı" göstergesi yeşilse veri gerçek zamanlı. F5\'e gerek yok — değişiklikler otomatik yansır.' },
]

// ─────────────────────────────────────────────────────────
// BİLEŞENLER
// ─────────────────────────────────────────────────────────

function Accordion({ title, color, Icon, children }: { title: string; color: string; Icon: any; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: `1px solid ${open ? color + '55' : 'var(--bdr)'}`, borderRadius: 10, overflow: 'hidden', marginBottom: 8, transition: 'border-color .15s' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: open ? `${color}0e` : 'var(--s1)', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={13} style={{ color }} strokeWidth={2} />
        </div>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--tx)', textAlign: 'left' }}>{title}</span>
        {open ? <ChevronDown size={14} style={{ color: 'var(--tx3)' }} /> : <ChevronRight size={14} style={{ color: 'var(--tx3)' }} />}
      </button>
      {open && (
        <div style={{ padding: '14px 16px', background: 'var(--s1)', borderTop: '1px solid var(--bdr)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 44, scrollMarginTop: 80 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--tx)', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid var(--bdr)' }}>{title}</h2>
      {children}
    </section>
  )
}

const SECTIONS = [
  { id: 'giris',    label: '🏠 Giriş' },
  { id: 'roller',   label: '👥 Roller' },
  { id: 'sayfalar', label: '📄 Sayfalar' },
  { id: 'akislar',  label: '🔄 İş Akışları' },
  { id: 'sorular',  label: '💡 Sık Sorular' },
]

// ─────────────────────────────────────────────────────────
// ANA SAYFA
// ─────────────────────────────────────────────────────────

export default function DokumantasyonPage() {
  const [search, setSearch] = useState('')

  const filteredPages = search
    ? PAGES.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase()))
    : PAGES

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <style>{`
        .doc-wrap{display:flex;flex:1;overflow:hidden}
        .doc-sb{width:190px;flex-shrink:0;border-right:1px solid var(--bdr);overflow-y:auto;padding:16px 10px;background:var(--s1)}
        .doc-body{flex:1;overflow-y:auto;padding:28px 28px 80px}
        .doc-nav{display:flex;align-items:center;gap:7px;padding:8px 10px;border-radius:8px;font-size:12.5px;color:var(--tx2);cursor:pointer;border:none;background:none;width:100%;text-align:left;margin-bottom:2px;transition:all .12s}
        .doc-nav:hover{color:var(--tx);background:var(--s2)}
        .dot{width:5px;height:5px;border-radius:50%;background:var(--bdr2);flex-shrink:0}
        .role-card{background:var(--s1);border:1px solid var(--bdr);border-radius:12px;padding:16px;margin-bottom:10px}
        .page-feat{display:flex;align-items:flex-start;gap:8px;margin-bottom:7px}
        .tip-card{display:flex;align-items:flex-start;gap:12px;background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:14px;margin-bottom:8px}
        .step-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--bdr)}
        .step-row:last-child{border-bottom:none}
        @media(max-width:768px){.doc-sb{display:none}.doc-body{padding:18px 16px 80px}}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar
          title="Kılavuz"
          subtitle="Daydream Production — Sistem Kullanım Kılavuzu"
          action={
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Sayfa ara..."
                style={{ padding: '6px 10px 6px 28px', background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 8, color: 'var(--tx)', fontSize: 12, outline: 'none', width: 150 }}
              />
            </div>
          }
        />

        <div className="doc-wrap">
          {/* Sidebar */}
          <div className="doc-sb">
            <p style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, padding: '0 4px' }}>İçindekiler</p>
            {SECTIONS.map(s => (
              <button key={s.id} className="doc-nav" onClick={() => scrollTo(s.id)}>
                <span className="dot" />
                {s.label}
              </button>
            ))}
            <div style={{ marginTop: 24, padding: '10px 12px', background: 'var(--ac2)', borderRadius: 9, border: '1px solid rgba(124,106,247,.15)' }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ac)', marginBottom: 3 }}>Daydream Production</p>
              <p style={{ fontSize: 10.5, color: 'var(--tx3)', lineHeight: 1.5 }}>Agency ERP v1.0<br />panelson.vercel.app</p>
            </div>
          </div>

          {/* İçerik */}
          <div className="doc-body">

            {/* ── GİRİŞ ── */}
            <Section id="giris" title="🏠 Bu Sistem Ne?">
              <div style={{ background: 'linear-gradient(135deg,var(--ac2),var(--blue2))', border: '1px solid rgba(124,106,247,.2)', borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Daydream Production — Agency ERP</p>
                <p style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.8 }}>
                  Ajansın tüm iş süreçlerini tek ekrandan yönetmek için tasarlandı.
                  Müşteri takibinden içerik onayına, proje aşamalarından finansa kadar her şey burada.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 18 }}>
                {[
                  { e: '🎯', t: 'Rol Bazlı Erişim', d: 'Her kişi sadece kendi alanını görür' },
                  { e: '⚡', t: 'Gerçek Zamanlı', d: 'Veri değişince F5\'e gerek yok' },
                  { e: '📲', t: 'Push Bildirim', d: 'Telefona anlık uyarı — uygulama kapalıyken bile' },
                  { e: '🤝', t: 'Müşteri Portali', d: 'Müşteri kendi projesini takip eder' },
                ].map(c => (
                  <div key={c.t} style={{ background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{c.e}</div>
                    <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{c.t}</p>
                    <p style={{ fontSize: 12, color: 'var(--tx3)', lineHeight: 1.5 }}>{c.d}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--bdr)' }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>🔐 Sisteme Nasıl Giriş Yapılır?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    'Tarayıcıdan panelson.vercel.app adresine git',
                    'E-posta ve şifrenle giriş yap (ilk şifre: 12345 — hemen değiştir)',
                    'Ayarlar → Güvenlik sekmesinden yeni şifreni belirle',
                    'Rolüne göre menü otomatik filtrelenir',
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--ac2)', color: 'var(--ac)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                      <p style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.5, paddingTop: 2 }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* ── ROLLER ── */}
            <Section id="roller" title="👥 Kim Kim? — Roller ve Yetkiler">
              <div style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.7 }}>
                  Sistemde 3 rol var: <strong style={{ color: 'var(--ac)' }}>Admin</strong> (her şey), <strong style={{ color: 'var(--blue)' }}>Manager</strong> (Kullanıcılar hariç her şey), <strong style={{ color: 'var(--green)' }}>Member</strong> (sadece kendine atananlar).
                  URL manipülasyonu da engellendi — rol kısıtlaması hem menüde hem sunucuda çalışır.
                </p>
              </div>
              {ROLES.map(r => (
                <div key={r.name} className="role-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{r.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: 700 }}>{r.name}</p>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: r.bg, color: r.color }}>{r.title}</span>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.6 }}>{r.desc}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>Erişilen Sayfalar</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {r.pages.map(p => <span key={p} className="badge badge-muted" style={{ fontSize: 10.5 }}>{p}</span>)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--bdr)' }}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: r.color, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.05em' }}>💡 İpuçları</p>
                    {r.tips.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: i < r.tips.length - 1 ? 5 : 0 }}>
                        <ChevronRight size={11} style={{ color: r.color, flexShrink: 0, marginTop: 3 }} strokeWidth={2.5} />
                        <p style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5 }}>{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>

            {/* ── SAYFALAR ── */}
            <Section id="sayfalar" title="📄 Sayfalar — Ne İşe Yarar?">
              {search && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--blue2)', borderRadius: 8, fontSize: 12.5, color: 'var(--blue)' }}>
                  "{search}" için {filteredPages.length} sayfa
                </div>
              )}
              {filteredPages.length === 0 && (
                <p style={{ color: 'var(--tx3)', fontSize: 13, padding: '20px 0' }}>Sonuç bulunamadı.</p>
              )}
              {filteredPages.map(p => (
                <Accordion key={p.name} title={`${p.name}  —  ${p.who}`} color={p.color} Icon={p.icon}>
                  <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.7, marginBottom: 12 }}>{p.desc}</p>
                  <div style={{ marginBottom: p.note ? 12 : 0 }}>
                    {p.features.map((f, i) => (
                      <div key={i} className="page-feat">
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color, flexShrink: 0, marginTop: 6 }} />
                        <p style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.5 }}>{f}</p>
                      </div>
                    ))}
                  </div>
                  {p.note && (
                    <div style={{ background: `${p.color}12`, border: `1px solid ${p.color}30`, borderRadius: 8, padding: '9px 12px' }}>
                      <p style={{ fontSize: 12, color: p.color, lineHeight: 1.6 }}>📌 {p.note}</p>
                    </div>
                  )}
                </Accordion>
              ))}
            </Section>

            {/* ── İŞ AKIŞLARI ── */}
            <Section id="akislar" title="🔄 İş Akışları — Adım Adım">
              {WORKFLOWS.map(wf => (
                <div key={wf.title} style={{ background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ padding: '12px 16px', background: `${wf.color}10`, borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: wf.color }} />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{wf.title}</span>
                  </div>
                  <div style={{ padding: '8px 16px 14px' }}>
                    {wf.steps.map((step, i) => (
                      <div key={i} className="step-row">
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${wf.color}20`, color: wf.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0, border: `1px solid ${wf.color}40` }}>{i + 1}</div>
                        <div style={{ flex: 1, paddingTop: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: wf.color, background: `${wf.color}15`, padding: '1px 7px', borderRadius: 4, marginRight: 8 }}>{step.who}</span>
                          <span style={{ fontSize: 13, color: 'var(--tx2)' }}>{step.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>

            {/* ── SIK SORULAR ── */}
            <Section id="sorular" title="💡 Sık Sorular">
              {TIPS.map((tip, i) => (
                <div key={i} className="tip-card">
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{tip.emoji}</div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 5 }}>{tip.q}</p>
                    <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6 }}>{tip.a}</p>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 20, background: 'var(--ac2)', border: '1px solid rgba(124,106,247,.2)', borderRadius: 12, padding: '18px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>🛠️ Sorun mu var?</p>
                <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.7 }}>
                  Sistemde bir problem yaşıyorsan <strong>Mert</strong>'e ilet.<br />
                  Teknik bir sorunsa Mert, <strong>Emir</strong>'i bilgilendirir.
                </p>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </>
  )
}
