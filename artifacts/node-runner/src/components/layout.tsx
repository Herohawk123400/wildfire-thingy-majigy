import React, { useState, useRef, useCallback } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Sidebar } from "./sidebar";
import { EditorPanel } from "./editor-panel";
import { OutputPanel } from "./output-panel";
import { useRunCode, useCreateSnippet, useListSnippets, getListSnippetsQueryKey, RunResult } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function Layout() {
  const [code, setCode] = useState<string>('console.log("Hello, Node.js!");');
  const [output, setOutput] = useState<RunResult | null>(null);
  
  const runCode = useRunCode();
  const createSnippet = useCreateSnippet();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRun = useCallback(() => {
    if (!code.trim()) return;
    
    runCode.mutate(
      { data: { code } },
      {
        onSuccess: (result) => {
          setOutput(result);
        },
        onError: (err) => {
          toast({
            title: "Execution Error",
            description: err.error || "An unknown error occurred",
            variant: "destructive"
          });
        }
      }
    );
  }, [code, runCode, toast]);

  const handleSaveSnippet = useCallback((title: string) => {
    createSnippet.mutate(
      { data: { title, code } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSnippetsQueryKey() });
          toast({
            title: "Snippet Saved",
            description: "Your snippet has been saved successfully.",
          });
        },
        onError: (err) => {
          toast({
            title: "Failed to save snippet",
            description: (err as any).error || "An unknown error occurred",
            variant: "destructive"
          });
        }
      }
    );
  }, [code, createSnippet, queryClient, toast]);

  const handleLoadSnippet = useCallback((snippetCode: string) => {
    setCode(snippetCode);
    setOutput(null);
  }, []);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background text-foreground">
      <Sidebar onLoadSnippet={handleLoadSnippet} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={65} minSize={20}>
            <EditorPanel 
              code={code} 
              onChange={setCode} 
              onRun={handleRun}
              onSave={handleSaveSnippet}
              isRunning={runCode.isPending}
            />
          </ResizablePanel>
          
          <ResizableHandle className="bg-border" />
          
          <ResizablePanel defaultSize={35} minSize={10}>
            <OutputPanel output={output} isRunning={runCode.isPending} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
