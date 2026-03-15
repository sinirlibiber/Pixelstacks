"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { Shield, Zap, Users, ArrowRight, ChevronDown, Star, Clock, Award, Fuel } from "lucide-react";

const FEATURES = [
  { icon: Shield, title: "Trustless Escrow", desc: "Funds locked in smart contract. Released only when work is approved.", color: "#4F7FFF" },
  { icon: Zap, title: "Milestone Payments", desc: "Split any project into steps. Pay progressively, reduce risk.", color: "#FFB830" },
  { icon: Clock, title: "72h Auto-Release", desc: "No response after delivery? Funds release automatically.", color: "#A064FF" },
  { icon: Award, title: "Soulbound Badges", desc: "Earn non-transferable NFT badges as your reputation grows.", color: "#00D084" },
  { icon: Fuel, title: "Gasless Transactions", desc: "We sponsor gas fees. You pay zero ETH to use the platform.", color: "#FF4F6A" },
  { icon: Users, title: "On-Chain Reputation", desc: "Every completed job builds a verifiable 0–1000 score on Base.", color: "#4F7FFF" },
];

const FAQS = [
  {
    q: "SkillSwap nasıl çalışır?",
    a: "Müşteri iş ilanı açar ve ödemeyi akıllı kontratta kilitler. Freelancer teklif verir. İş tamamlanıp onaylanınca para otomatik serbest kalır. Anlaşmazlıkta admin karar verir."
  },
  {
    q: "Hangi ağda çalışıyor?",
    a: "SkillSwap, Base blockchain üzerinde çalışır. Ödemeler USDC ile yapılır. Test sürümü Base Sepolia testnet'tedir."
  },
  {
    q: "Platform ücreti ne kadar?",
    a: "Platform, sadece başarıyla tamamlanan işlerden %2 komisyon alır. Upwork (%20) ve Fiverr (%20) ile karşılaştırıldığında çok daha düşük."
  },
  {
    q: "Gas ücreti ödemem gerekiyor mu?",
    a: "Hayır. SkillSwap, Coinbase CDP Paymaster entegrasyonu sayesinde işlem gas ücretlerini sponsorlar. Coinbase Smart Wallet kullananlar sıfır ETH ile işlem yapabilir."
  },
  {
    q: "Freelancer olarak nasıl para çekerim?",
    a: "İş onaylandığında USDC bakiyene eklenir. 'Withdraw Funds' butonuyla istediğin zaman cüzdanına çekebilirsin. Push transfer yok — sen ne zaman istersen çekersin."
  },
  {
    q: "Anlaşmazlık (dispute) çıkarsa ne olur?",
    a: "Her iki taraf da kanıt (IPFS hash, link, ekran görüntüsü) yükler. Platform admini kanıtları inceler ve on-chain karar verir. Karar üç seçenekten biri olabilir: Müşteri kazanır, Freelancer kazanır veya Split (bölüşme)."
  },
  {
    q: "Freelancer neden stake koymak zorunda?",
    a: "Freelancer, teklif verirken 5 USDC stake eder. Bu teminat, ciddiyetini kanıtlar ve spam teklifleri önler. İş başarıyla tamamlanınca stake iade edilir."
  },
  {
    q: "Soulbound NFT rozet nedir?",
    a: "Başarıyla tamamladığın her iş, otomatik olarak on-chain rozet mint eder (1. iş, 5. iş, 10. iş, 25. iş vb.). Bu rozetler transfer edilemez — sadece sende kalır ve gerçek başarını kanıtlar."
  },
  {
    q: "Milestone deadline geçerse ne olur?",
    a: "Her milestone'un kendi son teslim tarihi vardır. Süre geçilirse kontrat bunu kaydeder ve freelancer'ın 'on-time delivery' skoru düşer. Aşırı gecikmelerde müşteri dispute açabilir."
  },
  {
    q: "BaseApp Mini App olarak kullanılabilir mi?",
    a: "Evet. SkillSwap, Farcaster çerçevesine uygun MiniKit ile inşa edilmiştir. Base App'ten direkt açılabilir."
  },
];

