'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'
import {
  BookOpen, Users, FolderOpen, CheckSquare, CalendarDays,
  FileText, Activity, ShieldCheck, Receipt, BarChart2,
  TrendingUp, UserCog, SlidersHorizontal, ChevronRight,
  ChevronDown, Zap, Building2, ArrowRight, Eye, Lock,
  LayoutDashboard, Clock, AlertCircle, Search
} from 'lucide-react'

// ──────────────────────────────────────────────
// VERİ
// ──────────────────────────────────────────────

const ROLES = [
  {
    name: 'Emir Alp',
    title: 'Founder & Executive Producer',
    role: 'admin',
    color: 'var(--ac)',
    bg: 'var(--ac2)',
    avatar: 'EA',
    desc: 'Sistemin tam yöneticisidir. Tüm sayfaları görür, tüm kararları onaylayabilir. Müşteri ilişkileri, fiyatlandırma ve final onay yetkisi Emir\'dedir.',
    pages: ['Dashboard', 'Müşteriler', 'Projeler', 'Görevler', 'Takvim', 'İçerik', 'Operasyon', 'Gecikmeler', 'Onay', 'Muhasebe', 'Finans', 'Performans', 'Kullanıcılar', 'Otomasyonlar', 'Ayarlar', 'Dokümantasyon'],
    tips: [
      'Dashboard\'da tüm ekibin iş yükünü anlık izleyebilirsin',
      'Performans sayfasında ekip bazlı verimlilik skorlarını görebilirsin',
      'Onay sayfasında 4 adımlı iç onay → müşteri gönderim akışını yönetirsin',
      'Kullanıcılar sayfasından ekip rollerini değiştirebilirsin',
    ]
  },
  {
    name: 'Mert',
    title: 'Operations Manager',
    role: 'manager',
    color: 'var(--blue)',
    bg: 'var(--blue2)',
    avatar: 'ME',
    desc: 'Yaratıcı karar vermez. İşlerin doğru kişiye, doğru tarihe, doğru dosyayla müşteriye gitmesini sağlar. Operasyon trafik yöneticisidir.',
    pages: ['Dashboard', 'Müşteriler', 'Projeler', 'Görevler', 'Takvim (Tüm Ekip)', 'İçerik', 'Operasyon', 'Gecikmeler', 'Onay', 'Muhasebe', 'Finans', 'Performans', 'Otomasyonlar', 'Ayarlar'],
    tips: [
      'Operasyon sayfası senin ana çalışma alandır — acil 3 iş, pipeline, ekip yükü',
      'Gün sonu kapanış checklist\'i Operasyon sayfasının altında bulursun',
      'Takvimde "Tüm Ekip / Sadece Benim" toggle ile kendi görünümünü ayarlarsın',
      'Gecikmeler sayfasında geciken görevleri takip edip ilgili kişiye yönlendir',
    ]
  },
  {
    name: 'Aslı',
    title: 'Creative Lead',
    role: 'member',
    color: 'var(--green)',
    bg: 'var(--green2)',
    avatar: 'AS',
    desc: 'Brief alır, konsept kurar, kreatif yön belirler. İçerik akışının ilk halkasıdır. Marka diline uygunluğu denetler.',
    pages: ['Dashboard', 'Projeler', 'Görevler', 'Takvim (Sadece Kendi)', 'İçerik', 'Onay', 'Ayarlar'],
    tips: [
      'Takvimde sadece sana atanmış görevler görünür',
      'İçerik sayfasında "Taslak" statüsündeki içerikleri sen oluşturursun',
      'Onay sayfasında iç onay için talep oluşturabilirsin',
      'Görevler sayfasında kanban üzerinden durumunu güncelleyebilirsin',
    ]
  },
  {
    name: 'Gizem',
    title: 'Social Media Lead + Design Control',
    role: 'member',
    color: 'var(--amber)',
    bg: 'var(--amber2)',
    avatar: 'GZ',
    desc: 'Sosyal medya planlaması, retouch, ara kurgu, kalite kontrolü yapar. İçerik "Onay Bekliyor" aşamasına Gizem tarafından alınır.',
    pages: ['Dashboard', 'Projeler', 'Görevler', 'Takvim (Sadece Kendi)', 'İçerik', 'Onay', 'Ayarlar'],
    tips: [
      'İçerik sayfasında durumu "Taslak → Onay Bekliyor" olarak güncelle',
      'Kalite kontrol sonrası "Onaylandı" ya da "Revizyon" statüsüne al',
      'Revizyon olan içerikler kırmızıyla belirtilir',
    ]
  },
  {
    name: 'Yasin',
    title: 'Junior Operator',
    role: 'member',
    color: 'var(--tx2)',
    bg: 'var(--s3)',
    avatar: 'YA',
    desc: 'Post tasarımı, reels kapağı, kurgu düzenleme, export ve drive düzeni yapar. Basit revizyonları uygular.',
    pages: ['Dashboard', 'Projeler', 'Görevler', 'Takvim (Sadece Kendi)', 'İçerik', 'Onay', 'Ayarlar'],
    tips: [
      'Görevler sayfasında sana atanmış işler "Devam Eden" sütununda görünür',
      'Görevi tamamlayınca "Tamam" sütununa sürükle veya tıkla',
      'Takvimde sadece kendi deadline\'ların görünür',
    ]
  },
  {
    name: 'Caner',
    title: 'Accounting',
    role: 'member',
    color: 'var(--tx3)',
    bg: 'var(--s3)',
    avatar: 'CA',
    desc: 'Fatura, tahsilat ve ödeme takibinden sorumludur. Muhasebe ve finans sayfalarına erişimi vardır.',
    pages: ['Dashboard', 'Görevler', 'Takvim (Sadece Kendi)', 'Ayarlar'],
    tips: [
      'Muhasebe sayfasına şu an üst yönetim erişebilmekte — Emir\'den yetki talep edebilirsin',
      'Sana atanmış görevler Dashboard\'da görünür',
    ]
  },
  {
    name: 'Batuhan & Kerem',
    title: 'Project-Based Camera Team',
    role: 'member',
    color: 'var(--tx3)',
    bg: 'var(--s3)',
    avatar: 'BK',
    desc: 'Proje bazlı çalışır. Fotoğraf, video ve sahne prodüksiyonundan sorumludur.',
    pages: ['Dashboard', 'Görevler', 'Takvim (Sadece Kendi)', 'Ayarlar'],
    tips: [
      'Takvimde sadece sana atanmış görevler ve çekim tarihleri görünür',
      'Görev detayına tıklayarak brief ve müşteri bilgisini görebilirsin',
    ]
  },
]

