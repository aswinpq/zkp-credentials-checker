import express from 'express';
import request from 'supertest';
import { Server } from '../../src/api/server';
import { Logger } from '../../src/utils/logger';

const logger = new Logger('test');

describe('API Integration Tests', () => {
    let app: express.Express;

    beforeAll(() => {
        const server = new Server(logger);
        app = server.getApp();
    });

    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/api/health').expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('healthy');
            expect(res.body.data.version).toBe('1.0.0');
        });
    });

    describe('POST /api/proof/credential-sets', () => {
        it('should create a credential set', async () => {
            const res = await request(app)
                .post('/api/proof/credential-sets')
                .send({ name: 'Unis', credentials: ['MIT', 'Stanford'], description: 'test' })
                .expect(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.merkleRoot).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should reject empty credentials', async () => {
            await request(app)
                .post('/api/proof/credential-sets')
                .send({ name: 'E', credentials: [] })
                .expect(400);
        });
    });

    describe('GET /api/proof/credential-sets', () => {
        it('should list sets', async () => {
            const res = await request(app).get('/api/proof/credential-sets').expect(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('POST /api/proof/generate', () => {
        it('should reject invalid UUID', async () => {
            await request(app)
                .post('/api/proof/generate')
                .send({ credentialSetId: 'bad', credential: 'MIT' })
                .expect(400);
        });
    });

    describe('404 Handler', () => {
        it('should return 404', async () => {
            const res = await request(app).get('/api/nonexistent').expect(404);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });
    });

    describe('Security Headers', () => {
        it('should include security headers', async () => {
            const res = await request(app).get('/api/health');
            expect(res.headers['x-request-id']).toBeDefined();
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['x-frame-options']).toBe('DENY');
        });
    });
});
