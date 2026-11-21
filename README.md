# Horus API

API para conteo de personas en locales comerciales. Multitenant, con cámaras/ESP32 y YOLO, usando MongoDB para datos y Redis para OTP/sesiones.

## Características principales

- Autenticación OTP por correo electrónico
- Refresh token y logout con invalidación en Redis
- Multitenant: empresas, sedes y usuarios por tenant
- Gestión de cámaras/ESP32
- Heartbeat desde el ESP32 para estado de dispositivo
- Ingestión de eventos de conteo `in`/`out`
- Consultas de métricas para dashboard:
  - series temporales
  - KPIs diarios/mensuales/anuales
  - comparativas de periodo actual vs anterior
  - ranking por sede
- Swagger / OpenAPI disponible en `/api/docs`

## Tecnologías usadas

- NestJS
- TypeScript
- MongoDB / Mongoose
- Redis / ioredis
- JWT
- Swagger

## Ejecución

1. Instala dependencias:

```bash
npm install
```

2. Arranca en modo desarrollo:

```bash
npm run start:dev
```

3. Arranca en producción:

```bash
npm run build
npm run start
```

## Endpoints principales

Todos los endpoints usan el prefijo global `/api/v1`.

### Autenticación

- `POST /api/v1/auth/otp/request`
  - Solicita un código OTP por email
  - Body: `{ "email": "user@example.com" }`

- `POST /api/v1/auth/otp/verify`
  - Verifica el código OTP y devuelve `access_token` + `refresh_token`
  - Body: `{ "email": "user@example.com", "code": "123456" }`

- `POST /api/v1/auth/refresh`
  - Renueva el `access_token`
  - Body: `{ "refresh_token": "..." }`

- `POST /api/v1/auth/logout`
  - Invalida el refresh token del usuario en Redis
  - Body: `{ "email": "user@example.com" }`

### Empresas / Tenants

- `GET /api/v1/companies`
  - Listar empresas con paginación

- `GET /api/v1/companies/:id`
  - Obtener una empresa por ID

- `POST /api/v1/companies`
  - Crear nueva empresa

- `PATCH /api/v1/companies/:id`
  - Actualizar empresa

- `DELETE /api/v1/companies/:id`
  - Eliminar empresa (soft delete)

### Sedes

- `GET /api/v1/companies/:id/branches`
  - Listar sedes de una empresa

- `POST /api/v1/companies/:id/branches`
  - Añadir sede a una empresa

- `PATCH /api/v1/companies/:id/branches/:branchIndex`
  - Actualizar sede

- `DELETE /api/v1/companies/:id/branches/:branchIndex`
  - Desactivar sede

### Usuarios de empresa

- `POST /api/v1/companies/:id/users`
  - Invitar usuario a la empresa

- `PATCH /api/v1/companies/:id/users/:email`
  - Actualizar rol o acceso del usuario

- `DELETE /api/v1/companies/:id/users/:email`
  - Desactivar usuario

### Cámaras / ESP32

- `POST /api/v1/cameras`
  - Registrar nueva cámara con `uid_hardware`

- `GET /api/v1/cameras?companyId=...`
  - Listar cámaras de una empresa

- `GET /api/v1/cameras/branch?companyId=...&branchIndex=...`
  - Listar cámaras de una sede específica

- `GET /api/v1/cameras/status-summary?companyId=...`
  - Resumen de estado de cámaras (activas / inactivas / error)

- `GET /api/v1/cameras/:id`
  - Obtener cámara por ID

- `PATCH /api/v1/cameras/:id`
  - Actualizar cámara

- `DELETE /api/v1/cameras/:id?companyId=...`
  - Desactivar cámara

- `POST /api/v1/cameras/heartbeat`
  - Heartbeat periódico enviado por el ESP32
  - Body: `{ "uid_hardware": "...", "ip_local": "...", "firmware_version": "..." }`

### Conteos

- `POST /api/v1/counts/ingest`
  - Endpoint público para que el ESP32 reporte eventos de conteo
  - Body: `{ "uid_hardware": "...", "timestamp_utc": "...", "count_in": 3, "count_out": 1 }`

- `GET /api/v1/counts/query`
  - Consulta principal del dashboard
  - Query params: `companyId`, `from`, `to`, `granularity`, `branchIndex?`, `cameraId?`

- `GET /api/v1/counts/kpis`
  - Devuelve KPIs rápidos: visitantes hoy, mes, año, hora pico

- `GET /api/v1/counts/compare`
  - Comparativa período actual vs anterior

- `GET /api/v1/counts/by-branch`
  - Comparativa entre sedes en un rango de fechas

## Variables de entorno

- `PORT` - puerto de la API (por defecto `3001`)
- `ALLOWED_ORIGINS` - orígenes permitidos en CORS (coma-separados)
- `MONGODB_URI` - URI de conexión MongoDB
- `REDIS_URL` - URL completa de Redis
- `REDIS_HOST` - host de Redis (por defecto `172.22.4.134`)
- `REDIS_PORT` - puerto de Redis (por defecto `6379`)
- `JWT_SECRET` - secreto JWT para firmar tokens

## Documentación

- Swagger UI: `/api/docs`

## Observaciones

- El API usa `JWT` globalmente salvo rutas de OTP/ingest/heartbeat
- `ts-node-dev` se usa para el modo `npm run start:dev`
- La aplicación expone todos los endpoints bajo `/api/v1`
