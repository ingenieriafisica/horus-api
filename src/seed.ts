import * as fs from 'fs';
import * as path from 'path';
import mongoose, { Connection, Types } from 'mongoose';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config({ path: path.join(__dirname, '../.env') });

// ─────────────────────────────────────────────────────────────────────────────
// Script de Seed para PeopleCount API
// ─────────────────────────────────────────────────────────────────────────────

// Interfaces para parsear los JSON
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

interface CameraData {
  uid_hardware: string;
  companyId?: string; // será reemplazado por ObjectId
  branchIndex: number;
  ubicacion_cam: string;
  ip_local: string;
  firmware_version?: string;
}

interface UserData {
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  branchIndexes?: number[];
}

interface CountData {
  uid_hardware: string;
  timestamp_utc: string;
  count_in: number;
  count_out: number;
}

interface CameraRecord {
  _id: Types.ObjectId;
  uid_hardware: string;
}

// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplecount';
  let connection: Connection;

  try {
    console.log('🔌 Conectando a MongoDB...');
    connection = await mongoose.createConnection(mongoUri).asPromise();
    console.log('✅ Conexión a MongoDB exitosa');

    // Obtener las colecciones
    const companyCollection = connection.collection('companies');
    const cameraCollection = connection.collection('cameras');
    const countCollection = connection.collection('counts');

    // Limpiar colecciones (opcional - comentar si no se desea)
    console.log('🧹 Limpiando colecciones existentes...');
    await companyCollection.deleteMany({});
    await cameraCollection.deleteMany({});
    await countCollection.deleteMany({});

    // ─── 1. Insertar Companies ───────────────────────────────────────────────
    console.log('\n📦 1. Insertando empresas...');
    const companiesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'common/dto/seed-data/companies.json'), 'utf-8')
    ) as CompanyData[];

    const branchesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'common/dto/seed-data/branches.json'), 'utf-8')
    ) as BranchData[];

    const usersData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'common/dto/seed-data/users.json'), 'utf-8')
    ) as UserData[];

    const companiesWithEmbedded = companiesData.map((company, idx) => ({
      ...company,
      status: 'active',
      sedes: idx === 0 ? branchesData.slice(0, 2) : idx === 1 ? branchesData.slice(2, 3) : [],
      users: usersData.filter((_, uIdx) => {
        if (idx === 0) return uIdx < 3;
        if (idx === 1) return uIdx >= 3 && uIdx < 5;
        return uIdx >= 5;
      }).map(u => ({ ...u, active: true })),
    }));

    const companiesResult = await companyCollection.insertMany(companiesWithEmbedded);
    const companyIdMap = new Map(
      companiesData.map((c, idx) => [c.nit, companiesResult.insertedIds[idx]])
    );

    console.log(`✅ ${companiesResult.insertedCount} empresas insertadas`);
    companiesData.forEach((c, idx) => {
      console.log(
        `   • ${c.nombre} (NIT: ${c.nit}) - ID: ${companiesResult.insertedIds[idx]}`
      );
    });

    // ─── 2. Insertar Cameras ─────────────────────────────────────────────────
    console.log('\n📷 2. Insertando cámaras...');
    const camerasData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'common/dto/seed-data/cameras.json'), 'utf-8')
    ) as CameraData[];

    // Mapear companyId string a ObjectId
    const camerasWithObjectIds = camerasData.map(camera => {
      // Encontrar el companyId basado en el índice o patrón
      const companyId = camera.companyId;
      const mappedId = Array.from(companyIdMap.values())[
        camera.companyId === 'techcorp_id'
          ? 0
          : camera.companyId === 'retailplus_id'
            ? 1
            : 2
      ];

      return {
        ...camera,
        companyId: mappedId,
        status: 'active',
      };
    });

    const camerasResult = await cameraCollection.insertMany(camerasWithObjectIds);
    const cameraIdMap = new Map(
      camerasData.map((c, idx) => [
        c.uid_hardware,
        camerasResult.insertedIds[idx],
      ])
    );

    console.log(`✅ ${camerasResult.insertedCount} cámaras insertadas`);
    camerasData.forEach((c, idx) => {
      console.log(
        `   • ${c.uid_hardware} (${c.ubicacion_cam}) - ID: ${camerasResult.insertedIds[idx]}`
      );
    });

    // ─── 3. Insertar Counts ──────────────────────────────────────────────────
    console.log('\n📊 3. Insertando conteos...');
    const countsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'common/dto/seed-data/counts.json'), 'utf-8')
    ) as CountData[];

    const countsWithObjectIds = countsData.map(count => {
      const cameraId = cameraIdMap.get(count.uid_hardware);
      // Obtener companyId basado en la cámara
      const cameraDoc = camerasWithObjectIds.find(
        c => c.uid_hardware === count.uid_hardware
      );

      return {
        timestamp: new Date(count.timestamp_utc),
        count_in: count.count_in,
        count_out: count.count_out,
        meta: {
          cameraId: cameraId,
          companyId: cameraDoc?.companyId,
          branchIndex: cameraDoc?.branchIndex || 0,
        },
      };
    });

    const countsResult = await countCollection.insertMany(countsWithObjectIds);
    console.log(`✅ ${countsResult.insertedCount} registros de conteos insertados`);
    countsData.forEach((c, idx) => {
      console.log(
        `   • ${c.uid_hardware} @ ${c.timestamp_utc} (${c.count_in} entrada / ${c.count_out} salida)`
      );
    });

    // ─── Resumen ─────────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(70));
    console.log('✨ SEED COMPLETADO EXITOSAMENTE ✨');
    console.log('─'.repeat(70));
    console.log(
      `📊 Estadísticas:
   • Empresas: ${companiesResult.insertedCount}
   • Cámaras: ${camerasResult.insertedCount}
   • Conteos: ${countsResult.insertedCount}
  
📁 Base de datos: peoplecount (MongoDB Atlas)`
    );
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n🔌 Conexión a MongoDB cerrada');
    }
  }
}

// Ejecutar seed
seed();
