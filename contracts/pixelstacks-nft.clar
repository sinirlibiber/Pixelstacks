;; PixelStacks NFT Contract
;; SIP-009 compliant NFT contract

;; Define NFT
(define-non-fungible-token pixelstacks-nft-v2 uint)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-NOT-FOUND (err u101))
(define-constant ERR-ALREADY-LISTED (err u102))
(define-constant ERR-NOT-LISTED (err u103))
(define-constant ERR-WRONG-PRICE (err u104))
(define-constant ERR-MINT-LIMIT (err u105))

;; Data vars
(define-data-var last-token-id uint u0)
(define-data-var max-supply uint u10000)
(define-data-var royalty-percent uint u5)
(define-data-var base-uri (string-ascii 256) "https://pixelstacks.io/metadata/")

;; Data maps
(define-map token-owner uint principal)
(define-map marketplace-listings uint { price: uint, seller: principal })
(define-map creator-royalties uint principal)

;; SIP-009 Functions
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (token-id uint))
  (ok (some (var-get base-uri))))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? pixelstacks-nft-v2 token-id)))

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (map-get? marketplace-listings token-id)) ERR-ALREADY-LISTED)
    (nft-transfer? pixelstacks-nft-v2 token-id sender recipient)))

;; Mint (FREE - only gas fee required)
(define-public (mint (recipient principal))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (asserts! (<= token-id (var-get max-supply)) ERR-MINT-LIMIT)
    (try! (nft-mint? pixelstacks-nft-v2 token-id recipient))
    (map-set token-owner token-id recipient)
    (map-set creator-royalties token-id recipient)
    (var-set last-token-id token-id)
    (ok token-id)))

;; Admin mint
(define-public (admin-mint (recipient principal))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (<= token-id (var-get max-supply)) ERR-MINT-LIMIT)
    (try! (nft-mint? pixelstacks-nft-v2 token-id recipient))
    (map-set token-owner token-id recipient)
    (map-set creator-royalties token-id recipient)
    (var-set last-token-id token-id)
    (ok token-id)))

;; List NFT
(define-public (list-nft (token-id uint) (price uint))
  (let ((owner (unwrap! (nft-get-owner? pixelstacks-nft-v2 token-id) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender owner) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (map-get? marketplace-listings token-id)) ERR-ALREADY-LISTED)
    (asserts! (> price u0) ERR-WRONG-PRICE)
    (map-set marketplace-listings token-id { price: price, seller: tx-sender })
    (ok true)))

;; Unlist NFT
(define-public (unlist-nft (token-id uint))
  (let ((listing (unwrap! (map-get? marketplace-listings token-id) ERR-NOT-LISTED)))
    (asserts! (is-eq tx-sender (get seller listing)) ERR-NOT-AUTHORIZED)
    (map-delete marketplace-listings token-id)
    (ok true)))

;; Buy NFT
(define-public (buy-nft (token-id uint))
  (let (
    (listing (unwrap! (map-get? marketplace-listings token-id) ERR-NOT-LISTED))
    (price (get price listing))
    (seller (get seller listing))
    (creator (unwrap! (map-get? creator-royalties token-id) ERR-NOT-FOUND))
    (royalty-amount (/ (* price (var-get royalty-percent)) u100))
    (seller-amount (- price royalty-amount)))
    (asserts! (not (is-eq tx-sender seller)) ERR-NOT-AUTHORIZED)
    (try! (stx-transfer? royalty-amount tx-sender creator))
    (try! (stx-transfer? seller-amount tx-sender seller))
    (try! (nft-transfer? pixelstacks-nft-v2 token-id seller tx-sender))
    (map-delete marketplace-listings token-id)
    (map-set token-owner token-id tx-sender)
    (ok true)))

;; Read functions
(define-read-only (get-listing (token-id uint))
  (map-get? marketplace-listings token-id))

(define-read-only (get-total-supply)
  (var-get last-token-id))

(define-read-only (get-max-supply)
  (var-get max-supply))

;; Admin functions
(define-public (set-base-uri (new-uri (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set base-uri new-uri)
    (ok true)))
