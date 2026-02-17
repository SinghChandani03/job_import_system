import { Router } from 'express';
import * as jobSourceController from '../controllers/jobSourceController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(jobSourceController.list));
router.post('/', asyncHandler(jobSourceController.create));
router.post('/:id/trigger', asyncHandler(jobSourceController.trigger));

export default router;
