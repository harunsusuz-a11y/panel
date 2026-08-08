'use client'
import { useState } from 'react'
import TopBar from '@/components/TopBar'
import {
  BookOpen, Users, CheckSquare, CalendarDays, FileText,
  Activity, ShieldCheck, Receipt, BarChart2, TrendingUp,
  UserCog, SlidersHorizontal, ChevronRight, ChevronDown,
  LayoutDashboard, AlertCircle, Search, Bell, Workflow,
  Zap, Globe, Lock, Clock, MessageSquare, Star, StickyNote,
  Wrench, LayoutTemplate, Share2, Calculator, UserCheck,
  Plug, Video, AlertTriangle, HeadphonesIcon, FileBarChart,
  Instagram, Send
} from 'lucide-react'

const SECTIONS = [
  { id: 'nedir',    label: '🏢 Sistem Nedir?' },
  { id: 'ozellik',  label: '✨ Öne Çıkan Özellikler' },
  { id: 'roller',   label: '👥 Kullanıcı Rolleri' },
  { id: 'moduller', label: '📦 Modüller' },
  { id: 'akislar',  label: '🔄 İş Akışları' },
  { id: 'musteri',  label: '🤝 Müşteri Deneyimi' },
  { id: 'sorular',  label: '💡 Sık Sorular' },
]

const FEATURES = [
  { e: '⚡', t: 'Gerçek Zamanlı', d: 'Ekip aynı anda çalışır, değişiklikler anında herkese yansır. F5\'e gerek yok.' },
  { e: '📲', t: 'Push Bildirim + SMS', d: 'Görev gecikmesi, müşteri kararı, onay bildirimleri — telefona anlık ulaşır.' },
  { e: '🤝', t: 'Müşteri Portali', d: 'Müşteriye özel SMS ile link gönderilir. Projelerini, içeriklerini ve dosyalarını kendileri takip eder.' },
  { e: '🔐', t: 'Rol Bazlı Erişim', d: 'Her kullanıcı yalnızca kendi alanını görür. Hem menüde hem sunucuda kontrol edilir.' },
  { e: '📊', t: 'Performans Takibi', d: 'Ekip bazlı verimlilik skorları, tamamlanan/geciken oranları ve süre kayıtları.' },
  { e: '🤖', t: 'Otomasyon', d: 'Geciken görevlerde, bekleyen onaylarda SMS/push otomatik gönderilir — sizin müdahaleniz gerekmez.' },
  { e: '🌐', t: 'PWA — Her Cihazda', d: 'Tarayıcıdan ana ekrana eklenebilir. iOS ve Android\'de uygulama gibi çalışır.' },
  { e: '📅', t: 'Takvim & Özel Günler', d: 'Deadline\'lar, yayın tarihleri ve ajans için önemli pazarlama günleri tek takvimde.' },
  { e: '📝', t: 'Kişisel Notlar', d: 'Her ekip üyesi kendi notlarını yazar, hatırlatma ekler, SMS\'le anımsatma alır.' },
  { e: '📈', t: 'Sosyal Medya Raporu', d: 'Marka bazında haftalık Instagram, TikTok, LinkedIn ve YouTube verileri. PDF export.' },
  { e: '📋', t: 'Kanban İçerik Akışı', d: 'İçerikler taslaktan yayına sürükle-bırak ile taşınır. Dosya versiyonlama ve revizyon notu.' },
  { e: '🛠️', t: 'Araç & Hesap Yönetimi', d: 'Ekibin kullandığı yazılımlar, abonelikler ve hesap bilgileri merkezi olarak tutulur.' },
]

const ROLES = [
  {
    avatar: 'AD', title: 'Admin (Founder)',
    color: 'var(--ac)', bg: 'var(--ac2)',
    desc: 'Sistemin tüm yetkisine sahip kullanıcıdır. Finanstan kullanıcı yönetimine, onaylardan performans raporlarına kadar her modülü görür ve yönetir.',
    caps: ['Tüm sayfalar ve veriler', 'Kullanıcı ekleme, rol ve şifre yönetimi', 'Finansal raporlar ve muhasebe', 'Otomasyon kuralları tanımlama', 'Sistem ayarları ve SMS entegrasyonu'],
  },
  {
    avatar: 'MG', title: 'Manager (Operasyon Müdürü)',
    color: 'var(--blue)', bg: 'var(--blue2)',
    desc: 'Görev dağılımı, içerik akışı, müşteri iletişimi ve operasyonel süreçlerin yönetiminden sorumludur. Kullanıcı yönetimi ve finans raporları hariç her şeye erişir.',
    caps: ['Müşteri ve proje yönetimi', 'Görev atama ve gecikme takibi', 'İçerik onay akışını yönetme', 'Müşteriye portal linki SMS ile gönderme', 'Operasyon ekranı ve raporlar'],
  },
  {
    avatar: 'ÜY', title: 'Member (Ekip Üyesi)',
    color: 'var(--green)', bg: 'var(--green2)',
    desc: 'Grafiker, metin yazarı, sosyal medya uzmanı gibi üretim yapan ekip üyeleridir. Yalnızca kendilerine atanmış görevleri ve içerikleri görürler.',
    caps: ['Sadece kendi görevleri', 'Sadece kendi içerikleri', 'İçerik dosyası yükleme ve onaya gönderme', 'Kişisel takvim ve notlar', 'Destek talebi açma'],
  },
]

