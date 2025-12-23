import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Order,
  OrderDocument,
  PaymentStatus as OrderPaymentStatus,
} from 'src/orders/entities/order.entity';

import { Payment, PaymentDocument } from 'src/payments/entities/payment.entity';

import { User, UserDocument } from 'src/users/entities/user.entity';

import { LeanOrder } from 'src/common/types/order-lean.type';
import { LeanPayment } from 'src/payments/types/payment-lean.type';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getSummary() {
    // GENERAL
    const totalUsers = await this.userModel.countDocuments();
    const totalOrders = await this.orderModel.countDocuments();

    const paidOrders = await this.orderModel
      .find({ paymentStatus: OrderPaymentStatus.PAID })
      .lean<LeanOrder[]>();

    const totalSales = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    const averageTicket =
      paidOrders.length > 0 ? totalSales / paidOrders.length : 0;

    const totalPendingPayments = await this.paymentModel.countDocuments({
      status: 'pending',
    });

    // ORDERS BY STATUS
    const ordersByStatus = await this.orderModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // PAYMENTS BY STATUS
    const paymentsByStatus = await this.paymentModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // TOP TOURS
    const topTours = await this.orderModel.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.productType': 'Tour' } },
      {
        $group: {
          _id: '$items.productId',
          count: { $sum: 1 },
          revenue: { $sum: '$items.totalPrice' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'tours',
          localField: '_id',
          foreignField: '_id',
          as: 'tour',
        },
      },
      { $unwind: '$tour' },
      {
        $project: {
          title: '$tour.title',
          count: 1,
          revenue: 1,
        },
      },
    ]);

    // TOP TRANSPORT
    const topTransports = await this.orderModel.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.productType': 'Transport' } },
      {
        $group: {
          _id: '$items.productId',
          count: { $sum: 1 },
          revenue: { $sum: '$items.totalPrice' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'transports',
          localField: '_id',
          foreignField: '_id',
          as: 'transport',
        },
      },
      { $unwind: '$transport' },
      {
        $project: {
          title: '$transport.title',
          count: 1,
          revenue: 1,
        },
      },
    ]);

    // TOP CUSTOMERS
    const topCustomers = await this.orderModel.aggregate([
      {
        $group: {
          _id: '$customerEmail',
          customerName: { $first: '$customerName' },
          ordersCount: { $sum: 1 },
          totalSpent: { $sum: '$grandTotal' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);

    // SALES BY DAY
    const salesByDay = await this.orderModel.aggregate([
      { $match: { paymentStatus: OrderPaymentStatus.PAID } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // RECENT ORDERS
    const recentOrdersRaw = await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<LeanOrder[]>();

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o._id,
      customerName: o.customerName,
      total: o.grandTotal,
      currency: o.currency,
      paymentStatus: o.paymentStatus,
      status: o.status,
      items: o.items.map((it) => ({
        productType: it.productType,
        productId: it.productId,
        travelDate: it.travelDate,
        total: it.totalPrice,
      })),
      createdAt: o.createdAt,
    }));

    // RECENT PAYMENTS
    const recentPaymentsRaw = await this.paymentModel
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<LeanPayment[]>();

    const recentPayments = recentPaymentsRaw.map((p) => ({
      id: p._id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      orderId: p.orderId,
      izipayOrderId: p.izipayOrderId,
      transactionUuid: p.transactionUuid,
      customerName: p.orderDraft?.customerName,
      customerEmail: p.orderDraft?.customerEmail,
      items:
        p.orderDraft?.items?.map((it) => ({
          productType: it.productType,
          productId: it.productId,
          travelDate: it.travelDate,
          total: it.totalPrice,
        })) ?? [],
      createdAt: p.createdAt,
    }));

    return {
      totalUsers,
      totalOrders,
      totalSales,
      averageTicket,
      totalPendingPayments,
      ordersByStatus,
      paymentsByStatus,
      topTours,
      topTransports,
      topCustomers,
      salesByDay,
      recentOrders,
      recentPayments,
    };
  }
}
