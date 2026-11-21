import * as fs from 'fs';
import * as path from 'path';
import mongoose, { Connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface CompanyData {
  nombre: string;
  nit: string;
  dbName: string;
  plan?: 'starter' | 'pro' | 'enterprise';
  contacto_email?: string;
  logo_url?: string;
}

interface BranchData {
  nombre: string;
  ciudad: string;
  direccion: string;
  timezone?: string;
}

interface RadarData {
  uid_hardware: string;
  companyIndex: number;
  branchIndex: number;
  nombre: string;
  ip_local: string;
  local_api_port?: number;
  firmware_version?: string;
}

interface UserData {
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'viewer';
  branchIndexes?: number[];
}

// ─── Generador de tráfico realista ───────────────────────────────────────────

/**
 * Factor de tráfico por hora del día (0-23).
 * Simula apertura 7am, pico mañana 10-12, pico tarde 17-19, cierre 21.
 */
function hourlyFactor(hour: number): number {
  const curve: Record<number, number> = {
    7: 0.3, 8: 0.6, 9: 0.85, 10: 1.0, 11: 1.1, 12: 1.2,
    13: 1.1, 14: 0.9, 15: 0.85, 16: 0.9, 17: 1.15, 18: 1.2,
    19: 1.0, 20: 0.7, 21: 0.4,
  };
  return curve[hour] ?? 0;
}

/**
 * Genera eventos de conteo hora a hora para un día y un radar.
 * baseIn: visitantes base por hora en día pico normal.
 */
function generateDayEvents(
  date: Date,
  uid_hardware: string,
  baseIn: number,
  lastHour?: number,  // limitar hasta esta hora (para el día actual)
): Array<{ timestamp: Date; count_in: number; count_out: number }> {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const dayMult   = isWeekend ? 0.38 : 1.0;

  const events: Array<{ timestamp: Date; count_in: number; count_out: number }> = [];

  const openHour  = 7;
  const closeHour = lastHour ?? 21;

  for (let h = openHour; h <= closeHour; h++) {
    const factor = hourlyFactor(h);
    if (factor === 0) continue;

    // Pequeña variación aleatoria determinista basada en fecha+hora+hardware
    const seed   = (date.getDate() * 31 + date.getMonth() * 7 + h * 13 + uid_hardware.charCodeAt(uid_hardware.length - 1)) % 100;
    const jitter = 0.8 + (seed / 100) * 0.4;   // 0.80–1.20

    const count_in  = Math.max(1, Math.round(baseIn * factor * dayMult * jitter));
    const count_out = Math.max(0, Math.round(count_in * (0.65 + (seed % 40) / 100)));  // 65–105% de in

    const minute = (seed * 7) % 59;
    events.push({
      timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, minute, 0),
      count_in,
      count_out,
    });
  }

  return events;
}

/**
 * Genera eventos para un rango de fechas (desde startDate hasta endDate inclusive).
 * Para el último día solo llega hasta lastHourToday.
 */
function generateRangeEvents(
  startDate: Date,
  endDate: Date,
  uid_hardware: string,
  baseInPerHour: number,
): Array<{ timestamp: Date; count_in: number; count_out: number }> {
  const all: Array<{ timestamp: Date; count_in: number; count_out: number }> = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const isToday =
      cursor.getFullYear() === endDate.getFullYear() &&
      cursor.getMonth()    === endDate.getMonth()    &&
      cursor.getDate()     === endDate.getDate();

    const lastHour = isToday ? endDate.getHours() : undefined;
    all.push(...generateDayEvents(new Date(cursor), uid_hardware, baseInPerHour, lastHour));
    cursor.setDate(cursor.getDate() + 1);
  }

  return all;
}

// ─── Función principal ────────────────────────────────────────────────────────

