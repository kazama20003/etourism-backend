// src/dashboard/dto/dashboard-summary.dto.ts
export class DashboardSummaryDto {
  totalUsers: number;
  totalOrders: number;
  totalSales: number; // grandTotal solo de pagadas
  totalPendingPayments: number;

  ordersByStatus: Record<string, number>;
  paymentsByStatus: Record<string, number>;

  topTours: { title: string; count: number; revenue: number }[];
  topTransports: { title: string; count: number; revenue: number }[];

  recentOrders: any[];
  recentPayments: any[];
}
