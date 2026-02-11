import { Router, Request, Response } from 'express';

const router = Router();

const startTime = Date.now();

/**
 * GET /api/health
 * Health check endpoint for monitoring.
 */
router.get('/', (_req: Request, res: Response) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const memUsage = process.memoryUsage();

    res.status(200).json({
        success: true,
        data: {
            status: 'healthy',
            version: '1.0.0',
            uptime,
            timestamp: new Date().toISOString(),
            checks: {
                memory: memUsage.heapUsed < memUsage.heapTotal * 0.9,
                uptime: uptime > 0,
            },
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024),
            },
        },
    });
});

export const healthRoutes = router;
