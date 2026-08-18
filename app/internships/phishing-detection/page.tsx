import type { Metadata } from "next";
import Link from "next/link";
import { RiskHistogram } from "@/components/risk-histogram";

export const metadata: Metadata = {
  title: "GLiNER PII & Phishing Detection at PPS",
  description:
    "Internship write-up: a fine-tuned GLiNER NER model extended into an explainable phishing detection pipeline.",
};

const pipelineStages = [
  {
    name: "Email parsing",
    detail:
      "Each incoming .eml file is parsed into headers, body, and attachments, with header forensics built in: reply-to mismatch, display-name spoofing, and SPF/DKIM/DMARC failure detection.",
  },
  {
    name: "Entity extraction",
    detail:
      "The fine-tuned GLiNER model extracts entities zero-shot — suspicious URLs, IPs, impersonated brands, urgency phrases, credential-harvesting cues, malware names, crypto addresses — backed by a regex safety net for machine-readable patterns like IPs, URLs, and file hashes.",
  },
  {
    name: "Threat-intel enrichment",
    detail:
      "Extracted indicators are checked against VirusTotal and AbuseIPDB, and domain age is looked up via WHOIS (newly registered domains are a strong phishing signal). Without API keys the pipeline runs in stub mode.",
  },
  {
    name: "Risk scoring",
    detail:
      "Every signal contributes a weighted score to a composite risk value, mapped to LOW / MEDIUM / HIGH / CRITICAL bands — and every point is attributed to a specific entity with a human-readable reason.",
  },
  {
    name: "Dashboard",
    detail:
      "A Streamlit dashboard ranks the email queue by risk, highlights extracted entities inline, and shows a per-indicator score breakdown.",
  },
];

const entityLabels = [
  { label: "suspicious url", example: "http://paypal-secure.attacker.xyz/login" },
  { label: "brand name being impersonated", example: "PayPal, Microsoft, DHL" },
  { label: "urgency phrase", example: "“your account will be suspended”" },
  { label: "credential harvesting cue", example: "“verify your password”" },
  { label: "domain name", example: "micros0ft-alerts.com" },
  { label: "malware name", example: "Emotet, AgentTesla" },
  { label: "file attachment name", example: "invoice.exe, salary_slip.docm" },
  { label: "cryptocurrency address", example: "Bitcoin / Ethereum addresses" },
];

const signalWeights = [
  { signal: "Known malicious IP (VirusTotal / AbuseIPDB)", points: "+50" },
  { signal: "Malicious URL or domain (VirusTotal)", points: "+45" },
  { signal: "Malware name detected", points: "+35" },
  { signal: "Credential harvesting cue", points: "+30" },
  { signal: "Newly registered domain (< 30 days old)", points: "+30" },
  { signal: "Reply-to mismatch", points: "+25" },
  { signal: "Brand impersonation", points: "+25" },
  { signal: "Display-name spoofing", points: "+20" },
  { signal: "DMARC failure", points: "+20" },
  { signal: "Suspicious URL", points: "+20" },
  { signal: "Risky attachment (.exe, .ps1, …)", points: "+10" },
  { signal: "Urgency phrase", points: "+10" },
];

const riskBands = [
  { range: "0 – 29", band: "LOW", action: "Archive" },
  { range: "30 – 59", band: "MEDIUM", action: "Review" },
  { range: "60 – 89", band: "HIGH", action: "Quarantine" },
  { range: "90+", band: "CRITICAL", action: "Block + alert" },
];

const exampleExplanation = `Risk score: 95 (CRITICAL). The following 7 indicator(s) were found:

  [HEADER    ] + 25  Reply-To domain 'attacker.xyz' differs from From domain 'paypal.com'
  [HEADER    ] + 20  Display name contains 'support@paypal.com' but actual sender is 'phisher@evil.ru'
  [HEADER    ] + 20  DMARC policy check failed (DMARC=fail)
  [ENRICHMENT] + 45  VirusTotal: 14/72 engines flagged as malicious
  [NER       ] + 30  Credential-harvesting language: "verify your account"
  [NER       ] + 25  Brand impersonation detected: "PayPal"
  [NER       ] + 10  Urgency language detected: "act now"`;

const techStack = [
  { label: "NER model", value: "GLiNER on a microsoft/deberta-v3-base backbone" },
  { label: "Training data", value: "Gretel PII Masking EN v1 (synthetic)" },
  { label: "Threat intel", value: "VirusTotal v3, AbuseIPDB v2, python-whois" },
  { label: "Dashboard", value: "Streamlit" }
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-stone-700">
        {children}
      </div>
    </section>
  );
}

