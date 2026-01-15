# ContactShip Mini - Microservicio de Gestión de Leads

Backend moderno construido con **NestJS** y **TypeScript** que integra persistencia en PostgreSQL, cache con Redis, colas de trabajo, seguridad y generación de resúmenes con IA.

---

## 📋 Requisitos Previos

- **Node.js** recomandado v24.13.0 (LTS)
- **npm** o **yarn**
- **Docker** (para ejecutar Redis)
- **Cuenta en Supabase** (PostgreSQL gratuito)
- **API Key de Google Gemini** (para IA)

---

## 🚀 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/npminit-dev/contactship-mini
cd contactship-mini
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Servidor
PORT=3000

# Seguridad
API_KEY=your-secret-api-key-here

# Base de datos (Supabase PostgreSQL)
DB_HOST=xxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_NAME=postgres

# Cache (Redis)
REDIS_HOST=localhost
REDIS_PORT=6379

# IA (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Levantar Redis

```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

### 5. Ejecutar la aplicación

```bash
npm run start:dev
```

✅ La API estará disponible en: **http://localhost:3000**

---

## 🔐 Autenticación

Todos los endpoints requieren el header:

```
x-api-key: your-secret-api-key-here
```

Incluir este header en todas las solicitudes HTTP.

---

## 📡 Endpoints Disponibles

### Crear un lead manualmente

```http
POST /create-lead
x-api-key: your-api-key
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

**Respuesta (201):**
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "source": "manual",
  "summary": null,
  "nextAction": null,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

---

### Listar todos los leads

```http
GET /leads
x-api-key: your-api-key
```

**Respuesta (200):** Array de leads (ordenados por fecha descendente)

---

### Obtener detalle de un lead

```http
GET /leads/{id}
x-api-key: your-api-key
```

**Nota:** Este endpoint utiliza **cache Redis** con TTL de 1 minuto.

**Respuesta (200):** Lead individual

---

### Generar resumen con IA

```http
POST /leads/{id}/summarize
x-api-key: your-api-key
```

**Parámetros opcionales:**
- `force=true` - Regenerar resumen aunque ya exista

**Respuesta (200):**
```json
{
  "status": "queued"
}
```

Una vez procesado (asincrónico):
```json
{
  "summary": "Professional summary of the lead...",
  "next_action": "Schedule a follow-up call.",
  "status": "already_generated"
}
```

---

## 🔄 Sincronización Automática