const MODULES = [
  {
    icon: LayoutDashboard, name: 'Dashboard', color: 'var(--ac)',
    tag: 'Herkes',
    summary: 'Sistemin nabzını atan ana ekran. Ajansın anlık durumu tek bakışta görülür.',
    items: [
      'Gelir, gider, net kâr ve aktif proje sayısı KPI kartları',
      'Aylık gelir trend grafiği ve görev durum dağılımı',
      'Geciken görevler, bekleyen onaylar ve müşteri kararları',
      'Bu haftaki özel pazarlama günleri bandı',
      'Ekip aktivite akışı — kim ne zaman ne yaptı',
      'Gerçek zamanlı bağlantı göstergesi',
    ],
  },
  {
    icon: Users, name: 'Müşteriler', color: 'var(--blue)',
    tag: 'Admin + Manager',
    summary: 'Tüm müşterilerin ve marka bilgilerinin yönetildiği merkez.',
    items: [
      'Müşteri adı, marka adı, e-posta, telefon ve şirket bilgileri',
      'Tüm alanlar zorunlu — eksik müşteri kaydı oluşturulamaz',
      'Müşteri kartında marka adı görünür',
      'Müşteri Portali: kalıcı token ile şifresiz erişim linki',
      'Aktif / Pasif durum takibi',
    ],
  },
  {
    icon: FileText, name: 'Projeler', color: 'var(--blue)',
    tag: 'Admin + Manager',
    summary: 'Müşteri bazlı proje takibi ve aşama yönetimi.',
    items: [
      'Proje oluşturma, aşama tanımlama ve ilerleme takibi',
      'Proje bazlı dosya yükleme ve müşteriye teslim',
      'Proje portal linki — müşteri projesini takip eder',
      'Proje tamamlanınca otomatik bildirim',
    ],
  },
  {
    icon: CheckSquare, name: 'Görevler', color: 'var(--ac)',
    tag: 'Herkes (rol bazlı)',
    summary: 'Kanban tabanlı görev yönetimi. Tüm alanlar zorunlu.',
    items: [
      '4 sütunlu kanban: Bekliyor → Devam → Kontrol → Tamamlandı',
      'Zorunlu alanlar: Başlık, Firma, Proje, Sorumlu, Deadline, Açıklama',
      'Öncelik seviyeleri: Kritik, Yüksek, Normal, Düşük',
      'Otomatik süre takibi — "Devam"a alınınca sayaç başlar',
      'Deadline yaklaştığında otomatik SMS + push bildirim',
      'Member: Sadece kendi görevi; sadece ilerletme yetkisi',
    ],
  },
  {
    icon: FileText, name: 'İçerik Merkezi', color: 'var(--amber)',
    tag: 'Herkes (rol bazlı)',
    summary: '5 aşamalı kanban ile içerik üretim akışı. Dosya versiyonlama ve müşteri onayı entegre.',
    items: [
      'Kanban kolonları: Taslak → İç Onay → Müşteri Onayı → Revizyon → Yayında',
      'Platform filtresi: Instagram, TikTok, LinkedIn, YouTube',
      'İçerik türleri: Post, Story, Reels, Blog, Reklam',
      'Caption metin, yayın tarihi ve sorumlu ataması',
      'Dosya yükleme — v1, v2, v3 versiyonlama, kim yükledi görünür',
      '"Müşteriye Gönder" butonu → portal token oluşturur → müşteriye SMS gider',
      'Revizyon modalı — ekibe not bırakılır, kart üzerinde kırmızı görünür',
      'Müşteri onaylayınca/revizyon isteyince içerik otomatik güncellenir',
    ],
  },
  {
    icon: ShieldCheck, name: 'Onay Sistemi', color: 'var(--amber)',
    tag: 'Admin + Manager',
    summary: 'İç onay akışı. Proje ve dosya bazlı onay talepleri.',
    items: [
      'Onay talebi oluştur — proje veya dosya bazında',
      'İç onay yapılmadan müşteriye gönderilemez',
      'Müşteri onaylayınca veya revizyon isteyince push bildirim',
      'Tüm onay geçmişi arşivlenir',
    ],
  },
  {
    icon: Activity, name: 'Operasyon', color: 'var(--ac)',
    tag: 'Admin + Manager',
    summary: 'Ajansın trafik kontrol merkezi. Günlük operasyonun tamamı tek sayfada.',
    items: [
      'ACİL 3 İŞ bandı — kritik gecikmeler kırmızıda',
      'İçerik pipeline özeti — hangi aşamada kaç içerik',
      'Ekip yükü — kişi başına aktif iş ve gecikme oranı',
      'Müşteri durumu özeti',
      'Gün sonu kapanış checklisti',
    ],
  },
  {
    icon: AlertTriangle, name: 'Gecikmeler', color: 'var(--red)',
    tag: 'Admin + Manager',
    summary: 'Deadline\'ı geçmiş tüm görevlerin tek sayfada listesi.',
    items: [
      'Kaç gün geciktiği, sorumlusu ve önceliği görünür',
      'Geciken görevleri direkt bu sayfadan güncelleme',
      'Otomatik SMS gönderimi geciken görevler için',
    ],
  },
  {
    icon: Instagram, name: 'Sosyal Medya Raporu', color: 'var(--ac)',
    tag: 'Admin + Manager',
    summary: 'Marka ve platform bazında haftalık sosyal medya performans takibi.',
    items: [
      'Platformlar: Instagram, TikTok, LinkedIn, YouTube',
      'Metrikler: Post, Story, Like, Yorum, Kaydetme, Paylaşım, Takipçi, Erişim, Gösterim',
      'Önceki hafta karşılaştırması — % değişim okları',
      'Otomatik Engagement Rate hesabı',
      'Özet görünüm — tüm markaların tek sayfada özeti',
      'PDF İndir — haftalık raporu yazdırabilir veya kaydedebilirsin',
    ],
  },
  {
    icon: Bell, name: 'Bildirimler', color: 'var(--ac)',
    tag: 'Herkes',
    summary: 'Ajansın hiçbir anını kaçırmamanızı sağlar.',
    items: [
      'Görev gecikmesi → sorumluya + admin/manager\'a push + SMS',
      'Müşteri kararı (onay/revizyon) → admin + manager\'a anlık push',
      'İç onay bekleniyor → 24 saatte bir hatırlatma',
      'Destek talebi açıldı → admin + manager\'a bildirim',
    ],
  },
  {
    icon: TrendingUp, name: 'Performans & Raporlar', color: 'var(--ac)',
    tag: 'Admin + Manager',
    summary: 'Ekip ve müşteri bazlı verimlilik analizi.',
    items: [
      'Ekip bazlı performans skoru — tamamlanan/geciken oranı',
      'Süre kayıtları — kim hangi göreve ne kadar zaman harcadı',
      'Tüm sistem aktivite logu',
    ],
  },
  {
    icon: FileBarChart, name: 'Günlük Rapor', color: 'var(--blue)',
    tag: 'Admin',
    summary: 'Günlük operasyon özeti. ChatGPT ile otomatik yönetici özeti.',
    items: [
      'Aktif kullanıcılar, oluşturulan/tamamlanan görevler, onay hareketleri',
      'Kişi bazında aktivite detayı — kim ne yaptı',
      'OpenAI API bağlıysa ChatGPT ile Türkçe yönetici özeti',
      'Geçmiş tarihlere gidilerek raporlanabilir',
    ],
  },
  {
    icon: Receipt, name: 'Finans', color: 'var(--green)',
    tag: 'Admin + Manager',
    summary: 'Ajans gelir-gider takibi ve finansal özet.',
    items: [
      'Gelir ve gider kayıtları — müşteri/proje bağlantılı',
      'Ödendi / Bekliyor / Gecikti durumları',
      'Son 6 aylık gelir trend grafiği',
      'Net kâr ve bekleyen tahsilat özeti',
    ],
  },
  {
    icon: Calculator, name: 'Muhasebe', color: 'var(--green)',
    tag: 'Admin',
    summary: 'Detaylı muhasebe kayıtları ve kategori bazlı takip.',
    items: [
      'Gelir/gider kategorileri',
      'Fatura ve makbuz kaydı',
      'Dönemsel muhasebe özeti',
    ],
  },
  {
    icon: Workflow, name: 'Otomasyonlar', color: 'var(--blue)',
    tag: 'Admin + Manager',
    summary: 'Tekrar eden bildirimleri sistem otomatik gönderir.',
    items: [
      'Geciken görevde SMS + push otomasyonu',
      'Onay 24 saat bekleyince hatırlatma',
      'Proje tamamlandığında bildirim',
      'Özel mesaj şablonları — {{görev}}, {{sorumlu}}, {{tarih}} değişkenleri',
      'Her kural aktif/pasif yapılabilir',
    ],
  },
  {
    icon: CalendarDays, name: 'Takvim', color: 'var(--blue)',
    tag: 'Herkes (rol bazlı)',
    summary: 'Görev deadline\'ları ve içerik yayın tarihleri tek takvimde.',
    items: [
      'Aylık görünüm, tıklanınca o günün detayı',
      'Özel pazarlama günleri dahil (Dünya Sosyal Medya Günü, Black Friday vb.)',
      'Admin/Manager: Tüm ekip; Member: Sadece kendisi',
      'İçerik yayın tarihleri sarı etiketle ayrışır',
    ],
  },
  {
    icon: Video, name: 'Toplantılar', color: 'var(--blue)',
    tag: 'Admin + Manager',
    summary: 'Ekip ve müşteri toplantılarının planlanması ve takibi.',
    items: [
      'Toplantı oluşturma — tarih, saat, katılımcılar',
      'Yaklaşan toplantı listesi',
      'Toplantı notları ekleme',
    ],
  },
  {
    icon: StickyNote, name: 'Kişisel Notlar', color: 'var(--ac)',
    tag: 'Herkes',
    summary: 'Her ekip üyesinin kendine ait not ve hatırlatma alanı.',
    items: [
      'Not ekle, düzenle, sil — tamamen kişisel',
      'Hatırlatma tarihi ve saati belirle',
      'SMS hatırlatma — not başlığı ve içeriği tam olarak gelir',
      'Notlar yalnızca sana görünür',
    ],
  },
  {
    icon: Share2, name: 'Paylaşım Planlayıcı', color: 'var(--ac)',
    tag: 'Admin + Manager',
    summary: 'n8n entegrasyonu ile otomatik sosyal medya paylaşım planlama.',
    items: [
      'Paylaşım zamanı ve platform belirleme',
      'n8n ile otomatik sıralı gönderim',
      'Planlanan paylaşımların takibi',
    ],
  },
  {
    icon: Globe, name: 'Müşteri Portali', color: 'var(--green)',
    tag: 'Müşterilere özel',
    summary: 'Müşterinizin kendi projesini ve içeriklerini takip ettiği, onay verdiği alan.',
    items: [
      'Şifresiz, SMS ile gelen link — müşteriye ek hesap yükü yok',
      'Proje aşamaları, dosyalar görünür ve indirilebilir',
      'İçerik onayla / revizyon iste — not ekleyebilir',
      'Müşteri de dosya yükleyebilir (revize edilmiş materyaller)',
      'Ajans onaylamadan içerik portale düşmez',
    ],
  },
  {
    icon: HeadphonesIcon, name: 'Destek Talepleri', color: 'var(--ac)',
    tag: 'Herkes',
    summary: 'Ekip içi destek ve sorun bildirme sistemi.',
    items: [
      'Ekip üyesi destek talebi açar',
      'Admin + Manager\'a bildirim gider',
      'Talep durumu — açık, işlemde, kapatıldı',
    ],
  },
  {
    icon: UserCheck, name: 'Ekip & Yetkiler', color: 'var(--blue)',
    tag: 'Admin',
    summary: 'Ekip üyelerinin rol ve yetki yönetimi.',
    items: [
      'Ekip üyelerini listele ve rol değiştir',
      'Departman ve telefon bilgisi yönetimi',
      'Aktif/pasif kullanıcı kontrolü',
    ],
  },
  {
    icon: UserCog, name: 'Kullanıcılar', color: 'var(--blue)',
    tag: 'Admin',
    summary: 'Kullanıcı davet etme ve hesap yönetimi.',
    items: [
      'E-posta ile davet gönderme',
      'Rol atama: Admin, Manager, Member',
      'Şifre sıfırlama',
    ],
  },
  {
    icon: Plug, name: 'Entegrasyonlar', color: 'var(--ac)',
    tag: 'Admin',
    summary: 'Harici servis bağlantıları ve API entegrasyonları.',
    items: [
      'Netgsm SMS API bağlantısı',
      'OpenAI / ChatGPT entegrasyonu',
      'Google OAuth girişi',
      'Push bildirim (web-push) yapılandırması',
    ],
  },
  {
    icon: Wrench, name: 'Araç & Hesap Yönetimi', color: 'var(--ac)',
    tag: 'Sadece Admin',
    summary: 'Ekibin kullandığı tüm yazılım ve hesap bilgileri merkezi.',
    items: [
      'Her araç için ad, URL, kullanıcı adı, şifre',
      'Aylık/yıllık abonelik takibi',
      'Yalnızca admin görür — güvenli saklama',
    ],
  },
  {
    icon: LayoutTemplate, name: 'Haftalık Şablonlar', color: 'var(--ac)',
    tag: 'Admin + Manager',
    summary: 'Tekrar eden haftalık görev listelerini tek tıkla oluştur.',
    items: [
      'Şablon oluştur — başlık, açıklama, öncelik, deadline ve sorumlu kişi',
      'Şablon çalıştırılınca görevler otomatik oluşturulur',
      'Her çalıştırmada ilgili kişilere push bildirim gönderilir',
    ],
  },
  {
    icon: SlidersHorizontal, name: 'Ayarlar', color: 'var(--ac)',
    tag: 'Herkes (kısıtlı)',
    summary: 'Kişisel profil ve sistem ayarları.',
    items: [
      'Profil güncelleme — ad, telefon, avatar',
      'Şifre değiştirme',
      'Bildirim tercihleri — push açma/kapama',
      'Netgsm SMS ayarları (Admin)',
      'E-posta ve şirket ayarları (Admin)',
      'ChatGPT API key (Admin)',
    ],
  },
]

