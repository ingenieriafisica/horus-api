# Datos de Seed para PeopleCount API

Esta carpeta contiene archivos JSON de ejemplo para llenar la base de datos con datos iniciales.

## Archivos disponibles

### `companies.json`
Contiene datos de **empresas** para crear con `CreateCompanyDto`:
- Nombre, NIT, nombre de base de datos
- Plan (starter, pro, enterprise)
- Email de contacto y URL del logo

**Ejemplo de uso:**
```json
{
  "nombre": "TechCorp Colombia",
  "nit": "900.123.456-7",
  "dbName": "techcorp_db",
  "plan": "enterprise",
  "contacto_email": "admin@techcorp.com",
  "logo_url": "https://techcorp.com/logo.png"
}
```

### `branches.json`
Contiene datos de **sucursales** para crear con `CreateBranchDto`:
- Nombre, ciudad, dirección
- Timezone

**Ejemplo de uso:**
```json
{
  "nombre": "Oficina Central Bogotá",
  "ciudad": "Bogotá",
  "direccion": "Calle 72 No 10-50",
  "timezone": "America/Bogota"
}
```

### `cameras.json`
Contiene datos de **cámaras** para crear con `CreateCameraDto`:
- UID del hardware (ESP32)
- Company ID y branch index
- Ubicación, IP local, versión de firmware

**Ejemplo de uso:**
```json
{
  "uid_hardware": "ESP32-CAM-001",
  "companyId": "techcorp_id",
  "branchIndex": 0,
  "ubicacion_cam": "Entrada Principal - Piso 1",
  "ip_local": "192.168.1.100",
  "firmware_version": "2.1.5"
}
```

### `users.json`
Contiene datos de **usuarios** para crear con `AddUserDto`:
- Email, rol (admin, manager, viewer)
- Índices de sucursales asignadas

**Ejemplo de uso:**
```json
{
  "email": "juan.admin@techcorp.com",
  "role": "admin",
  "branchIndexes": [0, 1]
}
```

### `counts.json`
Contiene datos de **conteos** desde ESP32 con `IngestCountDto`:
- UID del hardware
- Timestamp en ISO 8601
- Conteo de entrada y salida

**Ejemplo de uso:**
```json
{
  "uid_hardware": "ESP32-CAM-001",
  "timestamp_utc": "2026-05-08T08:30:00Z",
  "count_in": 15,
  "count_out": 3
}
```

### `auth.json`
Contiene datos para testing de autenticación:
- **heartbeats**: Payloads de heartbeat desde ESP32 (`HeartbeatDto`)
- **auth_requests**: Solicitudes de OTP (`RequestOtpDto`)
- **auth_verifications**: Verificaciones de OTP (`VerifyOtpDto`)

## Uso en scripts seed

Puedes usar estos archivos en un script de seed para llenar la base de datos:

```typescript
import * as fs from 'fs';

const companies = JSON.parse(fs.readFileSync('./seed-data/companies.json', 'utf-8'));
const branches = JSON.parse(fs.readFileSync('./seed-data/branches.json', 'utf-8'));
const cameras = JSON.parse(fs.readFileSync('./seed-data/cameras.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('./seed-data/users.json', 'utf-8'));
const counts = JSON.parse(fs.readFileSync('./seed-data/counts.json', 'utf-8'));

// Luego insertar en MongoDB/tu BD
```

## Notas

- Los datos son de ejemplo y están diseñados para un ambiente de desarrollo
- Todos los datos tienen relaciones coherentes (las sucursales pertenecen a empresas, etc.)
- Los timestamps de conteos están en UTC con formato ISO 8601
- Los UIDs de hardware corresponden entre cámaras y conteos