El sistema sincroniza automáticamente leads desde [Random User Generator](https://randomuser.me) cada **5 segundos**.

**Características:**
- Importa 10 nuevos registros por ejecución
- Evita duplicados validando emails únicos en la base de datos
- Logs detallados de leads agregados vs. duplicados

---

## 🏗️ Arquitectura Técnica

### Stack de Tecnologías

| Componente | Tecnología |
|-----------|-----------|
| Framework | NestJS v11 + TypeScript |
| Base de datos | PostgreSQL (Supabase) |
| ORM | TypeORM |
| Cache | Redis + cache-manager |
| Colas | Bull (Redis-backed) |
| IA | Google Gemini API |
| Scheduler | @nestjs/schedule (CRON) |
| Validación | class-validator + DTOs |

### Características Implementadas

#### ✅ Persistencia
- Entidad `Lead` con UUIDs como PK
- Campos: nombre, email (único), teléfono, source (manual/external), summary, nextAction
- Sincronización automática de esquema (solo desarrollo)

#### ✅ Cache
- Redis con TTL de 1 minuto para detalle de leads
- Invalidación automática tras procesamiento de resúmenes

#### ✅ Colas de Trabajo
- Bull queue para procesamiento asincrónico de resúmenes
- Reintentos automáticos: 3 intentos con backoff de 5 segundos
- No bloquea respuestas HTTP

#### ✅ IA
- Integración con Google Gemini 3-Flash
- Formato estricto: `{ summary: string, next_action: string }`
- Validaciones en el prompt para evitar hallucinations

#### ✅ Seguridad
- API Key en header `x-api-key`
- Guard global en todos los endpoints
- Validación de DTOs con whitelist activada

#### ✅ Sincronización
- CRON job cada minuto
- Deduplicación por email
- Logging de operaciones (added/skipped)

#### ✅ Logs y Errores
- Logger contextualizado en servicios críticos
- Excepciones HTTP específicas (NotFoundException, ConflictException, etc.)
- Manejo de errores en jobs con reintentos

---

## 📁 Estructura del Proyecto

```
src/
├── main.ts                          # Entry point
├── app.module.ts                    # Módulo raíz
├── app.controller.ts                # Controller principal
├── app.service.ts                   # Service principal
├── types.ts                         # Tipos compartidos
├── common/
│   └── guards/
│       └── api-key.guard.ts         # Validación de API Key
├── leads/
│   ├── lead.entity.ts               # Entidad Lead (TypeORM)
│   ├── leads.service.ts             # Lógica de leads
│   ├── leads.controller.ts          # Endpoints HTTP
│   ├── leads.module.ts              # Módulo de leads
│   ├── dto/
│   │   └── create-lead.dto.ts       # DTO con validaciones
│   ├── ai/
│   │   └── ai.service.ts            # Servicio de IA (Gemini)
│   └── jobs/
│       └── summarize-lead.processor.ts # Processor para Bull queue
└── sync/
    ├── sync.service.ts              # Servicio de sincronización
    └── sync.module.ts               # Módulo de sync
```

---

## ⚙️ Variables de Configuración

Todas las variables se cargan desde `.env` usando `@nestjs/config`:

| Variable | Descripción | Ejemplo |
|----------|-----------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `API_KEY` | Clave para autenticación | `abc123xyz` |
| `DB_HOST` | Host de PostgreSQL | `proyecto.supabase.co` |
| `DB_PORT` | Puerto de DB | `5432` |
| `DB_USER` | Usuario de DB | `postgres` |
| `DB_PASSWORD` | Contraseña de DB | `password` |
| `DB_NAME` | Nombre de DB | `postgres` |
| `REDIS_HOST` | Host de Redis | `localhost` |
| `REDIS_PORT` | Puerto de Redis | `6379` |
| `GEMINI_API_KEY` | API Key de Google Gemini | `sk-...` |

---

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con coverage
npm run test:cov

# Tests E2E
npm run test:e2e

# Watch mode
npm run test:watch
```

---

## 📦 Scripts Disponibles

```bash
npm run start          # Producción
npm run start:dev      # Desarrollo con watch
npm run start:debug    # Debug mode
npm run start:prod     # Ejecutar dist compilado
npm run build          # Compilar TypeScript
npm run lint           # Linting con ESLint
npm run format         # Formatear código con Prettier
```

---

## 🔍 Notas Técnicas Importantes

### Base de Datos
- **synchronize: true** solo está habilitado en desarrollo
- Las migraciones manuales serían recomendables en producción
- El email está configurado como único para evitar duplicados

### Cache
- TTL de 1 minuto balancead entre freshness y performance
- Se invalida automáticamente tras procesar resúmenes
- Implementado con cache-manager + redis-store

### Colas Asincrónicas
- Bull utiliza Redis como broker
- Estrategia de reintentos: 3 intentos con backoff exponencial de 5 segundos
- Logging detallado de cada procesamiento

### IA
- Usa Google Gemini 3-Flash (rápido y económico)
- Prompt diseñado para evitar información inventada
- Validación estricta de formato JSON en respuestas

### Sincronización
- Ejecuta cada minuto (configurable en sync.service.ts)
- Descarga 10 registros por ejecución
- Deduplicación case-insensitive de emails

---

## 🐛 Troubleshooting

### Error: "Redis connection refused"
```bash
# Verifica que Redis esté corriendo
docker ps | grep redis

# Si no está, inicia Redis
docker run -d --name redis -p 6379:6379 redis:latest
```

### Error: "Invalid API key"
- Verifica que el header `x-api-key` esté presente en la solicitud
- Verifica que coincida con el valor en `.env`

### Error: "Lead with this email already exists"
- El email ya existe en la base de datos
- Los emails son únicos por diseño

### Base de datos no sincroniza
- Asegúrate de que las credenciales de Supabase en `.env` sean correctas
- Verifica conectividad a internet
- Revisa los logs de la consola

---

## 📝 Licencia

UNLICENSED

---

## ✨ Decisiones de Diseño Clave

1. **API Key en lugar de JWT** - Simplicidad para la prueba, sin necesidad de renovación de tokens
2. **Queue asincrónica para IA** - Evita timeouts en resúmenes largos
3. **Cache con TTL corto** - Balance entre datos frescos y reducción de carga
4. **Deduplicación en BD** - Constraint único + validación en servicio
5. **CRON cada minuto** - Frecuencia alta para demostración; recomendable ajustar en producción
6. **Gemini 3-Flash** - Modelo rápido y económico para este caso de uso

---

**Desarrollado como prueba técnica de NestJS + TypeScript.**