const WORKFLOWS = [
  {
    title: '📤 İçerik Üretim ve Müşteri Onayı', color: 'var(--amber)',
    steps: [
      { who: 'Manager', action: 'Brief alınır, İçerik Merkezi\'nde yeni içerik oluşturulur, sorumluya atanır' },
      { who: 'Ekip Üyesi', action: 'Dosyayı (görsel, video) yükler — v1 olarak kaydedilir' },
      { who: 'Ekip Üyesi', action: '"İç Onay" kolonuna sürükler veya butona basar' },
      { who: 'Admin / Manager', action: 'İnceler, onaylar. "Müşteriye Gönder" butonuna basar' },
      { who: 'Sistem', action: 'Portal token oluşturulur, müşteriye SMS gider: "İçerik onayınızı bekliyor: [link]"' },
      { who: 'Müşteri', action: 'Portale girer, içeriği ve dosyayı inceler, onaylar veya revizyon notu yazar' },
      { who: 'Admin / Manager', action: 'Müşteri kararı anlık bildirimle gelir — onaylandıysa "Yayında"ya alınır' },
      { who: 'Ekip Üyesi', action: 'Revizyon geldiyse — düzenler, v2 yükler, tekrar İç Onay\'a gönderir' },
    ]
  },
  {
    title: '📁 Proje Teslim Akışı', color: 'var(--blue)',
    steps: [
      { who: 'Admin / Manager', action: 'Müşteri oluşturulur, proje açılır, aşamalar tanımlanır' },
      { who: 'Manager', action: 'Görevler oluşturulur, ekip üyelerine atanır, deadline belirlenir' },
      { who: 'Ekip', action: 'Kanban üzerinden ilerler: Bekliyor → Devam → Kontrol → Tamamlandı' },
      { who: 'Manager', action: 'Dosyalar proje detayından müşteri için yüklenir' },
      { who: 'Manager', action: '"Müşteri Paneli" linki oluşturulur, SMS ile iletilir' },
      { who: 'Müşteri', action: 'Portalden projesini takip eder, dosyalarını indirir' },
    ]
  },
  {
    title: '🔔 Otomatik Bildirim Akışı', color: 'var(--green)',
    steps: [
      { who: 'Sistem', action: 'Her 10 dakikada arka planda çalışır — deadline ve onay kontrolleri yapılır' },
      { who: 'Sistem', action: 'Deadline yarın: Sorumluya push bildirim gönderilir' },
      { who: 'Sistem', action: 'Deadline geçti: Sorumluya push + SMS, admin/manager\'a bildirim' },
      { who: 'Sistem', action: 'Onay 24 saat bekledi: Admin ve manager\'a hatırlatma' },
      { who: 'Kullanıcı', action: 'Bildirimi tıklar, ilgili sayfaya yönlendirilir' },
    ]
  },
  {
    title: '📊 Sosyal Medya Haftalık Rapor', color: 'var(--ac)',
    steps: [
      { who: 'Gizem / Sorumlu', action: 'Sosyal Medya sayfasına girer, haftayı seçer' },
      { who: 'Gizem / Sorumlu', action: 'Platformu seçer (Instagram, TikTok...) ve markayı seçer' },
      { who: 'Gizem / Sorumlu', action: 'Bu haftanın ve önceki haftanın metriklerini girer' },
      { who: 'Sistem', action: '% değişim ve Engagement Rate otomatik hesaplanır' },
      { who: 'Manager', action: 'Özet sekmesinden tüm markaları görür, PDF İndir ile raporu kaydeder' },
    ]
  },
  {
    title: '📝 Kişisel Not ve SMS Hatırlatma', color: 'var(--ac)',
    steps: [
      { who: 'Ekip Üyesi', action: 'Notlarım sayfasından yeni not oluşturur' },
      { who: 'Ekip Üyesi', action: 'Hatırlatma tarihi ve saati seçer, SMS toggle\'ını açar' },
      { who: 'Sistem', action: 'Belirlenen saatte "Not başlığı: içeriği" şeklinde SMS gönderilir' },
      { who: 'Ekip Üyesi', action: 'Notun üzerinde "SMS gönderildi ✓" ibaresi görünür' },
    ]
  },
]

