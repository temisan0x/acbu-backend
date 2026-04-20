import { Router } from "express";
import {
  getMe,
  patchMe,
  deleteMe,
  getReceive,
  getReceiveQrcode,
  getMeBalance,
  postWalletConfirm,
  postWalletActivate,
  putWalletAddress,
  deleteWallet,
  postContacts,
  getContacts,
  deleteContact,
  postGuardians,
  getGuardians,
  deleteGuardian,
} from "../controllers/userController";
import { validateApiKey } from "../middleware/auth";
import { apiKeyRateLimiter } from "../middleware/rateLimiter";

const router: ReturnType<typeof Router> = Router();

router.use(validateApiKey);
router.use(apiKeyRateLimiter);

router.get("/me", getMe);
router.patch("/me", patchMe);
router.delete("/me", deleteMe);
router.get("/me/receive", getReceive);
router.get("/me/receive/qrcode", getReceiveQrcode);
router.get("/me/balance", getMeBalance);
router.post("/me/wallet/confirm", postWalletConfirm);
router.post("/me/wallet/activate", postWalletActivate);
router.put("/me/wallet", putWalletAddress);
router.delete("/me/wallet", deleteWallet);
router.post("/me/contacts", postContacts);
router.get("/me/contacts", getContacts);
router.delete("/me/contacts/:id", deleteContact);
router.post("/me/guardians", postGuardians);
router.get("/me/guardians", getGuardians);
router.delete("/me/guardians/:id", deleteGuardian);

export default router;
