# Horus API

API REST multitenant para la plataforma **Horus** de analítica y conteo de personas en locales comerciales con sensores/radares **ESP32**. Construida con **NestJS 12** (Express 5), **TypeScript**, **MongoDB** (colecciones estándar y *time-series*) y **Redis**.

---

## Stack Tecnológico

- **Framework:** NestJS `12.6` (`@nestjs/core`, `@nestjs/platform-express`)
- **Lenguaje:** TypeScript `6`
- **Base de datos:** MongoDB + Mongoose `8`
- **Caché / Sesiones / Rate Limit:** Redis + `ioredis`
- **Autenticación:** OTP por correo + JWT (`@nestjs/jwt`, `passport-jwt`)
- **Documentación OpenAPI:** Swagger UI en `/api/docs` (`@nestjs/swagger`)
- **Correo transaccional:** Nodemailer (`MailService`)

---

## Arquitectura y Módulos de la API

Todos los endpoints HTTP utilizan el prefijo global **`/api/v1`**. En `AppModule` se registran la conexión a MongoDB, Redis, el dominio de conteos y los módulos de negocio:

```text
src/
├── app.module.ts          # Módulo raíz: MongoDB, Redis, Counts y módulos de dominio
├── main.ts                # Bootstrap: prefijo /api/v1, CORS, ValidationPipe y Swagger
├── seed.ts                # Script de carga de datos iniciales
├── common/
│   ├── dto/               # DTOs compartidos y datos seed (seed-data/)
│   └── guards/            # TenantGuard, @TenantIdParam y assertBranchAccess
├── auth/                  # AuthModule
├── companies/             # CompaniesModule
├── radars/                # RadarsModule
├── counts/                # Dominio de conteos (CountSchema, CountsService, CountsController)
├── alerts/                # AlertsModule
└── audit/                 # AuditModule (@Global)
```

### 1. `AuthModule` (`src/auth/`)
Gestiona la autenticación sin contraseña (*passwordless*) mediante códigos **OTP** de 6 dígitos enviados por correo electrónico, emisión de tokens **JWT** y registro de los **guards globales** de la aplicación.

- **Componentes principales:** `AuthController`, `AuthService`, `JwtStrategy`, `JwtAuthGuard`, `RolesGuard`, `TokenBlacklistService`, `MailService`.
- **Flujo y seguridad:**
  - Solicitud y verificación de OTP almacenado en Redis (TTL de 10 minutos, máximo 3 intentos fallidos y bloqueo de 15 minutos por tenant/correo).
  - Emisión de `access_token` (HS256, 8 horas) y `refresh_token` (30 días, almacenado en Redis para evitar reutilización).
  - Cierre de sesión (`logout`) invalidando tanto el `access_token` como el `refresh_token` en lista negra (`blacklist:` en Redis).
  - Guards globales registrados en orden (`APP_GUARD`): `JwtAuthGuard` (omite rutas `@Public()`), `RolesGuard` (`@Roles(...)`) y `TenantGuard` (aislamiento multitenant).
- **Endpoints (`/api/v1/auth`):**
  - `POST /auth/otp/request` *(público)* — Envía el código OTP al correo registrado.
  - `POST /auth/otp/verify` *(público)* — Valida el OTP y devuelve `access_token`, `refresh_token` y datos del usuario.
  - `POST /auth/refresh` *(público)* — Renueva el `access_token` usando un `refresh_token` válido.
  - `POST /auth/logout` *(autenticado)* — Invalida la sesión activa en Redis.

### 2. `CompaniesModule` (`src/companies/`)
Administra los **tenants (empresas)**, sus **sedes (`branches`)** embebidas y sus **usuarios** con control por roles (`super_admin`, `admin`, `manager`, `viewer`) y acceso restringido por sedes (`branchIndexes`).

- **Componentes principales:** `CompaniesController`, `CompaniesService`, `CompanySchema`, `BranchSchema`, `CompanyUserSchema`, `PLAN_LIMITS`.
- **Límites por plan:**
  - `starter`: hasta 2 sedes y 4 radares.
  - `pro`: hasta 10 sedes y 25 radares.
  - `enterprise`: sedes y radares ilimitados.