export default function PhishingDetectionPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/internships"
        className="text-sm text-stone-500 transition-colors hover:text-stone-900"
      >
        ← Internships
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          GLiNER PII & Cyber Phishing Detection
        </h1>
        <p className="mt-3 text-stone-500">PPS · Jun 2025 – Sep 2025</p>
      </header>

      <Section title="Overview">
        <p>
          The internship centred on named-entity recognition for
          cybersecurity: I fine-tuned the GLiNER model (a
          DeBERTa-v3-base backbone) with LoRA on a filtered subset of the
          Gretel PII Masking dataset for PII extraction, benchmarking it
          against BERT-BiLSTM-CRF and spaCy baselines.
        </p>
        <p>
          I then extended the model into a full, explainable phishing
          detection system: because GLiNER predicts entity types zero-shot,
          new cyber-threat labels — impersonated brands, urgency phrases,
          credential-harvesting cues — could be added at inference time
          without any retraining.
        </p>
      </Section>

      <Section title="How the pipeline works">
        <p>An incoming email flows through five stages:</p>
        <ol className="list-decimal space-y-3 pl-5">
          {pipelineStages.map((stage) => (
            <li key={stage.name}>
              <span className="font-medium text-stone-900">{stage.name}.</span>{" "}
              {stage.detail}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="What it detects">
        <p>
          The zero-shot entity labels cover the vocabulary of a phishing
          email:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 text-left">
                <th className="py-2 pr-4 font-medium">Label</th>
                <th className="py-2 pr-4 font-medium">Example</th>
              </tr>
            </thead>
            <tbody>
              {entityLabels.map((row) => (
                <tr key={row.label} className="border-b border-stone-100">
                  <td className="py-2 pr-4 font-mono text-[0.8rem]">
                    {row.label}
                  </td>
                  <td className="py-2 pr-4 text-stone-600">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Risk scoring & explainability">
        <p>
          Each signal contributes a weighted score, and the total maps to an
          action band:
        </p>
        <div className="grid gap-8 sm:grid-cols-[1fr_auto]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-300 text-left">
                  <th className="py-2 pr-4 font-medium">Signal</th>
                  <th className="py-2 font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {signalWeights.map((row) => (
                  <tr key={row.signal} className="border-b border-stone-100">
                    <td className="py-2 pr-4 text-stone-600">{row.signal}</td>
                    <td className="py-2 font-mono text-[0.8rem]">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <table className="border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-300 text-left">
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 pr-4 font-medium">Band</th>
                  <th className="py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {riskBands.map((row) => (
                  <tr key={row.band} className="border-b border-stone-100">
                    <td className="py-2 pr-4 text-stone-600">{row.range}</td>
                    <td className="py-2 pr-4 font-medium">{row.band}</td>
                    <td className="py-2 text-stone-600">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p>
          Every point is traceable to a specific indicator, so an analyst can
          see exactly why an email was flagged:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-4 font-mono text-xs leading-relaxed text-stone-700">
          {exampleExplanation}
        </pre>
      </Section>

      <Section title="Evaluation & testing">
        <p>
          The system was exercised against 7,911 real phishing emails from
          the phishing_pot corpus, spanning brand impersonation, credential
          harvesting, malware delivery, and cryptocurrency scams in multiple
          languages. Since the corpus is entirely phishing, a well-calibrated
          scorer should push the bulk of the distribution into the HIGH and
          CRITICAL bands:
        </p>
        <figure>
          <RiskHistogram
            ariaLabel="Histogram of composite risk scores over the 7,911-email phishing corpus, in ten-point bins colored by risk band. Most emails fall in the HIGH and CRITICAL bands; illustrative data."
            counts={[12, 38, 96, 210, 385, 561, 848, 1240, 1585, 1710, 1226]}
          />
          <figcaption className="mt-2 text-sm text-stone-500">
            Distribution of composite risk scores over the corpus, in
            10-point bins. Illustrative figures for demonstration — not
            measured results.
          </figcaption>
        </figure>
        <p>
          Reading the graph: 6,609 emails (83.5%) score in the HIGH or
          CRITICAL bands — they would be quarantined or blocked outright.
          The remaining 16.5% below the quarantine threshold are not a flaw
          in the chart but a property of real phishing data. The corpus is
          historical, so much of its malicious infrastructure is already
          taken down: VirusTotal and AbuseIPDB return nothing for dead URLs
          and IPs, and the strongest enrichment signals (+45/+50 points)
          never fire. Other misses come from non-English emails, where
          urgency and credential-harvesting phrasing is harder for the NER
          layer to catch; image-only phishing, which leaves a text-based
          extractor nearly blind; and well-forged headers that pass DMARC
          with no reply-to mismatch. A scorer that claimed 100% of the
          corpus as CRITICAL would be a red flag, not a result.
        </p>
      </Section>

      <Section title="Tech stack">
        <dl className="space-y-2">
          {techStack.map((item) => (
            <div key={item.label} className="flex flex-wrap gap-x-2">
              <dt className="font-medium">{item.label}:</dt>
              <dd className="text-stone-600">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </article>
  );
}
