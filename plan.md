# Plan de trabajo — Sistema de ventas

Proyecto de Desarrollo V. App móvil (React Native + Expo) con SQLite local,
autenticación por roles y módulo de ventas con encabezado/detalle.

**Equipo:** [@lmilo](https://github.com/lmilo) (Camilo Rincón) · [@Nataly97](https://github.com/Nataly97) (Nataly Martínez)

---

## 1. Requisitos del profesor

Esto es lo que se califica. No se negocia, no se recorta.

### Entidades

| Entidad | Campos exigidos |
|---|---|
| Login | correo, contraseña, rol |
| Cliente | id cliente, nombre completo, fecha nacimiento, correo |
| Producto | id producto, nombre, descripción, stock, precio unitario |
| Encabezado | id encabezado, id cliente, fecha venta, total (suma de los detalles) |
| Detalle | id detalle, id encabezado, id producto, cantidad, subtotal |

### Reglas de rol

- **Cliente:** compra y ve sus propias compras. No maneja formularios de gestión.
- **Administrador:** ve las compras de los clientes, gestiona productos (crear, editar, subir stock). **No** crea ventas ni clientes por su cuenta.

Consecuencia de diseño: si el admin no crea clientes, los clientes entran por **auto-registro**. El registro público crea `usuario(rol='cliente')` + `cliente` en una sola transacción.

### Componentes visuales exigidos

`inicio` · `cliente` · `productos` · `ventas` (encabezado + detalle)

---

## 2. Extras que agregamos

Todo lo de abajo va **encima** de lo exigido, nunca en reemplazo.

| Extra | Por qué suma |
|---|---|
| Imágenes de productos | Catálogo real, no una lista de texto |
| Precio de compra | Sin costo no hay margen, y sin margen el dashboard financiero es solo "ventas" |
| Facturas en PDF | Cierra el ciclo de la venta |
| Login realmente seguro | Ver §6.4. Es el extra con más fondo técnico |
| Checkout con carrito | La venta deja de ser un formulario y pasa a ser un flujo |
| Dashboard financiero | Resumen de tienda: ventas, ganancias, bajo stock, clientes |

---

## 3. Stack

| Capa | Herramienta | Nota |
|---|---|---|
| Runtime | Expo SDK 57 + React Native 0.86 | Ya montado |
| Lenguaje | TypeScript estricto | Ya montado |
| Navegación | `expo-router` | Rutas por archivo → menos conflictos de merge |
| Base de datos | `expo-sqlite` | API async (`runAsync`, `getFirstAsync`, `getAllAsync`) |
| Hash de contraseñas | `@noble/hashes` (scrypt) | Ver §6.4 |
| Aleatoriedad | `expo-crypto` | `getRandomBytesAsync` para el salt |
| Sesión | `expo-secure-store` | Keychain / Keystore del sistema |
| Imágenes | `expo-image-picker` + `expo-file-system` | Guardar **ruta**, nunca el binario en la BD |
| Facturas | `expo-print` + `expo-sharing` | `printToFileAsync({ html })` → PDF |

**Plataforma objetivo: celular con Expo Go.** No web. La documentación de Expo v57 marca el soporte web de SQLite como *alpha* y exige `metro.config.js` con `wasm` en `sourceExts` más headers `Cross-Origin-Embedder-Policy` y `Cross-Origin-Opener-Policy` en el servidor. No vale la pena pelear con eso.

### Instalación (Fase 0)

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npx expo install expo-sqlite expo-crypto expo-secure-store expo-image-picker expo-file-system expo-print expo-sharing
npm install @noble/hashes
```

En `package.json`: `"main": "expo-router/entry"`
En `app.json`: agregar `"scheme": "ventasapp"` y `"experiments": { "typedRoutes": true }`

---

## 4. Modelo de datos

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;   -- ver §6.1

CREATE TABLE usuarios (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  correo            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash     TEXT NOT NULL,
  salt              TEXT NOT NULL,
  rol               TEXT NOT NULL CHECK (rol IN ('cliente', 'administrador')),
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta   TEXT,
  creado_en         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE clientes (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario       INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre_completo  TEXT NOT NULL,
  fecha_nacimiento TEXT NOT NULL,              -- ISO: yyyy-mm-dd
  correo           TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE productos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  precio_unitario REAL NOT NULL CHECK (precio_unitario >= 0),
  precio_compra   REAL NOT NULL DEFAULT 0 CHECK (precio_compra >= 0),   -- extra
  imagen_uri      TEXT,                                                 -- extra
  activo          INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE ventas_encabezado (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cliente  INTEGER NOT NULL REFERENCES clientes(id),
  fecha_venta TEXT NOT NULL DEFAULT (datetime('now')),
  total       REAL NOT NULL DEFAULT 0
);

CREATE TABLE ventas_detalle (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  id_encabezado   INTEGER NOT NULL REFERENCES ventas_encabezado(id) ON DELETE CASCADE,
  id_producto     INTEGER NOT NULL REFERENCES productos(id),
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario REAL NOT NULL,   -- congelado, ver §6.2
  costo_unitario  REAL NOT NULL,   -- congelado, para calcular ganancia
  subtotal        REAL NOT NULL
);

CREATE INDEX idx_detalle_encabezado ON ventas_detalle(id_encabezado);
CREATE INDEX idx_encabezado_cliente ON ventas_encabezado(id_cliente);
```

---

## 5. Estructura de carpetas

```
app/
├── _layout.tsx              SQLiteProvider + sesión + guard por rol
├── login.tsx
├── registro.tsx
├── (cliente)/
│   ├── _layout.tsx          tabs del cliente
│   ├── inicio.tsx
│   ├── catalogo.tsx
│   ├── carrito.tsx
│   └── mis-compras.tsx
└── (admin)/
    ├── _layout.tsx          tabs del admin
    ├── dashboard.tsx
    ├── productos.tsx
    ├── clientes.tsx
    └── ventas.tsx

db/
├── esquema.ts               DDL + migraciones (PRAGMA user_version)
├── tipos.ts                 tipos compartidos — CONTRATO, ver §8
├── usuarios.ts
├── clientes.ts
├── productos.ts
└── ventas.ts

lib/
├── auth.ts                  hash, verificación, sesión
├── moneda.ts                formato COP
└── factura.ts               HTML → PDF

components/                  UI compartida
```

Las pantallas **no escriben SQL**. Llaman funciones de `db/`. Si mañana esto se conecta a una API, se cambia `db/` y ninguna pantalla se entera.

---

## 6. Decisiones técnicas que hay que respetar

### 6.1 `PRAGMA foreign_keys = ON`

SQLite **ignora las foreign keys por defecto**. Si no se activa en cada conexión, los `REFERENCES` del esquema son decoración: se pueden insertar detalles apuntando a productos que no existen. Va en el `onInit` del `SQLiteProvider`.

### 6.2 El precio se congela en el detalle

`ventas_detalle` guarda `precio_unitario` y `costo_unitario` propios, copiados del producto **en el momento de la venta**. No se consultan desde `productos` al mostrar una factura vieja.

Razón: si el admin sube el precio mañana, todas las facturas del año pasado cambiarían de valor. Una factura es un documento histórico, no una vista en vivo.

### 6.3 El checkout es una transacción atómica

Crear encabezado + insertar detalles + descontar stock ocurre **todo o nada**:

```ts
await db.withExclusiveTransactionAsync(async txn => {
  // 1. validar stock de cada item
  // 2. insertar encabezado
  // 3. insertar detalles
  // 4. descontar stock
  // 5. actualizar total del encabezado
})
```

Si falla el paso 4, se revierte todo. Sin esto se puede terminar con una venta registrada y el stock intacto, o peor: stock descontado sin venta.

Se usa la variante **exclusiva** porque `withTransactionAsync` no bloquea a otros escritores: el hilo de JS es cooperativo y otro `await` puede colarse en medio.

### 6.4 Login "realmente seguro" — hasta dónde llega

Dato duro: **`expo-crypto` no trae PBKDF2 ni HMAC nativos.** Solo hash, AES-GCM y random. Iterar `digestStringAsync` a mano son miles de llamadas al lado nativo: lentísimo e inútil.

La salida es `@noble/hashes` (JS puro, auditada, sin dependencias) usando **scrypt**, que además de lento es caro en memoria — eso es lo que frena a las GPU.

```ts
import { scryptAsync } from '@noble/hashes/scrypt'
import * as Crypto from 'expo-crypto'

const salt = await Crypto.getRandomBytesAsync(16)          // salt único por usuario
const hash = await scryptAsync(password, salt, { N: 2 ** 14, r: 8, p: 1, dkLen: 32 })
```

Y además:
- Salt único por usuario (dos personas con la misma clave dan hashes distintos).
- Bloqueo temporal tras 5 intentos fallidos (`intentos_fallidos`, `bloqueado_hasta`).
- Sesión en `expo-secure-store`, no en estado de React ni en AsyncStorage.
- Comparación del hash en tiempo constante.

**Lo que hay que decir en la sustentación, con honestidad:** el archivo `.db` no está cifrado — SQLCipher no viene en `expo-sqlite` — así que en un dispositivo con root se puede abrir. Lo protege el sandbox del sistema operativo. La seguridad real de autenticación vive en un servidor; esto es lo máximo defendible en una app local, y saber dónde está el límite vale más que fingir que no existe.

### 6.5 Las imágenes no van en la base de datos

`productos.imagen_uri` guarda una **ruta**, no el binario. Meter BLOBs en SQLite infla el archivo y hace lentas las consultas que ni siquiera piden la imagen.

`expo-image-picker` devuelve una URI temporal (caché). Hay que copiarla a almacenamiento permanente o la imagen desaparece:

```ts
import { File, Paths } from 'expo-file-system'

const origen = new File(uri)
const destino = new File(Paths.document, `producto-${id}.jpg`)
await origen.copy(destino)
```

Ojo: en SDK 57 la API de `expo-file-system` es la nueva (`File`, `Directory`, `Paths`). La vieja (`copyAsync`, `documentDirectory`) **lanza error en runtime** salvo que se importe de `expo-file-system/legacy`.

### 6.6 Dashboard: consultas, no bucles en JS

```sql
-- ventas y ganancia del mes
SELECT
  COUNT(DISTINCT e.id)                              AS ventas,
  SUM(d.subtotal)                                   AS ingresos,
  SUM(d.subtotal - (d.costo_unitario * d.cantidad)) AS ganancia
FROM ventas_encabezado e
JOIN ventas_detalle d ON d.id_encabezado = e.id
WHERE e.fecha_venta >= date('now', 'start of month');

-- productos con bajo stock
SELECT id, nombre, stock FROM productos WHERE stock <= 5 AND activo = 1 ORDER BY stock;

-- clientes registrados
SELECT COUNT(*) AS total FROM clientes;
```

Traer todo a memoria y sumar con `.reduce()` es el anti-patrón clásico. Para eso existe el motor.

---

## 7. Reparto del trabajo

### Camilo (@lmilo)

| # | Entregable | Archivos |
|---|---|---|
| C1 | Autenticación segura: scrypt + salt, bloqueo por intentos, sesión en SecureStore, guard por rol | `lib/auth.ts`, `app/_layout.tsx`, `app/login.tsx`, `app/registro.tsx`, `db/usuarios.ts` |
| C2 | Carrito y checkout transaccional (§6.3) | `app/(cliente)/carrito.tsx`, `db/ventas.ts` |
| C3 | Facturas en PDF y compartir | `lib/factura.ts` |
| C4 | Dashboard financiero (§6.6) | `app/(admin)/dashboard.tsx` |
| C5 | Imágenes de productos: picker + almacenamiento permanente (§6.5) | `components/SelectorImagen.tsx` |
| C6 | Precio de compra y cálculo de márgenes | `db/productos.ts` (campos), `lib/moneda.ts` |

### Nataly (@Nataly97)

| # | Entregable | Archivos |
|---|---|---|
| N1 | Esquema, migraciones con `PRAGMA user_version` y `SQLiteProvider` | `db/esquema.ts` |
| N2 | Repositorio de clientes + pantalla de clientes (admin, solo lectura) | `db/clientes.ts`, `app/(admin)/clientes.tsx` |
| N3 | Repositorio de productos + formulario CRUD del admin (crear, editar, subir stock) | `db/productos.ts`, `app/(admin)/productos.tsx` |
| N4 | Catálogo del cliente (listado, búsqueda, "agregar al carrito") | `app/(cliente)/catalogo.tsx` |
| N5 | Ventas del admin: listado de encabezados con detalle expandible | `app/(admin)/ventas.tsx` |
| N6 | "Mis compras" del cliente + inicio del cliente | `app/(cliente)/mis-compras.tsx`, `app/(cliente)/inicio.tsx` |
| N7 | Componentes UI compartidos y datos de prueba (seed) | `components/`, `db/seed.ts` |

**Trabajo conjunto (Fase 0, antes de que cada uno arranque por su lado):** definir `db/tipos.ts` y las **firmas** de todas las funciones de `db/`. Ver §8.

---

## 8. Cómo no chocarnos

El riesgo real de este proyecto no es técnico, es de merge. Tres reglas:

**1. El contrato va primero.** En la Fase 0 se escribe `db/tipos.ts` completo y las firmas vacías de cada repositorio:

```ts
export async function crearVenta(db: SQLiteDatabase, idCliente: number, items: ItemCarrito[]): Promise<number>
export async function ventasDeCliente(db: SQLiteDatabase, idCliente: number): Promise<VentaResumen[]>
```

Con eso, Camilo programa el carrito contra `crearVenta()` aunque Nataly todavía no la haya implementado, y al revés. Ese archivo se commitea y **no se toca solo**: cambiarlo requiere avisar.

**2. Una rama por entregable.** `feat/C2-checkout`, `feat/N3-productos`. Nadie commitea directo a `main`. PR y revisión del otro antes de mezclar — así los dos entienden todo el código, que es lo que el profesor va a preguntar en la sustentación.

**3. Un archivo, un dueño.** La tabla de §7 dice quién manda en cada archivo. Si necesitas tocar un archivo ajeno, se avisa antes.

---

## 9. Fases

| Fase | Contenido | Quién |
|---|---|---|
| 0 | Instalar dependencias, migrar a `expo-router`, definir `db/tipos.ts` y firmas | Los dos, sentados juntos |
| 1 | Esquema + migraciones + seed · Auth con scrypt + guard por rol | N1 · C1 |
| 2 | CRUD productos + catálogo · Imágenes + precio de compra | N3, N4 · C5, C6 |
| 3 | Carrito + checkout transaccional · Clientes (admin) | C2 · N2 |
| 4 | Ventas (admin) + mis compras · Facturas PDF | N5, N6 · C3 |
| 5 | Dashboard financiero · UI compartida y pulido | C4 · N7 |
| 6 | Pruebas de extremo a extremo, datos de demo, ensayo de sustentación | Los dos |

> Fechas: pendientes de la entrega real. Ajustar al calendario del curso.

---

## 10. Extras candidatos (sin pasarnos)

El profesor pidió no alejarse mucho de lo planeado. Estos están ordenados por qué tan visible es el cambio:

**Invisibles — puro criterio técnico, califican sin llamar la atención**
- Validar stock insuficiente dentro de la transacción, no antes (evita la condición de carrera).
- Tabla `movimientos_stock` como auditoría: quién cambió el stock, cuándo, por qué. Responde "¿por qué hay 3 y no 5?".
- Baja lógica (`activo = 0`) en vez de `DELETE`: un producto borrado rompería las facturas que lo referencian.
- Pruebas de la capa `db/` con datos en memoria.

**Moderados — se notan, pero son obvios de justificar**
- Búsqueda y filtros en catálogo y ventas.
- Estados vacíos y de carga bien resueltos.
- Formato de moneda en pesos colombianos.
- Confirmación antes de acciones destructivas.

**Llamativos — evaluar si conviene**
- Gráfica de ventas por día en el dashboard.
- Exportar el reporte de ventas a CSV.
- Devoluciones (nota crédito que revierte stock).
- Modo oscuro.

Recomendación: los cuatro primeros sí o sí, los moderados según el tiempo, y de los llamativos máximo uno.

---

## 11. Definición de terminado

- [ ] Las 5 entidades del profesor existen con todos sus campos.
- [ ] Cliente compra y ve solo sus compras. No accede a pantallas de admin.
- [ ] Admin gestiona productos y ve todas las ventas. No crea ventas ni clientes.
- [ ] El total del encabezado siempre es igual a la suma de sus detalles.
- [ ] El stock nunca queda negativo ni se descuenta sin venta asociada.
- [ ] Las contraseñas no se pueden leer en la base de datos.
- [ ] La app abre en Expo Go sin warnings en consola.
- [ ] Los dos entienden el código completo, no solo su parte.
