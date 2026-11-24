"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCorsOrigin = resolveCorsOrigin;
const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:4200',
];
function resolveCorsOrigin(rawOrigins) {
    const list = (rawOrigins ?? '')
        .split(',')
        .map((entry) => entry.trim().replace(/\/+$/, ''))
        .filter(Boolean);
    if (list.length === 0) {
        return DEFAULT_ALLOWED_ORIGINS;
    }
    if (list.includes('*') || list.includes('0.0.0.0')) {
        return true;
    }
    return list;
}
//# sourceMappingURL=cors.js.map