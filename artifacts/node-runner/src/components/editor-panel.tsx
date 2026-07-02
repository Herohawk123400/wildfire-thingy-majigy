import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { useCreateApp, getListAppsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Runtime = "node" | "bun" | "python" | "html";

const STARTER_CODES: Record<Runtime, string> = {
  node: `import http from "http";

const PORT = process.env.PORT;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello from my Node.js server!\\n");
});

server.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`,
  bun: `const PORT = process.env.PORT!;

Bun.serve({
  port: PORT,
  fetch(req) {
    return new Response("Hello from Bun!", {
      headers: { "Content-Type": "text/plain" },
    });
  },
});

console.log(\`Bun server running on port \${PORT}\`);
`,
  python: `import os
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = int(os.environ.get("PORT", 3000))

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"Hello from Python!")

    def log_message(self, format, *args):
        print(format % args)

HTTPServer(("", PORT), Handler).serve_forever()
`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Page</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #f5f5f5; }
    pre { background: #fff; padding: 1rem; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Hello from HTML!</h1>
  <p>This page has internet access. Fetching a public API:</p>
  <pre id="output">Loading...</pre>
  <script>
    fetch("https://api.github.com/zen")
      .then(r => r.text())
      .then(text => {
        document.getElementById("output").textContent = text;
      })
      .catch(err => {
        document.getElementById("output").textContent = "Error: " + err.message;
      });
  </script>
</body>
</html>
`
};

const RUNTIME_LANGUAGES: Record<Runtime, string> = {
  node: "javascript",
  bun: "typescript",
  python: "python",
  html: "html"
};

const RUNTIME_LABELS: Record<Runtime, string> = {
  node: "Node.js",
  bun: "Bun",
  python: "Python",
  html: "HTML"
};

export function EditorPanel() {
  const [name, setName] = useState("");
  const [runtime, setRuntime] = useState<Runtime>("node");
  const [code, setCode] = useState(STARTER_CODES["node"]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createApp = useCreateApp();

  const handleRuntimeChange = (newRuntime: Runtime) => {
    setRuntime(newRuntime);
    setCode(STARTER_CODES[newRuntime]);
  };

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
      { data: { name: name.trim(), code, runtime } as any },
      {
        onSuccess: () => {
          setName("");
          setCode(STARTER_CODES[runtime]);
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
      
      <div className="flex items-center px-4 py-2 border-b border-border bg-card/50 gap-2">
        <span className="text-xs font-mono uppercase text-muted-foreground mr-2">Runtime:</span>
        {(Object.keys(RUNTIME_LABELS) as Runtime[]).map((rt) => (
          <button
            key={rt}
            onClick={() => handleRuntimeChange(rt)}
            data-testid={`button-runtime-${rt}`}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              runtime === rt 
                ? "bg-primary/20 text-primary border border-primary/50 font-bold" 
                : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
            }`}
          >
            {RUNTIME_LABELS[rt]}
          </button>
        ))}
      </div>

      <div className="flex-1 w-full bg-[#1e1e1e]">
        <Editor
          height="100%"
          language={RUNTIME_LANGUAGES[runtime]}
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
