# PixelStacks Auto-Mint

5000 tx otomatik mint scripti — Stacks Mainnet

## Kurulum

```bash
npm install
```

## Kullanım

### Seçenek 1 — Seed phrase ile (önerilen)
```bash
MNEMONIC="word1 word2 word3 ... word24" node auto-mint.js
```

### Seçenek 2 — Private key ile
```bash
PRIVATE_KEY="0xabc123..." STX_ADDRESS="SP..." node auto-mint.js
```

## Ayarlar (auto-mint.js içinde CONFIG)

| Parametre | Varsayılan | Açıklama |
|-----------|-----------|----------|
| `totalTx` | 5000 | Kaç mint atılacak |
| `delayBetweenTx` | 200ms | TX'ler arası bekleme |
| `maxRetries` | 3 | Hata durumunda retry sayısı |
| `fee` | 2000 (0.002 STX) | Her TX için gas ücreti |

## Tahmini Maliyet

- 5000 tx × 0.002 STX = **10 STX** gas ücreti
- Süre: ~5000 × 200ms ≈ **~17 dakika**

## Notlar

- Script kaldığı yerden devam etmez — hata olursa `errors.json`'a kaydeder
- Nonce otomatik yönetilir, elle müdahale gerekmez
- Mempool dolmaması için delay'i 200ms altına indirme
