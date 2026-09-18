# Plan de trabajo — Sistema de ventas

Proyecto de Desarrollo V. App móvil (React Native + Expo) con SQLite local,
autenticación por roles y módulo de ventas con encabezado/detalle.

**Equipo:** [@lmilo](https://github.com/lmilo) (Camilo Rincón) · [@Nataly97](https://github.com/Nataly97) (Nataly Martínez)

---

## 1. Requisitos del profesor

Fuente: `Parcial practico.docx`. Esto es lo que se califica.

### Historias de usuario

| HU | Qué exige |
|---|---|
| HU-01 | Registro público con correo y contraseña. Queda en estado **Pendiente/Inactivo** y avisa que un administrador debe aprobarla |
| HU-02 | El administrador ve las solicitudes pendientes, **asigna rol** (Admin o Cliente) y activa la cuenta |
| HU-03 | Login con control por estado y rol. Cuenta inactiva: acceso denegado con aviso explicativo |
| HU-04 | El cliente consulta y edita sus datos personales. El administrador ve el listado de clientes. Campos según la tabla Cliente, ver §4 |
| HU-05 | Catálogo de productos. Solo se selecciona con stock mayor a cero y nunca por encima del stock |
| HU-06 | Compra: inserta encabezado, inserta detalles y descuenta stock. **Transacción atómica** |
| HU-07 | CRUD de productos, exclusivo del administrador, con validación de valor unitario positivo y stock entero mayor o igual a cero |

### Reglas de HU-03 que condicionan todo el flujo

- Si el rol es Admin: todos los módulos (Clientes, Productos, Compras, Detalles).
- Si el rol es Cliente: solo su información personal y la opción de compra.
- **Primer ingreso como cliente: obligado a llenar sus datos personales.**
- **No se permite comprar sin datos del cliente registrados.**
- **No se permite comprar sin productos registrados.**

### Requerimientos generales

Login · **Menú en todas las pantallas** · Pantalla de compra · Diseño de la pantalla de compra · Validaciones en cada pantalla · Diseño general · Orden de la estructura del proyecto.

### Rúbrica

| Peso | Criterio | Qué mira |
|---|---|---|
| 15% | Login funcional | Validación de credenciales, control de acceso, mensajes al usuario, seguridad básica |
| 10% | Navegación y Home | Redirección tras login, estructura del home, **persistencia de sesión** |
| 30% | Entidades (mínimo 4) | Modelo de datos, visualización, **operaciones CRUD** |
| 15% | Diseño visual | Login, home, consistencia, **menú en todas las pantallas** |
| 30% | Funcionamiento general | Estructura del proyecto, ejecución, integración de módulos, base de datos conectada |

Lectura de la rúbrica: **60% se va en funcionamiento y entidades**. Los extras de §2 no suman nada si el CRUD falla. Primero se cierra lo exigido.

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

> **Dos conflictos dentro del propio enunciado, resueltos a favor de las tablas.**
> 1. La tabla Cliente define nombre completo y fecha de nacimiento, pero HU-04 dice "editar mis datos personales (Nombre, Apellido, Correo)". Mandan las tablas: se usa `nombre_completo` y `fecha_nacimiento`, y la pantalla de perfil edita esos campos. **Confirmar con el profesor.**
> 2. La tabla Login no tiene columna de estado, pero HU-01 y HU-02 exigen que la cuenta nazca pendiente y que un administrador la active. Sin esa columna las dos historias no se pueden cumplir, así que `estado` se agrega. Es la única columna añadida a una tabla del enunciado.
>
> Los campos extra marcados abajo (`precio_compra`, `imagen_uri`, `valor_unitario` y `costo_unitario` en detalle) son de §2 y no reemplazan nada de lo pedido.

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;   -- ver §6.1

-- HU-01, HU-02, HU-03. El rol es NULL hasta que el administrador lo asigna.
CREATE TABLE login (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  correo            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash     TEXT NOT NULL,
  salt              TEXT NOT NULL,
  rol               TEXT CHECK (rol IN ('admin', 'cliente')),
  estado            TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'activo', 'inactivo')),
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta   TEXT,
  creado_en         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- HU-03, HU-04. Se crea en el primer ingreso del cliente, no en el registro.
CREATE TABLE cliente (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  id_login         INTEGER NOT NULL UNIQUE REFERENCES login(id) ON DELETE CASCADE,
  nombre_completo  TEXT NOT NULL,
  fecha_nacimiento TEXT NOT NULL,             -- ISO: yyyy-mm-dd
  correo           TEXT NOT NULL UNIQUE COLLATE NOCASE
);

