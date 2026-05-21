import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { useCreateApp, getListAppsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STARTER_CODE = `import http from "http";

const PORT = process.env.PORT;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello from my Node.js server!\\n");
});

server.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

export function EditorPanel() {
  const [name, setName] = useState("");
  const [code, setCode] = useState(STARTER_CODE);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createApp = useCreateApp();

  const handleDeploy = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for your app before deploying.",
        variant: "destructive"
      });
      return;
    }

    createApp.mutate(
      { data: { name: name.trim(), code } },
      {
        onSuccess: () => {
          setName("");
          setCode(STARTER_CODE);
          queryClient.invalidateQueries({ queryKey: getListAppsQueryKey() });
          toast({
            title: "App Deployed",
            description: "Your app is starting up."
          });
        },
        onError: (err) => {
          toast({
            title: "Deploy Failed",
            description: err?.message || "Something went wrong.",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-background border-r border-border">
      <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-card">
        <div className="flex-1 max-w-sm">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="App Name"
            className="font-mono bg-background border-border rounded-none focus-visible:ring-1 focus-visible:ring-primary h-9"
            data-testid="input-app-name"
          />
        </div>
        <Button 
          onClick={handleDeploy} 
          disabled={createApp.isPending}
          className="rounded-none font-mono tracking-tight uppercase text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="button-deploy"
        >
          {createApp.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Deploy
        </Button>
      </div>
      <div className="flex-1 w-full bg-[#1e1e1e]">
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "var(--app-font-mono)",
            wordWrap: "on",
            padding: { top: 16 },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
