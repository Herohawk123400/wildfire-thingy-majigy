import React, { useState } from "react";
import { useListSnippets, useDeleteSnippet, getListSnippetsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, FileCode2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export function Sidebar({ onLoadSnippet }: { onLoadSnippet: (code: string) => void }) {
  const { data: snippets, isLoading } = useListSnippets();
  const deleteSnippet = useDeleteSnippet();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSnippet.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSnippetsQueryKey() });
      }
    });
  };

  const filteredSnippets = snippets?.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <FileCode2 className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-semibold text-sm tracking-tight">Node.js Runner</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search snippets..." 
            className="pl-9 h-9 bg-background/50 border-border/50 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading snippets...</div>
          ) : filteredSnippets?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {search ? "No snippets found." : "No saved snippets yet."}
            </div>
          ) : (
            filteredSnippets?.map(snippet => (
              <div 
                key={snippet.id}
                onClick={() => onLoadSnippet(snippet.code)}
                className="group flex items-center justify-between p-2 hover:bg-secondary rounded-md cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate pr-2 text-foreground/90">{snippet.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDelete(snippet.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