-- HU-05, HU-07. precio_compra e imagen_uri son extras nuestros (§2).
CREATE TABLE producto (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  precio_unitario REAL NOT NULL CHECK (precio_unitario > 0),
  precio_compra   REAL NOT NULL DEFAULT 0 CHECK (precio_compra >= 0),   -- extra §2
  imagen_uri      TEXT,                                                 -- extra §2
  activo          INTEGER NOT NULL DEFAULT 1
);

-- HU-06
CREATE TABLE encabezado (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cliente  INTEGER NOT NULL REFERENCES cliente(id),
  fecha_venta TEXT NOT NULL DEFAULT (datetime('now')),
  total       REAL NOT NULL DEFAULT 0
);

CREATE TABLE detalle (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  id_encabezado   INTEGER NOT NULL REFERENCES encabezado(id) ON DELETE CASCADE,
  id_producto     INTEGER NOT NULL REFERENCES producto(id),
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  subtotal        REAL NOT NULL,
  precio_unitario REAL NOT NULL,   -- extra §2: congelado, ver §6.2
  costo_unitario  REAL NOT NULL    -- extra §2: congelado, para calcular ganancia
);

CREATE INDEX idx_detalle_encabezado ON detalle(id_encabezado);
CREATE INDEX idx_encabezado_cliente ON encabezado(id_cliente);
```

Son **5 entidades**, por encima del mínimo de 4 que pide la rúbrica.

### El ciclo de vida de una cuenta

Es lo que más cambió frente a la versión anterior del plan, y condiciona el login entero:

```
registro (HU-01)      login.estado = 'pendiente', login.rol = NULL
      |
      v
admin aprueba (HU-02) login.estado = 'activo', login.rol = 'cliente' | 'admin'
      |
      v
primer ingreso        si rol = 'cliente' y no existe fila en cliente
   (HU-03)            -> pantalla obligatoria de datos personales
      |
      v
puede comprar (HU-05) solo si existe su fila en cliente Y hay productos con stock
```

Tres compuertas antes de la primera compra. Cada una necesita su propio mensaje explicativo, no un error genérico: la rúbrica evalúa "mensajes al usuario" dentro del 15% de login.

---

## 5. Estructura de carpetas

```
app/
├── _layout.tsx                 SQLiteProvider + sesión + guard global
├── index.tsx                   redirige según estado y rol
├── login.tsx
├── registro.tsx
├── completar-perfil.tsx        HU-03: obligatoria en el primer ingreso del cliente
├── (cliente)/
│   ├── _layout.tsx             menú del cliente
│   ├── inicio.tsx
│   ├── perfil.tsx              HU-04: consulta y edita sus datos
│   ├── comprar.tsx             HU-05 + HU-06: catálogo, cantidades y confirmación
│   └── mis-compras.tsx
└── (admin)/
    ├── _layout.tsx             menú del admin
    ├── inicio.tsx              home + dashboard
    ├── solicitudes.tsx         HU-02: aprobar cuentas y asignar rol
    ├── productos.tsx           HU-07: CRUD
    ├── clientes.tsx            HU-04: listado
    └── compras.tsx             encabezados con sus detalles

db/
├── esquema.ts                  DDL + migraciones (PRAGMA user_version)
├── tipos.ts                    tipos compartidos — CONTRATO, ver §8
├── login.ts                    autenticación, aprobación, roles
├── clientes.ts
├── productos.ts
├── compras.ts
└── reportes.ts

lib/
├── auth.ts                     hash, verificación, sesión
├── imagenes.ts                 guardado permanente de la imagen del producto
├── moneda.ts                   formato COP
└── factura.ts                  HTML → PDF

