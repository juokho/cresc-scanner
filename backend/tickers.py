# ============================================================
# 롱/숏 페어 — 전체 리스트 (원본 100% 유지)
# ============================================================
LEVERAGE_MAP = {
    # ── 인덱스 3X ──────────────────────────────────────────
    "SPY": {"long": "SPXL", "short": "SPXS", "name": "S&P 500 3X"},
    "QQQ": {"long": "TQQQ", "short": "SQQQ", "name": "Nasdaq-100 3X"},
    "IWM": {"long": "TNA",  "short": "TZA",  "name": "Russell 2000 3X"},
    "DIA": {"long": "UDOW", "short": "SDOW", "name": "Dow Jones 3X"},
        
    # ── 섹터 3X ────────────────────────────────────────────
    "SOXX": {"long": "SOXL", "short": "SOXS", "name": "PHLX Semi 3X"},
    "XLF": {"long": "FAS",  "short": "FAZ",  "name": "Financials 3X"},
    "XLE": {"long": "ERX",  "short": "ERY",  "name": "Energy 3X"},
    "XLB": {"long": "NAIL", "short": "CLAW", "name": "Homebuilder 3X"},
    "IBB": {"long": "LABU", "short": "LABD", "name": "Biotech 3X"},
    "XBI": {"long": "CURE", "short": "RXD",  "name": "Healthcare 3X"},
    "PSCE": {"long": "HIBL", "short": "HIBS", "name": "S&P High Beta 3X"},
    
    # ── 테마 / FANG ────────────────────────────────────────
    "FNGS": {"long": "FNGU", "short": "FNGD", "name": "FANG+ 3X"},
    "WEBL": {"long": "WEBL", "short": "WEBS", "name": "Internet 3X"},
    "BULZ": {"long": "BULZ", "short": "BERZ", "name": "MagnificentSeven 3X"},
    
    # ── 원자재 / 채권 3X ───────────────────────────────────
    "GDX":  {"long": "NUGT", "short": "DUST", "name": "Gold Miners 3X"},
    "GDXJ": {"long": "JNUG", "short": "JDST", "name": "Jr Gold Miners 3X"},
    "TLT":  {"long": "TMF",  "short": "TMV",  "name": "20Y Bond 3X"},
    "USO":  {"long": "OILU", "short": "OILD", "name": "Oil 3X"},
    "DRN":  {"long": "DRN",  "short": "DRV",  "name": "Real Estate 3X"},
    
    # ── 해외 3X ────────────────────────────────────────────
    "FXI":  {"long": "YINN", "short": "YANG", "name": "China 3X"},
    "KWEB": {"long": "CWEB", "short": "CWEI", "name": "China Web 2X"},
    "INDA": {"long": "INDL", "short": "INDZ", "name": "India 3X"},
    
    # ── 단일 주식 2X ───────────────────────────────────────
    "NVDA": {"long": "NVDU", "short": "NVDD", "name": "NVIDIA 2X"},
    "TSLA": {"long": "TSLL", "short": "TSLS", "name": "Tesla 2X"},
    "MSTR": {"long": "MSTU", "short": "MSTZ", "name": "MicroStrategy 2X"},
    "COIN": {"long": "CONL", "short": "CONI", "name": "Coinbase 2X"},
    "AAPL": {"long": "AAPU", "short": "AAPD", "name": "Apple 2X"},
    "AMZN": {"long": "AMZU", "short": "AMZD", "name": "Amazon 2X"},
    "MSFT": {"long": "MSFU", "short": "MSFD", "name": "Microsoft 2X"},
    "GOOGL": {"long": "GGLL", "short": "GGLS", "name": "Alphabet 2X"},
    "META": {"long": "METU", "short": "METD", "name": "Meta 2X"},
    "TSM":  {"long": "TSMX", "short": "TSMZ", "name": "TSMC 2X"},
    "NFLX": {"long": "NFXL", "short": "NFXS", "name": "Netflix 2X"},
    "AMD":  {"long": "AMUU", "short": "AMDD", "name": "AMD 2X"},
    "AVGO": {"long": "AVL",  "short": "AVS",  "name": "Broadcom 2X"},
    "MU":   {"long": "MUU",  "short": "MUD",  "name": "Micron 2X"},
    "PLTR": {"long": "PLTU", "short": "PLTD", "name": "Palantir 2X"},
    "SMCI": {"long": "SMCX", "short": "SMCZ", "name": "SuperMicro 2X"},
    "SHOP": {"long": "SHPU", "short": "SHPD", "name": "Shopify 2X"},
    "OKLO": {"long": "OKLL", "short": "OKLS", "name": "Oklo 2X"},
    "SMR":  {"long": "SMU",  "short": "SMZ",  "name": "NuScale 2X"},
    "IONQ": {"long": "IONX", "short": "IONZ", "name": "IonQ 2X"},
    "RGTI": {"long": "RGTX", "short": "RGTZ", "name": "Rigetti 2X"},
    "BITF": {"long": "BMNU", "short": "BMNZ", "name": "Bitfarms 2X"},
    "IREN": {"long": "IREX", "short": "IREZ", "name": "IREN 2X"},
    
    # ── 크립토 2X ──────────────────────────────────────────
    "BTC-USD": {"long": "BTCL", "short": "BTCZ", "name": "Bitcoin 2X"},
    "ETH-USD": {"long": "ETU",  "short": "ETHD", "name": "Ethereum 2X"},
    "SOL-USD": {"long": "SOLT", "short": "SOLZ", "name": "Solana 2X"},
}
