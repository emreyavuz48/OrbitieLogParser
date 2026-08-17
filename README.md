Markdown
# Orbitie Log Parser & Analytics Platform

![.NET](https://img.shields.io/badge/.NET_Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![ASP.NET Core Web API](https://img.shields.io/badge/Web_API-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)
![xUnit](https://img.shields.io/badge/xUnit-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)

**Orbitie Log Parser**, ham log dosyalarını işleyerek yararlı bilgilere çeviren, bu bilgileri merkezi bir veritabanında depolayan ve kullanıcılarına web tabanlı bir arayüz aracılığıyla gelişmiş filtreleme seçenekleri, veri görselleştirmesi ve KPI analiz olanakları sağlayan kapsamlı bir log yönetim ve analiz çözümüdür.

## Proje Mimarisi

Sistem birbirine entegre 4 ana modülden oluşmaktadır:

1. **OrbitieLogParser (Root / Console Service):** `Logs/` klasöründe bulunan düz metin log dosyalarını Regex ile okuyup analiz eden ve bunları SQL Server veritabanına kaydeden C# .NET Core arka plan servisidir.
2. **Task2.1-WebAPI (Backend):** Entity Framework Core ORM kullanılarak geliştirilmiş ASP.NET Core Web API uygulamasıdır. Log filtreleme, sayfalama, KPI özetleri ve modüllere göre grafik istatistikleri sunan RESTful endpoint'ler içerir.
3. **orbitie-log-dashboard (Frontend):** React, TypeScript, Tailwind CSS ve Recharts ile tasarlanmış bir analitik arayüzüdür. Pano kartları, kronolojik görünüm, log arama ve filtreleme tabloları ile açılır pencere detaylarından oluşur.
4. **OrbitieLogParser.Tests (QA):** xUnit ile hazırlanmış; tek satır, çok satır ve yığın izi ile null-safe log ayrıştırma senaryolarını test eden birim test paketi olup, bu senaryoları doğrular.

---

## Sistem Gereksinimleri

Uygulamayı kendi bilgisayarınızda çalıştırabilmek için şu yazılımların yüklü olması gerekir:

* **.NET SDK:** 8.0 veya 10.0
* **Node.js:** v18.x veya üzeri
* **Veritabanı:** Microsoft SQL Server (LocalDB, Express veya Developer versiyonları)

---

## Veritabanı Kurulumu

Uygulamayı başlatmadan önce SQL Server'da `Orbitie` isminde bir veritabanı oluşturup, aşağıdaki T-SQL komutlarını çalıştırarak gerekli tabloları ve performans indekslerini oluşturun:

```sql
-- 1. Veritabanını oluşturun ve seçin
CREATE DATABASE Orbitie;
GO
USE Orbitie;
GO

-- 2. Logs tablosunu oluşturun
CREATE TABLE [dbo].[Logs] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Timestamp] DATETIMEOFFSET NOT NULL,
    [LogLevel] NVARCHAR(10) NOT NULL,
    [SourceContext] NVARCHAR(255) NULL,
    [Message] NVARCHAR(MAX) NOT NULL,
    [Exception] NVARCHAR(MAX) NULL
);
GO

-- 3. Sorgu performansı için index (Filtreleme ve sayfalama işlemlerini hızlandırır)
CREATE NONCLUSTERED INDEX [IX_Logs_Timestamp_LogLevel] 
ON [dbo].[Logs]([Timestamp] DESC, [LogLevel]);
GO
Yapılandırma (Configuration)
1. Backend Bağlantı Ayarı (Web API & Log Parser)
Veritabanı bağlantınızı Task2.1-WebAPI/appsettings.json içerisinde aşağıdaki gibi güncelleyin:

JSON
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=Orbitie;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
2. Frontend API Bağlantı Ayarı (React)
React uygulamasının backend ile haberleşebilmesi için, orbitie-log-dashboard dizinindeki .env dosyasında API adresinin doğru tanımlandığından emin olun:

Kod snippet'i
REACT_APP_API_BASE_URL=http://localhost:5243/api
Projeyi Ayağa Kaldırma
Sistemin tüm parçalarını sırasıyla çalıştırmak için terminal üzerinden aşağıdaki adımları izleyin:

Adım 1: Log Parser ile Veritabanını Doldurma
Test loglarını veritabanına aktarmak için ayrıştırıcı servisi çalıştırın:

Bash
cd OrbitieLogParser
dotnet run
Adım 2: Web API'yi Başlatma
Veri sunumu için REST API projesini başlatın:

Bash
cd Task2.1-WebAPI
dotnet run
Erişim: API ayağa kalktığında Swagger arayüzüne http://localhost:5243/swagger adresinden ulaşabilirsiniz.

Adım 3: React Dashboard'u Başlatma
Frontend bağımlılıklarını kurun ve arayüz sunucusunu başlatın:

Bash
cd orbitie-log-dashboard
npm install
npm start
Erişim: Dashboard tarayıcınızda http://localhost:3000 adresinde açılacaktır.

Adım 4: Unit Testleri Çalıştırma
Regex ve ayrıştırma senaryolarını doğrulamak için xUnit testlerini koşturun:

Bash
cd OrbitieLogParser.Tests
dotnet test
Proje Dizin Ağacı
Plaintext
OrbitieLogParser-Root/
├── OrbitieLogParser/             # Log ayrıştırma motoru ve veritabanı kayıt servisi
│   └── Logs/                     # Örnek uygulama log dosyalarının bulunduğu dizin
├── Task2.1-WebAPI/               # EF Core tabanlı, veri filtreleme ve KPI API'si
├── orbitie-log-dashboard/        # React, TS, Tailwind ve Recharts tabanlı web arayüzü
├── OrbitieLogParser.Tests/       # xUnit birim test (QA) projeleri (7 test case)
└── README.md                     # Kurulum ve dokümantasyon