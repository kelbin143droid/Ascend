import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatRowProps {
  label: string;
  value: number;
  canAdd: boolean;
  onAdd: () => void;
}

export function StatRow({ label, value, canAdd, onAdd }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-primary/10 last:border-0 group hover:bg-primary/5 px-2 rounded-sm transition-colors">
      <span className="text-muted-foreground font-display text-sm tracking-wider w-24">{label}</span>
      <div className="flex items-center gap-4 flex-1 justify-end">
        <span className="font-mono text-lg font-bold text-foreground text-glow">{value.toString().padStart(3, '0')}</span>
        <Button
            variant="outline"
            size="icon"
            className={cn(
                "h-6 w-6 rounded-none border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all",
                canAdd ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={onAdd}
            disabled={!canAdd}
        >
            <Plus size={12} />
        </Button>
      </div>
    </div>
  );
}
