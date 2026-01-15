import { Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "../middleware/auth.js";

// Get all accounts for user
export const getAccounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { includeInactive } = req.query;

    const accounts = await prisma.account.findMany({
      where: {
        userId,
        ...(includeInactive !== "true" && { isActive: true }),
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    // Calculate totals by type
    const summary = {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      byType: {} as Record<string, { count: number; total: number }>,
    };

    accounts.forEach((account) => {
      // Initialize type if not exists
      if (!summary.byType[account.type]) {
        summary.byType[account.type] = { count: 0, total: 0 };
      }

      if (account.includeInTotal && account.isActive) {
        summary.byType[account.type].count++;
        summary.byType[account.type].total += account.balance;

        // Credit cards and loans are liabilities
        if (account.type === "CREDIT_CARD" || account.type === "LOAN") {
          summary.totalLiabilities += Math.abs(account.balance);
        } else {
          summary.totalAssets += account.balance;
        }
      }
    });

    summary.netWorth = summary.totalAssets - summary.totalLiabilities;

    res.json({
      accounts,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

// Get single account with recent transactions
export const getAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: { id, userId },
      include: {
        transactionsFrom: {
          take: 20,
          orderBy: { date: "desc" },
          include: {
            toAccount: { select: { name: true, type: true } },
            budgetItem: { select: { category: true } },
            financialGoal: { select: { name: true } },
          },
        },
        transactionsTo: {
          take: 20,
          orderBy: { date: "desc" },
          include: {
            fromAccount: { select: { name: true, type: true } },
            budgetItem: { select: { category: true } },
            financialGoal: { select: { name: true } },
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Combine and sort transactions
    const allTransactions = [
      ...account.transactionsFrom.map((t) => ({ ...t, direction: "outgoing" })),
      ...account.transactionsTo.map((t) => ({ ...t, direction: "incoming" })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      ...account,
      recentTransactions: allTransactions.slice(0, 20),
    });
  } catch (error) {
    next(error);
  }
};

// Create new account
export const createAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const {
      name,
      type,
      balance,
      institution,
      accountNumber,
      color,
      icon,
      includeInTotal,
      notes,
    } = req.body;

    const account = await prisma.account.create({
      data: {
        userId,
        name,
        type,
        balance: balance || 0,
        initialBalance: balance || 0,
        institution,
        accountNumber,
        color,
        icon,
        includeInTotal: includeInTotal !== false,
        notes,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
};

// Update account
export const updateAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const {
      name,
      type,
      institution,
      accountNumber,
      color,
      icon,
      isActive,
      includeInTotal,
      notes,
    } = req.body;

    // Verify ownership
    const existing = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Account not found" });
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        name,
        type,
        institution,
        accountNumber,
        color,
        icon,
        isActive,
        includeInTotal,
        notes,
      },
    });

    res.json(account);
  } catch (error) {
    next(error);
  }
};

// Adjust account balance (manual adjustment)
export const adjustBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { newBalance, notes } = req.body;

    // Verify ownership
    const existing = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Account not found" });
    }

    const adjustment = newBalance - existing.balance;

    // Create adjustment transaction and update balance
    const [account] = await prisma.$transaction([
      prisma.account.update({
        where: { id },
        data: { balance: newBalance },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: Math.abs(adjustment),
          type: adjustment >= 0 ? "INCOME" : "EXPENSE",
          description: notes || "Balance adjustment",
          toAccountId: adjustment >= 0 ? id : undefined,
          fromAccountId: adjustment < 0 ? id : undefined,
        },
      }),
    ]);

    res.json(account);
  } catch (error) {
    next(error);
  }
};

// Delete account (soft delete by setting inactive)
export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { permanent } = req.query;

    // Verify ownership
    const existing = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (permanent === "true") {
      // Permanent deletion
      await prisma.account.delete({
        where: { id },
      });
      res.json({ message: "Account permanently deleted" });
    } else {
      // Soft delete
      await prisma.account.update({
        where: { id },
        data: { isActive: false },
      });
      res.json({ message: "Account deactivated" });
    }
  } catch (error) {
    next(error);
  }
};

// Get account types for dropdown
export const getAccountTypes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const types = [
      { value: "CASH", label: "Cash", icon: "💵" },
      { value: "BANK_ACCOUNT", label: "Bank Account", icon: "🏦" },
      { value: "CREDIT_CARD", label: "Credit Card", icon: "💳" },
      { value: "WALLET", label: "Digital Wallet", icon: "📱" },
      { value: "INVESTMENT", label: "Investment", icon: "📈" },
      { value: "LOAN", label: "Loan", icon: "📋" },
      { value: "OTHER", label: "Other", icon: "💰" },
    ];

    res.json(types);
  } catch (error) {
    next(error);
  }
};
