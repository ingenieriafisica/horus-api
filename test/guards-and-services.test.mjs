import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Reflector } = require('@nestjs/core');
const { TenantGuard, assertBranchAccess, TENANT_ID_PARAM_KEY } = require('../dist/common/guards/index.js');
const { CountsService } = require('../dist/counts/counts.service.js');
const { RadarsService } = require('../dist/radars/radars.service.js');

function mockExecContext({ handlerMeta = {}, classMeta = {}, req = {} }) {
  const handler = () => {};
  class MockCtrl {}
  for (const [k, v] of Object.entries(handlerMeta)) Reflect.defineMetadata(k, v, handler);
  for (const [k, v] of Object.entries(classMeta)) Reflect.defineMetadata(k, v, MockCtrl);
  return {
    getHandler: () => handler,
    getClass: () => MockCtrl,
    switchToHttp: () => ({ getRequest: () => req }),
  };
}

describe('TenantGuard & Branch Access', () => {
  const reflector = new Reflector();
  const guard = new TenantGuard(reflector);

  it('allows @Public() routes without user', () => {
    const ctx = mockExecContext({ handlerMeta: { isPublic: true }, req: {} });
    assert.equal(guard.canActivate(ctx), true);
  });

  it('allows radar :id routes for normal admin without confusing radarId with companyId', () => {
    const ctx = mockExecContext({
      req: {
        user: { email: 'a@b.com', companyId: 'comp-1', role: 'admin' },
        params: { id: 'radar-999' },
        query: {},
        body: {},
      },
    });
    assert.equal(guard.canActivate(ctx), true);
  });

  it('blocks mismatched :id when @TenantIdParam("id") is set on controller', () => {
    const ctx = mockExecContext({
      classMeta: { [TENANT_ID_PARAM_KEY]: 'id' },
      req: {
        user: { email: 'a@b.com', companyId: 'comp-1', role: 'admin' },
        params: { id: 'comp-2' },
        query: {},
        body: {},
      },
    });
    assert.throws(() => guard.canActivate(ctx), /No autorizado para acceder a esta empresa/);
  });

  it('allows super_admin across any tenant', () => {
    const ctx = mockExecContext({
      classMeta: { [TENANT_ID_PARAM_KEY]: 'id' },
      req: {
        user: { email: 'sa@horus.co', companyId: 'comp-1', role: 'super_admin' },
        params: { id: 'comp-2' },
        query: {},
        body: {},
      },
    });
    assert.equal(guard.canActivate(ctx), true);
  });

  it('enforces branchIndexes for manager/viewer', () => {
    assert.doesNotThrow(() => assertBranchAccess({ role: 'admin', branchIndexes: [0] }, 2));
    assert.doesNotThrow(() => assertBranchAccess({ role: 'manager', branchIndexes: [0, 1] }, 1));
    assert.throws(() => assertBranchAccess({ role: 'manager', branchIndexes: [0] }, 2), /sede 2/);
  });
});

describe('CountsService', () => {
  it('enforces 60 req/min rate limit per device and invalidates cache on ingest', async () => {
    let savedDoc = null;
    const deletedKeys = [];
    let rlCount = 0;

    function MockCountModel(doc) {
      this.doc = doc;
      this.save = async () => { savedDoc = doc; return doc; };
    }
    MockCountModel.findOne = async () => null;

    const fakeRedis = {
      incr: async () => ++rlCount,
      expire: async () => 1,
      del: async (...keys) => { deletedKeys.push(...keys); return keys.length; },
    };

    const fakeRadars = {
      validateDevice: async () => ({
        _id: '507f1f77bcf86cd799439011',
        companyId: '507f1f77bcf86cd799439012',
        branchIndex: 0,
      }),
    };

    const fakeAlerts = {
      evaluateOccupancy: async () => {},
    };

    const svc = new CountsService(MockCountModel, fakeRadars, fakeAlerts, fakeRedis);
    const res = await svc.ingest({
      uid_hardware: 'ESP32-TEST-1',
      timestamp_utc: '2026-11-18T12:00:00.000Z',
      count_in: 3,
      count_out: 1,
    });
    assert.deepEqual(res, { ok: true });
    assert.equal(savedDoc.count_in, 3);
    assert.ok(deletedKeys.includes('tenant:507f1f77bcf86cd799439012:cache:kpis:all'));

    // Trigger rate limit (> 60)
    rlCount = 60;
    await assert.rejects(
      () => svc.ingest({
        uid_hardware: 'ESP32-TEST-1',
        timestamp_utc: '2026-11-18T12:01:00.000Z',
        count_in: 1,
        count_out: 0,
      }),
      /Demasiadas peticiones/,
    );
  });

  it('exports aggregated series as CSV', async () => {
    const MockCountModel = {
      aggregate: async () => [
        { _id: { year: 2026, month: 11, day: 18 }, total_in: 42, total_out: 30, events: 5 },
      ],
    };
    const svc = new CountsService(MockCountModel, {}, {}, {});
    const csv = await svc.exportCsv({
      companyId: '507f1f77bcf86cd799439012',
      from: '2026-11-01',
      to: '2026-11-18',
      granularity: 'day',
    });
    assert.match(csv, /^periodo,granularity,total_in,total_out,events\n2026-11-18,day,42,30,5$/);
  });
});

describe('RadarsService device key validation', () => {
  it('validates matching bearer device_key and rejects invalid key', async () => {
    const rawKey = 'horus_dev_testkey123';
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const mockRadarModel = {
      findOne: () => ({
        select: () => ({
          exec: async () => ({ _id: 'r1', uid_hardware: 'ESP-1', device_key_hash: hash }),
        }),
      }),
    };

    const svc = new RadarsService(mockRadarModel, {}, {}, {});
    const ok = await svc.validateDevice('ESP-1', rawKey);
    assert.equal(ok.uid_hardware, 'ESP-1');

    await assert.rejects(
      () => svc.validateDevice('ESP-1', 'wrong-key'),
      /Device API key inválida/,
    );
  });
});