const PAGES = [
  {
    icon: LayoutDashboard, name: 'Dashboard', color: 'var(--ac)',
    who: 'Herkes',
    desc: 'Sistemin ana ekranıdır. Toplam gelir, aktif proje sayısı, geciken görevler ve onay bekleyenler anlık gösterilir. Kartlara tıklayarak ilgili sayfaya geçebilirsin.',
    features: [
      'Tüm KPI kartları tıklanabilir ve ilgili sayfaya yönlendirir',
      'Aylık gelir trendi bar chart ile görselleştirilir',
      'Görev durum dağılımı donut grafik üzerinde anlık güncellenir',
      'Geciken görevler öncelik sırasıyla listelenir',
      'Sağ üstte "Canlı" göstergesi veritabanı bağlantısını gösterir — veri değişince otomatik güncellenir',
    ],
    note: 'Admin ve manager tam veri görür. Member rolü sadece kendisiyle ilgili verileri görür.',
  },
  {
    icon: Users, name: 'Müşteriler', color: 'var(--blue)',
    who: 'Emir, Mert',
    desc: 'Tüm müşterilerin listelendiği ve yönetildiği sayfadır. Müşteri ekleyebilir, düzenleyebilir, notlar girebilirsin.',
    features: [
      'Aktif / Pasif müşteri durumu takibi',
      'Müşteri bazlı proje ve görev sayısı özeti',
      'İletişim bilgileri (telefon, e-posta)',
      'Notlar alanı ile müşteriye özel bilgi saklama',
    ],
  },
  {
    icon: FolderOpen, name: 'Projeler', color: 'var(--blue)',
    who: 'Herkes (kısıtlı)',
    desc: 'Aktif projelerin aşamalarını ve dosyalarını yönettiğin sayfadır. Her proje için aşama tanımlayabilir, dosya yükleyebilir ve müşteriye portal linki oluşturabilirsin.',
    features: [
      'Proje aşamaları (Bekliyor → Devam → Onay Bekliyor → Tamamlandı)',
      'Her aşamaya "Müşteri Onayı Gerekiyor" işareti eklenebilir',
      'Dosya yükleme — müşteriye görünür/görünmez seçeneği',
      '"Portal Linki" butonu ile müşteriye özel erişim linki oluşturulur',
      'Proje ilerleme yüzdesi aşama tamamlanınca otomatik hesaplanır',
    ],
    note: 'Portal linki oluşturunca link otomatik kopyalanır. Müşteri bu linkle dosyaları indirebilir ve aşamaları görebilir.',
  },
  {
    icon: CheckSquare, name: 'Görevler', color: 'var(--ac)',
    who: 'Herkes',
    desc: 'Kanban tahtasıdır. Bekliyor → Devam → Kontrol → Tamam sütunlarıyla görevlerin durumu izlenir.',
    features: [
      'Yeni görev oluştururken Firma (Müşteri) seçilir — proje seçince firma otomatik gelir',
      'Sorumlu kişi atanabilir',
      'Öncelik: Kritik / Yüksek / Normal / Düşük',
      'Deadline girilince takvimle senkronize olur',
      'Geciken görevler kırmızı uyarıyla işaretlenir',
    ],
    note: 'Member rolündekiler tüm görevleri görür ama takvimde sadece kendi görevlerini görür.',
  },
  {
    icon: CalendarDays, name: 'Takvim', color: 'var(--blue)',
    who: 'Herkes (rol bazlı)',
    desc: 'Görevlerin deadline\'larını takvim üzerinde gösterir.',
    features: [
      'Member: Sadece kendi görevleri görünür',
      'Manager/Admin: Tüm ekibin görevleri görünür, kişi adıyla etiketli',
      '"Tüm Ekip / Sadece Benim" toggle — Emir ve Mert için',
      'Güne tıklayınca o güne ait görevler sağ panelde listelenir',
      'Bu Hafta özeti: tamamlanan / devam eden / bekleyen sayıları',
    ],
  },
  {
    icon: FileText, name: 'İçerik', color: 'var(--amber)',
    who: 'Emir, Mert, Aslı, Gizem, Yasin',
    desc: 'İçerik üretim akışının yönetildiği sayfadır. Daydream iş hiyerarşisine göre 5 aşamalı workflow üzerinden ilerler.',
    features: [
      'Workflow şeridi: Taslak → İç Onay → Müşteri Onayı → Revizyon → Yayında',
      'Müşteri bazlı filtreleme — her müşterinin içeriklerini ayrı görebilirsin',
      'Sağ panel ile içerik durumunu tek tıkla değiştirme',
      'Yayın tarihi geçmiş ve henüz yayınlanmamış içerikler uyarı ile belirtilir',
    ],
    note: 'Aslı taslak oluşturur → Gizem onay bekleyorya alır → Emir ya da Mert müşteriye gönderir → Müşteri onaylar → Gizem yayınlar.',
  },
  {
    icon: Activity, name: 'Operasyon', color: 'var(--ac)',
    who: 'Emir, Mert',
    desc: 'Mert\'in ana çalışma sayfasıdır. Tüm işlerin anlık durumunu, ekip yükünü ve müşteri pipeline\'ını gösterir.',
    features: [
      'ACİL 3 İŞ: Kritik/yüksek öncelikli gecikmiş görevler kırmızı banner\'da öne çıkar',
      'Daydream Pipeline: Emir → Aslı → Gizem → Yasin → Mert → Müşteri aşamalarında kaç iş var',
      'Ekip iş yükü: Her kişinin taşıdığı aktif iş sayısı ve gecikme durumu',
      'Müşteri durumu: Her müşteri için açık/geciken/tamamlanan görev özeti',
      'Gün Sonu Kapanış Checklist: 6 maddelik kontrol listesi (sadece Mert görür)',
    ],
  },
  {
    icon: AlertCircle, name: 'Gecikmeler', color: 'var(--red)',
    who: 'Emir, Mert',
    desc: 'Deadline\'ı geçmiş tüm görevlerin listelendiği sayfadır. Öncelik sırasına göre görünür.',
    features: [
      'Kaç gün geciktiği her görevde belirtilir',
      'Sorumlu kişi ve proje bilgisi görünür',
      'Görevi doğrudan "Tamamlandı" olarak işaretleyebilirsin',
    ],
  },
  {
    icon: ShieldCheck, name: 'Onay', color: 'var(--amber)',
    who: 'Herkes (kısıtlı)',
    desc: 'İçerik ve proje onaylarının 4 adımlı akışla yönetildiği sayfadır.',
    features: [
      '1. Talep Oluştur — herhangi biri talep açabilir',
      '2. İç Onay — Emir ya da Mert "Onayla" veya "Reddet" eder',
      '3. Müşteriye Gönder — İç onay sonrası portal linki oluşturulur ve müşteriye iletilir',
      '4. Müşteri Onayı — Müşterinin portal üzerinden verdiği yanıt izlenir',
    ],
    note: 'İç onay olmadan müşteriye gönderim butonu görünmez. Akış sırayla ilerler.',
  },
  {
    icon: Receipt, name: 'Muhasebe', color: 'var(--green)',
    who: 'Emir, Mert',
    desc: 'Gelir ve gider işlemlerinin kaydedildiği sayfadır.',
    features: [
      'Gelir / Gider sekmesi ayrı',
      'Ödendi / Bekliyor / Gecikti durumları',
      'Müşteri ve proje bağlantısı kurulabilir',
      'Kategori bazlı filtreleme',
    ],
  },
  {
    icon: BarChart2, name: 'Finans', color: 'var(--green)',
    who: 'Emir, Mert',
    desc: 'Gelir-gider grafiklerinin ve finansal özet tablosunun bulunduğu sayfadır.',
    features: [
      'Aylık gelir trendi',
      'Net kâr hesabı',
      'Müşteri bazlı gelir dağılımı',
    ],
  },
  {
    icon: TrendingUp, name: 'Performans', color: 'var(--ac)',
    who: 'Emir, Mert',
    desc: 'Emir\'in yönetici özetidir. Ekip performansı, müşteri bazlı içerik durumu ve tüm aktivite logu burada bulunur.',
    features: [
      'Her ekip üyesi için performans skoru (tamamlanan / geciken oranı)',
      'Daydream unvanlarıyla (Creative Lead, Junior Operator vb.) ekip kartları',
      'Müşteri bazlı içerik timeline — her müşteri kaç taslak/yayın/revizyon',
      '"Kim Ne Zaman Ne Yaptı" — tüm sistemdeki işlemler anlık loglanır',
    ],
  },
  {
    icon: UserCog, name: 'Kullanıcılar', color: 'var(--ac)',
    who: 'Sadece Emir',
    desc: 'Sisteme kayıtlı tüm kullanıcıların yönetildiği sayfadır.',
    features: [
      'Kullanıcı rolü değiştirme (Admin / Yönetici / Üye)',
      'Departman ve telefon bilgisi güncelleme',
      '"Sayfa Erişimi" sekmesi ile o kullanıcının hangi sayfalara girebileceğini görme',
      'Yeni kullanıcı davet etme',
    ],
    note: 'Kendi rolünü değiştiremezsin.',
  },
  {
    icon: SlidersHorizontal, name: 'Ayarlar', color: 'var(--tx2)',
    who: 'Herkes (kısıtlı)',
    desc: 'Kişisel profil ve sistem ayarlarının yönetildiği sayfadır.',
    features: [
      'Profil: Ad soyad, telefon, departman güncelleme',
      'Güvenlik: Şifre değiştirme',
      'Netgsm SMS: API bilgileri + test SMS gönderimi (Emir/Mert)',
      'E-posta SMTP: Otomatik bildirim ayarları (Emir/Mert)',
      'Şirket: Firma adı ve iletişim bilgileri (Emir/Mert)',
    ],
  },
]