- **Endpoints (`/api/v1/companies`):**
  - `GET /companies` *(super_admin)* — Lista empresas paginadas.
  - `GET /companies/platform-kpis` *(super_admin)* — Métricas globales de la plataforma.
  - `GET /companies/audit-logs` *(super_admin, admin)* — Consulta logs de auditoría.
  - `GET /companies/:id` — Detalle de empresa por ID.
  - `POST /companies` *(super_admin)* — Crea una nueva empresa.
  - `PATCH /companies/:id` *(admin, super_admin)* — Actualiza datos de la empresa.
  - `DELETE /companies/:id` *(super_admin)* — Soft delete de la empresa.
  - `GET /companies/:id/branches` — Lista las sedes de la empresa.
  - `POST /companies/:id/branches` *(admin, super_admin)* — Agrega una sede respetando el límite del plan.
  - `PATCH /companies/:id/branches/:branchIndex` *(admin, super_admin)* — Actualiza una sede.
  - `DELETE /companies/:id/branches/:branchIndex` *(admin, super_admin)* — Desactiva una sede.
  - `POST /companies/:id/users` *(admin, super_admin)* — Invita/asigna un usuario a la empresa.
  - `PATCH /companies/:id/users/:email` *(admin, super_admin)* — Actualiza rol o sedes asignadas.
  - `DELETE /companies/:id/users/:email` *(admin, super_admin)* — Desactiva un usuario.

### 3. `RadarsModule` (`src/radars/`)
Administra los dispositivos físicos **ESP32 + radar** (`uid_hardware`), sus credenciales de dispositivo, su estado operativo (`active`, `inactive`, `error`, `offline`) y la comunicación bidireccional con cada sensor.

- **Componentes principales:** `RadarsController`, `RadarsService`, `RadarSchema`.
- **Capacidades:**
  - Generación de `device_key` única en el registro (almacenada como hash SHA-256 en `device_key_hash`) y soporte de rotación de llave.
  - Recepción de *heartbeats* desde el ESP32 con telemetría (`ip_local`, `firmware_version`, `wifi_rssi`, `heap_free`, `uptime_s`, `detections_total`).
  - Proxy HTTP hacia la API local del ESP32 (`http://<ip_local>:<local_api_port>`) para inspección en vivo.
- **Endpoints (`/api/v1/radars`):**
  - `POST /radars` *(admin, super_admin)* — Registra un radar y devuelve su `device_key` en claro una única vez.
  - `GET /radars` — Lista radares de la empresa (filtrable por sede).
  - `GET /radars/branch` — Lista radares de una sede específica.
  - `GET /radars/status-summary` — Resumen de radares por estado (con caché Redis de 60s).
  - `GET /radars/:id` — Obtiene un radar por ID.
  - `PATCH /radars/:id` *(admin, super_admin)* — Actualiza nombre, sede o parámetros del radar.
  - `POST /radars/:id/rotate-key` *(admin, super_admin)* — Rota la `device_key` del dispositivo.
  - `DELETE /radars/:id` *(admin, super_admin)* — Desactiva un radar.
  - `POST /radars/heartbeat` *(público / `device_key`)* — Actualiza `last_seen` y estado del ESP32.
  - `GET /radars/:id/realtime` — Proxy a telemetría en tiempo real del radar.
  - `GET /radars/:id/stats` — Proxy a estadísticas del dispositivo.
  - `GET /radars/:id/health` — Proxy al estado de salud del dispositivo.

### 4. Dominio de Conteos (`src/counts/`, registrado en `AppModule`)
Gestiona la ingestión de eventos de entrada/salida (`count_in`, `count_out`) en una colección **MongoDB Time-Series** (`CountSchema`, retención de 3 años) y las agregaciones analíticas para el dashboard.

- **Componentes principales:** `CountsController`, `CountsService`, `CountSchema`.
- **Capacidades:**
  - *Rate limiting* por dispositivo en Redis (máximo `60 req/min` por `uid_hardware`).
  - Deduplicación de eventos dentro de una ventana de 5 segundos por radar.
  - Invalidación automática de caché de KPIs en Redis y disparo de evaluación de alertas de ocupación tras cada ingestión.
  - Caché de KPIs (60s) y restricción por sede (`assertBranchAccess`) para roles `manager` y `viewer`.
- **Endpoints (`/api/v1/counts`):**
  - `POST /counts/ingest` *(público / `device_key`)* — Registra eventos de conteo desde el ESP32.
  - `GET /counts/query` — Series temporales agregadas (`hour`, `day`, `week`, `month`).
  - `GET /counts/export` — Exporta series temporales en formato CSV (`horus-counts.csv`).
  - `GET /counts/kpis` — Visitantes hoy, mes, año y hora pico.
  - `GET /counts/compare` — Comparativa entre el período actual y el período anterior.
  - `GET /counts/by-branch` — Ranking y comparativa entre sedes.
  - `GET /counts/by-radar` — Conteos discriminados por dispositivo.
  - `GET /counts/by-company` *(super_admin)* — Comparativa global entre empresas.