async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplecount';
  let connection!: Connection;

  try {
    console.log('🔌 Conectando a MongoDB...');
    connection = await mongoose.createConnection(mongoUri).asPromise();
    console.log('✅ Conexión exitosa');

    const companyCollection = connection.collection('companies');
    const radarCollection   = connection.collection('radars');
    const countCollection   = connection.collection('counts');

    console.log('🧹 Limpiando colecciones...');
    await Promise.all([
      companyCollection.deleteMany({}),
      radarCollection.deleteMany({}),
      countCollection.deleteMany({}),
    ]);

    const DATA = path.join(__dirname, 'common/dto/seed-data');

    // ── 1. Empresas ──────────────────────────────────────────────────────────

    console.log('\n📦 1. Insertando empresas...');

    const companiesRaw = JSON.parse(fs.readFileSync(`${DATA}/companies.json`, 'utf-8')) as CompanyData[];
    const branchesRaw  = JSON.parse(fs.readFileSync(`${DATA}/branches.json`,  'utf-8')) as BranchData[];
    const usersRaw     = JSON.parse(fs.readFileSync(`${DATA}/users.json`,     'utf-8')) as UserData[];

    // Distribución de sedes: empresa 0 → sedes 0,1 | empresa 1 → sede 2 | empresa 2 → sede 3
    const sedeRanges: [number, number][] = [[0, 2], [2, 3], [3, 4]];
    // Distribución de usuarios: empresa 0 → users 0-4 (incluye super_admin) | empresa 1 → users 5-6 | empresa 2 → user 7
    const userRanges: [number, number][] = [[0, 5], [5, 7], [7, 8]];

    const companies = companiesRaw.map((c, i) => ({
      ...c,
      status: 'active',
      sedes: branchesRaw.slice(...sedeRanges[i]).map(s => ({ ...s, active: true, radars: [] })),
      users: usersRaw.slice(...userRanges[i]).map(u => ({ ...u, active: true })),
    }));

    const { insertedIds: companyIds } = await companyCollection.insertMany(companies);
    console.log(`✅ ${Object.keys(companyIds).length} empresas`);

    // ── 2. Radares ───────────────────────────────────────────────────────────

    console.log('\n📡 2. Insertando radares...');

    const radarsRaw = JSON.parse(fs.readFileSync(`${DATA}/radars.json`, 'utf-8')) as RadarData[];

    const radarsToInsert = radarsRaw.map(r => ({
      uid_hardware:    r.uid_hardware,
      companyId:       companyIds[r.companyIndex],
      branchIndex:     r.branchIndex,
      nombre:          r.nombre,
      ip_local:        r.ip_local,
      local_api_port:  r.local_api_port ?? 80,
      firmware_version: r.firmware_version,
      status:          'active',
      last_seen:       new Date(),
    }));

    const { insertedIds: radarIds } = await radarCollection.insertMany(radarsToInsert);
    console.log(`✅ ${Object.keys(radarIds).length} radares`);
    radarsRaw.forEach((r, i) => console.log(`   • ${r.uid_hardware} → ID ${radarIds[i]}`));

    // ── 3. Conteos generados programáticamente ────────────────────────────────

    console.log('\n📊 3. Generando conteos (6 meses de tráfico realista)...');

    // Generar desde el 1 de enero hasta AHORA (incluye el día de hoy)
    const now       = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0); // 1 Ene del año actual
    const endDate   = now;

    // Tráfico base por hora para cada radar (visitantes/hora en día pico)
    const baseTrafficMap: Record<string, number> = {
      'ESP32-CAM-001': 45,   // Entrada principal — alto tráfico
      'ESP32-CAM-002': 20,   // Salida emergencia — bajo tráfico
      'ESP32-CAM-003': 38,   // Sucursal Medellín
      'ESP32-CAM-004': 52,   // Tienda Cali — alto tráfico
      'ESP32-CAM-005': 30,   // Zona cajas
    };

    let totalCounts = 0;

    for (let i = 0; i < radarsRaw.length; i++) {
      const radar       = radarsRaw[i];
      const radarId     = radarIds[i];
      const companyId   = companyIds[radar.companyIndex];
      const baseIn      = baseTrafficMap[radar.uid_hardware] ?? 30;

      const events = generateRangeEvents(startDate, endDate, radar.uid_hardware, baseIn);

      const docs = events.map(e => ({
        timestamp: e.timestamp,
        count_in:  e.count_in,
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

    // ── 4. Índices ────────────────────────────────────────────────────────────

    // Índices alineados con count.schema.ts: un eje de discriminación cada uno
    // (empresa / sede / dispositivo), todos con companyId como prefijo.
    console.log('\n🗂️  4. Creando índices...');
    await countCollection.createIndex({ 'meta.companyId': 1, timestamp: 1 });                          // por empresa
    await countCollection.createIndex({ 'meta.companyId': 1, 'meta.branchIndex': 1, timestamp: 1 });   // por sede
    await countCollection.createIndex({ 'meta.companyId': 1, 'meta.radarId': 1, timestamp: 1 });       // por dispositivo
    await radarCollection.createIndex({ companyId: 1, uid_hardware: 1 }, { unique: true });
    await radarCollection.createIndex({ companyId: 1, branchIndex: 1 });
    console.log('✅ Índices creados');

    // ── Resumen ───────────────────────────────────────────────────────────────

    console.log('\n' + '═'.repeat(60));
    console.log('✨  SEED COMPLETADO');
    console.log(`    Empresas : ${Object.keys(companyIds).length}`);
    console.log(`    Radares  : ${Object.keys(radarIds).length}`);
    console.log(`    Conteos  : ${totalCounts.toLocaleString()}`);
    console.log('═'.repeat(60));

  } catch (err) {
    console.error('\n❌ Error:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔌 Conexión cerrada');
    }
  }
}

seed();
