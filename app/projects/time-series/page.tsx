import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Statistical Modelling of Processes",
  description:
    "Project write-up: three time-series studies — GARCH volatility forecasting on gold futures, spatio-temporal Hawkes processes on Chicago crime, and copula-based pair trading on VIX/RVX.",
};

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

function Figure({
  src,
  alt,
  width,
  height,
  caption,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
}) {
  return (
    <figure>
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white p-3">
        <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full" />
      </div>
      <figcaption className="mt-2 text-sm text-stone-500">{caption}</figcaption>
    </figure>
  );
}

function Remark({ children }: { children: React.ReactNode }) {
  return (
    <p>
      <span className="font-medium text-stone-900">Remark.</span> {children}
    </p>
  );
}

export default function TimeSeriesPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/projects"
        className="text-sm text-stone-500 transition-colors hover:text-stone-900"
      >
        ← Projects
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Statistical Modelling of Random Processes: Three Case Studies
        </h1>
        <p className="mt-3 text-stone-500">
          APM 52065, École Polytechnique · 2026 · with Joel Tagne W. &amp;
          Christel Mallo P.
        </p>
        <p className="mt-1 text-sm text-stone-500">
          <a
            href="/time_series/Stat_procs___Christel_Joel_Hok.pdf"
            className="underline decoration-stone-300 underline-offset-4 hover:text-stone-900 hover:decoration-stone-500"
          >
            Report (PDF)
          </a>
        </p>
      </header>

      <Section title="Overview">
        <p>
          Three self-contained studies, one common thread: using stochastic
          processes and statistical inference to describe, forecast, and
          exploit complex dynamics in real data. The first forecasts the
          volatility of gold futures with a GARCH model; the second models
          crime contagion in Chicago with spatio-temporal Hawkes processes;
          the third captures the joint behaviour of two volatility indices
          with copulas and turns it into a profitable pair-trading strategy.
        </p>
      </Section>

      <Section title="1 · Forecasting gold-futures volatility with GARCH">
        <p>
          Gold is the classic safe-haven asset, and in a period marked by
          geopolitical tensions its price moves matter. Using daily data for
          the gold futures contract (GC=F) from Yahoo Finance, January 2025
          to February 2026, we set out to forecast its volatility for March
          2026.
        </p>
        <Figure
          src="/time_series/gold-price-returns.png"
          alt="Two charts: the daily closing price of gold futures rising from about 2700 to above 5000 over the period, and the daily log-returns fluctuating around zero with bursts of large moves."
          width={1283}
          height={245}
          caption="Daily closing price (left) and daily log-returns (right) of GC=F, January 2025 – February 2026."
        />
        <Remark>
          The two panels justify the whole modelling strategy. The price
          (left) trends strongly upward — clearly non-stationary, confirmed
          by an ADF test that cannot reject a unit root. The log-returns
          (right) hover around zero with no trend — stationary — but the
          size of the swings is anything but constant: quiet stretches
          alternate with bursts like the sharp drop in early 2026. That
          combination — no structure in the mean (Ljung-Box tests find no
          significant autocorrelation), fat-tailed distribution (Jarque-Bera
          strongly rejects normality), but clustered variance — is the
          textbook signature calling for a GARCH model with Student-t
          innovations rather than any model of the returns themselves.
        </Remark>
        <p>
          We fitted a GARCH(1,1) with Student-t innovations by maximum
          likelihood. All parameters came out statistically significant, and
          their values tell a coherent story: the volatility reacts
          noticeably to recent shocks, and above all it is highly persistent
          — the persistence terms sum to roughly 0.95, meaning a burst of
          volatility takes a long time to die out. The model was then used
          in a rolling one-step-ahead scheme (re-estimated at each date on
          290 training observations, evaluated on 15 out-of-sample days) to
          forecast March 2026, giving a mean squared error of 0.898
          in-sample and 1.36 out-of-sample.
        </p>
        <Figure
          src="/time_series/garch-forecast.png"
          alt="Two charts: realized volatility with the GARCH fitted volatility tracking it over the full sample, and a zoom on the March 2026 forecast window comparing realized volatility with static and rolling one-step forecasts."
          width={1015}
          height={324}
          caption="Realized vs fitted volatility over the full sample (left) and the March 2026 out-of-sample forecast window (right)."
        />
        <Remark>
          The fitted volatility (orange, left panel) tracks the level and
          the clustering of realized volatility well — including the large
          spike in early 2026 — but is visibly smoother: it rises with a
          short delay and undershoots the sharpest peaks. The zoom on March
          2026 (right) shows why the rolling forecast (red) beats the static
          one (dashed): by re-estimating daily it bends toward the
          late-month volatility pickup that the static forecast misses
          entirely. Underestimating sudden extreme spikes is a known,
          structural limit of a standard GARCH(1,1) — it models persistence,
          not surprises — and the out-of-sample error being larger than the
          in-sample one quantifies exactly that.
        </Remark>
      </Section>

      <Section title="2 · Crime contagion in Chicago with Hawkes processes">
        <p>
          Criminology documents a robust empirical pattern called{" "}
          <em>near-repeat victimization</em>: right after a crime, the
          probability of another crime nearby — in space and in time — is
          elevated. That is precisely the behaviour of a self-exciting
          (Hawkes) point process, where each event temporarily raises the
          intensity of future events around it. We fitted a multivariate
          spatio-temporal Hawkes model to the public Chicago crime registry
          for December 2015, restricted to two crime types: theft and
          battery. The model lets each type excite both itself and the
          other, with an exponentially decaying influence in time and a
          Gaussian-shaped influence in space.
        </p>
        <Figure
          src="/time_series/chicago-crime-maps.png"
          alt="Two maps of Chicago built from crime coordinates: the raw unfiltered events, and the filtered events colored by type, theft and battery, densely tracing the city's street grid."
          width={1253}
          height={470}
          caption="Reported crime locations in Chicago (December 2015): raw data (left) and after filtering to theft and battery (right)."
        />
        <Remark>
          The point cloud is dense enough to redraw the city: the street
          grid, the empty airport corridor, the lakefront. Two practical
          lessons hide in this figure. First, the raw registry (left) needs
          real preprocessing before a point-process model can touch it —
          timestamps rounded to the minute create duplicated event times
          (fixed by adding a tiny random jitter), and latitude/longitude
          must be projected to kilometres (Lambert conformal projection),
          because the spatial kernel reasons in Euclidean distance. Second,
          the filtered map (right) shows theft and battery interleaved in
          the same neighbourhoods rather than occupying separate zones —
          spatial overlap that makes cross-excitation between the two types
          plausible before any parameter is estimated.
        </Remark>
        <p>
          The eight model parameters were estimated by maximizing the
          point-process likelihood with L-BFGS-B, using five random
          restarts — the restarts landed on visibly different optima, so
          the multi-start strategy genuinely mattered. The fitted model is
          strikingly interpretable:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            the influence of a crime decays with a{" "}
            <strong>half-life of about 12.5 hours</strong> and a{" "}
            <strong>spatial range of about 0.8 km</strong> — an elevated
            risk lasting roughly a day, within walking distance;
          </li>
          <li>
            self-excitation dominates: a theft generates on average ~0.76
            follow-up thefts, a battery ~0.64 follow-up batteries, while the
            cross effects (theft→battery, battery→theft) are smaller but
            far from negligible at ~0.24–0.25;
          </li>
          <li>
            the estimated background rates are tiny, and the branching
            ratios approach 1 (0.995 for theft, 0.892 for battery): almost
            every crime in the model is triggered by an earlier one rather
            than arising spontaneously, putting the system close to the
            critical regime where long cascades of events occur.
          </li>
        </ul>
      </Section>

      <Section title="3 · Copulas & pair trading on VIX and RVX">
        <p>
          The VIX and RVX indices measure the implied volatility of US
          large-cap (S&amp;P 500) and small-cap (Russell 2000) stocks. They
          spike together in every market stress episode, yet their relative
          level keeps drifting — which raises a trading question: when one
          of them is abnormally high <em>given</em> the level of the other,
          will the gap close? Copulas are the right tool for that question,
          because they model the dependence structure between two series
          separately from each series&apos; own distribution.
        </p>
        <Figure
          src="/time_series/vix-rvx-levels.png"
          alt="Daily levels of the VIX and RVX indices from 2010 to 2020, moving in lockstep with RVX consistently above VIX and both spiking dramatically in March 2020."
          width={960}
          height={516}
          caption="Daily VIX and RVX levels over the training sample (2010–2020)."
        />
        <Remark>
          The two indices are almost mirror images — log-return correlation
          of 0.92 — and every spike is shared, from the 2011 and 2018
          sell-offs to the huge COVID spike of March 2020. But look at the
          gap between the curves: RVX sits persistently above VIX, and the
          spread widens and narrows over time. That is the structure the
          strategy will exploit: strong co-movement makes a long/short
          position hedged against market-wide volatility shocks, while the
          fluctuating spread provides the mispricings to trade. The heavy
          tails visible in these series also explain why Student-t
          distributions beat the normal for both margins (by AIC/BIC and
          Kolmogorov–Smirnov tests).
        </Remark>
        <p>
          After fitting the margins, we compared seven copula families by
          maximum likelihood on 2010–2020 data. The N14 copula — one with
          upper-tail dependence, fitting the tendency of both indices to
          explode together — won by a clear AIC margin over the Gaussian.
          The strategy then works on a rolling basis: margins and copula
          re-estimated on a 500-day window, and at each date the model
          produces the conditional probability that each index is unusually
          low or high given the other. When one index sits in an extreme
          conditional quantile (beyond 0.90), the strategy opens the
          corresponding long/short pair and closes it once the imbalance
          fades (back within 0.65) — with positions lagged one day to rule
          out look-ahead bias.
        </p>
        <Figure
          src="/time_series/pair-trading-performance.png"
          alt="Cumulative value of the pair-trading strategy versus holding VIX or RVX alone from 2021 to 2025: both individual indices drift down to around 0.6-0.7 while the strategy stays flat then accelerates to nearly 2.0."
          width={1050}
          height={560}
          caption="Cumulative performance of the copula pair-trading strategy vs directional exposure to VIX or RVX alone (2021–2025)."
        />
        <Remark>
          Over 2021–2025, simply holding either index lost about a third of
          its value — volatility indices decay in calm markets, so the
          benchmarks drift down (orange, green). The pair-trading strategy
          (blue) tells a different story: long flat stretches — it is out
          of the market most of the time, trading only when the copula
          flags a genuine imbalance — punctuated by steady gains and a
          strong acceleration from 2023 on. Final tally: +93.1% total
          return, 17.9% annualized, a Sharpe ratio of 0.88, and a maximum
          drawdown of −21.8%, versus drawdowns above 60% for the
          directional positions. Honest caveats remain: fixed unit weights
          with no dynamic hedge ratio, and no transaction costs in this
          first version — both would trim the numbers, neither erases the
          gap to the benchmarks.
        </Remark>
      </Section>

      <Section title="What ties it together">
        <p>
          Three datasets, three model families — conditional
          heteroskedasticity, self-exciting point processes, copulas — but
          one workflow throughout: diagnose the data&apos;s statistical
          properties first, choose the stochastic model those diagnostics
          call for, estimate it by maximum likelihood under real numerical
          constraints, and validate out of sample. The projects also share a
          failure-awareness: GARCH underestimates sudden spikes, the Hawkes
          likelihood landscape is multimodal, and the trading backtest
          ignores costs — knowing where a model stops working is part of
          the modelling.
        </p>
      </Section>
    </article>
  );
}