### 5. `AlertsModule` (`src/alerts/`)
Define reglas de alerta por empresa o sede y genera eventos automáticos ante exceso de aforo o pérdida de conectividad de sensores.

- **Componentes principales:** `AlertsController`, `AlertsService`, `AlertRuleSchema`, `AlertEventSchema`.
- **Capacidades:**
  - **Reglas `max_occupancy`:** Evalúa el aforo neto estimado del día (`count_in - count_out`) tras cada ingestión, con *cooldown* de 30 minutos en Redis para evitar notificaciones repetidas.
  - **Reglas `radar_offline`:** Monitor periódico cada 60 segundos (`OnModuleInit` / `setInterval`) que marca como `offline` a radares sin heartbeat reciente (15 min por defecto o según regla).
  - Envío opcional de notificaciones por correo vía `MailService` sin bloquear el flujo IoT.
- **Endpoints (`/api/v1/alerts`):**
  - `GET /alerts` — Lista eventos de alerta (filtrable por `acknowledged` y `limit`).
  - `PATCH /alerts/:id/acknowledge` *(admin, manager, super_admin)* — Marca una alerta como atendida.
  - `GET /alerts/rules` — Lista reglas de alerta de la empresa.
  - `POST /alerts/rules` *(admin, super_admin)* — Crea una regla de alerta.
  - `PATCH /alerts/rules/:id` *(admin, super_admin)* — Actualiza una regla.
  - `DELETE /alerts/rules/:id` *(admin, super_admin)* — Elimina una regla.

### 6. `AuditModule` (`src/audit/`)
Módulo global (`@Global()`) que registra la trazabilidad de acciones administrativas en la colección `audit_logs` (creación/edición/baja de empresas, sedes, usuarios, radares, reglas y atención de alertas) mediante `AuditService`.

### 7. Seguridad Transversal (`src/common/guards/`)
- `TenantGuard` + `@TenantIdParam('id')`: valida que el `companyId` recibido en parámetros, query o body coincida con el del JWT (excepto para `super_admin` y rutas `@Public()`).
- `assertBranchAccess`: valida que usuarios `manager` y `viewer` únicamente consulten las sedes autorizadas en su `branchIndexes`.

---

## Scripts Disponibles

```bash
# Instalar dependencias
npm ci

# Compilar TypeScript -> dist/
npm run build

# Ejecutar en desarrollo (recarga automática)
npm run start:dev

# Ejecutar en modo debug
npm run start:debug

# Ejecutar compilado en producción
npm run start

# Poblar base de datos con datos de ejemplo
npm run seed

# Compilar y ejecutar pruebas unitarias y de bootstrap
npm test
```

---

## Variables de Entorno

| Variable | Descripción | Ejemplo / Defecto |
| --- | --- | --- |
| `PORT` | Puerto HTTP de la API | `3001` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (separados por coma) | `http://localhost:4200` |
| `MONGODB_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/peoplecount` |
| `REDIS_URL` | URI de conexión a Redis | `redis://127.0.0.1:6379` |
| `JWT_SECRET` | Secreto para firma de tokens JWT | — |
| `MAIL_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Puerto SMTP | `587` |
| `MAIL_SECURE` | Usar TLS directo (`true` para 465, `false` para STARTTLS) | `false` |
| `MAIL_USER` | Usuario SMTP | — |
| `MAIL_PASS` | Contraseña / App Password SMTP | — |
| `MAIL_FROM` | Remitente de correos | `"Horus" <noreply@horus.co>` |
| `MAIL_API_KEY` | API key opcional para proveedor externo | — |
| `OTP_TTL_SECONDS` | Vigencia del OTP en segundos | `600` |
| `OTP_MAX_ATTEMPTS` | Máximo de intentos fallidos de OTP | `3` |
| `OTP_BLOCK_SECONDS` | Duración del bloqueo tras exceder intentos | `900` |
| `DISABLE_OFFLINE_MONITOR` | Desactiva el monitor periódico de radares offline (`true`) | `false` |

---

## Documentación Interactiva

Con la API en ejecución, la especificación OpenAPI / Swagger está disponible en:

- `http://localhost:3001/api/docs`
