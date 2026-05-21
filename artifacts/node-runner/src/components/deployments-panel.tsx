import React, { useState } from "react";
import { useListApps, useDeleteApp, useRestartApp, useGetAppLogs, getListAppsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Trash2, FileTerminal, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function StatusBadge({ status }: { status: string }) {
  let color = "bg-gray-500";
  let text = status;

  switch (status) {
    case "running":
      color = "bg-green-500";
      break;
    case "starting":
      color = "bg-yellow-500";
      break;
    case "stopped":
      color = "bg-gray-500";
      break;
    case "crashed":
      color = "bg-red-500";
      break;
  }

  return (
    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="opacity-80">{text}</span>
    </div>
  );
}

function LogsModal({ appId, open, onOpenChange }: { appId: string, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: logs, isLoading } = useGetAppLogs(appId, {
    query: {
      enabled: open,
      refetchInterval: 3000,
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border rounded-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-4">
            Application Logs
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ScrollArea className="h-[400px] w-full bg-[#1e1e1e] p-4 font-mono text-xs text-foreground">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading logs...
              </div>
            ) : !logs ? (
              <div className="text-muted-foreground">No logs available.</div>
            ) : (
              <div className="space-y-4">
                {logs.stdout && (
                  <pre className="whitespace-pre-wrap break-words">{logs.stdout}</pre>
                )}
                {logs.stderr && (
                  <pre className="text-red-400 whitespace-pre-wrap break-words">{logs.stderr}</pre>
                )}
                {!logs.stdout && !logs.stderr && (
                  <div className="text-muted-foreground italic">Process has no output yet.</div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DeploymentsPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: apps, isLoading } = useListApps({
    query: {
      refetchInterval: 3000
    }
  });

  const deleteApp = useDeleteApp();
  const restartApp = useRestartApp();

  const [logsAppId, setLogsAppId] = useState<string | null>(null);
  const [deleteAppId, setDeleteAppId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteApp.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppsQueryKey() });
          setDeleteAppId(null);
          toast({ title: "App deleted" });
        },
        onError: (err) => {
          toast({ title: "Failed to delete app", description: err?.message, variant: "destructive" });
        }
      }
    );
  };

  const handleRestart = (id: string) => {
    restartApp.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppsQueryKey() });
          toast({ title: "Restarting app" });
        },
        onError: (err) => {
          toast({ title: "Failed to restart app", description: err?.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-background font-mono">
      <div className="h-12 flex items-center px-6 border-b border-border bg-card">
        <h2 className="text-sm uppercase tracking-widest font-bold text-foreground">Your Deployments</h2>
      </div>

      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading deployments...
          </div>
        ) : !apps || apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4 border border-dashed border-border p-8 bg-card/50">
            <p className="text-sm">No deployments yet. Write some code and hit Deploy.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => (
              <div key={app.id} className="border border-border bg-card p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-primary">{app.name}</h3>
                    <div className="mt-2">
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                  {app.status === "running" && app.url && (
                    <a 
                      href={app.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline flex items-center gap-1.5 text-sm transition-colors"
                      data-testid={`link-app-url-${app.id}`}
                    >
                      {app.url}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none border-border h-8 text-xs font-mono uppercase hover:bg-secondary"
                    onClick={() => handleRestart(app.id)}
                    disabled={restartApp.isPending && restartApp.variables?.id === app.id}
                    data-testid={`button-restart-${app.id}`}
                  >
                    {restartApp.isPending && restartApp.variables?.id === app.id ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Restart
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none border-border h-8 text-xs font-mono uppercase hover:bg-secondary text-destructive hover:text-destructive"
                    onClick={() => setDeleteAppId(app.id)}
                    data-testid={`button-delete-${app.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Stop / Delete
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none border-border h-8 text-xs font-mono uppercase hover:bg-secondary ml-auto"
                    onClick={() => setLogsAppId(app.id)}
                    data-testid={`button-logs-${app.id}`}
                  >
                    <FileTerminal className="w-3.5 h-3.5 mr-1.5" />
                    Logs
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {logsAppId && (
        <LogsModal 
          appId={logsAppId} 
          open={!!logsAppId} 
          onOpenChange={(open) => !open && setLogsAppId(null)} 
        />
      )}

      <Dialog open={!!deleteAppId} onOpenChange={(open) => !open && setDeleteAppId(null)}>
        <DialogContent className="rounded-none border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase text-sm tracking-wider">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm font-mono">
              Are you sure you want to stop and delete this application? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              className="rounded-none font-mono text-xs uppercase h-8"
              onClick={() => setDeleteAppId(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="rounded-none font-mono text-xs uppercase h-8"
              onClick={() => deleteAppId && handleDelete(deleteAppId)}
              disabled={deleteApp.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteApp.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
