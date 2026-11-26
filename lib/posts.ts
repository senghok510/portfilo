// Edit this list to add or update blog posts. Newest first.
export type Post = {
  slug: string;
  title: string;
  date: string; // ISO date, e.g. "2026-11-26"
  readingTime: string;
  summary: string;
  tags: string[];
};

export const posts: Post[] = [
  {
    slug: "looped-attention",
    title: "Looped Attention: Running One Transformer Block Many Times",
    date: "2026-11-26",
    readingTime: "12 min read",
    summary:
      "What happens when you stop stacking new layers and instead feed a transformer block its own output, again and again? A tour of looped transformers: the idea, the maths, the tricks that make them train, and why they are so good at algorithmic reasoning. With four interactive figures, including a small weight-tied transformer you can type a sentence into and watch go round the loop.",
    tags: ["Transformers", "Reasoning", "Deep learning"],
  },
];

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
