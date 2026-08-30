import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Formula } from "@/components/formula";

export const metadata: Metadata = {
  title: "Influencer or Observer",
  description:
    "Project write-up: predicting social roles on Twitter — an end-to-end ML pipeline from data preprocessing to a bagged LLM + gradient-boosting ensemble, reaching 0.859 leaderboard accuracy.",
};

const leaderboard = [
  { model: "XGB + RoBERTa 2k + Pythia 6k", accuracy: "0.845" },
  { model: "XGB + RoBERTa 0k + Pythia 6k", accuracy: "0.845" },
  { model: "XGB + BERT LoRA fine-tuning", accuracy: "0.843" },
  { model: "LGBM + RoBERTa 2k + Pythia 6k", accuracy: "0.846" },
  { model: "LGBM + RoBERTa 3k + Pythia 6k (with user features)", accuracy: "0.856" },
  { model: "LGBM + RoBERTa 0k + Pythia 6k", accuracy: "0.846" },
  { model: "LGBM + RoBERTa 0k + Pythia 6k (with user features)", accuracy: "0.852" },
  { model: "LGBM + RoBERTa 2k", accuracy: "0.843" },
  { model: "LGBM + RoBERTa 2k (with user features)", accuracy: "0.853" },
  { model: "LGBM + Pythia 0k", accuracy: "0.840" },
  { model: "LGBM + TF-IDF (with user features)", accuracy: "0.850" },
  { model: "LGBM + BERT LoRA fine-tuning", accuracy: "0.843" },
  { model: "LGBM + BERTweet 0k + Pythia 6k (with user features)", accuracy: "0.853" },
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

export default function InfluencerObserverPage() {
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
          Influencer or Observer: Predicting Social Roles
        </h1>
        <p className="mt-3 text-stone-500">
          Kaggle challenge · CSC 51054, École Polytechnique · Autumn 2025 ·
          with Joel Tagne Waffo &amp; Sylvain Dehayem Kenfouo
        </p>
        <p className="mt-1 flex gap-4 text-sm text-stone-500">
          <a
            href="/influencer-observer/report.pdf"
            className="underline decoration-stone-300 underline-offset-4 hover:text-stone-900 hover:decoration-stone-500"
          >
            Report (PDF)
          </a>
          <a
            href="/influencer-observer/slides.pdf"
            className="underline decoration-stone-300 underline-offset-4 hover:text-stone-900 hover:decoration-stone-500"
          >
            Slides (PDF)
          </a>
        </p>
      </header>

      <Section title="Overview">
        <p>
          Given a tweet and its account metadata, is the author an{" "}
          <strong>Influencer</strong> — someone who shapes opinions and drives
          engagement — or an <strong>Observer</strong>? This binary
          classification challenge came with a heterogeneous dataset mixing
          numerical metadata, categorical attributes, and raw tweet text, and
          we built the pipeline end to end: exploratory analysis, data
          preprocessing, feature engineering, LLM-based text encoders,
          gradient-boosted classifiers, hyperparameter tuning, and a final
          bagging ensemble that reached{" "}
          <strong>0.859 accuracy on the leaderboard</strong>.
        </p>
      </Section>

      <Section title="Data analysis & preprocessing">
        <p>
          The raw data had 192 features, and 73% of them were missing for
          more than half the rows. We dropped features with zero variance
          (they carry no signal) and those with more than 90% missing values.
        </p>
        <p>
          The most valuable discovery of the whole project came from plain
          data analysis, not modelling: the dataset description mentions
          ~38k users, but <code>user.created_at</code> takes only ~30k
          distinct values — and all tweets sharing a creation date share the
          same label and nearly identical user metadata. Account creation
          timestamps are precise enough to act as a{" "}
          <em>de facto user identifier</em>. We therefore grouped tweets by{" "}
          <code>user.created_at</code> and imputed missing values within each
          group (median for numerical features, most frequent value
          otherwise), which denoises the data far better than global
          imputation.
        </p>
        <Figure
          src="/influencer-observer/corre_map.png"
          alt="Correlation matrix of the engineered numerical features, showing a few strongly correlated blocks such as activity counts and their derived ratios."
          width={520}
          height={452}
          caption="Correlation map of numerical features after preprocessing. The red blocks flag redundant activity counts — a reason to prefer engineered ratios over raw counts."
        />
      </Section>

      <Section title="Feature engineering">
        <p>
          We built features at two levels, then aggregated everything to the
          user level. From the raw metadata we derived interpretable
          quantities:
        </p>
        <Formula math="\text{account\_age} = \text{tweet\_datetime} - \text{user\_created\_datetime}" />
        <Formula math="\text{total\_activity} = \text{statuses\_count} + \text{favourites\_count} + \text{listed\_count}" />
        <p>
          plus activity rates (<code>statuses_per_day</code>,{" "}
          <code>followers_per_day</code>), text statistics (tweet length and
          word count, profile-description length), and temporal patterns
          (tweet hour and day of week). Averaging these per user —{" "}
          <code>mean_user_listed</code>, <code>mean_total_activity</code>,{" "}
          <code>mean_tweet_hour</code>, and so on — produced the features
          that consistently ranked at the top of the importance charts: a
          user&apos;s <em>habits</em> predict their role better than any
          single tweet.
        </p>
      </Section>

      <Section title="Text encoders">
        <p>
          To use the tweet text itself, we compared a spectrum of encoders,
          from TF-IDF to fine-tuned language models. Encoder-only models
          (BERT, RoBERTa, BERTweet) were fine-tuned for binary
          classification, and we then extracted their <code>[CLS]</code>{" "}
          embedding as a feature vector. We also tried LoRA fine-tuning,
          which freezes the pretrained weights W and learns only a low-rank
          update:
        </p>
        <Formula math="W' = W + \Delta W, \qquad \Delta W = BA, \qquad A \in \mathbb{R}^{r \times d_{\text{in}}}, \quad B \in \mathbb{R}^{d_{\text{out}} \times r}" />
        <p>
          Pythia-160M, a decoder-only (GPT-like) model, was instead
          fine-tuned autoregressively on a prompt formulation:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-4 font-mono text-xs leading-relaxed text-stone-700">
          {`What type of Twitter account posted this tweet?
{combined_text}
OPTIONS:
0: Observer
1: Influencer
ANSWER: {label}`}
        </pre>
        <p>
          with its embedding taken as a mean-pool of the last hidden layer
          over non-padding tokens. Why go to that trouble? A PCA projection
          of the two extremes makes the answer visible:
        </p>
        <Figure
          src="/influencer-observer/pca.png"
          alt="Two PCA scatter plots side by side: with TF-IDF embeddings the two classes overlap almost completely; with fine-tuned BERT embeddings they separate into two distinct clusters."
          width={893}
          height={380}
          caption="PCA of tweet embeddings, colored by class. TF-IDF (left) cannot separate Influencers from Observers; fine-tuned BERT embeddings (right) pull the two classes apart — semantic representations earn their cost."
        />
      </Section>

      <Section title="Model pipeline">
        <p>
          Each tweet ends up represented as the concatenation of the GPT-like
          pooled embedding, the BERT-like <code>[CLS]</code> embedding, and
          the engineered tabular features, fed into a classifier head. We
          compared an MLP, random forest, LightGBM, and XGBoost — the
          gradient-boosted trees won, with LightGBM matching XGBoost&apos;s
          accuracy at a fraction of the training time.
        </p>
        <Figure
          src="/influencer-observer/pipeline_arc.png"
          alt="Model pipeline diagram: tweet text goes through a GPT-like model with mean pooling and a BERT-like encoder producing a CLS embedding; both are concatenated with tabular features and passed to a classifier head that outputs the prediction."
          width={583}
          height={665}
          caption="The model pipeline: two complementary text representations concatenated with tabular features, feeding one classifier head."
        />
        <p>
          Hyperparameters (learning rate, tree depth, number of leaves,
          regularization) were tuned with Optuna, which samples promising
          configurations adaptively instead of exhaustively grid-searching —
          each trial scored by 5-fold cross-validation. Crucially, all splits
          used <strong>StratifiedGroupKFold at the user level</strong>: tweets
          from one user never appear in both train and validation folds,
          which would leak the (user-constant) label.
        </p>
      </Section>

      <Section title="Ensembling">
        <p>Three layers of averaging turn the base models into a robust predictor:</p>
        <p>
          <span className="font-medium text-stone-900">
            1. Cross-validation bagging.
          </span>{" "}
          Each configuration is trained on 5 user-level folds, and the
          test-set probabilities are averaged over the folds:
        </p>
        <Formula math="\hat{p}(x) = \frac{1}{K} \sum_{k=1}^{K} \hat{p}_k(x), \qquad \hat{y} = \mathbf{1}_{\left[\hat{p}(x) \ge 0.5\right]}" />
        <p>
          <span className="font-medium text-stone-900">
            2. User-level aggregation.
          </span>{" "}
          Predictions are then made uniform per user (majority vote over a
          user&apos;s tweets) — since the label is a property of the user,
          not the tweet, this removes tweet-level noise and was one of the
          largest single score jumps.
        </p>
        <p>
          <span className="font-medium text-stone-900">
            3. Majority vote across decorrelated models.
          </span>{" "}
          Finally, the strongest complementary configurations vote:
        </p>
        <Formula math="\hat{y} = \mathbf{1}_{\left[\sum_{m=1}^{3} \hat{y}_m > 1.5\right]}" />
        <p>
          Bagging only helps when the models make <em>different</em> errors,
          and the feature-importance charts prove ours do:
        </p>
        <div className="space-y-8">
          <div>
            <Figure
              src="/influencer-observer/fi-lgbm.png"
              alt="LightGBM feature importance chart dominated by aggregated behavioral features such as user listed count, favourites per status, and statuses per day."
              width={990}
              height={440}
              caption="LightGBM leans on behavioral metadata — it models who the user is."
            />
            <p className="mt-3">
              <span className="font-medium text-stone-900">Remark.</span>{" "}
              Every top feature here is behavioral, and the ranking is
              interpretable on its face. The strongest predictor,{" "}
              <code>user.listed_count</code>, counts how many public lists
              other people have added the account to — notoriety conferred{" "}
              <em>by others</em>, which is close to the definition of an
              influencer. Next come <code>favourites_per_status</code> and{" "}
              <code>statuses_per_day</code>: engineered <em>ratios</em>{" "}
              outranking the raw counts they were built from, confirming that
              normalizing activity by time or volume adds signal. Account age
              and its squared term also rank highly — influence correlates
              with how long an account has existed. Notably, RoBERTa and
              Pythia embedding dimensions were available to this model, yet
              almost none crack the top 25.
            </p>
          </div>
          <div>
            <Figure
              src="/influencer-observer/fi-xgb.png"
              alt="XGBoost feature importance chart dominated by individual RoBERTa embedding dimensions such as Roberta_741."
              width={980}
              height={630}
              caption="XGBoost leans on RoBERTa embedding dimensions — it models what the user writes."
            />
            <p className="mt-3">
              <span className="font-medium text-stone-900">Remark.</span>{" "}
              The picture inverts: the top of the ranking is almost entirely
              RoBERTa embedding dimensions, with <code>Roberta_741</code>{" "}
              towering over everything else — the fine-tuned encoder has
              concentrated the class signal into a handful of directions of
              its embedding space. Individual dimensions aren&apos;t
              human-readable, but their dominance means this model decides
              mostly from the <em>content and style of the text</em>. Only a
              few metadata features (<code>user.listed_count</code>,{" "}
              <code>user.statuses_count</code>) survive in the ranking.
            </p>
          </div>
        </div>
        <p>
          The two rankings barely overlap: one model reads the metadata, the
          other reads the text. Their errors are therefore weakly correlated
          — exactly the condition under which averaging reduces variance,
          and the empirical justification for the majority vote above.
        </p>
      </Section>

      <Section title="Results">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 text-left">
                <th className="py-2 pr-4 font-medium">Model</th>
                <th className="py-2 font-medium">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr key={row.model} className="border-b border-stone-100">
                  <td className="py-2 pr-4 text-stone-600">{row.model}</td>
                  <td className="py-2 font-mono text-[0.8rem]">
                    {row.accuracy}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-stone-100">
                <td className="py-2 pr-4 font-medium">
                  Final ensemble — LGBM + XGBoost (RoBERTa 3k + Pythia 6k +
                  BERTweet 0k)
                </td>
                <td className="py-2 font-mono text-[0.8rem] font-semibold">
                  0.859
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Two patterns stand out. Adding aggregated user features lifts every
          configuration by roughly a full point (0.846 → 0.856 for the best
          LightGBM) — feature engineering beat model swaps. And the ensemble
          adds a final, modest-but-consistent gain over the best single
          model (0.856 → 0.859), exactly what bagging theory predicts when
          averaging strong, partially decorrelated predictors.
        </p>
      </Section>

      <Section title="Takeaways & future work">
        <p>
          LLM embeddings carry real signal, but they paid off only when
          combined with disciplined tabular feature engineering and
          leak-free, user-level validation — the unglamorous parts of the
          pipeline drove most of the score. For future work: cheaper
          fine-tuning (LoRA, distilled models) to cut the dominant compute
          cost, and graph neural networks over the explicit social graph
          (followers, friends, mentions), since influence is ultimately a
          relational property that per-user features can only approximate.
        </p>
      </Section>
    </article>
  );
}