const WORKFLOWS = [
  {
    title: 'İçerik Üretim Akışı',
    color: 'var(--amber)',
    steps: [
      { who: 'Emir', action: 'Müşteriden brief alır, öncelik belirler' },
      { who: 'Aslı', action: 'Brief\'i alır, konsept kurar, İçerik sayfasında "Taslak" oluşturur' },
      { who: 'Gizem', action: 'Tasarım ve kalite kontrolü yapar, durumu "Onay Bekliyor" yapar' },
      { who: 'Yasin', action: 'Export, drive düzeni ve uygulama yapar' },
      { who: 'Mert', action: 'Dosyaların hazır olduğunu kontrol eder, Onay sayfasından talep oluşturur' },
      { who: 'Emir', action: 'İç onay verir' },
      { who: 'Mert', action: 'Portal linki oluşturarak müşteriye iletir' },
      { who: 'Müşteri', action: 'Portal üzerinden onaylar veya revizyon ister' },
    ]
  },
  {
    title: 'Proje Teslim Akışı',
    color: 'var(--blue)',
    steps: [
      { who: 'Emir', action: 'Projeyi sisteme ekler, müşteri atar, deadline girer' },
      { who: 'Mert', action: 'Aşamaları tanımlar, görevi ilgili kişiye atar' },
      { who: 'Aslı/Gizem/Yasin', action: 'Görevleri tamamlar, kanban\'da ilerletir' },
      { who: 'Mert', action: 'Aşama tamamlanınca Projeler → Dosya Yükle ile dosyayı ekler' },
      { who: 'Emir', action: 'Final onay verir' },
      { who: 'Mert', action: '"Portal Linki" oluşturur, müşteri dosyaları indirir' },
    ]
  },
]

