# ÜniKEY

ÜniKEY, üniversite öğrencilerinin vize ve final dönemlerinde PDF
dökümanlarını daha hızlı çalışabilmesi için geliştirilen bir uygulama
prototipidir.

Şimdilik hedef çok net:

> PDF yükle, özet al, anlamadığın kısmı sor, gerekirse quiz oluştur.

## İlk kullanıcı akışı

1. Öğrenci e-posta, şifre, üniversite, bölüm ve sınıf/sene bilgisiyle kayıt olur.
2. E-posta doğrulama kodunu girerek hesabını aktif eder.
3. Çalışacağı dersin adını yazar.
4. Ders sekmesi açılır ve PDF yüklemeye hazır olur.
5. PDF yüklenince özet çıkar.
6. Öğrenci isterse anlamadığı yeri sorar.
7. Sonrasında şu kararlardan birini verir:
   - Hayır, daha fazla döküman ekleyeceğim.
   - Çalışmayı bitir.
   - Evet, quizi hazırlayabilirsin.
   - Birden fazla PDF varsa sadece son PDF için quiz üret.

## Çalıştırma

Bu ortamda Node normal PATH içinde değilse bundled runtime kullan:

```bash
PATH=/Users/emir/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/emir/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin:$PATH pnpm install
PATH=/Users/emir/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/emir/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin:$PATH pnpm dev
```

Sonra tarayıcıda aç:

```text
http://localhost:3000
```

## Şu an çalışan çekirdek

- PDF dosyasından metin çıkarılır.
- Çıkarılan metinden yerel, basit bir özet üretilir.
- Öğrencinin sorusu yüklenen PDF metni içinde aranarak cevaplanır.
- Quiz soruları PDF metninden basit kurallarla üretilir.
- `OPENAI_API_KEY` verilirse özet, soru-cevap ve quiz üretimi AI ile yapılır.

API anahtarı yoksa uygulama yine çalışır; yerel motor otomatik devreye girer.

## AI ayarı

`.env.local` dosyası oluştur:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1
```

Sonra geliştirme sunucusunu yeniden başlat.

## Sıradaki teknik adım

AI çıktıları için kaynak sayfa gösterimi, daha iyi quiz tipleri ve klasik soru
üretimi eklenecek.
