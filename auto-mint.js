/**
 * PixelStacks Auto-Mint Script
 * Mainnet - 5000 tx otomatik mint
 * 
 * Kurulum:
 *   npm install @stacks/transactions @stacks/network
 * 
 * Çalıştır:
 *   MNEMONIC="your 24 word seed phrase" node auto-mint.js
 */

const {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  principalCV,
  getNonce,
} = require("@stacks/transactions");
const { StacksMainnet } = require("@stacks/network");
const crypto = require("crypto");

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const CONFIG = {
  // Kontrat bilgileri (mainnet deployment'tan)
  contractAddress: "SP38Q50GFD6PDP895EDB1Z4B64NCG9763QFS663G7",
  contractName: "pixelstacks-nft-v2",
  functionName: "mint",

  // Kaç tx atacağız
  totalTx: 5000,

  // Her tx sonrası bekleme (ms) — rate limit aşmamak için
  // Stacks ~10 dk'da bir blok üretiyor, mempool'u boğmamak için 200ms yeterli
  delayBetweenTx: 200,

  // Hata durumunda kaç kez retry
  maxRetries: 3,

  // Retry öncesi bekleme (ms)
  retryDelay: 5000,

  // Kaçta bir log bas (her N tx'te bir)
  logInterval: 50,
};
// ───────────────────────────────────────────────────────────────────────────────

const network = new StacksMainnet();

// Seed phrase'den account türet
async function getAccount() {
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    console.error("❌ MNEMONIC environment variable eksik!");
    console.error("   Kullanım: MNEMONIC=\"word1 word2 ...\" node auto-mint.js");
    process.exit(1);
  }

  // @stacks/wallet-sdk kullanmadan basit türetme
  const { generateSecretKey, generateWallet } = require("@stacks/wallet-sdk");
  const wallet = await generateWallet({ secretKey: mnemonic, password: "" });
  const account = wallet.accounts[0];

  return {
    privateKey: account.stxPrivateKey,
    address: account.address,
  };
}

// Mevcut nonce'u al
async function getCurrentNonce(address) {
  const url = `https://api.mainnet.hiro.so/v2/accounts/${address}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.nonce;
}

// Tek bir mint tx'i at
async function mintOne(privateKey, recipientAddress, nonce, retryCount = 0) {
  try {
    const txOptions = {
      contractAddress: CONFIG.contractAddress,
      contractName: CONFIG.contractName,
      functionName: CONFIG.functionName,
      functionArgs: [principalCV(recipientAddress)],
      senderKey: privateKey,
      network,
      nonce: BigInt(nonce),
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: BigInt(2000), // 0.002 STX fee — mainnet için uygun
    };

    const tx = await makeContractCall(txOptions);
    const result = await broadcastTransaction(tx, network);

    if (result.error) {
      throw new Error(result.error + (result.reason ? ` (${result.reason})` : ""));
    }

    return { success: true, txid: result.txid };
  } catch (err) {
    if (retryCount < CONFIG.maxRetries) {
      await sleep(CONFIG.retryDelay);
      return mintOne(privateKey, recipientAddress, nonce, retryCount + 1);
    }
    return { success: false, error: err.message, nonce };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}s ${m % 60}dk ${s % 60}sn`;
  if (m > 0) return `${m}dk ${s % 60}sn`;
  return `${s}sn`;
}

// ─── ANA FONKSİYON ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 PixelStacks Auto-Mint Başlatılıyor...");
  console.log("═".repeat(50));

  // Account bilgilerini al
  let account;
  try {
    account = await getAccount();
  } catch (e) {
    // @stacks/wallet-sdk yoksa manuel private key dene
    const privateKey = process.env.PRIVATE_KEY;
    const address = process.env.STX_ADDRESS;
    if (!privateKey || !address) {
      console.error("❌ MNEMONIC veya (PRIVATE_KEY + STX_ADDRESS) gerekli!");
      console.error("\nAlternatif kullanım:");
      console.error("  PRIVATE_KEY=\"0x...\" STX_ADDRESS=\"SP...\" node auto-mint.js");
      process.exit(1);
    }
    account = { privateKey, address };
  }

  console.log(`📍 Adres     : ${account.address}`);
  console.log(`📄 Kontrat   : ${CONFIG.contractAddress}.${CONFIG.contractName}`);
  console.log(`🎯 Toplam TX : ${CONFIG.totalTx}`);
  console.log(`⏱  TX arası  : ${CONFIG.delayBetweenTx}ms`);

  // Mevcut nonce'u al
  console.log("\n⏳ Nonce alınıyor...");
  let currentNonce = await getCurrentNonce(account.address);
  console.log(`🔢 Başlangıç nonce: ${currentNonce}`);

  // İstatistikler
  const stats = {
    success: 0,
    failed: 0,
    errors: [],
    startTime: Date.now(),
  };

  console.log("\n▶️  Mint başlıyor...\n");

  for (let i = 0; i < CONFIG.totalTx; i++) {
    const nonce = currentNonce + i;
    const result = await mintOne(account.privateKey, account.address, nonce);

    if (result.success) {
      stats.success++;
    } else {
      stats.failed++;
      stats.errors.push({ tx: i + 1, nonce, error: result.error });
    }

    // Periyodik log
    if ((i + 1) % CONFIG.logInterval === 0 || i === CONFIG.totalTx - 1) {
      const elapsed = Date.now() - stats.startTime;
      const progress = (((i + 1) / CONFIG.totalTx) * 100).toFixed(1);
      const eta = ((elapsed / (i + 1)) * (CONFIG.totalTx - i - 1));
      console.log(
        `[${String(i + 1).padStart(4)}/${CONFIG.totalTx}] ` +
        `%${progress} | ` +
        `✅ ${stats.success} | ` +
        `❌ ${stats.failed} | ` +
        `Geçen: ${formatDuration(elapsed)} | ` +
        `Kalan: ~${formatDuration(eta)}`
      );
    }

    // Rate limit koruması
    if (i < CONFIG.totalTx - 1) {
      await sleep(CONFIG.delayBetweenTx);
    }
  }

  // ─── SONUÇ ─────────────────────────────────────────────────────────────────
  const totalTime = Date.now() - stats.startTime;
  console.log("\n" + "═".repeat(50));
  console.log("📊 SONUÇ");
  console.log("═".repeat(50));
  console.log(`✅ Başarılı  : ${stats.success}`);
  console.log(`❌ Başarısız : ${stats.failed}`);
  console.log(`⏱  Toplam    : ${formatDuration(totalTime)}`);
  console.log(`📈 Hız       : ${(stats.success / (totalTime / 1000)).toFixed(1)} tx/sn`);

  if (stats.errors.length > 0) {
    console.log("\n⚠️  Hatalı TX'ler (ilk 10):");
    stats.errors.slice(0, 10).forEach((e) => {
      console.log(`   TX #${e.tx} (nonce ${e.nonce}): ${e.error}`);
    });

    // Hataları dosyaya kaydet
    const fs = require("fs");
    fs.writeFileSync("errors.json", JSON.stringify(stats.errors, null, 2));
    console.log(`\n📁 Tüm hatalar errors.json dosyasına kaydedildi.`);
  }
}

main().catch((err) => {
  console.error("💥 Kritik hata:", err);
  process.exit(1);
});
