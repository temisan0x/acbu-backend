import { Router, type IRouter } from "express";
import { getPublicAssetsConfig } from "../controllers/configController";

const router: IRouter = Router();

// Public — no API key required. Used by the frontend to discover the exact
// ACBU asset (code + issuer) + Stellar network to sign trustlines against.
router.get("/assets", getPublicAssetsConfig);

export default router;
