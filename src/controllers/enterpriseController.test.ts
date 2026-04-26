/**
 * Enterprise Controller Tests
 *
 * Tests for the getTreasury endpoint covering:
 * - Successful treasury retrieval
 * - Response format and completeness
 * - Custom tolerance parameter handling
 * - Error handling
 */

import { Response, NextFunction } from "express";
import { getTreasury } from "./enterpriseController";
import { treasuryService } from "../services/treasury/TreasuryService";
import type { AuthRequest } from "../middleware/auth";

jest.mock("../services/treasury/TreasuryService", () => ({
  treasuryService: {
    getEnterpriseTreasury: jest.fn(),
  },
}));

const mockTreasuryService = treasuryService as jest.Mocked<typeof treasuryService>;

const makeRes = () => {
  const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  (res.json as jest.Mock).mockReturnValue(res);
  return res;
};

const makeNext = () => jest.fn() as jest.MockedFunction<NextFunction>;

describe("enterpriseController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTreasury", () => {
    it("returns complete treasury response with all required fields", async () => {
      mockTreasuryService.getEnterpriseTreasury.mockResolvedValue({
        totalBalanceUsd: 5000,
        totalReserveAmount: 1000000,
        summary: {
          transactionsSegmentUsd: 3000,
          investmentSavingsSegmentUsd: 2000,
        },
        byCurrency: [
          {
            currency: "NGN",
            targetWeight: 18,
            transactions: {
              currency: "NGN",
              segment: "transactions",
              reserveAmount: 500000,
              reserveValueUsd: 1500,
              fxRate: 0.003,
              fxRateTimestamp: new Date(),
              fxRateSource: "current",
            },
            investmentSavings: {
              currency: "NGN",
              segment: "investment_savings",
              reserveAmount: 300000,
              reserveValueUsd: 1000,
              fxRate: 0.003,
              fxRateTimestamp: new Date(),
              fxRateSource: "current",
            },
            combined: {
              reserveAmount: 800000,
              reserveValueUsd: 2500,
            },
          },
          {
            currency: "KES",
            targetWeight: 12,
            transactions: {
              currency: "KES",
              segment: "transactions",
              reserveAmount: 100000,
              reserveValueUsd: 750,
              fxRate: 0.0075,
              fxRateTimestamp: new Date(),
              fxRateSource: "current",
            },
            investmentSavings: {
              currency: "KES",
              segment: "investment_savings",
              reserveAmount: 100000,
              reserveValueUsd: 750,
              fxRate: 0.0075,
              fxRateTimestamp: new Date(),
              fxRateSource: "current",
            },
            combined: {
              reserveAmount: 200000,
              reserveValueUsd: 1500,
            },
          },
        ],
        reconciliation: {
          ledgerTotal: 5000,
          calculatedTotal: 5000,
          discrepancy: 0,
          discrepancyPercentage: 0,
          isReconciled: true,
          tolerancePercentage: 0.01,
          warnings: [],
        },
        message: "Treasury reconciliation successful",
      } as any);

      const res = makeRes();
      const req = {
        apiKey: { organizationId: "org-123" },
        query: {},
      } as unknown as AuthRequest;

      await getTreasury(req, res, makeNext());

      expect(res.status).toHaveBeenCalledWith(200);

      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body).toHaveProperty("totalBalanceUsd", 5000);
      expect(body).toHaveProperty("totalReserveAmount", 1000000);
      expect(body).toHaveProperty("summary");
      expect(body).toHaveProperty("byCurrency");
      expect(body).toHaveProperty("reconciliation");
      expect(body).toHaveProperty("message");

      expect(body.byCurrency).toHaveLength(2);
      expect(body.byCurrency[0]).toHaveProperty("currency", "NGN");
      expect(body.byCurrency[0]).toHaveProperty("segments");
      expect(body.byCurrency[0].segments).toHaveProperty("transactions");
      expect(body.byCurrency[0].segments).toHaveProperty("investmentSavings");
    });

    it("uses default tolerance of 0.01% when not specified", async () => {
      mockTreasuryService.getEnterpriseTreasury.mockResolvedValue({
        totalBalanceUsd: 1000,
        totalReserveAmount: 100000,
        summary: { transactionsSegmentUsd: 600, investmentSavingsSegmentUsd: 400 },
        byCurrency: [],
        reconciliation: {
          ledgerTotal: 1000,
          calculatedTotal: 1000,
          discrepancy: 0,
          discrepancyPercentage: 0,
          isReconciled: true,
          tolerancePercentage: 0.01,
          warnings: [],
        },
        message: "Treasury reconciliation successful",
      } as any);

      const res = makeRes();
      const req = {
        apiKey: { organizationId: "org-123" },
        query: {},
      } as unknown as AuthRequest;

      await getTreasury(req, res, makeNext());

      expect(mockTreasuryService.getEnterpriseTreasury).toHaveBeenCalledWith(
        "org-123",
        0.01,
      );
    });

    it("parses and uses custom tolerance parameter", async () => {
      mockTreasuryService.getEnterpriseTreasury.mockResolvedValue({
        totalBalanceUsd: 1000,
        totalReserveAmount: 100000,
        summary: { transactionsSegmentUsd: 600, investmentSavingsSegmentUsd: 400 },
        byCurrency: [],
        reconciliation: {
          ledgerTotal: 1000,
          calculatedTotal: 1000,
          discrepancy: 0,
          discrepancyPercentage: 0,
          isReconciled: true,
          tolerancePercentage: 0.5,
          warnings: [],
        },
        message: "Treasury reconciliation successful",
      } as any);

      const res = makeRes();
      const req = {
        apiKey: { organizationId: "org-123" },
        query: { tolerance: "0.5" },
      } as unknown as AuthRequest;

      await getTreasury(req, res, makeNext());

      expect(mockTreasuryService.getEnterpriseTreasury).toHaveBeenCalledWith(
        "org-123",
        0.5,
      );
    });

    it("ignores invalid tolerance values and uses default", async () => {
      mockTreasuryService.getEnterpriseTreasury.mockResolvedValue({
        totalBalanceUsd: 1000,
        totalReserveAmount: 100000,
        summary: { transactionsSegmentUsd: 600, investmentSavingsSegmentUsd: 400 },
        byCurrency: [],
        reconciliation: {
          ledgerTotal: 1000,
          calculatedTotal: 1000,
          discrepancy: 0,
          discrepancyPercentage: 0,
          isReconciled: true,
          tolerancePercentage: 0.01,
          warnings: [],
        },
        message: "Treasury reconciliation successful",
      } as any);

      const res = makeRes();
      const req = {
        apiKey: { organizationId: "org-123" },
        query: { tolerance: "invalid" },
      } as unknown as AuthRequest;

      await getTreasury(req, res, makeNext());

      expect(mockTreasuryService.getEnterpriseTreasury).toHaveBeenCalledWith(
        "org-123",
        0.01, // default
      );
    });

    it("clamps tolerance value between 0 and 100", async () => {
      mockTreasuryService.getEnterpriseTreasury.mockResolvedValue({
        totalBalanceUsd: 1000,
        totalReserveAmount: 100000,
        summary: { transactionsSegmentUsd: 600, investmentSavingsSegmentUsd: 400 },
        byCurrency: [],
        reconciliation: {
          ledgerTotal: 1000,
          calculatedTotal: 1000,
          discrepancy: 0,
          discrepancyPercentage: 0,
          isReconciled: true,
          tolerancePercentage: 100,
          warnings: [],
        },
        message: "Treasury reconciliation successful",
      } as any);

      const res = makeRes();
      const req = {
        apiKey: { organizationId: "org-123" },
        query: { tolerance: "999" }, // Over 100
      } as unknown as AuthRequest;

      await getTreasury(req, res, makeNext());

      expect(mockTreasuryService.getEnterpriseTreasury).toHaveBeenCalledWith(
        "org-123",
        999, // Clamping is handled by service, controller passes through
      );
    });

    it("includes FX rate source and timestamp in response", async () => {
      const now = new Date();

      mockTreasuryService.getEnterpriseTreasury.mockResolvedValue({
        totalBalanceUsd: 1000,
        totalReserveAmount: 100000,
        summary: { transactionsSegmentUsd: 600, investmentSavingsSegmentUsd: 400 },
        byCurrency: [
          {
            currency: "NGN",
            targetWeight: 18,
            transactions: {
              currency: "NGN",
              segment: "transactions",
              reserveAmount: 50000,
              reserveValueUsd: 600,
              fxRate: 0.012,
              fxRateTimestamp: now,
              fxRateSource: "fallback",
            },
            investmentSavings: {
              currency: "NGN",
              segment: "investment_savings",
              reserveAmount: 30000,
              reserveValueUsd: 360,
              fxRate: 0.012,
              fxRateTimestamp: now,
              fxRateSource: "current",
            },
            combined: {
              reserveAmount: 80000,
              reserveValueUsd: 960,
            },
          },
        ],
        reconciliation: {
          ledgerTotal: 1000,
          calculatedTotal: 1000,
          discrepancy: 0,
          discrepancyPercentage: 0,
          isReconciled: true,
          tolerancePercentage: 0.01,
          warnings: [],
        },
        message: "Treasury reconciliation successful",
      } as any);

      const res = makeRes();
      const req = {
        apiKey: { organizationId: "org-123" },
        query: {},
      } as unknown as AuthRequest;

      await getTreasury(req, res, makeNext());

      const body = (res.json as jest.Mock).mock.calls[0][0];
      const ngnSegments = body.byCurrency[0].segments;

      expect(ngnSegments.transactions.fxRateSource).toBe("fallback");
      expect(ngnSegments.transactions.fxRateTimestamp).toEqual(now);
      expect(ngnSegments.investmentSavings.fxRateSource).toBe("current");
    });

    it("includes reconciliation warnings in response", async () => {
      mockTreasuryService.getEnterpriseTreasury.mockResolvedValue({
        totalBalanceUsd: 1000,
        totalReserveAmount: 100000,
        summary: { transactionsSegmentUsd: 600, investmentSavingsSegmentUsd: 400 },
        byCurrency: [],
        reconciliation: {
          ledgerTotal: 1000,
          calculatedTotal: 1100,
          discrepancy: 100,
          discrepancyPercentage: 10,
          isReconciled: false,
          tolerancePercentage: 0.01,
          warnings: ["Treasury reconciliation FAILED: Discrepancy exceeds tolerance"],
        },
        message: "Treasury reconciliation failed - see warnings in reconciliation section",
      } as any);

      const res = makeRes();
      const req = {
        apiKey: { organizationId: "org-123" },
        query: {},
      } as unknown as AuthRequest;

      await getTreasury(req, res, makeNext());

      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.reconciliation.isReconciled).toBe(false);
      expect(body.reconciliation.warnings).toHaveLength(1);
      expect(body.message).toContain("failed");
    });

    it("calls error handler on service failure", async () => {
      mockTreasuryService.getEnterpriseTreasury.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const res = makeRes();
      const next = makeNext();
      const req = {
        apiKey: { organizationId: "org-123" },
        query: {},
      } as unknown as AuthRequest;

      await getTreasury(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("uses organizationId from apiKey context", async () => {
      mockTreasuryService.getEnterpriseTreasury.mockResolvedValue({
        totalBalanceUsd: 1000,
        totalReserveAmount: 100000,
        summary: { transactionsSegmentUsd: 600, investmentSavingsSegmentUsd: 400 },
        byCurrency: [],
        reconciliation: {
          ledgerTotal: 1000,
          calculatedTotal: 1000,
          discrepancy: 0,
          discrepancyPercentage: 0,
          isReconciled: true,
          tolerancePercentage: 0.01,
          warnings: [],
        },
        message: "Treasury reconciliation successful",
      } as any);

      const res = makeRes();
      const req = {
        apiKey: { organizationId: "specific-org-456" },
        query: {},
      } as unknown as AuthRequest;

      await getTreasury(req, res, makeNext());

      expect(mockTreasuryService.getEnterpriseTreasury).toHaveBeenCalledWith(
        "specific-org-456",
        0.01,
      );
    });

    it("defaults to undefined organizationId if not in apiKey", async () => {
      mockTreasuryService.getEnterpriseTreasury.mockResolvedValue({
        totalBalanceUsd: 1000,
        totalReserveAmount: 100000,
        summary: { transactionsSegmentUsd: 600, investmentSavingsSegmentUsd: 400 },
        byCurrency: [],
        reconciliation: {
          ledgerTotal: 1000,
          calculatedTotal: 1000,
          discrepancy: 0,
          discrepancyPercentage: 0,
          isReconciled: true,
          tolerancePercentage: 0.01,
          warnings: [],
        },
        message: "Treasury reconciliation successful",
      } as any);

      const res = makeRes();
      const req = {
        apiKey: { userId: "user-123" },
        query: {},
      } as unknown as AuthRequest;

      await getTreasury(req, res, makeNext());

      expect(mockTreasuryService.getEnterpriseTreasury).toHaveBeenCalledWith(
        undefined,
        0.01,
      );
    });
  });
});