const TIPS = [
  { e: '🔴', q: 'Geciken görevleri nasıl takip ederim?', a: 'Dashboard → "Geciken Görev" kartına tıkla ya da Gecikmeler sayfasına git. Kaç gün geciktiği, kim sorumlu olduğu ve öncelik sırasına göre listelenir.' },
  { e: '📤', q: 'Müşteriye içerik nasıl gönderilir?', a: 'İçerik Merkezi → İçeriği "İç Onay"a al → "Müşteriye Gönder" butonuna bas. Sistem otomatik portal linki oluşturur ve müşteriye SMS gönderir. Müşteri şifresiz portale girer.' },
  { e: '📱', q: 'Telefona bildirim almak istiyorum', a: 'Ayarlar → Bildirimler sekmesine gir → "Bildirimleri Aktifleştir" butonuna tıkla. Tarayıcı izin sorar, kabul et. Uygulama kapalıyken bile bildirim alırsın.' },
  { e: '👤', q: 'Bazı sayfaları neden göremiyorum?', a: 'Rol kısıtlaması. Member rolü yalnızca kendine atanmış görevleri ve içerikleri görür. Admin rolünü değiştirebilir — Kullanıcılar sayfasından.' },
  { e: '📲', q: 'SMS sistemi çalışmıyor', a: 'Ayarlar → Netgsm SMS bölümünden API bilgilerinin girildiğini kontrol et. Hesapta SMS paketi olması gerekiyor — Toplu SMS paketi (OTP değil). "Test SMS Gönder" ile anlık deneme yapabilirsin.' },
  { e: '📊', q: 'Sosyal medya raporunu nasıl PDF yaparım?', a: 'Sosyal Medya sayfası → Özet Görünüm sekmesi → "PDF İndir" butonuna tıkla. Tarayıcı yazdırma diyalogu açılır, "PDF olarak kaydet" seçeneğiyle kaydedebilirsin.' },
  { e: '🔄', q: 'İçeriği revize edince ne yapmalıyım?', a: 'Revizyon kolonundaki içeriği aç → Yeni dosyayı yükle (otomatik v2 olarak kaydedilir) → "İç Onay"a geri gönder → "Müşteriye Gönder" → yeni SMS gider.' },
  { e: '🤝', q: 'Müşteri portalini nasıl paylaşırım?', a: 'İki yol: 1) İçerik Merkezi\'nde "Müşteriye Gönder" → SMS otomatik gider. 2) Müşteriler sayfasından "Müşteri Paneli" butonu kalıcı link üretir, tüm proje geçmişini gösterir.' },
  { e: '🛠️', q: 'Yeni ekip üyesi nasıl eklenir?', a: 'Kullanıcılar sayfası → "Kullanıcı Ekle" → E-posta ile davet gönderilir. Kişi giriş yaptıktan sonra admin rolünü ve şifresini belirler.' },
  { e: '📋', q: 'Görev oluştururken hangi alanlar zorunlu?', a: 'Başlık, Firma, Proje, Sorumlu, Deadline ve Açıklama zorunludur. Hepsi doldurulmadan "Görev Oluştur" butonu aktif olmaz.' },
]

