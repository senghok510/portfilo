# GLiNER PII & Cyber Phishing Detection

A fine-tuned [GLiNER](https://github.com/urchade/GLiNER) named-entity recognition model extended into a full **explainable phishing detection pipeline**.

The model backbone is `microsoft/deberta-v3-base`, fine-tuned on the [Gretel PII Masking dataset](https://huggingface.co/datasets/gretelai/gretel-pii-masking-en-v1) for PII entity extraction, then extended with zero-shot cyber-threat labels and wrapped in an end-to-end email analysis system.

---

## Architecture

```
Incoming .eml
      │
      ▼
┌─────────────────┐
│  email_parser   │  Headers, body, attachments, SPF/DKIM/DMARC, anomalies
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ner_extractor  │  GLiNER zero-shot + regex fallback
└────────┬────────┘  IPs · URLs · urgency phrases · credential cues
         │           brand impersonation · crypto addresses · hashes
         ▼
┌─────────────────┐
│   enrichment    │  VirusTotal · AbuseIPDB · WHOIS domain age
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     scorer      │  Composite risk score  0 → 999
└────────┬────────┘  LOW · MEDIUM · HIGH · CRITICAL  +  explanation
         │
         ▼
┌─────────────────┐
│   dashboard     │  Streamlit — ranked queue + entity highlighting
└─────────────────┘
```

---

## Key Features

| Feature | Detail |
|---|---|
| **Zero-shot NER** | GLiNER with cyber-focused entity labels — no retraining needed to add new entity types |
| **Two-layer extraction** | Neural model + regex safety net for IPs, URLs, crypto addresses, file hashes |
| **Explainability** | Every risk point is attributed to a specific entity with a human-readable reason |
| **Threat intel enrichment** | VirusTotal, AbuseIPDB, WHOIS — stubs when keys absent, real calls when set |
| **Header forensics** | Reply-to mismatch, display-name spoofing, SPF/DKIM/DMARC failure detection |
| **Risky attachment detection** | `.exe`, `.ps1`, `.vbs`, `.docm` and 10+ other dangerous extensions |
| **Dataset ready** | Ships with the [Nazario phishing corpus](https://github.com/rf-peixoto/phishing_pot) (7,911 real phishing emails) |

---

## Project Structure

```
gliner_pii_cyber_finetuned/
├── gliner_fine_tuned_model/        # Fine-tuned GLiNER weights (DeBERTa-v3-base)
│   ├── gliner_config.json
│   ├── pytorch_model.bin           # tracked via Git LFS
│   └── tokenizer_config.json
├── gretel_synthetic_data.ipynb     # Data prep notebook (Gretel PII dataset)
└── phishing_pipeline/
    ├── config.py                   # All tuneable parameters
    ├── requirements.txt
    ├── pipeline/
    │   ├── email_parser.py         # .eml → ParsedEmail
    │   ├── ner_extractor.py        # GLiNER + regex → ExtractedEntity[]
    │   ├── enrichment.py           # VirusTotal / AbuseIPDB / WHOIS
    │   ├── scorer.py               # Composite risk score + explanation
    │   └── pipeline.py             # Orchestration (single file + folder)
    ├── dashboard/
    │   └── app.py                  # Streamlit UI
    ├── tests/
    │   ├── conftest.py             # Fixtures (synthetic .eml files)
    │   ├── test_email_parser.py
    │   ├── test_ner_extractor.py
    │   ├── test_enrichment.py
    │   ├── test_scorer.py
    │   └── test_pipeline.py
    └── data/
        └── sample_emails/          # 7,911 .eml files (gitignored — local only)
```

---

## Quickstart

### 1. Install dependencies

```bash
cd phishing_pipeline
pip install -r requirements.txt
```

### 2. (Optional) Add API keys for real threat-intel lookups

```bash
export VIRUSTOTAL_API_KEY="your_key_here"
export ABUSEIPDB_API_KEY="your_key_here"
```

Without keys the pipeline runs in **stub mode** — all NER and scoring still works, enrichment lookups return neutral stubs.

### 3a. Run the Streamlit dashboard

```bash
streamlit run dashboard/app.py
```

Upload `.eml` files or point at a folder. The dashboard ranks emails by risk score, highlights extracted entities inline, and shows a per-indicator score breakdown.

### 3b. Run headless over a folder

```python
from phishing_pipeline.pipeline import EmailAnalysisPipeline

pipeline = EmailAnalysisPipeline()

# Process all emails in a folder, ranked by risk score
results = pipeline.process_folder("data/sample_emails/", max_emails=100)
pipeline.print_summary(results)
pipeline.save_json(results, "results.json")
```

### 3c. Process a single email

```python
result = pipeline.process_email("path/to/email.eml")

print(result.risk.explanation)
# Risk score: 95 (CRITICAL). The following 7 indicator(s) were found:
#
#   [HEADER    ] + 25  Reply-To domain 'attacker.xyz' differs from From domain 'paypal.com'
#   [HEADER    ] + 20  Display name contains 'support@paypal.com' but actual sender is 'phisher@evil.ru'
#   [HEADER    ] + 20  DMARC policy check failed (DMARC=fail)
#   [ENRICHMENT] + 45  VirusTotal: 14/72 engines flagged as malicious
#   [NER       ] + 30  Credential-harvesting language: "verify your account"
#   [NER       ] + 25  Brand impersonation detected: "PayPal"
#   [NER       ] + 10  Urgency language detected: "act now"
```

---

## Entity Labels (Zero-shot)

| Label | Example |
|---|---|
| `suspicious url` | `http://paypal-secure.attacker.xyz/login` |
| `ip address` | `185.220.101.47` |
| `email address` | `collect@evil.ru` |
| `domain name` | `micros0ft-alerts.com` |
| `brand name being impersonated` | `PayPal`, `Microsoft`, `DHL` |
| `urgency phrase` | `"your account will be suspended"` |
| `credential harvesting cue` | `"verify your password"` |
| `malware name` | `Emotet`, `AgentTesla` |
| `file attachment name` | `invoice.exe`, `salary_slip.docm` |
| `cryptocurrency address` | Bitcoin / Ethereum addresses |

---

## Scoring Logic

Each extracted signal contributes a weighted score:

| Signal | Points |
|---|---|
| Known malicious IP (confirmed by VirusTotal / AbuseIPDB) | +50 |
| Malicious URL or domain (VirusTotal) | +45 |
| Malware name detected | +35 |
| Credential harvesting cue | +30 |
| Newly registered domain (< 30 days old) | +30 |
| Reply-to mismatch | +25 |
| Brand impersonation | +25 |
| Display-name spoofing | +20 |
| DMARC failure | +20 |
| Suspicious URL | +20 |
| Risky attachment (`.exe`, `.ps1`, etc.) | +10 |
| Urgency phrase | +10 |

**Risk bands:**

| Score | Band | Action |
|---|---|---|
| 0 – 29 | LOW | Archive |
| 30 – 59 | MEDIUM | Review |
| 60 – 89 | HIGH | Quarantine |
| 90+ | CRITICAL | Block + alert |

---

## Running Tests

```bash
cd phishing_pipeline
python3 -m pytest tests/ -v
```

182 tests across 5 modules covering header parsing, NER regex patterns, enrichment routing, scoring logic, and end-to-end pipeline behaviour.

```
tests/test_email_parser.py    37 tests
tests/test_ner_extractor.py   43 tests
tests/test_enrichment.py      29 tests
tests/test_scorer.py          44 tests
tests/test_pipeline.py        29 tests
─────────────────────────────────────
TOTAL                        182 tests  ✅ all pass
```

---

## Fine-tuning Background

The base model was fine-tuned on a filtered subset of the Gretel PII Masking dataset, focusing on technology/software and authentication domains. The notebook [`gretel_synthetic_data.ipynb`](gretel_synthetic_data.ipynb) documents:

- Domain filtering (`technology-software`, `information-technology`, `cryptography`, `blockchain`, `authentication-services`)
- Rare label removal (`pin`, `cvv`, `tax_id`, etc.)
- Conversion to GLiNER span-prediction format

The phishing pipeline extends this via **zero-shot prompting** — GLiNER's architecture allows new entity types at inference time without retraining.

---

## Dataset

The `data/sample_emails/` folder contains **7,911 real phishing emails** from the [phishing_pot](https://github.com/rf-peixoto/phishing_pot) corpus (gitignored — not pushed to remote). Emails span brand impersonation (banking, e-commerce, cloud services), credential harvesting, malware delivery, and cryptocurrency scams in multiple languages.

---

## Tech Stack

| Layer | Technology |
|---|---|
| NER model | [GLiNER](https://github.com/urchade/GLiNER) · `microsoft/deberta-v3-base` |
| Training data | [Gretel PII Masking EN v1](https://huggingface.co/datasets/gretelai/gretel-pii-masking-en-v1) |
| Email parsing | Python `email` stdlib |
| Threat intel | VirusTotal v3 API · AbuseIPDB v2 API · `python-whois` |
| Dashboard | Streamlit |
| Tests | pytest (182 tests) |
