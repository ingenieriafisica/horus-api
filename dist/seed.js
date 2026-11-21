"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: path.join(__dirname, '../.env') });
function hourlyFactor(hour) {
    const curve = {
        7: 0.3, 8: 0.6, 9: 0.85, 10: 1.0, 11: 1.1, 12: 1.2,
        13: 1.1, 14: 0.9, 15: 0.85, 16: 0.9, 17: 1.15, 18: 1.2,
        19: 1.0, 20: 0.7, 21: 0.4,
    };
    return curve[hour] ?? 0;
}
function generateDayEvents(date, uid_hardware, baseIn, lastHour) {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const dayMult = isWeekend ? 0.38 : 1.0;
    const events = [];
    const openHour = 7;
    const closeHour = lastHour ?? 21;
    for (let h = openHour; h <= closeHour; h++) {
        const factor = hourlyFactor(h);
        if (factor === 0)
            continue;
        const seed = (date.getDate() * 31 + date.getMonth() * 7 + h * 13 + uid_hardware.charCodeAt(uid_hardware.length - 1)) % 100;
        const jitter = 0.8 + (seed / 100) * 0.4;
        const count_in = Math.max(1, Math.round(baseIn * factor * dayMult * jitter));
        const count_out = Math.max(0, Math.round(count_in * (0.65 + (seed % 40) / 100)));
        const minute = (seed * 7) % 59;
        events.push({
            timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, minute, 0),
            count_in,
            count_out,
        });
    }
    return events;
}
function generateRangeEvents(startDate, endDate, uid_hardware, baseInPerHour) {
    const all = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
        const isToday = cursor.getFullYear() === endDate.getFullYear() &&
            cursor.getMonth() === endDate.getMonth() &&
            cursor.getDate() === endDate.getDate();
        const lastHour = isToday ? endDate.getHours() : undefined;
        all.push(...generateDayEvents(new Date(cursor), uid_hardware, baseInPerHour, lastHour));
        cursor.setDate(cursor.getDate() + 1);
    }
    return all;
}
async function seed() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplecount';
    let connection;
    try {
        console.log('🔌 Conectando a MongoDB...');
        connection = await mongoose_1.default.createConnection(mongoUri).asPromise();
        console.log('✅ Conexión exitosa');
        const companyCollection = connection.collection('companies');
        const radarCollection = connection.collection('radars');
        const countCollection = connection.collection('counts');
        console.log('🧹 Limpiando colecciones...');
        await Promise.all([
            companyCollection.deleteMany({}),
            radarCollection.deleteMany({}),
            countCollection.deleteMany({}),
        ]);
        const DATA = path.join(__dirname, 'common/dto/seed-data');
        console.log('\n📦 1. Insertando empresas...');
        const companiesRaw = JSON.parse(fs.readFileSync(`${DATA}/companies.json`, 'utf-8'));
        const branchesRaw = JSON.parse(fs.readFileSync(`${DATA}/branches.json`, 'utf-8'));
        const usersRaw = JSON.parse(fs.readFileSync(`${DATA}/users.json`, 'utf-8'));
        const sedeRanges = [[0, 2], [2, 3], [3, 4]];
        const userRanges = [[0, 5], [5, 7], [7, 8]];
        const companies = companiesRaw.map((c, i) => ({
            ...c,
            status: 'active',
            sedes: branchesRaw.slice(...sedeRanges[i]).map(s => ({ ...s, active: true, radars: [] })),
            users: usersRaw.slice(...userRanges[i]).map(u => ({ ...u, active: true })),
        }));
        const { insertedIds: companyIds } = await companyCollection.insertMany(companies);
        console.log(`✅ ${Object.keys(companyIds).length} empresas`);
        console.log('\n📡 2. Insertando radares...');
        const radarsRaw = JSON.parse(fs.readFileSync(`${DATA}/radars.json`, 'utf-8'));
        const radarsToInsert = radarsRaw.map(r => ({
            uid_hardware: r.uid_hardware,
            companyId: companyIds[r.companyIndex],
            branchIndex: r.branchIndex,
            nombre: r.nombre,
            ip_local: r.ip_local,
            local_api_port: r.local_api_port ?? 80,
            firmware_version: r.firmware_version,
            status: 'active',
            last_seen: new Date(),
        }));
        const { insertedIds: radarIds } = await radarCollection.insertMany(radarsToInsert);
        console.log(`✅ ${Object.keys(radarIds).length} radares`);
        radarsRaw.forEach((r, i) => console.log(`   • ${r.uid_hardware} → ID ${radarIds[i]}`));
        console.log('\n📊 3. Generando conteos (6 meses de tráfico realista)...');
        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        const endDate = now;
        const baseTrafficMap = {
            'ESP32-CAM-001': 45,
            'ESP32-CAM-002': 20,
            'ESP32-CAM-003': 38,
            'ESP32-CAM-004': 52,
            'ESP32-CAM-005': 30,
        };
        let totalCounts = 0;
        for (let i = 0; i < radarsRaw.length; i++) {
            const radar = radarsRaw[i];
            const radarId = radarIds[i];
            const companyId = companyIds[radar.companyIndex];
            const baseIn = baseTrafficMap[radar.uid_hardware] ?? 30;
            const events = generateRangeEvents(startDate, endDate, radar.uid_hardware, baseIn);
            const docs = events.map(e => ({
                timestamp: e.timestamp,
                count_in: e.count_in,
                count_out: e.count_out,
                meta: {
                    radarId,
                    companyId,
                    branchIndex: radar.branchIndex,
                },
            }));
            await countCollection.insertMany(docs);
            totalCounts += docs.length;
            const totalIn = docs.reduce((s, d) => s + d.count_in, 0);
            console.log(`   • ${radar.uid_hardware}: ${docs.length} eventos — ${totalIn.toLocaleString()} visitantes en 6 meses`);
        }
        console.log('\n🗂️  4. Creando índices...');
        await countCollection.createIndex({ 'meta.companyId': 1, timestamp: 1 });
        await countCollection.createIndex({ 'meta.companyId': 1, 'meta.branchIndex': 1, timestamp: 1 });
        await countCollection.createIndex({ 'meta.companyId': 1, 'meta.radarId': 1, timestamp: 1 });
        await radarCollection.createIndex({ companyId: 1, uid_hardware: 1 }, { unique: true });
        await radarCollection.createIndex({ companyId: 1, branchIndex: 1 });
        console.log('✅ Índices creados');
        console.log('\n' + '═'.repeat(60));
        console.log('✨  SEED COMPLETADO');
        console.log(`    Empresas : ${Object.keys(companyIds).length}`);
        console.log(`    Radares  : ${Object.keys(radarIds).length}`);
        console.log(`    Conteos  : ${totalCounts.toLocaleString()}`);
        console.log('═'.repeat(60));
    }
    catch (err) {
        console.error('\n❌ Error:', err);
        process.exit(1);
    }
    finally {
        if (connection) {
            await connection.close();
            console.log('🔌 Conexión cerrada');
        }
    }
}
seed();
//# sourceMappingURL=seed.js.map