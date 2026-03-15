'use client';
import { useState, useRef } from 'react';
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  principalCV,
} from '@stacks/transactions';
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';
import { TransactionVersion } from '@stacks/transactions';
import { network, CONTRACT_ADDRESS, CONTRACT_NAME } from '@/hooks/useWallet';

interface LogEntry {
  time: string;
  msg: string;
  type: 'ok' | 'err' | 'info';
}

export default function AutoMintPage() {
  const [mnemonic, setMnemonic] = useState('');
  const [totalTx, setTotalTx] = useState(5000);
  const [delay, setDelay] = useState(200);
  const [recipient, setRecipient] = useState('');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sent, setSent] = useState(0);
  const [ok, setOk] = useState(0);
  const [err, setErr] = useState(0);
  const [eta, setEta] = useState('—');
  const [progress, setProgress] = useState(0);
  const stopFlag = useRef(false);
  const logBoxRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => {
      const next = [...prev, { time, msg, type }];
      return next.slice(-200);
    });
    setTimeout(() => {
      if (logBoxRef.current) logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }, 10);
  };

  const fmtETA = (ms: number) => {
    if (!ms || ms < 0) return '—';
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}sn`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}dk ${s % 60}sn`;
    return `${Math.floor(m / 60)}s ${m % 60}dk`;
  };

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const getNonce = async (address: string) => {
    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${address}?unanchored=true`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return parseInt(data.nonce);
  };

  const deriveAccount = async (mn: string) => {
    const words = mn.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) throw new Error('12 veya 24 kelime olmalı');
    const wallet = await generateWallet({ secretKey: mn.trim(), password: '' });
    const account = wallet.accounts[0];
    const address = getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet });
    return { privateKey: account.stxPrivateKey, address };
  };

  const mintOne = async (privateKey: string, to: string, nonce: number) => {
    const tx = await makeContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'mint',
      functionArgs: [principalCV(to)],
      senderKey: privateKey,
      network,
      nonce: BigInt(nonce),
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: BigInt(2000),
    });
    const result = await broadcastTransaction(tx, network);
    if (result.error) throw new Error(result.error + (result.reason ? ` (${result.reason})` : ''));
    return result.txid;
  };

  const startMint = async () => {
    if (running) return;
    if (!mnemonic.trim()) { addLog('Seed phrase boş!', 'err'); return; }
    if (!totalTx || totalTx < 1) { addLog('Geçersiz TX sayısı', 'err'); return; }

    stopFlag.current = false;
    setRunning(true);
    setLogs([]);
    setSent(0); setOk(0); setErr(0); setProgress(0); setEta('—');

    let privateKey: string, address: string;
    try {
      ({ privateKey, address } = await deriveAccount(mnemonic));
      addLog(`Adres: ${address}`, 'ok');
    } catch (e: any) {
      addLog('Adres türetilemedi: ' + e.message, 'err');
      setRunning(false); return;
    }

    const to = recipient.trim() || address;
    addLog(`Recipient: ${to}`, 'info');

    let nonce: number;
    try {
      nonce = await getNonce(address);
      addLog(`Nonce: ${nonce}`, 'info');
      addLog(`Toplam ${totalTx} TX atılacak...`, 'info');
    } catch (e: any) {
      addLog('Nonce alınamadı: ' + e.message, 'err');
      setRunning(false); return;
    }

    let okCount = 0, errCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < totalTx; i++) {
      if (stopFlag.current) { addLog('Durduruldu.', 'info'); break; }

      try {
        const txid = await mintOne(privateKey, to, nonce + i);
        okCount++;
        addLog(`TX #${i + 1} OK · ${txid.slice(0, 18)}...`, 'ok');
      } catch (e: any) {
        errCount++;
        addLog(`TX #${i + 1} HATA: ${e.message}`, 'err');
      }

      const s = i + 1;
      const elapsed = Date.now() - startTime;
      const etaMs = (elapsed / s) * (totalTx - s);
      setSent(s);
      setOk(okCount);
      setErr(errCount);
      setProgress(Math.round((s / totalTx) * 100));
      setEta(fmtETA(etaMs));

      if (i < totalTx - 1 && !stopFlag.current) await sleep(delay);
    }

    const total = Date.now() - startTime;
    addLog(`Bitti! ${okCount} başarılı, ${errCount} hatalı · ${fmtETA(total)}`, okCount > 0 ? 'ok' : 'err');
    setRunning(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold gradient-text mb-1">Auto Mint</h1>
          <p className="text-ps-muted text-sm">Otomatik TX gönderici · Mainnet · {CONTRACT_ADDRESS.slice(0,8)}...{CONTRACT_ADDRESS.slice(-4)}</p>
        </div>

        {/* Warning */}
        <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs">
          Seed phrase yalnızca tarayıcında çalışır, sunucuya gönderilmez. Yine de mint için ayrı bir cüzdan kullan.
        </div>

        {/* Seed Phrase */}
        <div className="card-dark p-4 mb-3">
          <label className="block text-xs text-ps-muted uppercase tracking-wider mb-2">Seed Phrase (12 veya 24 kelime)</label>
          <input
            type="password"
            value={mnemonic}
            onChange={e => setMnemonic(e.target.value)}
            placeholder="word1 word2 word3 ..."
            disabled={running}
            className="w-full bg-ps-bg border border-ps-border rounded-lg px-3 py-2 text-sm font-mono text-ps-text placeholder-ps-muted focus:outline-none focus:border-ps-accent disabled:opacity-50"
          />
          <p className="text-xs text-ps-muted mt-1">Adres otomatik türetilir (Hiro/Xverse uyumlu)</p>
        </div>

        {/* Config */}
        <div className="card-dark p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-ps-muted uppercase tracking-wider mb-2">Toplam TX</label>
              <input
                type="number"
                value={totalTx}
                onChange={e => setTotalTx(parseInt(e.target.value))}
                min={1} max={10000}
                disabled={running}
                className="w-full bg-ps-bg border border-ps-border rounded-lg px-3 py-2 text-sm text-ps-text focus:outline-none focus:border-ps-accent disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-ps-muted uppercase tracking-wider mb-2">TX arası (ms)</label>
              <input
                type="number"
                value={delay}
                onChange={e => setDelay(parseInt(e.target.value))}
                min={50}
                disabled={running}
                className="w-full bg-ps-bg border border-ps-border rounded-lg px-3 py-2 text-sm text-ps-text focus:outline-none focus:border-ps-accent disabled:opacity-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ps-muted uppercase tracking-wider mb-2">Recipient adresi (boş = kendi cüzdanın)</label>
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="SP... (opsiyonel)"
              disabled={running}
              className="w-full bg-ps-bg border border-ps-border rounded-lg px-3 py-2 text-sm font-mono text-ps-text placeholder-ps-muted focus:outline-none focus:border-ps-accent disabled:opacity-50"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Gönderildi', value: sent },
            { label: 'Başarılı', value: ok, color: 'text-green-400' },
            { label: 'Hatalı', value: err, color: 'text-red-400' },
            { label: 'Kalan', value: eta },
          ].map(({ label, value, color }) => (
            <div key={label} className="card-dark p-3">
              <div className={`text-xl font-bold ${color || 'text-ps-text'}`}>{value}</div>
              <div className="text-xs text-ps-muted uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-1 h-1.5 bg-ps-surface rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-ps-accent to-ps-accent2 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-ps-muted text-right mb-3">{sent} / {totalTx}</div>

        {/* Log */}
        <div ref={logBoxRef} className="h-44 overflow-y-auto bg-ps-bg border border-ps-border rounded-xl p-3 font-mono text-xs mb-4">
          {logs.length === 0 && <div className="text-ps-muted">— Bekleniyor —</div>}
          {logs.map((l, i) => (
            <div key={i} className={l.type === 'ok' ? 'text-green-400' : l.type === 'err' ? 'text-red-400' : 'text-ps-muted'}>
              [{l.time}] {l.msg}
            </div>
          ))}
        </div>

        {/* Buttons */}
        {!running ? (
          <button onClick={startMint} className="btn-primary w-full py-3 rounded-xl font-semibold text-white text-sm">
            Mint Başlat
          </button>
        ) : (
          <button onClick={() => { stopFlag.current = true; }} className="w-full py-3 rounded-xl border border-red-500 text-red-400 font-semibold text-sm hover:bg-red-500/10 transition-all">
            Durdur
          </button>
        )}

      </div>
    </div>
  );
}