const TIPS = [
  { icon: '🔴', title: 'Geciken görev var mı?', desc: 'Dashboard\'daki "Geciken Görev" kartına tıkla → Gecikmeler sayfasına gider.' },
  { icon: '📋', title: 'Müşteriye içerik göndermek?', desc: 'Onay sayfası → Talep oluştur → İç onay al → "Portal Linki Oluştur" → Müşteriye link gönder.' },
  { icon: '📁', title: 'Müşteri dosya indiremiyor?', desc: 'Projeler → İlgili proje → Dosyalar sekmesi → Dosya yüklenmiş mi kontrol et → Portal Link oluştur.' },
  { icon: '👤', title: 'Yeni kişi sisteme girecek?', desc: 'Kullanıcılar sayfası (sadece Emir) → Kullanıcı Ekle → Kişi /login adresinden kayıt olur.' },
  { icon: '📱', title: 'SMS bildirimi çalışmıyor?', desc: 'Ayarlar → Netgsm SMS sekmesi → API bilgilerini kontrol et → Test SMS gönder.' },
  { icon: '🔄', title: 'Veriler güncellendi mi?', desc: 'Her sayfa anlık veritabanına bağlı. Sağ üstteki "Canlı" göstergesi yeşilse veri gerçek zamanlıdır.' },
]

