"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Order, OrderStatus, statusConfig } from "@/lib/data";
import { cn } from "@/lib/utils";

interface OrderTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export function OrderTable({
  orders,
  onViewOrder,
  onUpdateStatus,
}: OrderTableProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead className="text-muted-foreground font-semibold">
              Order ID
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold">
              Customer
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold">
              Items
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold">
              Total
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold">
              Status
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold">
              Time
            </TableHead>
            <TableHead className="text-muted-foreground font-semibold text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="border-white/10 hover:bg-white/5 transition-all duration-300 cursor-pointer"
              onClick={() => onViewOrder(order)}
            >
              <TableCell className="font-medium text-[#FF6B35]">
                {order.id}
              </TableCell>
              <TableCell className="font-medium">
                {order.customerName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {order.items.length} item{order.items.length > 1 ? "s" : ""}
              </TableCell>
              <TableCell className="font-semibold">
                ${order.total.toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-xl px-3 py-1 font-medium transition-all duration-300",
                    statusConfig[order.status].color
                  )}
                >
                  {statusConfig[order.status].label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatTime(order.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-white/10 rounded-xl transition-all duration-300"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="backdrop-blur-md bg-white/90 dark:bg-black/90 border border-white/20 rounded-xl shadow-xl"
                  >
                    <DropdownMenuLabel className="text-[#FF6B35]">
                      Actions
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/20" />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewOrder(order);
                      }}
                      className="rounded-lg hover:bg-orange-500/10 cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/20" />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Update Status
                    </DropdownMenuLabel>
                    {(
                      [
                        "pending",
                        "preparing",
                        "ready",
                        "delivered",
                        "cancelled",
                      ] as OrderStatus[]
                    ).map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(order.id, status);
                        }}
                        className="rounded-lg hover:bg-orange-500/10 cursor-pointer"
                        disabled={order.status === status}
                      >
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full mr-2",
                            status === "pending" && "bg-yellow-500",
                            status === "preparing" && "bg-orange-500",
                            status === "ready" && "bg-green-500",
                            status === "delivered" && "bg-blue-500",
                            status === "cancelled" && "bg-red-500"
                          )}
                        />
                        {statusConfig[status].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
