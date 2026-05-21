import { EditorPanel } from "@/components/editor-panel";
import { DeploymentsPanel } from "@/components/deployments-panel";

export default function Home() {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground font-mono">
      <div className="w-1/2 border-r border-border h-full flex flex-col">
        <EditorPanel />
      </div>
      <div className="w-1/2 h-full flex flex-col bg-card/30">
        <DeploymentsPanel />
      </div>
    </div>
  );
}
