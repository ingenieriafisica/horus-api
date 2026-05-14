"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const mongoose_1 = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, '../.env') });
async function seed() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplecount';
    let connection;
    try {
        console.log('🔌 Conectando a MongoDB...');
        connection = await mongoose_1.default.createConnection(mongoUri).asPromise();
        console.log('✅ Conexión a MongoDB exitosa');
        const companyCollection = connection.collection('companies');
        const cameraCollection = connection.collection('cameras');
        const countCollection = connection.collection('counts');
        console.log('🧹 Limpiando colecciones existentes...');
        await companyCollection.deleteMany({});
        await cameraCollection.deleteMany({});
        await countCollection.deleteMany({});
        console.log('\n📦 1. Insertando empresas...');
        const companiesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'common/dto/seed-data/companies.json'), 'utf-8'));
        const branchesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'common/dto/seed-data/branches.json'), 'utf-8'));
        const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'common/dto/seed-data/users.json'), 'utf-8'));
        const companiesWithEmbedded = companiesData.map((company, idx) => ({
            ...company,
            status: 'active',
            sedes: idx === 0 ? branchesData.slice(0, 2) : idx === 1 ? branchesData.slice(2, 3) : [],
            users: usersData.filter((_, uIdx) => {
                if (idx === 0)
                    return uIdx < 3;
                if (idx === 1)
                    return uIdx >= 3 && uIdx < 5;
                return uIdx >= 5;
            }).map(u => ({ ...u, active: true })),
        }));
        const companiesResult = await companyCollection.insertMany(companiesWithEmbedded);
        const companyIdMap = new Map(companiesData.map((c, idx) => [c.nit, companiesResult.insertedIds[idx]]));
        console.log(`✅ ${companiesResult.insertedCount} empresas insertadas`);
        companiesData.forEach((c, idx) => {
            console.log(`   • ${c.nombre} (NIT: ${c.nit}) - ID: ${companiesResult.insertedIds[idx]}`);
        });
        console.log('\n📷 2. Insertando cámaras...');
        const camerasData = JSON.parse(fs.readFileSync(path.join(__dirname, 'common/dto/seed-data/cameras.json'), 'utf-8'));
        const camerasWithObjectIds = camerasData.map(camera => {
            const companyId = camera.companyId;
            const mappedId = Array.from(companyIdMap.values())[camera.companyId === 'techcorp_id'
                ? 0
                : camera.companyId === 'retailplus_id'
                    ? 1
                    : 2];
            return {
                ...camera,
                companyId: mappedId,
                status: 'active',
            };
        });
        const camerasResult = await cameraCollection.insertMany(camerasWithObjectIds);
        const cameraIdMap = new Map(camerasData.map((c, idx) => [
            c.uid_hardware,
            camerasResult.insertedIds[idx],
        ]));
        console.log(`✅ ${camerasResult.insertedCount} cámaras insertadas`);
        camerasData.forEach((c, idx) => {
            console.log(`   • ${c.uid_hardware} (${c.ubicacion_cam}) - ID: ${camerasResult.insertedIds[idx]}`);
        });
        console.log('\n📊 3. Insertando conteos...');
        const countsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'common/dto/seed-data/counts.json'), 'utf-8'));
        const countsWithObjectIds = countsData.map(count => {
            const cameraId = cameraIdMap.get(count.uid_hardware);
            const cameraDoc = camerasWithObjectIds.find(c => c.uid_hardware === count.uid_hardware);
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
            console.log(`   • ${c.uid_hardware} @ ${c.timestamp_utc} (${c.count_in} entrada / ${c.count_out} salida)`);
        });
        console.log('\n' + '─'.repeat(70));
        console.log('✨ SEED COMPLETADO EXITOSAMENTE ✨');
        console.log('─'.repeat(70));
        console.log(`📊 Estadísticas:
   • Empresas: ${companiesResult.insertedCount}
   • Cámaras: ${camerasResult.insertedCount}
   • Conteos: ${countsResult.insertedCount}
  
📁 Base de datos: peoplecount (MongoDB Atlas)`);
    }
    catch (error) {
        console.error('❌ Error durante el seed:', error);
        process.exit(1);
    }
    finally {
        if (connection) {
            await connection.close();
            console.log('\n🔌 Conexión a MongoDB cerrada');
        }
    }
}
seed();
//# sourceMappingURL=seed.js.map