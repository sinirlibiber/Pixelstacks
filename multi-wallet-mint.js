/**
 * PixelStacks — Sonsuz Multi-Wallet Mint
 * ═══════════════════════════════════════════════════════════
 * 1. Ana cüzdana STX gönder (örn. 5 STX)
 * 2. Script bakiye bitene kadar otomatik olarak:
 *    → Yeni cüzdan üret
 *    → Ona STX gönder
 *    → O cüzdandan mint TX at
 *    → Tekrar et
 * ═══════════════════════════════════════════════════════════
 *
 * Kurulum:
 *   npm install @stacks/transactions @stacks/wallet-sdk @stacks/network
 *
 * Çalıştır:
 *   MNEMONIC="24 kelime" node multi-wallet-mint.js
 *   veya
 *   PRIVATE_KEY="0x..." STX_ADDRESS="SP..." node multi-wallet-mint.js
 */

const {
  makeContractCall,
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  principalCV,
  getAddressFromPrivateKey,
  TransactionVersion,
} = require("@stacks/transactions");
const { StacksMainnet } = require("@stacks/network");
const crypto = require("crypto");
const fs = require("fs");

// ─── CONFIG ────────────────────────────────────────────────
const CONFIG = {
  // Kontrat
  contractAddress: "SP38Q50GFD6PDP895EDB1Z4B64NCG9763QFS663G7",
  contractName:    "pixelstacks-nft-v2",
  functionName:    "mint",

  // Her yeni cüzdana gönderilecek STX (microstacks)
  // 0.15 STX → 50 mint × 0.002 STX fee = 0.1 STX + 0.05 buffer
  stxPerWallet: 150_000n,

  // Her yeni cüzdan kaç mint atacak
  mintsPerWallet: 50,

  // Kaç cüzdan aynı anda paralel çalışsın
  parallelWorkers: 5,

  // Fee'ler (microstacks)
  mintFee:     2_000n,
  transferFee: 1_500n,

  // Bekleme süreleri (ms)
  delayBetweenMints:    300,
  delayFundingConfirm: 12_000,
  retryDelay:           5_000,
  maxRetries:           3,
};

// Her cüzdan için toplam maliyet
const COST_PER_WALLET =
  CONFIG.stxPerWallet +
  CONFIG.transferFee +
  BigInt(CONFIG.mintsPerWallet) * CONFIG.mintFee;

// ───────────────────────────────────────────────────────────

const network = new StacksMainnet();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}s ${m % 60}dk ${s % 60}sn`;
  if (m > 0) return `${m}dk ${s % 60}sn`;
  return `${s}sn`;
}

function generatePrivateKey() {
  return crypto.randomBytes(32).toString("hex") + "01";
}

function getAddress(pk) {
  return getAddressFromPrivateKey(pk, TransactionVersion.Mainnet);
}

async function getNonce(address) {
  try {
    const r = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}`);
    const d = await r.json();
    return Number(d.nonce ?? 0);
  } catch { return 0; }
}

