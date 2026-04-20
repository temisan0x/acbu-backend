import { Router } from "express";
import { validateApiKey } from "../middleware/auth";
import {
  postFaucet,
  getAccounts,
  postOnRamp,
  postOffRamp,
} from "../controllers/fiatController";

const router: Router = Router();

router.use(validateApiKey);

router.post("/faucet", postFaucet);
router.post("/onramp", postOnRamp);
router.post("/offramp", postOffRamp);
router.get("/accounts", getAccounts);

export default router;
