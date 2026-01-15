import { Router } from 'express';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getBudgetTransactionSummary,
} from '../controllers/transaction.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.delete('/:id', deleteTransaction);
router.get('/budget/:year/:month', getBudgetTransactionSummary);

export default router;