components/                     UI compartida, incluido el menú
```

El menú vive en los `_layout.tsx` de cada grupo: así aparece en **todas** las pantallas del rol sin repetir código, que es exactamente lo que pide la rúbrica.

Las pantallas **no escriben SQL**. Llaman funciones de `db/`. La rúbrica evalúa "orden de la estructura del proyecto" dentro del 30% de funcionamiento general.

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

El corte es **por capa dentro de cada módulo**: Nataly escribe datos y lógica, Camilo escribe las vistas que los consumen. Un módulo, dos dueños, archivos distintos. Nadie edita el archivo del otro.

Excepción acordada: la **lógica** de autenticación, checkout y facturación la escribe Camilo, aunque no sea vista. Son los tres puntos que más pesan en la sustentación.

### Módulos

| Módulo | Datos y lógica (Nataly) | Vistas (Camilo) |
|---|---|---|
| Plataforma | `db/esquema.ts`, `db/seed.ts` | — |
| Autenticación | — | `lib/auth.ts`, `db/usuarios.ts`, `app/login.tsx`, `app/registro.tsx`, `lib/guard.tsx` |
| Clientes | `db/clientes.ts` | `app/(admin)/clientes.tsx` |
| Productos | `db/productos.ts`, `lib/imagenes.ts` | `app/(admin)/productos.tsx`, `app/(cliente)/catalogo.tsx`, `components/SelectorImagen.tsx` |
| Carrito y checkout | — | `db/ventas.ts` (`crearVenta`), `app/(cliente)/carrito.tsx` |
| Ventas e historial | `db/ventas.ts` (consultas) | `app/(admin)/ventas.tsx`, `app/(cliente)/mis-compras.tsx` |
| Facturación | — | `lib/factura.ts` |
| Dashboard | `db/reportes.ts` | `app/(admin)/dashboard.tsx` |
| Sistema visual | — | `components/`, `theme.ts` |

### Camilo (@lmilo) — 8 entregables

| # | Entregable | HU / Rúbrica | Archivos |
|---|---|---|---|
| C1 | Autenticación: registro en estado pendiente, login con control de estado y rol, scrypt + salt, bloqueo por intentos, sesión en SecureStore, guard | HU-01, HU-03 · 15% + 10% | `lib/auth.ts`, `db/login.ts`, `lib/sesion.tsx`, `lib/guard.tsx`, `app/login.tsx`, `app/registro.tsx` |
| C2 | Aprobación de cuentas: listado de solicitudes pendientes, asignar rol y activar | HU-02 | `app/(admin)/solicitudes.tsx` |
| C3 | Perfil del cliente: pantalla obligatoria de primer ingreso y edición posterior | HU-03, HU-04 | `app/completar-perfil.tsx`, `app/(cliente)/perfil.tsx` |
| C4 | Pantalla de compra: catálogo con stock, selección de cantidades, validación contra stock y confirmación | HU-05 · 15% diseño | `app/(cliente)/comprar.tsx` |
| C5 | Lógica de compra: `crearCompra` transaccional, encabezado + detalles + descuento de stock | HU-06 · 30% | `db/compras.ts` (`crearCompra`) |
| C6 | Pantallas de consulta: compras del admin, mis compras, listado de clientes | HU-04 · 30% | `app/(admin)/compras.tsx`, `app/(cliente)/mis-compras.tsx`, `app/(admin)/clientes.tsx` |
| C7 | Formulario de productos del admin y selector de imágenes | HU-07 · 30% | `app/(admin)/productos.tsx`, `components/SelectorImagen.tsx` |
| C8 | Sistema visual: **menú en todas las pantallas**, tema, estados de carga, vacío y error, home de cada rol | 15% + 10% | `components/`, `theme.ts`, ambos `_layout.tsx`, pantallas de inicio |

Extras de §2 (facturas, dashboard financiero) van **después** de que C1–C8 estén cerrados. No antes.

### Nataly (@Nataly97) — 5 entregables

| # | Entregable | HU / Rúbrica | Archivos |
|---|---|---|---|
| N1 | Plataforma de datos: las 5 tablas, migraciones con `PRAGMA user_version`, PRAGMAs de arranque, seed con un admin inicial | 30% funcionamiento | `db/esquema.ts`, `db/seed.ts` |
| N2 | Repositorio de login: crear solicitud, listar pendientes, aprobar con rol, cambiar estado | HU-01, HU-02 | `db/login.ts` (todo menos la verificación de contraseña) |
| N3 | Repositorio de clientes: crear en primer ingreso, leer por usuario, actualizar, listar | HU-04 · 30% CRUD | `db/clientes.ts` |
| N4 | Repositorio de productos: CRUD completo, validación de valor unitario positivo y stock entero, guardado de imagen en disco | HU-07 · 30% CRUD | `db/productos.ts`, `lib/imagenes.ts` |
| N5 | Consultas de compras y reportes: historial por cliente, listado del admin, compra con sus detalles, agregaciones del dashboard | HU-06 · 30% | `db/compras.ts` (lectura), `db/reportes.ts` |

**Riesgo asumido, que quede escrito:** Nataly no toca ninguna pantalla en todo el proyecto. Si el profesor pregunta en sustentación por la interfaz, ella debe poder explicarla igual. Camilo queda con diez pantallas: es la carga más alta del equipo y se decidió a conciencia.

**Trabajo conjunto (Fase 0, antes de que cada uno arranque por su lado):** definir `db/tipos.ts` y las **firmas** de todas las funciones de `db/`. Ver §8.

---

## 8. Cómo no chocarnos

Con el corte por capa, los dos trabajan sobre el mismo módulo al mismo tiempo. El contrato deja de ser una buena práctica y pasa a ser la condición para que esto funcione.

**1. El contrato va primero, y es ley.** En la Fase 0 se escribe `db/tipos.ts` completo y las firmas de cada repositorio, con el cuerpo lanzando `throw new Error('N3 pendiente: ...')`:

```ts
export async function crearVenta(db: SQLiteDatabase, idCliente: number, items: ItemCarrito[]): Promise<number>
export async function ventasDeCliente(db: SQLiteDatabase, idCliente: number): Promise<VentaResumen[]>
```

Camilo programa la pantalla contra esa firma aunque el cuerpo todavía no exista. Cambiar una firma ya acordada **exige avisar al otro antes**, porque rompe código ajeno al instante.

**2. Un archivo, un dueño.** La tabla de §7 dice quién manda en cada archivo. `db/` es de Nataly salvo `db/usuarios.ts` y la función `crearVenta`; `app/` y `components/` son de Camilo. Si necesitas tocar un archivo ajeno, se avisa antes.

**3. Dos archivos compartidos, y solo dos.** `db/compras.ts`: Camilo escribe `crearCompra` (la transacción), Nataly las consultas de lectura. `db/login.ts`: Camilo la verificación de contraseña, Nataly el resto. Los dos se crean en la Fase 0 con todas las firmas, y desde ahí cada uno toca solo sus funciones. No se reordena ni se reformatea el archivo completo.

**4. Una rama por entregable.** `feat/C4-checkout`, `feat/N3-productos`. Nadie commitea directo a `main`. PR y revisión del otro antes de mezclar — así los dos entienden todo el código, que es lo que el profesor va a preguntar en la sustentación.

---

## 9. Fases

| Fase | Contenido | Quién |
|---|---|---|
| 0 | Cotejar las tablas del `.docx`, instalar dependencias, migrar a `expo-router`, escribir `db/tipos.ts` y todas las firmas | Los dos, sentados juntos |
| 1 | Las 5 tablas, migraciones y seed del admin · Autenticación con estados y roles | N1 · C1 |
| 2 | Repositorio de login · Aprobación de cuentas y perfil del cliente | N2 · C2, C3 |
| 3 | Repositorio de productos · Formulario de productos del admin | N4 · C7 |
| 4 | Repositorio de clientes · Pantalla de compra y lógica transaccional | N3 · C4, C5 |
| 5 | Consultas de compras y reportes · Pantallas de consulta y sistema visual | N5 · C6, C8 |
| 6 | Extras de §2, pruebas de extremo a extremo, ensayo de sustentación | Los dos |

Orden pensado contra la rúbrica: al terminar la Fase 4 el sistema **ya cumple** todas las historias de usuario. Las fases 5 y 6 suben nota, no la salvan.

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

Ordenado por peso en la rúbrica, no por gusto.

**Login funcional (15%)**
- [ ] Registro valida formato de correo y contraseña segura.
- [ ] La cuenta nace en estado pendiente y el sistema lo dice con un mensaje claro.
- [ ] Una cuenta inactiva no entra, y el aviso explica por qué.
- [ ] Las contraseñas no se pueden leer en la base de datos.

**Navegación y Home (10%)**
- [ ] Tras iniciar sesión, cada rol aterriza en su home.
- [ ] La sesión sobrevive al cierre de la aplicación.
- [ ] El cliente no alcanza ninguna pantalla de administrador, ni escribiendo la ruta.

**Entidades (30%)**
- [ ] Las 5 tablas existen con los campos del enunciado.
- [ ] Productos tiene CRUD completo del administrador.
- [ ] Clientes se crea, se consulta y se edita.
- [ ] El administrador ve el listado de clientes y el de compras.

**Diseño visual (15%)**
- [ ] Menú presente en todas las pantallas de ambos roles.
- [ ] Login y home consistentes con el resto.
- [ ] Cada formulario valida y muestra el error al lado del campo.

**Funcionamiento general (30%)**
- [ ] La compra es atómica: o entra encabezado, detalles y descuento de stock, o no entra nada.
- [ ] No se puede comprar más unidades que el stock disponible.
- [ ] No se puede comprar sin datos de cliente ni sin productos registrados.
- [ ] El total del encabezado es igual a la suma de sus detalles.
- [ ] El stock nunca queda negativo.
- [ ] La aplicación abre en Expo Go sin warnings en consola.
- [ ] Los dos entienden el código completo, no solo su parte.
