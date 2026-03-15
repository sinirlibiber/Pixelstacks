'use client';
import { useState, useRef } from 'react';
import {
  makeContractCall,
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  principalCV,
  getAddressFromPrivateKey,
  TransactionVersion,
} from '@stacks/transactions';
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';
import { network, CONTRACT_ADDRESS, CONTRACT_NAME } from '@/hooks/useWallet';
import { Zap, Wallet, Play, Square, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';

interface LogEntry {
  time: string;
  msg: string;
  type: 'ok' | 'err' | 'info';
}

interface Stats {
  totalMinted: number;
  totalFailed: number;
  totalWallets: number;
  rounds: number;
}

// CONFIG — buradan ayarla
const DEFAULT_STX_PER_WALLET = 0.15;   // Her alt cüzdana gönderilecek STX
const DEFAULT_MINTS_PER_WALLET = 50;   // Her alt cüzdan kaç mint atacak
const DEFAULT_PARALLEL_WORKERS = 5;   // Kaç cüzdan paralel çalışacak
const MINT_FEE = BigInt(2000);         // 0.002 STX
const TRANSFER_FEE = BigInt(1500);     // 0.0015 STX
const FUNDING_CONFIRM_DELAY = 12_000;  // 12 saniye fonlama onayı

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}s ${m % 60}dk`;
  if (m > 0) return `${m}dk ${s % 60}sn`;
  return `${s}sn`;
}

function generatePrivateKey() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('') + '01';
}

function getSubAddress(pk: string) {
  return getAddressFromPrivateKey(pk, TransactionVersion.Mainnet);
}

export default function MultiMintPage() {
  const [mnemonic, setMnemonic] = useState('');
  const [stxPerWallet, setStxPerWallet] = useState(DEFAULT_STX_PER_WALLET);
  const [mintsPerWallet, setMintsPerWallet] = useState(DEFAULT_MINTS_PER_WALLET);
  const [parallelWorkers, setParallelWorkers] = useState(DEFAULT_PARALLEL_WORKERS);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMinted: 0, totalFailed: 0, totalWallets: 0, rounds: 0 });
  const [balance, setBalance] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'funding' | 'minting' | 'done'>('idle');
  const [round, setRound] = useState(0);
  const stopFlag = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<Stats>({ totalMinted: 0, totalFailed: 0, totalWallets: 0, rounds: 0 });

  const addLog = (msg: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => {
      const next = [...prev, { time, msg, type }];
      return next.slice(-300);
    });
    setTimeout(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, 10);
  };

  const getNonce = async (address: string) => {
    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?unanchored=true`);
    const d = await res.json();
    return parseInt(d.nonce);
  };

  const getBalanceMicro = async (address: string): Promise<bigint> => {
    try {
      const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?unanchored=true`);
      const d = await res.json();
      return BigInt(d.balance ?? '0');
    } catch { return BigInt(0); }
  };

  const sendSTX = async (fromKey: string, toAddress: string, amount: bigint, nonce: number): Promise<{ ok: boolean; txid?: string; error?: string }> => {
    for (let t = 0; t <= 3; t++) {
      try {
        const tx = await makeSTXTokenTransfer({
          recipient: toAddress,
          amount,
          senderKey: fromKey,
          network,
          nonce: BigInt(nonce),
          anchorMode: AnchorMode.Any,
          fee: TRANSFER_FEE,
        });
        const res = await broadcastTransaction(tx, network);
        if (res.error) throw new Error(res.error + (res.reason ? ` (${res.reason})` : ''));
        return { ok: true, txid: res.txid };
      } catch (e: any) {
        if (t < 3) { await sleep(3000); continue; }
        return { ok: false, error: e.message };
      }
    }
    return { ok: false, error: 'max retries' };
  };

  const mintOne = async (fromKey: string, toAddress: string, nonce: number): Promise<{ ok: boolean; txid?: string; error?: string }> => {
    for (let t = 0; t <= 3; t++) {
      try {
        const tx = await makeContractCall({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'mint',
          functionArgs: [principalCV(toAddress)],
          senderKey: fromKey,
          network,
          nonce: BigInt(nonce),
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow,
          fee: MINT_FEE,
        });
        const res = await broadcastTransaction(tx, network);
        if (res.error) throw new Error(res.error + (res.reason ? ` (${res.reason})` : ''));
        return { ok: true, txid: res.txid };
      } catch (e: any) {
        if (t < 3) { await sleep(3000); continue; }
        return { ok: false, error: e.message };
      }
    }
    return { ok: false, error: 'max retries' };
  };

  const runWorker = async (id: number, pk: string, addr: string) => {
    let ok = 0, fail = 0;
    let nonce: number;
    try { nonce = await getNonce(addr); }
    catch { nonce = 0; }

    for (let i = 0; i < mintsPerWallet; i++) {
      if (stopFlag.current) break;
      const r = await mintOne(pk, addr, nonce + i);
      if (r.ok) {
        ok++;
        statsRef.current.totalMinted++;
        addLog(`[W${id}] TX #${i + 1} ✅ ${r.txid?.slice(0, 14)}...`, 'ok');
      } else {
        fail++;
        statsRef.current.totalFailed++;
        addLog(`[W${id}] TX #${i + 1} ❌ ${r.error}`, 'err');
      }
      setStats({ ...statsRef.current });
      if (i < mintsPerWallet - 1 && !stopFlag.current) await sleep(300);
    }
    addLog(`[W${id}] Tamamlandı → ✅${ok} ❌${fail}`, ok > 0 ? 'ok' : 'err');
  };

  const startMultiMint = async () => {
    if (running) return;
    if (!mnemonic.trim()) { addLog('Seed phrase boş!', 'err'); return; }

    stopFlag.current = false;
    setRunning(true);
    setLogs([]);
    statsRef.current = { totalMinted: 0, totalFailed: 0, totalWallets: 0, rounds: 0 };
    setStats({ ...statsRef.current });
    setPhase('idle');
    setRound(0);

    // Master cüzdanı türet
    let masterKey: string, masterAddress: string;
    try {
      const words = mnemonic.trim().split(/\s+/);
      if (words.length !== 12 && words.length !== 24) throw new Error('12 veya 24 kelime olmalı');
      const wallet = await generateWallet({ secretKey: mnemonic.trim(), password: '' });
      const account = wallet.accounts[0];
      masterKey = account.stxPrivateKey;
      masterAddress = getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet });
      addLog(`Ana cüzdan: ${masterAddress}`, 'info');
    } catch (e: any) {
      addLog('Cüzdan türetilemedi: ' + e.message, 'err');
      setRunning(false); return;
    }

    const stxMicro = BigInt(Math.round(stxPerWallet * 1_000_000));
    const costPerWallet = stxMicro + TRANSFER_FEE + BigInt(mintsPerWallet) * MINT_FEE;

    // Bakiye kontrol
    const bal = await getBalanceMicro(masterAddress);
    setBalance(Number(bal) / 1_000_000);
    addLog(`Bakiye: ${Number(bal) / 1_000_000} STX`, 'info');
    addLog(`Cüzdan başı maliyet: ~${Number(costPerWallet) / 1_000_000} STX`, 'info');

    if (bal < costPerWallet) {
      addLog(`Yetersiz bakiye! En az ${Number(costPerWallet) / 1_000_000} STX gerekli.`, 'err');
      setRunning(false); return;
    }

    let masterNonce = await getNonce(masterAddress);
    let roundNum = 0;

    // SONSUZ DÖNGÜ
    while (!stopFlag.current) {
      roundNum++;
      setRound(roundNum);

      const currentBal = await getBalanceMicro(masterAddress);
      setBalance(Number(currentBal) / 1_000_000);

      const affordable = Number(currentBal / costPerWallet);
      if (affordable === 0) {
        addLog('Bakiye bitti. Döngü tamamlandı.', 'info');
        break;
      }

      const activeWorkers = Math.min(parallelWorkers, affordable);
      addLog(`\n── TUR #${roundNum} | Bakiye: ${Number(currentBal) / 1_000_000} STX | ${activeWorkers} worker ──`, 'info');

      // Yeni cüzdanlar üret
      const batch: { pk: string; addr: string }[] = [];
      for (let i = 0; i < activeWorkers; i++) {
        const pk = generatePrivateKey();
        const addr = getSubAddress(pk);
        batch.push({ pk, addr });
      }

      // Fonla (sıralı)
      setPhase('funding');
      addLog(`${activeWorkers} yeni cüzdan fonlanıyor...`, 'info');
      const funded: { pk: string; addr: string }[] = [];

      for (let i = 0; i < batch.length; i++) {
        if (stopFlag.current) break;
        const { pk, addr } = batch[i];
        const r = await sendSTX(masterKey, addr, stxMicro, masterNonce++);
        if (r.ok) {
          funded.push({ pk, addr });
          addLog(`Fonlandı #${i + 1}: ${addr.slice(0, 14)}... ✅`, 'ok');
          statsRef.current.totalWallets++;
        } else {
          addLog(`Fonlama başarısız #${i + 1}: ${r.error}`, 'err');
        }
      }

      if (funded.length === 0) {
        addLog('Hiçbir cüzdan fonlanamadı, devam ediliyor...', 'err');
        continue;
      }

      // Onay bekle
      addLog(`Fonlama onayı için ${FUNDING_CONFIRM_DELAY / 1000}sn bekleniyor...`, 'info');
      await sleep(FUNDING_CONFIRM_DELAY);

      // Paralel mint
      setPhase('minting');
      addLog(`${funded.length} cüzdan paralel mint başlıyor...`, 'info');
      await Promise.all(funded.map(({ pk, addr }, i) => runWorker(i + 1, pk, addr)));

      statsRef.current.rounds++;
      setStats({ ...statsRef.current });

      if (stopFlag.current) break;
    }

    setPhase('done');
    setRunning(false);
    addLog(`\n✅ Tamamlandı! Toplam: ${statsRef.current.totalMinted} mint, ${statsRef.current.totalWallets} cüzdan, ${statsRef.current.rounds} tur`, 'ok');
  };

  const costPerWallet = (stxPerWallet + (Number(TRANSFER_FEE) + mintsPerWallet * Number(MINT_FEE)) / 1_000_000).toFixed(4);
  const estimatedMints = balance ? Math.floor(balance / parseFloat(costPerWallet)) * mintsPerWallet : 0;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-ps-accent flex items-center justify-center flex-shrink-0">
            <Zap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold gradient-text mb-1">Multi-Wallet Mint</h1>
            <p className="text-ps-muted text-sm">Ana cüzdan → Yeni cüzdanlar üretir → Onlara STX gönderir → Hepsinden paralel mint atar</p>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-5 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex gap-2">
          <AlertTriangle size={15} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-400 text-xs">Seed phrase yalnızca tarayıcında işlenir, sunucuya gönderilmez. Mint için ayrı bir cüzdan kullan.</p>
        </div>

        {/* Seed phrase */}
        <div className="card-dark p-4 mb-3">
          <label className="block text-xs text-ps-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Wallet size={11} /> Ana Cüzdan Seed Phrase
          </label>
          <input
            type="password"
            value={mnemonic}
            onChange={e => setMnemonic(e.target.value)}
            placeholder="word1 word2 word3 ... (12 veya 24 kelime)"
            disabled={running}
            className="w-full bg-ps-bg border border-ps-border rounded-lg px-3 py-2 text-sm font-mono text-ps-text placeholder-ps-muted focus:outline-none focus:border-ps-accent disabled:opacity-50"
          />
          <p className="text-xs text-ps-muted mt-1.5">Bu cüzdandan alt cüzdanlara STX gönderilecek. STX gönder, script kalanı halleder.</p>
        </div>

        {/* Config */}
        <div className="card-dark p-4 mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-ps-muted uppercase tracking-wider mb-2">STX / Cüzdan</label>
              <input
                type="number"
                value={stxPerWallet}
                onChange={e => setStxPerWallet(parseFloat(e.target.value))}
                step={0.05} min={0.05}
                disabled={running}
                className="w-full bg-ps-bg border border-ps-border rounded-lg px-3 py-2 text-sm text-ps-text focus:outline-none focus:border-ps-accent disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-ps-muted uppercase tracking-wider mb-2">Mint / Cüzdan</label>
              <input
                type="number"
                value={mintsPerWallet}
                onChange={e => setMintsPerWallet(parseInt(e.target.value))}
                min={1} max={200}
                disabled={running}
                className="w-full bg-ps-bg border border-ps-border rounded-lg px-3 py-2 text-sm text-ps-text focus:outline-none focus:border-ps-accent disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-ps-muted uppercase tracking-wider mb-2">Paralel Worker</label>
              <input
                type="number"
                value={parallelWorkers}
                onChange={e => setParallelWorkers(parseInt(e.target.value))}
                min={1} max={20}
                disabled={running}
                className="w-full bg-ps-bg border border-ps-border rounded-lg px-3 py-2 text-sm text-ps-text focus:outline-none focus:border-ps-accent disabled:opacity-50"
              />
            </div>
          </div>

          {/* Cost preview */}
          <div className="mt-3 pt-3 border-t border-ps-border flex items-center justify-between text-xs text-ps-muted">
            <span className="flex items-center gap-1"><Info size={11} /> Cüzdan başı maliyet: ~<span className="text-ps-text font-medium">{costPerWallet} STX</span></span>
            {balance !== null && (
              <span>Tahmini toplam mint: <span className="text-ps-accent font-bold">{estimatedMints.toLocaleString()}</span></span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Mint', value: stats.totalMinted, icon: <CheckCircle2 size={14} />, color: 'text-green-400' },
            { label: 'Hata', value: stats.totalFailed, icon: <XCircle size={14} />, color: 'text-red-400' },
            { label: 'Cüzdan', value: stats.totalWallets, icon: <Wallet size={14} />, color: 'text-ps-accent' },
            { label: 'Tur', value: round, icon: <Zap size={14} />, color: 'text-purple-400' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="card-dark p-3">
              <div className={`flex items-center gap-1 mb-1 ${color}`}>{icon}<span className="text-xs uppercase tracking-wider text-ps-muted">{label}</span></div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Phase indicator */}
        {running && (
          <div className="mb-3 p-3 rounded-xl bg-ps-surface border border-ps-border flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-ps-accent animate-pulse" />
            <span className="text-xs text-ps-muted">
              {phase === 'funding' && '📤 Alt cüzdanlar fonlanıyor...'}
              {phase === 'minting' && `🔥 Tur #${round} — paralel mint çalışıyor...`}
            </span>
            {balance !== null && (
              <span className="ml-auto text-xs text-ps-muted">💼 {balance.toFixed(4)} STX</span>
            )}
          </div>
        )}

        {/* Log */}
        <div
          ref={logRef}
          className="h-52 overflow-y-auto bg-ps-bg border border-ps-border rounded-xl p-3 font-mono text-xs mb-4"
        >
          {logs.length === 0 && <div className="text-ps-muted">— Bekleniyor —</div>}
          {logs.map((l, i) => (
            <div
              key={i}
              className={
                l.type === 'ok' ? 'text-green-400' :
                l.type === 'err' ? 'text-red-400' :
                'text-ps-muted'
              }
            >
              <span className="text-ps-border">[{l.time}]</span> {l.msg}
            </div>
          ))}
        </div>

        {/* Buttons */}
        {!running ? (
          <button
            onClick={startMultiMint}
            className="btn-primary w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2"
          >
            <Zap size={16} />
            Multi-Wallet Mint Başlat
          </button>
        ) : (
          <button
            onClick={() => { stopFlag.current = true; }}
            className="w-full py-3 rounded-xl border border-red-500 text-red-400 font-semibold text-sm hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
          >
            <Square size={14} fill="currentColor" />
            Durdur
          </button>
        )}

        {phase === 'done' && (
          <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs text-center">
            ✅ İşlem tamamlandı. {stats.totalMinted} mint, {stats.totalWallets} cüzdan kullanıldı.
          </div>
        )}

      </div>
    </div>
  );
}
