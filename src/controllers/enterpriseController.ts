import { Request, Response, NextFunction } from "express";
import { treasuryService } from "../services/treasury/TreasuryService";
import { AppError } from "../middleware/errorHandler";

export async function postBulkTransfer(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // TODO: bulk transfer (many transfers); idempotency; enterprise limits
    res.status(501).json({
      error: "NOT_IMPLEMENTED",
      message:
        "Bulk transfer endpoint not yet implemented. Use /transfers for single transfers.",
    });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /treasury
 * Returns verified enterprise treasury balance with reconciliation status.
 *
 * Features:
 * - Aggregates data from Transfers (transactions), Reserves, and FX Snapshots
 * - Handles null values: defaults to 0 for missing segments
 * - FX Fallback: uses most recent available rate if current rate missing
 * - Reconciliation: verifies calculated total against ledger with 0.01% tolerance
 *
 * Response:
 * - totalBalanceUsd: Sum of all reserve holdings in USD
 * - byCurrency: Breakdown by currency with transaction and investment segments
 * - reconciliation: Status and warnings for data consistency
 */
export async function getTreasury(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const organizationId = (req as any).apiKey?.organizationId || undefined;
    const toleranceStr = req.query.tolerance as string | undefined;
    
    let tolerance = 0.01; // Default 0.01%
    if (toleranceStr) {
      const parsed = Number(toleranceStr);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        tolerance = parsed;
      }
    }

    const treasury = await treasuryService.getEnterpriseTreasury(organizationId, tolerance);

    res.status(200).json({
      totalBalanceUsd: treasury.totalBalanceUsd,
      totalReserveAmount: treasury.totalReserveAmount,
      summary: treasury.summary,
      byCurrency: treasury.byCurrency.map((item) => ({
        currency: item.currency,
        targetWeight: item.targetWeight,
        reserveAmount: item.combined.reserveAmount,
        reserveValueUsd: item.combined.reserveValueUsd,
        segments: {
          transactions: {
            amount: item.transactions.reserveAmount,
            valueUsd: item.transactions.reserveValueUsd,
            fxRate: item.transactions.fxRate,
            fxRateTimestamp: item.transactions.fxRateTimestamp,
            fxRateSource: item.transactions.fxRateSource,
          },
          investmentSavings: {
            amount: item.investmentSavings.reserveAmount,
            valueUsd: item.investmentSavings.reserveValueUsd,
            fxRate: item.investmentSavings.fxRate,
            fxRateTimestamp: item.investmentSavings.fxRateTimestamp,
            fxRateSource: item.investmentSavings.fxRateSource,
          },
        },
      })),
      reconciliation: {
        ledgerTotal: treasury.reconciliation.ledgerTotal,
        calculatedTotal: treasury.reconciliation.calculatedTotal,
        discrepancy: treasury.reconciliation.discrepancy,
        discrepancyPercentage: treasury.reconciliation.discrepancyPercentage,
        isReconciled: treasury.reconciliation.isReconciled,
        tolerancePercentage: treasury.reconciliation.tolerancePercentage,
        warnings: treasury.reconciliation.warnings,
      },
      message: treasury.message,
    });
  } catch (e) {
    next(e);
  }
}