const BADGE_INFO = [
  { type: 1, name: "First Step", desc: "İlk iş tamamlandı", color: "#FFB830", emoji: "🥇" },
  { type: 2, name: "Rising Star", desc: "5 iş tamamlandı", color: "#4F7FFF", emoji: "⭐" },
  { type: 3, name: "Reliable Pro", desc: "10 iş tamamlandı", color: "#A064FF", emoji: "💎" },
  { type: 4, name: "Veteran", desc: "25 iş tamamlandı", color: "#00D084", emoji: "🏆" },
  { type: 5, name: "Elite", desc: "50 iş tamamlandı", color: "#FF4F6A", emoji: "🔥" },
  { type: 6, name: "Legend", desc: "100 iş tamamlandı", color: "#FFD700", emoji: "👑" },
  { type: 7, name: "Top Earner", desc: "10.000+ USDC kazanıldı", color: "#00D084", emoji: "💰" },
  { type: 8, name: "Dispute Free", desc: "10 iş, sıfır anlaşmazlık", color: "#4F7FFF", emoji: "🛡️" },
  { type: 9, name: "Speed Demon", desc: "5 iş zamanında teslim", color: "#FFB830", emoji: "⚡" },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0" }}>
        <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", flex: 1, marginRight: 16 }}>{q}</span>
        <ChevronDown
          size={16}
          color="var(--text-muted)"
          style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </div>
      {open && (
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, paddingBottom: 20, marginTop: -8 }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>

      {/* NAV */}
      <nav className="glass" style={{ position: "sticky", top: 0, zIndex: 50, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <span className="font-display" style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #4F7FFF, #A064FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SkillSwap
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/jobs" style={{ textDecoration: "none" }}>
              <button className="btn-secondary" style={{ padding: "7px 16px", fontSize: 13 }}>Jobs</button>
            </Link>
            <Link href="/faq" style={{ textDecoration: "none" }}>
              <button className="btn-secondary" style={{ padding: "7px 16px", fontSize: 13 }}>FAQ</button>
            </Link>
            {isConnected
              ? <Link href="/jobs/post"><button className="btn-primary" style={{ fontSize: 13, padding: "7px 16px" }}>Post a Job</button></Link>
              : <ConnectWallet />
            }
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "88px 24px 72px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(79,127,255,0.1)", border: "1px solid rgba(79,127,255,0.2)", borderRadius: 100, padding: "5px 14px", marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F7FFF", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
          <span style={{ fontSize: 11, color: "#4F7FFF", fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Live on Base Sepolia · Gas Sponsored
          </span>
        </div>

        <h1 className="font-display" style={{ fontSize: "clamp(36px, 5.5vw, 66px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, marginBottom: 22 }}>
          Freelance without<br />
          <span style={{ background: "linear-gradient(135deg, #4F7FFF 30%, #A064FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            trusting anyone
          </span>
        </h1>

        <p style={{ fontSize: 17, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 44px", lineHeight: 1.7 }}>
          Smart contracts hold payments in escrow. Work gets done. Funds release automatically. Zero platform drama.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/jobs">
            <button className="btn-primary" style={{ fontSize: 15, padding: "12px 28px", display: "flex", alignItems: "center", gap: 8 }}>
              Browse Jobs <ArrowRight size={15} />
            </button>
          </Link>
          <Link href="/jobs/post">
            <button className="btn-secondary" style={{ fontSize: 15, padding: "12px 28px" }}>Post a Job</button>
          </Link>
        </div>

        {/* Gas badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 28, background: "rgba(0,208,132,0.08)", border: "1px solid rgba(0,208,132,0.15)", borderRadius: 10, padding: "8px 16px" }}>
          <Fuel size={13} color="#00D084" />
          <span style={{ fontSize: 12, color: "#00D084", fontFamily: "var(--font-display)", fontWeight: 700 }}>
            Zero gas fees for users — we sponsor all transactions
          </span>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="card" style={{ padding: "24px 24px 28px" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <f.icon size={18} color={f.color} />
              </div>
              <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, textAlign: "center", marginBottom: 48 }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { n: "01", t: "Client posts & locks funds", d: "Describe the work, set milestones with deadlines, and lock USDC in escrow." },
            { n: "02", t: "Freelancer delivers", d: "Work is done step by step. Each milestone delivered and tracked on-chain." },
            { n: "03", t: "Instant payment", d: "Client approves → funds hit the freelancer's wallet. Or auto-release after 72h." },
          ].map((item) => (
            <div key={item.n} className="card" style={{ padding: "28px 28px 32px", position: "relative", overflow: "hidden" }}>
              <span className="font-display" style={{ position: "absolute", top: 8, right: 16, fontSize: 72, fontWeight: 800, color: "var(--border)", lineHeight: 1, userSelect: "none" }}>{item.n}</span>
              <span className="font-display" style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10, display: "block" }}>Step {item.n}</span>
              <h3 className="font-display" style={{ fontSize: 17, marginBottom: 10 }}>{item.t}</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BADGES */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Earn Soulbound Badges</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Non-transferable NFT badges. Your reputation lives on-chain forever.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {BADGE_INFO.map((b) => (
            <div key={b.type} className="card" style={{ padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{b.emoji}</div>
              <div className="font-display" style={{ fontSize: 13, fontWeight: 800, color: b.color, marginBottom: 4 }}>{b.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, textAlign: "center", marginBottom: 48 }}>Sıkça Sorulan Sorular</h2>
        <div className="card" style={{ padding: "8px 32px" }}>
          {FAQS.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* RULES */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card" style={{ padding: 32 }}>
            <h3 className="font-display" style={{ fontSize: 20, marginBottom: 20, color: "var(--accent)" }}>Müşteri Kuralları</h3>
            {[
              "İş ilanı açmadan önce tam açıklama ve net milestone'lar belirleyin.",
              "Teslim alınan işi 72 saat içinde inceleyin — süre geçince otomatik ödeme tetiklenir.",
              "Gerçek bir sorun olmadıkça dispute açmayın — kötü niyetli dispute reputation puanınızı düşürür.",
              "Freelancer'ı iş kabul etmeden önce seçin; iş başladıktan sonra tek taraflı iptal mümkün değildir.",
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <span style={{ color: "var(--accent)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>0{i + 1}</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{r}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 32 }}>
            <h3 className="font-display" style={{ fontSize: 20, marginBottom: 20, color: "#00D084" }}>Freelancer Kuralları</h3>
            {[
              "Teklif verirken 5 USDC stake koyarsınız. Bu, işi tamamlayacağınızın teminatıdır.",
              "Milestone'ları belirlenen deadline'a göre teslim edin. Geç teslim reputation puanını etkiler.",
              "Teslim notunda işin linkini, ekran görüntüsünü veya IPFS hash'ini paylaşın.",
              "Müşteri onaylamasa bile 72 saat sonra fonlar otomatik serbest kalır. Sabırlı olun.",
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <span style={{ color: "#00D084", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>0{i + 1}</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 100px" }}>
        <div className="card" style={{ padding: "56px 40px", textAlign: "center", background: "linear-gradient(135deg, rgba(79,127,255,0.07), rgba(160,100,255,0.04))", boxShadow: "0 0 60px rgba(79,127,255,0.08)" }}>
          <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, marginBottom: 14 }}>Başlamaya hazır mısın?</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 440, margin: "0 auto 36px" }}>
            Cüzdanını bağla. Sözleşmeni imzala. İşini yap. Para akıllı kontratta güvende.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link href="/jobs/post"><button className="btn-primary" style={{ fontSize: 15, padding: "12px 28px" }}>İş İlanı Aç</button></Link>
            <Link href="/jobs"><button className="btn-secondary" style={{ fontSize: 15, padding: "12px 28px" }}>İş Bul</button></Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 12 }}>
          {["Jobs", "Post a Job", "Profile", "FAQ", "Admin"].map((link) => (
            <Link key={link} href={link === "Jobs" ? "/jobs" : link === "Post a Job" ? "/jobs/post" : `/${link.toLowerCase()}`}
              style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 600 }}>
              {link}
            </Link>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          SkillSwap · Built on Base · 2% platform fee · Gas sponsored by CDP Paymaster
        </p>
      </footer>
    </div>
  );
}
