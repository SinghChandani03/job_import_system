import { Router } from 'express';
import * as importLogController from '../controllers/importLogController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(importLogController.list));

export default router;