function Accordion({ title, color, Icon, tag, children }: { title: string; color: string; Icon: any; tag: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: `1px solid ${open ? color + '55' : 'var(--bdr)'}`, borderRadius: 10, overflow: 'hidden', marginBottom: 8, transition: 'border-color .15s' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: open ? `${color}0e` : 'var(--s1)', border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={13} style={{ color }} strokeWidth={2} />
        </div>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--tx)', textAlign: 'left' }}>{title}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>{tag}</span>
        {open ? <ChevronDown size={14} style={{ color: 'var(--tx3)', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: 'var(--tx3)', flexShrink: 0 }} />}
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
    <section id={id} style={{ marginBottom: 48, scrollMarginTop: 80 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--tx)', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid var(--bdr)' }}>{title}</h2>
      {children}
    </section>
  )
}

export default function DokumantasyonPage() {
  const [search, setSearch] = useState('')

  const filtered = search
    ? MODULES.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.summary.toLowerCase().includes(search.toLowerCase()))
    : MODULES

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <style>{`
        .doc-wrap{display:flex;flex:1;overflow:hidden}
        .doc-sb{width:200px;flex-shrink:0;border-right:1px solid var(--bdr);overflow-y:auto;padding:16px 10px;background:var(--s1)}
        .doc-body{flex:1;overflow-y:auto;padding:28px 32px 100px}
        .doc-nav{display:flex;align-items:center;gap:7px;padding:8px 10px;border-radius:8px;font-size:12.5px;color:var(--tx2);cursor:pointer;border:none;background:none;width:100%;text-align:left;margin-bottom:2px;transition:all .12s}
        .doc-nav:hover{color:var(--tx);background:var(--s2)}
        .feat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:20px}
        .feat-card{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:14px}
        .role-card{background:var(--s1);border:1px solid var(--bdr);border-radius:12px;padding:18px;margin-bottom:12px}
        .step-row{display:flex;align-items:flex-start;gap:12px;padding:11px 0;border-bottom:1px solid var(--bdr)}
        .step-row:last-child{border-bottom:none}
        .tip-card{display:flex;align-items:flex-start;gap:14px;background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:14px;margin-bottom:8px}
        .bullet{width:5px;height:5px;border-radius:50%;flex-shrink:0;margin-top:7px}
        @media(max-width:768px){.doc-sb{display:none}.doc-body{padding:18px 16px 100px}.feat-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:480px){.feat-grid{grid-template-columns:1fr}}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar
          title="Sistem Tanıtımı"
          subtitle="Daydream Production — Agency ERP"
          action={
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Modül ara..."
                style={{ padding: '6px 10px 6px 28px', background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 8, color: 'var(--tx)', fontSize: 12, outline: 'none', width: 150 }}
              />
            </div>
          }
        />

        <div className="doc-wrap">
          <div className="doc-sb">
            <p style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, padding: '0 4px' }}>İçindekiler</p>
            {SECTIONS.map(s => (
              <button key={s.id} className="doc-nav" onClick={() => scrollTo(s.id)}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--bdr2)', flexShrink: 0 }} />
                {s.label}
              </button>
            ))}
            <div style={{ marginTop: 24, padding: '12px', background: 'var(--ac2)', borderRadius: 9, border: '1px solid rgba(124,106,247,.15)' }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ac)', marginBottom: 4 }}>Daydream Production</p>
              <p style={{ fontSize: 10.5, color: 'var(--tx3)', lineHeight: 1.6 }}>Agency ERP<br />daydreamsocial.online</p>
            </div>
          </div>

          <div className="doc-body">

            <Section id="nedir" title="🏢 Bu Sistem Nedir?">
              <div style={{ background: 'linear-gradient(135deg,var(--ac2),var(--blue2))', border: '1px solid rgba(124,106,247,.2)', borderRadius: 14, padding: '24px 26px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Star size={18} style={{ color: 'var(--ac)' }} strokeWidth={2} />
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)' }}>Daydream Production — Agency ERP</p>
                </div>
                <p style={{ fontSize: 14, color: 'var(--tx2)', lineHeight: 1.9 }}>
                  Daydream Production için baştan sona özel geliştirilen bir ajans yönetim sistemidir.
                  Müşteri takibinden içerik onayına, proje yönetiminden ekip performansına, finanstan
                  otomasyona kadar ajansın tüm operasyonel süreçleri tek çatı altında toplanmıştır.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                  {['Özel Geliştirme', 'Gerçek Zamanlı', 'PWA — Her Cihazda', 'Müşteri Portali', 'SMS & Push Bildirim', 'Rol Bazlı Erişim', 'Dosya Versiyonlama', 'PDF Rapor'].map(t => (
                    <span key={t} style={{ fontSize: 11.5, fontWeight: 600, background: 'rgba(124,106,247,.15)', color: 'var(--ac)', padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(124,106,247,.2)' }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '18px 20px' }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>💼 Hangi Sorunu Çözüyor?</p>
                {[
                  { e: '❌', b: 'Eskiden:', t: 'WhatsApp\'ta boğulan onaylar, Excel\'de kaybolan görevler, unutulan deadlineler, müşteriye manuel iletilen linkler, Drive\'da kayıp dosyalar' },
                  { e: '✅', b: 'Artık:', t: 'Tek platform — görev atama, içerik kanbanı, dosya versiyonlama, müşteri portali, otomatik SMS, sosyal medya raporu ve performans takibi hepsi burada' },
                ].map(r => (
                  <div key={r.e} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{r.e}</span>
                    <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.7 }}><strong style={{ color: 'var(--tx)' }}>{r.b}</strong> {r.t}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="ozellik" title="✨ Öne Çıkan Özellikler">
              <div className="feat-grid">
                {FEATURES.map(f => (
                  <div key={f.t} className="feat-card">
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{f.e}</div>
                    <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{f.t}</p>
                    <p style={{ fontSize: 12, color: 'var(--tx3)', lineHeight: 1.6 }}>{f.d}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="roller" title="👥 Kullanıcı Rolleri">
              <div style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.7 }}>
                  Sistemde 3 kullanıcı tipi vardır. Her rol yalnızca kendi yetkisi dahilindeki sayfalara ve verilere erişebilir.
                  Bu kısıtlama sadece menüde değil, sunucu tarafında da geçerlidir.
                </p>
              </div>
              {ROLES.map(r => (
                <div key={r.title} className="role-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0, border: `2px solid ${r.color}40` }}>{r.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 6 }}>{r.title}</p>
                      <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.7 }}>{r.desc}</p>
                    </div>
                  </div>
                  <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, color: r.color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Yetkiler</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {r.caps.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <ChevronRight size={12} style={{ color: r.color, flexShrink: 0, marginTop: 2 }} strokeWidth={2.5} />
                          <p style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.5 }}>{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </Section>

            <Section id="moduller" title={`📦 Modüller — ${MODULES.length} Modül`}>
              {search && filtered.length < MODULES.length && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--blue2)', borderRadius: 8, fontSize: 12.5, color: 'var(--blue)' }}>
                  &quot;{search}&quot; için {filtered.length} modül
                </div>
              )}
              {filtered.length === 0 && <p style={{ color: 'var(--tx3)', fontSize: 13, padding: '20px 0' }}>Sonuç bulunamadı.</p>}
              {filtered.map(m => (
                <Accordion key={m.name} title={m.name} color={m.color} Icon={m.icon} tag={m.tag}>
                  <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.7, marginBottom: 12 }}>{m.summary}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {m.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                        <div className="bullet" style={{ background: m.color }} />
                        <p style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.5 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </Accordion>
              ))}
            </Section>

            <Section id="akislar" title="🔄 İş Akışları — Adım Adım">
              {WORKFLOWS.map(wf => (
                <div key={wf.title} style={{ background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ padding: '13px 18px', background: `${wf.color}10`, borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: wf.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{wf.title}</span>
                  </div>
                  <div style={{ padding: '10px 18px 16px' }}>
                    {wf.steps.map((step, i) => (
                      <div key={i} className="step-row">
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${wf.color}20`, color: wf.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, border: `1px solid ${wf.color}35` }}>{i + 1}</div>
                        <div style={{ flex: 1, paddingTop: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: wf.color, background: `${wf.color}15`, padding: '2px 8px', borderRadius: 4, marginRight: 8 }}>{step.who}</span>
                          <span style={{ fontSize: 13, color: 'var(--tx2)' }}>{step.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>

            <Section id="musteri" title="🤝 Müşteri Deneyimi — Müşteriniz Sistemi Nasıl Görür?">
              <div style={{ background: 'linear-gradient(135deg,var(--green2),var(--blue2))', border: '1px solid rgba(34,211,160,.2)', borderRadius: 14, padding: '22px 24px', marginBottom: 16 }}>
                <p style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 10 }}>🌐 Müşteri Portali</p>
                <p style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.9, marginBottom: 14 }}>
                  Müşterinize ayrıca hesap açmanıza gerek yok. "Müşteriye Gönder" butonuna basınca sistem
                  otomatik bir portal linki oluşturur ve müşterinin telefon numarasına SMS gönderir.
                  Müşteri bu linkle şifresiz portale girer.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
                  {[
                    { e: '📲', t: 'SMS ile Link', d: 'Otomatik gönderilir — extra adım yok' },
                    { e: '📁', t: 'Dosyalar', d: 'İndirebilir, müşteri de dosya yükleyebilir' },
                    { e: '✅', t: 'Onay / Revizyon', d: 'Kararını not ile birlikte iletir' },
                    { e: '🏗️', t: 'Proje Aşamaları', d: 'İlerlemeyi anlık görür' },
                  ].map(c => (
                    <div key={c.t} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 9, padding: '12px 14px', border: '1px solid rgba(255,255,255,.1)' }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{c.e}</div>
                      <p style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}>{c.t}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{c.d}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--bdr)', fontSize: 13, color: 'var(--tx2)', lineHeight: 1.8 }}>
                <strong style={{ color: 'var(--tx)' }}>📌 Önemli:</strong> Ajansın iç onayını vermediği hiçbir içerik müşteri portalinde görünmez.
                Müşteri yalnızca size hazır dediğiniz içerikleri görür. Tüm kararlar kayıt altında tutulur ve ekibe anlık bildirilir.
              </div>
            </Section>

            <Section id="sorular" title="💡 Sık Sorulan Sorular">
              {TIPS.map((tip, i) => (
                <div key={i} className="tip-card">
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{tip.e}</div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 5 }}>{tip.q}</p>
                    <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6 }}>{tip.a}</p>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 20, background: 'var(--ac2)', border: '1px solid rgba(124,106,247,.2)', borderRadius: 14, padding: '22px 24px', textAlign: 'center' }}>
                <Zap size={24} style={{ color: 'var(--ac)', margin: '0 auto 10px' }} strokeWidth={2} />
                <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Sistem tamamen size özel geliştirildi</p>
                <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.8 }}>
                  Yeni modül, özellik veya entegrasyon ihtiyacı için<br />
                  <strong style={{ color: 'var(--ac)' }}>Mert</strong> ile iletişime geçin.
                </p>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </>
  )
}
