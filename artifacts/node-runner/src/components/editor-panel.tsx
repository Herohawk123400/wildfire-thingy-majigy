import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Play, Save, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditorPanelProps {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onSave: (title: string) => void;
  isRunning: boolean;
}

export function EditorPanel({ code, onChange, onRun, onSave, isRunning }: EditorPanelProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [title, setTitle] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title);
    setSaveOpen(false);
    setTitle("");
  };

  return (
    <div className="h-full flex flex-col bg-background" onKeyDown={handleKeyDown}>
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">index.js</span>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-border/50 hover:bg-secondary">
                <Save className="w-4 h-4 mr-1.5" />
                Save Snippet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Save Snippet</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Snippet Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Express server setup" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!title.trim()}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            size="sm" 
            className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            onClick={onRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-1.5" />
            )}
            Run
            <span className="ml-2 text-[10px] opacity-60 border border-primary-foreground/20 rounded px-1 py-0.5">⌘↵</span>
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 pt-2">
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={(val) => onChange(val || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
            lineHeight: 1.5,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            formatOnPaste: true,
          }}
        />
      </div>
    </div>
  );
}
