# 📊 AdQueryTriage - Google Ads Search Query Triage Dashboard

> **A single-page React dashboard powered by PapaParse to ingest Google Ads Search Terms CSVs and algorithmically triage queries into `Promote` (Exact Match Keywords), `Block` (Negative Keywords), and `Ignore` (Monitor).**

---

## 🚀 Quick Start

### Run the website (recommended)

1. Install **Node.js (LTS version)** from https://nodejs.org, then restart VS Code.
2. Download and unzip the project, then open the folder in VS Code (**File → Open Folder**).
   Make sure you open the folder that contains `package.json`.
3. Open the terminal (**Ctrl + `**) and run these two commands one at a time:

```bash
npm install
npm run dev
```

4. Open **http://localhost:5173/** in your browser.

> ⚠️ **Do NOT use the "Go Live" / Live Server button.** It shows a blank page for this project. Always use `npm run dev`.
>
> On Windows, if you see *"running scripts is disabled on this system"*, run this once in the terminal and then try again:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

### Quick preview without installing anything

Open `standalone.html` in Chrome (needs an internet connection).

### Run unit tests

```bash
npm test
```

### Python scripts (optional)

```bash
pip install -r requirements.txt
python test_pipeline.py
python -m unittest test_triage_engine
```

---

## 🧠 The 3-Way Triage Algorithm

| Category | Goal | Trigger Criteria | Recommended Action |
| :--- | :--- | :--- | :--- |
| <strong style="color:#10b981">PROMOTE</strong> | Scale winning queries | • Conversions $\ge 2$ AND CPA $\le \text{Target CPA} \times 1.15$<br>• High ROAS: $\ge 2.5\times$ Target ROAS<br>• High Conversion Rate ($\ge 12\%$) at efficient CPA | Export as **Exact Match `[query]`** with dedicated Max CPC bid to improve Quality Score & Ad Rank |
| <strong style="color:#f43f5e">BLOCK</strong> | Stop budget bleeders | • **Bleeder**: Cost $\ge \$50$ with $0$ conversions<br>• **Click Burner**: $\ge 20$ clicks with $0$ conversions<br>• **Unprofitable CPA**: CPA $> \text{Max CPA}$ (\$85)<br>• **Negative Stopwords**: Matches `"free"`, `"crack"`, `"torrent"`, `"jobs"`, `"salary"`, `"login"`, etc.<br>• **Ghost Impressions**: $\ge 800$ impr with CTR $< 0.35\%$ and $0$ conv | Export as **Negative Exact `[query]`** or **Negative Phrase `"query"`** to immediately recover wasted ad spend |
| <strong style="color:#f59e0b">IGNORE</strong> | Statistical patience | • Insufficient data (low clicks, low spend)<br>• Inconclusive sample size below bleeder threshold | Keep running in existing campaign and monitor until statistical significance is reached |

---

## 🛠 Features

1. **PapaParse Google Ads Ingestion**:
   - Skips Google Ads metadata header lines (e.g. `Search terms report`, date ranges).
   - Filters out summary totals rows (`Total: Search terms`, `Total: Other search terms`, `Total: Account`).
   - Cleans currencies (`$`, `€`, `£`), percentages (`%`), and commas automatically.
   - Fuzzy column mapping across different Google Ads CSV export versions.

2. **Executive KPI & Financial Summary**:
   - Total queries & ad spend audited.
   - Promoted winners count, conversion volume, and average CPA.
   - Bleeder count and **instant monthly dollar savings calculation**.
   - Testing spend on low-volume terms.

3. **Visual Distribution & Strategy**:
   - Query count distribution bar (Promote vs Block vs Ignore).
   - Ad budget spend allocation breakdown.
   - Actionable strategy alert banner.

4. **Interactive Data Table**:
   - Real-time search by query, campaign, ad group, or triggered rule.
   - Multi-select checkboxes for batch triage (Batch Promote, Batch Block, Batch Ignore).
   - Column sorting (Urgency Score, Spend, Clicks, Conversions, CPA, ROAS).
   - Quick one-click manual status overrides.
   - Configurable pagination (10, 15, 25, 50, View All).

5. **Google Ads Export & Clipboard Toolkit**:
   - **Google Ads Editor Negative Keywords CSV**: compatible bulk upload schema.
   - **Promoted Keywords Exact Match CSV**: with calculated suggested Max CPC bids.
   - **Full Audit CSV**: comprehensive report for stakeholders and clients.
   - **1-Click Clipboard Copying**: copy negative keyword lists or exact match lists directly to paste into Google Ads.

6. **Interactive Rule Thresholds Modal**:
   - Adjust Target CPA, Max CPA, Bleeder spend limit, Click limits, and Target ROAS.
   - Add or remove negative stopword tags with real-time recalculation.
