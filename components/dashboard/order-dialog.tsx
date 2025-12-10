"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Order, statusConfig } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Clock, User, FileText, ShoppingBag } from "lucide-react";

interface OrderDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDialog({ order, open, onOpenChange }: OrderDialogProps) {
  if (!order) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-white/80 dark:bg-black/80 border border-white/30 rounded-2xl shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="bg-gradient-to-r from-[#FF6B35] to-[#FFA500] bg-clip-text text-transparent font-bold">
              {order.id}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "rounded-xl px-3 py-1 font-medium",
                statusConfig[order.status].color
              )}
            >
              {statusConfig[order.status].label}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Order details and items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Customer Info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF8C42]">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-semibold">{order.customerName}</p>
            </div>
          </div>

          {/* Time Info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF8C42] to-[#FFA500]">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ordered at</p>
              <p className="font-semibold">{formatDateTime(order.createdAt)}</p>
            </div>
            {order.estimatedTime && (
              <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">ETA</p>
                <p className="font-semibold text-[#FF6B35]">
                  {order.estimatedTime}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#FF6B35]" />
              <h4 className="font-semibold">Order Items</h4>
            </div>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-yellow-600" />
                <h4 className="font-semibold text-yellow-700">Notes</h4>
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {order.notes}
              </p>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFA500] text-white">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-bold text-2xl">
              ${order.total.toFixed(2)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