// ──────────────────────────────────────────────
// KOMPONENTİLER
// ──────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 40, scrollMarginTop: 80 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid var(--bdr)', letterSpacing: '-.3px' }}>{title}</h2>
      {children}
    </section>
  )
}

function Accordion({ title, color, icon: Icon, children }: { title: string; color: string; icon: any; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: `1px solid ${open ? color : 'var(--bdr)'}`, borderRadius: 10, overflow: 'hidden', marginBottom: 8, transition: 'border-color .15s' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: open ? `${color}10` : 'var(--s1)', border: 'none', cursor: 'pointer', transition: 'background .15s' }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={13} style={{ color }} strokeWidth={2} />
        </div>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--tx)', textAlign: 'left' }}>{title}</span>
        {open ? <ChevronDown size={14} style={{ color: 'var(--tx3)' }} /> : <ChevronRight size={14} style={{ color: 'var(--tx3)' }} />}
      </button>
      {open && <div style={{ padding: '14px 16px', background: 'var(--s1)', borderTop: `1px solid var(--bdr)` }}>{children}</div>}
    </div>
  )
}

// ──────────────────────────────────────────────
// ANA SAYFA
// ──────────────────────────────────────────────

const SECTIONS = [
  { id: 'giris',     label: 'Giriş' },
  { id: 'roller',    label: 'Kim Kim?' },
  { id: 'sayfalar',  label: 'Sayfalar' },
  { id: 'akis',      label: 'İş Akışları' },
  { id: 'ipuclari',  label: 'Sık Sorular' },
]

