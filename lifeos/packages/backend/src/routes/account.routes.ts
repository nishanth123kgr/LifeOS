import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  adjustBalance,
  deleteAccount,
  getAccountTypes,
} from "../controllers/account.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get account types for dropdowns
router.get("/types", getAccountTypes);

// Get all accounts with summary
router.get("/", getAccounts);

// Get single account with transactions
router.get("/:id", getAccount);

// Create new account
router.post("/", createAccount);

// Update account details
router.put("/:id", updateAccount);

// Adjust account balance
router.patch("/:id/balance", adjustBalance);

// Delete/deactivate account
router.delete("/:id", deleteAccount);

export default router;
