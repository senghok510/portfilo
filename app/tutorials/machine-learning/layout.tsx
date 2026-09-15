import { AlgorithmNavigation } from "@/components/tutorials/navigation";
export default function MachineLearningLayout({ children }: { children: React.ReactNode }) {
  return <div className="tutorial-shell"><AlgorithmNavigation />{children}</div>;
}