export default function DokumantasyonPage() {
  const [activeSection, setActiveSection] = useState('giris')
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filteredPages = PAGES.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <style>{`
        .doc-layout{display:flex;flex:1;overflow:hidden;position:relative}
        .doc-sidebar{width:200px;flex-shrink:0;border-right:1px solid var(--bdr);overflow-y:auto;padding:16px 12px;background:var(--s1)}
        .doc-content{flex:1;overflow-y:auto;padding:28px 28px 80px}
        .doc-nav-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;font-size:13px;color:var(--tx2);cursor:pointer;transition:all .12s;border:none;background:none;width:100%;text-align:left;margin-bottom:2px}
        .doc-nav-item:hover{color:var(--tx);background:var(--s2)}
        .doc-nav-item.active{color:var(--ac);background:var(--ac2);font-weight:600}
        .role-card{background:var(--s1);border:1px solid var(--bdr);border-radius:12px;padding:16px;margin-bottom:10px;transition:border-color .15s}
        .role-card:hover{border-color:var(--bdr2)}
        .page-card{background:var(--s1);border:1px solid var(--bdr);border-radius:12px;overflow:hidden;margin-bottom:10px}
        .tip-card{display:flex;align-items:flex-start;gap:12px;background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:14px;margin-bottom:8px}
        .step-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--bdr)}
        .step-row:last-child{border-bottom:none}
        .mob-sidebar-btn{display:none;position:fixed;bottom:80px;right:16px;z-index:100;width:42px;height:42px;border-radius:12px;background:var(--ac);border:none;cursor:pointer;box-shadow:0 4px 16px rgba(124,106,247,.4);align-items:center;justify-content:center}
        @media(max-width:768px){
          .doc-sidebar{display:none}
          .doc-sidebar.open{display:block;position:fixed;top:0;left:0;bottom:0;width:220px;z-index:200;animation:mmSlideIn .22s cubic-bezier(.22,1,.36,1) both}
          .doc-content{padding:18px 16px 100px}
          .mob-sidebar-btn{display:flex}
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar
          title="Dokümantasyon"
          subtitle="Sistem Kullanım Kılavuzu"
          action={
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)' }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); if (e.target.value) setActiveSection('sayfalar') }}
                placeholder="Sayfa ara..."
                style={{ padding: '6px 10px 6px 28px', background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 8, color: 'var(--tx)', fontSize: 12.5, outline: 'none', width: 160 }}
              />
            </div>
          }
        />

        <div className="doc-layout">
          {/* Sidebar */}
          <div className={`doc-sidebar${sidebarOpen ? ' open' : ''}`}>
            {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: -1 }} onClick={() => setSidebarOpen(false)} />}
            <p style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8, padding: '0 4px' }}>İçindekiler</p>
            {SECTIONS.map(s => (
              <button key={s.id} className={`doc-nav-item${activeSection === s.id ? ' active' : ''}`}
                onClick={() => {
                  setActiveSection(s.id)
                  setSearch('')
                  setSidebarOpen(false)
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
                }}>
                <ChevronRight size={12} strokeWidth={2} />
                {s.label}
              </button>
            ))}
            <div style={{ marginTop: 20, padding: '10px', background: 'var(--ac2)', borderRadius: 8, border: '1px solid rgba(124,106,247,.15)' }}>
              <p style={{ fontSize: 11, color: 'var(--ac)', fontWeight: 600, marginBottom: 4 }}>Daydream Production</p>
              <p style={{ fontSize: 10.5, color: 'var(--tx3)', lineHeight: 1.5 }}>Agency ERP v1.0</p>
            </div>
          </div>

          {/* İçerik */}
          <div className="doc-content">

            {/* ── GİRİŞ ── */}
            <Section id="giris" title="🏠 Giriş — Bu Sistem Ne?">
              <div style={{ background: 'linear-gradient(135deg,var(--ac2),var(--blue2))', border: '1px solid rgba(124,106,247,.2)', borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--tx)' }}>Daydream Production — Agency ERP</p>
                <p style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.7 }}>
                  Bu sistem Daydream ekibinin tüm iş süreçlerini tek bir yerden yönetmesi için tasarlanmıştır.
                  Müşteri takibinden içerik onayına, proje aşamalarından finansa kadar her şey burada.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 16 }}>
                {[
                  { emoji: '👥', title: 'Ekip Yönetimi', desc: '7 kişi, her biri kendi rolünde sistemi kullanır' },
                  { emoji: '📋', title: 'İş Takibi', desc: 'Görevler kanban, projeler aşama bazlı takip edilir' },
                  { emoji: '🎨', title: 'İçerik Akışı', desc: 'Brief\'ten yayına 5 adımlı onay süreci' },
                  { emoji: '📊', title: 'Anlık Veri', desc: 'Tüm veriler veritabanından, her değişiklik anında yansır' },
                ].map(c => (
                  <div key={c.title} style={{ background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '14px' }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{c.emoji}</div>
                    <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{c.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--tx3)', lineHeight: 1.5 }}>{c.desc}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--bdr)' }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>🔐 Sisteme Giriş</p>
                <p style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.7 }}>
                  Tarayıcından <span style={{ fontFamily: 'JetBrains Mono,monospace', background: 'var(--s3)', padding: '1px 7px', borderRadius: 5, fontSize: 12 }}>panelson.vercel.app</span> adresine git.
                  E-posta ve şifrenle giriş yap. İlk girişte Emir sana davet gönderir ve şifreni Ayarlar → Güvenlik bölümünden belirlersin.
                </p>
              </div>
            </Section>

            {/* ── ROLLER ── */}
            <Section id="roller" title="👥 Kim Kim? — Roller ve Yetkiler">
              {ROLES.map(r => (
                <div key={r.name} className="role-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{r.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                        <p style={{ fontSize: 14, fontWeight: 700 }}>{r.name}</p>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: r.bg, color: r.color }}>{r.title}</span>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.6 }}>{r.desc}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}><Eye size={10} style={{ display: 'inline', marginRight: 4 }} />Erişilen Sayfalar</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {r.pages.map(p => <span key={p} className="badge badge-muted" style={{ fontSize: 10.5 }}>{p}</span>)}
                      </div>
                    </div>
                  </div>
                  {r.tips.length > 0 && (
                    <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--bdr)' }}>
                      <p style={{ fontSize: 10.5, fontWeight: 700, color: r.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>💡 {r.name.split(' ')[0]} için ipuçları</p>
                      {r.tips.map((tip, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: i < r.tips.length - 1 ? 5 : 0 }}>
                          <ChevronRight size={12} style={{ color: r.color, flexShrink: 0, marginTop: 2 }} strokeWidth={2.5} />
                          <p style={{ fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5 }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Section>

            {/* ── SAYFALAR ── */}
            <Section id="sayfalar" title="📄 Sayfalar — Ne İşe Yarar?">
              {search && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--blue2)', borderRadius: 8, fontSize: 12.5, color: 'var(--blue)' }}>
                  "{search}" için {filteredPages.length} sonuç
                </div>
              )}
              {filteredPages.map(p => (
                <Accordion key={p.name} title={`${p.name} — ${p.who}`} color={p.color} icon={p.icon}>
                  <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.7, marginBottom: 12 }}>{p.desc}</p>
                  <div style={{ marginBottom: p.note ? 12 : 0 }}>
                    {p.features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
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
            <Section id="akis" title="🔄 İş Akışları — Adım Adım">
              {WORKFLOWS.map(wf => (
                <div key={wf.title} style={{ background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ padding: '12px 16px', background: `${wf.color}10`, borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: wf.color }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{wf.title}</span>
                  </div>
                  <div style={{ padding: '8px 16px 16px' }}>
                    {wf.steps.map((step, i) => (
                      <div key={i} className="step-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${wf.color}20`, color: wf.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, border: `1px solid ${wf.color}40` }}>{i + 1}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: wf.color, background: `${wf.color}15`, padding: '1px 8px', borderRadius: 4, marginRight: 8 }}>{step.who}</span>
                          <span style={{ fontSize: 13, color: 'var(--tx2)' }}>{step.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>

            {/* ── SIK SORULAR ── */}
            <Section id="ipuclari" title="💡 Sık Sorular & İpuçları">
              {TIPS.map((tip, i) => (
                <div key={i} className="tip-card">
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{tip.icon}</div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 5 }}>{tip.title}</p>
                    <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6 }}>{tip.desc}</p>
                  </div>
                </div>
              ))}

              {/* Sorun mu var? */}
              <div style={{ marginTop: 20, background: 'var(--ac2)', border: '1px solid rgba(124,106,247,.2)', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sorun mu var?</p>
                <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6 }}>
                  Sistemle ilgili bir problem yaşıyorsan Mert'e ilet.<br />
                  Teknik bir sorunsa Emir bilgilendirilir.
                </p>
              </div>
            </Section>

          </div>
        </div>
      </div>

      {/* Mobil sidebar toggle */}
      <button className="mob-sidebar-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <BookOpen size={18} color="#fff" strokeWidth={2} />
      </button>
    </>
  )
}
