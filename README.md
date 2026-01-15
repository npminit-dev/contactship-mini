Instrucciones:

Requisitos:

Node.js (v18+ recomendado)

npm

Docker (para Redis)

Cuenta en Supabase (PostgreSQL)

Clonar el repositorio
git clone <repo-url>
cd contactship-mini

Instalar dependencias
npm install

Configurar variables de entorno
Crear un archivo .env en la raíz del proyecto con los siguientes valores:

PORT=3000
API_KEY=your-api-key

DB_HOST=xxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_NAME=postgres

REDIS_HOST=localhost
REDIS_PORT=6379

Levantar Redis
docker run -d --name redis -p 6379:6379 redis

Ejecutar el proyecto
npm run start:dev

La API quedará disponible en:
http://localhost:3000

Autenticación:
Los endpoints protegidos requieren el header:
x-api-key: your-api-key

Notas:

La base de datos se sincroniza automáticamente mediante TypeORM (synchronize: true) únicamente con fines de prueba.

Redis se utiliza para cachear el detalle de leads con TTL.

Los procesos automáticos (CRON y colas) se inicializan al levantar la aplicación.

AI summarization is executed asynchronously using Bull and Redis to avoid blocking HTTP requests. Jobs include retry and backoff strategies, and cached lead data is invalidated after processing.