async function getBalance(address) {
  try {
    const r = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}`);
    const d = await r.json();
    return BigInt(d.balance ?? "0");
  } catch { return 0n; }
}

async function sendSTX(fromKey, toAddress, amount, nonce) {
  for (let t = 0; t <= CONFIG.maxRetries; t++) {
    try {
      const tx = await makeSTXTokenTransfer({
        recipient: toAddress,
        amount,
        senderKey: fromKey,
        network,
        nonce: BigInt(nonce),
        anchorMode: AnchorMode.Any,
        fee: CONFIG.transferFee,
      });
      const res = await broadcastTransaction(tx, network);
      if (res.error) throw new Error(res.error + (res.reason ? ` (${res.reason})` : ""));
      return { ok: true, txid: res.txid };
    } catch (e) {
      if (t < CONFIG.maxRetries) { await sleep(CONFIG.retryDelay); continue; }
      return { ok: false, error: e.message };
    }
  }
}

async function mintTx(fromKey, recipientAddress, nonce) {
  for (let t = 0; t <= CONFIG.maxRetries; t++) {
    try {
      const tx = await makeContractCall({
        contractAddress: CONFIG.contractAddress,
        contractName:    CONFIG.contractName,
        functionName:    CONFIG.functionName,
        functionArgs:    [principalCV(recipientAddress)],
        senderKey: fromKey,
        network,
        nonce: BigInt(nonce),
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: CONFIG.mintFee,
      });
      const res = await broadcastTransaction(tx, network);
      if (res.error) throw new Error(res.error + (res.reason ? ` (${res.reason})` : ""));
      return { ok: true, txid: res.txid };
    } catch (e) {
      if (t < CONFIG.maxRetries) { await sleep(CONFIG.retryDelay); continue; }
      return { ok: false, error: e.message };
    }
  }
}

async function runWorker(id, pk, addr, stats) {
  let ok = 0, fail = 0;
  const nonce = await getNonce(addr);
  for (let i = 0; i < CONFIG.mintsPerWallet; i++) {
    const r = await mintTx(pk, addr, nonce + i);
    if (r.ok) { ok++; stats.totalMinted++; }
    else       { fail++; stats.totalFailed++; }
    if (i < CONFIG.mintsPerWallet - 1) await sleep(CONFIG.delayBetweenMints);
  }
  console.log(`  [W${id}] ${addr.slice(0, 14)}... → ✅${ok} ❌${fail}`);
}

// ─── ANA DÖNGÜ ─────────────────────────────────────────────
async function main() {
  console.log("\n" + "═".repeat(58));
  console.log("  🚀  PixelStacks — Sonsuz Multi-Wallet Mint");
  console.log("═".repeat(58));

  // Master cüzdan yükle
  let masterKey, masterAddress;
  try {
    const { generateWallet } = require("@stacks/wallet-sdk");
    const mnemonic = process.env.MNEMONIC;
    if (!mnemonic) throw new Error("no mnemonic");
    const w = await generateWallet({ secretKey: mnemonic, password: "" });
    masterKey     = w.accounts[0].stxPrivateKey;
    masterAddress = w.accounts[0].address;
  } catch {
    masterKey     = process.env.PRIVATE_KEY;
    masterAddress = process.env.STX_ADDRESS;
    if (!masterKey || !masterAddress) {
      console.error("❌ MNEMONIC veya (PRIVATE_KEY + STX_ADDRESS) gerekli!");
      process.exit(1);
    }
  }

  console.log(`\n📍 Ana Cüzdan      : ${masterAddress}`);
  console.log(`👥 Paralel Worker  : ${CONFIG.parallelWorkers}`);
  console.log(`🎯 Mint/Cüzdan     : ${CONFIG.mintsPerWallet}`);
  console.log(`💸 STX/Cüzdan      : ${Number(CONFIG.stxPerWallet) / 1e6} STX`);
  console.log(`💰 Maliyet/Cüzdan  : ~${Number(COST_PER_WALLET) / 1e6} STX`);

  const stats = { totalMinted: 0, totalFailed: 0, totalWallets: 0, rounds: 0, startTime: Date.now() };
  const logFile = `mint-log-${Date.now()}.jsonl`;
  const allSubWallets = [];
  let masterNonce = await getNonce(masterAddress);
  let round = 0;

  // ── SONSUZ DÖNGÜ — bakiye bitince durur ────────────────
  while (true) {
    round++;
    const balance = await getBalance(masterAddress);
    const activeWorkers = Math.min(
      CONFIG.parallelWorkers,
      Number(balance / COST_PER_WALLET)
    );

    console.log(`\n${"─".repeat(58)}`);
    console.log(`  TUR #${round}  |  💼 ${Number(balance) / 1e6} STX  |  👥 ${activeWorkers} worker`);
    console.log(`${"─".repeat(58)}`);

    if (activeWorkers === 0) {
      console.log("\n⛔ Bakiye yetersiz. Döngü tamamlandı.");
      break;
    }

    // Yeni cüzdanlar üret
    const batch = Array.from({ length: activeWorkers }, () => {
      const pk   = generatePrivateKey();
      const addr = getAddress(pk);
      return { pk, addr };
    });

    // Fonla (sıralı — nonce çakışmasın)
    console.log(`\n  📤 ${activeWorkers} yeni cüzdan fonlanıyor...`);
    const funded = [];
    for (let i = 0; i < batch.length; i++) {
      const { pk, addr } = batch[i];
      const r = await sendSTX(masterKey, addr, CONFIG.stxPerWallet, masterNonce++);
      if (r.ok) {
        funded.push({ pk, addr });
        allSubWallets.push({ address: addr, privateKey: pk, round });
        console.log(`  ✅ #${i + 1} ${addr.slice(0, 16)}...`);
      } else {
        console.log(`  ❌ #${i + 1} hata: ${r.error}`);
      }
    }

    if (funded.length === 0) {
      console.log("  ⚠️  Fonlama başarısız, 10sn bekleniyor...");
      await sleep(10_000);
      continue;
    }

    // Fonlama onayı için bekle
    console.log(`\n  ⏳ Onay bekleniyor (${CONFIG.delayFundingConfirm / 1000}sn)...`);
    await sleep(CONFIG.delayFundingConfirm);

    // Paralel mint
    console.log(`\n  🔥 Paralel mint başlıyor (${funded.length} cüzdan)...\n`);
    await Promise.all(funded.map(({ pk, addr }, i) => runWorker(i + 1, pk, addr, stats)));

    stats.rounds++;
    stats.totalWallets += funded.length;

    const elapsed = Date.now() - stats.startTime;
    const speed = (stats.totalMinted / (elapsed / 1000)).toFixed(2);
    console.log(`\n  📊 Toplam: ✅${stats.totalMinted} | ❌${stats.totalFailed} | ⏱ ${fmt(elapsed)} | 📈 ${speed} tx/sn`);

    // Log
    fs.appendFileSync(logFile, JSON.stringify({
      round, wallets: funded.map(w => w.addr),
      minted: stats.totalMinted, elapsed: fmt(elapsed),
      ts: new Date().toISOString(),
    }) + "\n");
  }

  // ── FINAL ÖZET ─────────────────────────────────────────
  const total = Date.now() - stats.startTime;
  console.log("\n" + "═".repeat(58));
  console.log("  📊  FINAL ÖZET");
  console.log("═".repeat(58));
  console.log(`  ✅ Toplam Mint    : ${stats.totalMinted}`);
  console.log(`  ❌ Başarısız      : ${stats.totalFailed}`);
  console.log(`  👛 Kullanılan CZ  : ${stats.totalWallets}`);
  console.log(`  🔄 Tur Sayısı     : ${stats.rounds}`);
  console.log(`  ⏱  Toplam Süre    : ${fmt(total)}`);
  console.log(`  📈 Ortalama Hız   : ${(stats.totalMinted / (total / 1000)).toFixed(2)} tx/sn`);

  // Kayıt
  const dumpFile = `sub-wallets-${Date.now()}.json`;
  fs.writeFileSync(dumpFile, JSON.stringify(allSubWallets, null, 2));
  console.log(`  📁 Log            : ${logFile}`);
  console.log(`  🔑 Alt Cüzdanlar  : ${dumpFile}`);
  console.log("═".repeat(58) + "\n");
}

main().catch((err) => {
  console.error("💥 Kritik hata:", err);
  process.exit(1);
});
