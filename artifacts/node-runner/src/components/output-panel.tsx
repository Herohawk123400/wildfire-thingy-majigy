import React from "react";
import { RunResult } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OutputPanel({ output, isRunning }: { output: RunResult | null, isRunning: boolean }) {
  return (
    <div className="h-full flex flex-col bg-[#0a0a0c]">
      <div className="h-10 border-b border-border flex items-center px-4 justify-between bg-card">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Terminal className="w-4 h-4" />
          Output
        </div>
        
        {output && !isRunning && (
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {output.executionTimeMs}ms
            </div>
            {output.exitCode === 0 ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20 font-mono">
                Exit {output.exitCode}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 hover:bg-red-500/10 border-red-500/20 font-mono">
                Exit {output.exitCode ?? 'null'}
              </Badge>
            )}
            {output.timedOut && (
              <Badge variant="destructive" className="font-mono">Timeout</Badge>
            )}
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1 font-mono text-sm">
        <div className="p-4">
          {isRunning ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Executing...
            </div>
          ) : !output ? (
            <div className="text-muted-foreground/50">Run code to see output</div>
          ) : (
            <div className="space-y-2">
              {output.stdout && (
                <pre className="text-foreground whitespace-pre-wrap break-words">{output.stdout}</pre>
              )}
              {output.stderr && (
                <pre className="text-red-400 whitespace-pre-wrap break-words">{output.stderr}</pre>
              )}
              {!output.stdout && !output.stderr && (
                <div className="text-muted-foreground/50 italic">Process exited with no output.</div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
