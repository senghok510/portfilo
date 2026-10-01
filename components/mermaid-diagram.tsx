"use client";

import { useEffect, useId, useState } from "react";

type MermaidDiagramProps = {
  chart: string;
  ariaLabel: string;
};

export function MermaidDiagram({ chart, ariaLabel }: MermaidDiagramProps) {
  const reactId = useId();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const diagramId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    async function renderDiagram() {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          themeVariables: {
            background: "#ffffff",
            primaryColor: "#f5f5f4",
            primaryTextColor: "#292524",
            primaryBorderColor: "#d6d3d1",
            secondaryColor: "#fafaf9",
            tertiaryColor: "#ffffff",
            lineColor: "#78716c",
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          },
          flowchart: {
            curve: "basis",
            htmlLabels: true,
          },
        });

        const result = await mermaid.render(diagramId, chart);
        if (active) {
          setSvg(result.svg);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    }

    void renderDiagram();

    return () => {
      active = false;
    };
  }, [chart, reactId]);

  if (error) {
    return (
      <p className="p-4 text-sm text-stone-500">
        The workflow diagram could not be rendered.
      </p>
    );
  }

  if (!svg) {
    return <div className="h-96 animate-pulse bg-stone-50" aria-hidden="true" />;
  }

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="flex justify-center [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
