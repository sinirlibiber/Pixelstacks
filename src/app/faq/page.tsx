"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowLeft } from "lucide-react";

const FAQ_SECTIONS = [
  {
    title: "Genel",
    items: [
      { q: "SkillSwap nedir?", a: "SkillSwap, Base blockchain üzerinde çalışan merkeziyetsiz bir freelance pazaryeridir. Müşteri ödemeyi akıllı kontratta kilitler; iş tamamlanıp onaylanınca para otomatik serbest kalır." },
      { q: "Hangi ağda çalışıyor?", a: "Base blockchain (Coinbase'in Layer 2 ağı). Ödemeler USDC ile yapılır. Test sürümü Base Sepolia testnet'tedir." },
      { q: "Neden Base?", a: "Base, Coinbase'in geliştirdiği hızlı ve ucuz bir Ethereum Layer 2 ağıdır. İşlem ücretleri çok düşüktür ve Coinbase Wallet ile native entegrasyona sahiptir." },
      { q: "Mobilde kullanılabilir mi?", a: "Evet. SkillSwap, BaseApp üzerinde Mini App olarak çalışır. Farcaster uyumludur." },
    ]
  },
  {
    title: "Ödemeler",
    items: [
      { q: "Platform ücreti ne kadar?", a: "Yalnızca başarıyla tamamlanan işlerden %2 komisyon alınır. Açık işler, iptal edilen işler veya anlaşmazlıkla sonuçlanan işler için ücret kesilmez." },
      { q: "Gas ücreti ödemek zorunda mıyım?", a: "Hayır. CDP Paymaster entegrasyonu sayesinde tüm işlemler platformumuz tarafından sponsorlanır. Coinbase Smart Wallet kullananlar için sıfır ETH harcanır." },
      { q: "USDC nasıl temin ederim?", a: "Coinbase'den veya herhangi bir DEX'ten Base Sepolia üzerinde USDC alabilirsiniz. Test için Circle Faucet'i kullanın: faucet.circle.com" },
      { q: "Freelancer olarak ne zaman para çekerim?", a: "Milestone onaylandığında USDC bakiyenize eklenir. 'Withdraw Funds' butonuyla istediğiniz zaman cüzdanınıza çekebilirsiniz. Bekleme yoktur." },
    ]
  },
  {
    title: "Escrow & Güvenlik",
    items: [
      { q: "Escrow sistemi nasıl çalışır?", a: "Müşteri iş ilanı açarken USDC'yi akıllı kontratta kilitler. Kontrat fonları güvenle saklar. İş onaylanınca freelancer'a otomatik gönderilir. Hiçbir aracı müdahil olmaz." },
      { q: "Freelancer neden stake koyuyor?", a: "Teklif verirken 5 USDC stake koymak zorunludur. Bu teminat, ciddi olmayan teklifleri önler. İş başarıyla tamamlanırsa stake iade edilir." },
      { q: "72 saat auto-release ne anlama geliyor?", a: "Freelancer işi teslim etti ama müşteri 72 saat boyunca onaylamadı veya dispute açmadıysa, fonlar otomatik olarak freelancer'a serbest bırakılır." },
      { q: "Müşteri onaylamamak için direniyor mu?", a: "72 saat kuralı tam olarak bunun için var. Müşteri kasıtlı olarak onaylamayı reddederse, süre dolduğunda fonlar otomatik serbest bırakılır." },
    ]
  },
  {
    title: "Anlaşmazlıklar",
    items: [
      { q: "Dispute nasıl açılır?", a: "İş detay sayfasında 'Dispute' butonuna tıklayıp kanıt yüklersiniz (IPFS hash, link, açıklama). Her iki taraf da kanıt yükleyebilir." },
      { q: "Admin kimdir?", a: "Platform yöneticisi kontratı deploy eden cüzdan adresinin sahibidir. Anlaşmazlıkları inceler, kanıtları değerlendirir ve on-chain karar verir." },
      { q: "Karar nasıl verilir?", a: "Admin, her iki tarafın kanıtlarını inceledikten sonra üç seçenekten birini uygular: (1) Müşteri kazanır — tam iade, (2) Freelancer kazanır — tam ödeme, (3) Split — belirlenen oran dahilinde bölüşme." },
      { q: "Kötü niyetli dispute açarsam ne olur?", a: "Kaybedilen her dispute, reputation puanınızdan 50 puan düşürür. Çok sayıda kaybedilen dispute hesabınızın kısıtlanmasına yol açabilir." },
    ]
  },
  {
    title: "Rozetler & Reputation",
    items: [
      { q: "Soulbound NFT rozet nedir?", a: "Tamamlanan iş sayısına veya kazanılan USDC'ye göre otomatik olarak mint edilen NFT'lerdir. Transfer edilemez — sadece o adrese aittir. Bu sayede sahte reputation imkansızdır." },
      { q: "Hangi rozetler var?", a: "First Step (1 iş), Rising Star (5 iş), Reliable Pro (10 iş), Veteran (25 iş), Elite (50 iş), Legend (100 iş), Top Earner (10.000+ USDC), Dispute Free (10 arka arkaya dispute-free iş), Speed Demon (5 zamanında teslim)." },
      { q: "Reputation skoru nasıl hesaplanır?", a: "Her kullanıcı 500 puan ile başlar (0-1000 arası). Başarıyla tamamlanan her iş +20 puan kazandırır. Kaybedilen her dispute -50 puan düşürür." },
    ]
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }} onClick={() => setOpen(!open)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0" }}>
        <span className="font-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", flex: 1, marginRight: 16 }}>{q}</span>
        <ChevronDown size={15} color="var(--text-muted)" style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
      </div>
      {open && <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75, paddingBottom: 18, marginTop: -4 }}>{a}</p>}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <nav className="glass" style={{ position: "sticky", top: 0, zIndex: 50, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 13 }}>
            <ArrowLeft size={15} /> Ana Sayfa
          </Link>
          <span className="font-display" style={{ fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg, #4F7FFF, #A064FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SkillSwap</span>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "56px 24px 100px" }}>
        <h1 className="font-display" style={{ fontSize: 40, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>Sıkça Sorulan Sorular</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 56 }}>SkillSwap hakkında her şeyi buradan öğrenebilirsin.</p>

        {FAQ_SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: 48 }}>
            <h2 className="font-display" style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 12 }}>
              {section.title}
            </h2>
            <div className="card" style={{ padding: "4px 28px" }}>
              {section.items.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
            </div>
          </div>
        ))}

        <div className="card" style={{ padding: 28, textAlign: "center", marginTop: 20, background: "linear-gradient(135deg, rgba(79,127,255,0.06), transparent)" }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>Sorun çözülmedi mi?</p>
          <Link href="/jobs">
            <button className="btn-primary">Platformu Keşfet</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
