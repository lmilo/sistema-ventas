import type { SQLiteDatabase } from 'expo-sqlite'
import { derivarHash, generarSalt } from '../lib/auth'

/**
 * Datos de demostracion: un mes de operacion de la tienda.
 *
 * Restriccion que manda sobre el diseno de este archivo: cada hash scrypt
 * cuesta cerca de dos segundos en el dispositivo. Por eso se derivan SOLO DOS
 * hashes y se reutilizan entre las cuentas de prueba. Sembrar veinte cuentas
 * con su propio hash tardaria casi un minuto en el primer arranque.
 */

const ADMIN_EMAIL = 'admin@sistema-ventas.com'
const ADMIN_PASSWORD = 'admin123'
const CLIENTE_PASSWORD = 'cliente123'

const DIAS_DE_HISTORIA = 30

type ClienteDemo = {
  nombre: string
  nacimiento: string
  correo: string
}

const CLIENTES: ClienteDemo[] = [
  { nombre: 'Ana Gómez Restrepo', nacimiento: '1995-06-15', correo: 'cliente@sistema-ventas.com' },
  { nombre: 'Julián Ospina Vélez', nacimiento: '1992-11-03', correo: 'julian.ospina@correo.com' },
  { nombre: 'Daniela Arango Mesa', nacimiento: '1998-02-21', correo: 'daniela.arango@correo.com' },
  { nombre: 'Santiago Quintero Ruiz', nacimiento: '1990-08-09', correo: 'santiago.quintero@correo.com' },
  { nombre: 'Valentina Cardona Loaiza', nacimiento: '2000-04-30', correo: 'valentina.cardona@correo.com' },
  { nombre: 'Andrés Betancur Salazar', nacimiento: '1988-12-12', correo: 'andres.betancur@correo.com' },
  { nombre: 'Laura Zapata Muñoz', nacimiento: '1996-07-18', correo: 'laura.zapata@correo.com' },
  { nombre: 'Mateo Henao Duque', nacimiento: '1999-01-25', correo: 'mateo.henao@correo.com' },
  { nombre: 'Camila Jaramillo Ríos', nacimiento: '1994-09-07', correo: 'camila.jaramillo@correo.com' },
  { nombre: 'Sebastián Marín Correa', nacimiento: '1991-03-14', correo: 'sebastian.marin@correo.com' },
  { nombre: 'Isabela Torres Agudelo', nacimiento: '1997-10-02', correo: 'isabela.torres@correo.com' },
  { nombre: 'Tomás Escobar Palacio', nacimiento: '1993-05-26', correo: 'tomas.escobar@correo.com' },
  { nombre: 'Manuela Giraldo Ceballos', nacimiento: '2001-08-19', correo: 'manuela.giraldo@correo.com' },
  { nombre: 'Emanuel Ramírez Toro', nacimiento: '1989-06-04', correo: 'emanuel.ramirez@correo.com' }
]

/** Cuentas recien registradas que el administrador aun no ha aprobado (HU-02). */
const PENDIENTES = [
  'nuevo.usuario@correo.com',
  'paula.montoya@correo.com',
  'kevin.alzate@correo.com'
]

type ProductoDemo = {
  nombre: string
  descripcion: string
  compra: number
  venta: number
  stock: number
}

const PRODUCTOS: ProductoDemo[] = [
  { nombre: 'Teclado mecánico RGB', descripcion: 'Switches rojos, formato 87 teclas, retroiluminado.', compra: 95000, venta: 165000, stock: 40 },
  { nombre: 'Mouse inalámbrico 2.4G', descripcion: 'Sensor óptico 1600 DPI, silencioso, batería AA.', compra: 28000, venta: 52000, stock: 80 },
  { nombre: 'Audífonos over-ear', descripcion: 'Bluetooth 5.3, cancelación pasiva, 30 h de batería.', compra: 120000, venta: 215000, stock: 35 },
  { nombre: 'Base refrigerante para portátil', descripcion: 'Cinco ventiladores, altura ajustable, hasta 17 pulgadas.', compra: 45000, venta: 89000, stock: 25 },
  { nombre: 'Hub USB-C 7 en 1', descripcion: 'HDMI 4K, dos USB 3.0, lector SD y carga PD 100 W.', compra: 72000, venta: 139000, stock: 30 },
  { nombre: 'Memoria USB 128 GB', descripcion: 'USB 3.2, carcasa metálica, hasta 150 MB/s.', compra: 32000, venta: 62000, stock: 60 },
  { nombre: 'Disco SSD externo 1 TB', descripcion: 'NVMe en carcasa USB-C, hasta 1050 MB/s.', compra: 280000, venta: 449000, stock: 18 },
  { nombre: 'Webcam Full HD', descripcion: '1080p a 30 fps, micrófono dual y tapa de privacidad.', compra: 65000, venta: 125000, stock: 22 },
  { nombre: 'Micrófono de condensador', descripcion: 'USB, patrón cardioide, brazo articulado incluido.', compra: 130000, venta: 239000, stock: 15 },
  { nombre: 'Monitor 24" IPS', descripcion: 'Full HD, 75 Hz, bordes delgados, HDMI y VGA.', compra: 420000, venta: 649000, stock: 12 },
  { nombre: 'Soporte de monitor', descripcion: 'Brazo de gas, giro 360°, hasta 27 pulgadas.', compra: 58000, venta: 109000, stock: 20 },
  { nombre: 'Silla ergonómica de malla', descripcion: 'Soporte lumbar, apoyabrazos 3D, reclinable.', compra: 310000, venta: 529000, stock: 8 },
  { nombre: 'Lámpara de escritorio LED', descripcion: 'Tres temperaturas, atenuable, puerto USB.', compra: 38000, venta: 72000, stock: 45 },
  { nombre: 'Power bank 20 000 mAh', descripcion: 'Carga rápida 22.5 W, tres salidas, pantalla digital.', compra: 68000, venta: 129000, stock: 33 },
  { nombre: 'Cargador GaN 65 W', descripcion: 'Dos USB-C y un USB-A, compacto, protección térmica.', compra: 55000, venta: 105000, stock: 28 },
  { nombre: 'Cable HDMI 2.1 de 2 m', descripcion: '8K a 60 Hz, malla trenzada, conectores dorados.', compra: 18000, venta: 39000, stock: 70 },
  { nombre: 'Adaptador Ethernet USB-C', descripcion: 'Gigabit, plug and play, sin controladores.', compra: 24000, venta: 49000, stock: 40 },
  { nombre: 'Pad de escritorio XL', descripcion: '90 × 40 cm, base antideslizante, bordes cosidos.', compra: 22000, venta: 45000, stock: 55 },
  { nombre: 'Router WiFi 6 doble banda', descripcion: 'AX1800, cuatro antenas, control parental.', compra: 195000, venta: 319000, stock: 14 },
  { nombre: 'Impresora multifuncional', descripcion: 'Tinta continua, WiFi, imprime, escanea y copia.', compra: 480000, venta: 749000, stock: 6 },
  { nombre: 'Resma de papel carta', descripcion: '500 hojas, 75 g, blancura 96 %.', compra: 12000, venta: 24000, stock: 120 },
  { nombre: 'Organizador de cables', descripcion: 'Canaleta adhesiva de 1 m, corte a medida.', compra: 9000, venta: 21000, stock: 90 },
  { nombre: 'Tarjeta microSD 256 GB', descripcion: 'Clase 10 U3, con adaptador SD, ideal para video 4K.', compra: 74000, venta: 135000, stock: 26 },
  { nombre: 'Kit de limpieza para pantallas', descripcion: 'Espuma sin alcohol, paño de microfibra y brocha.', compra: 11000, venta: 26000, stock: 65 }
]

/** Generador determinista: la demo se ve igual en el equipo de los dos. */
function crearAleatorio(semilla: number) {
  let estado = semilla
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296
    return estado / 4294967296
  }
}

const enteroEntre = (aleatorio: () => number, minimo: number, maximo: number) =>
  minimo + Math.floor(aleatorio() * (maximo - minimo + 1))

/** Formato que entiende SQLite: 'YYYY-MM-DD HH:MM:SS'. */
function fechaHace(dias: number, hora: number, minuto: number) {
  const fecha = new Date(Date.now() - dias * 86_400_000)
  fecha.setHours(hora, minuto, 0, 0)
  return fecha.toISOString().slice(0, 19).replace('T', ' ')
}

export async function sembrarDatosDemo(db: SQLiteDatabase): Promise<void> {
  const existentes = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM login;'
  )

  if ((existentes?.total ?? 0) > 0) {
    return
  }

  const saltAdmin = await generarSalt()
  const hashAdmin = await derivarHash(ADMIN_PASSWORD, saltAdmin)

  // Un solo hash para todas las cuentas de prueba: derivar uno por cliente
  // costaria casi un minuto de arranque.
  const saltCliente = await generarSalt()
  const hashCliente = await derivarHash(CLIENTE_PASSWORD, saltCliente)

  const aleatorio = crearAleatorio(20260922)

  await db.withExclusiveTransactionAsync(async txn => {
    await txn.runAsync(
      `INSERT INTO login (correo, password_hash, salt, rol, estado)
       VALUES (?, ?, ?, 'administrador', 'activo');`,
      [ADMIN_EMAIL, hashAdmin, saltAdmin]
    )

    const idsCliente: number[] = []

    for (const persona of CLIENTES) {
      const cuenta = await txn.runAsync(
        `INSERT INTO login (correo, password_hash, salt, rol, estado)
         VALUES (?, ?, ?, 'cliente', 'activo');`,
        [persona.correo, hashCliente, saltCliente]
      )

      const cliente = await txn.runAsync(
        `INSERT INTO cliente (id_login, nombre_completo, fecha_nacimiento, correo)
         VALUES (?, ?, ?, ?);`,
        [cuenta.lastInsertRowId, persona.nombre, persona.nacimiento, persona.correo]
      )

      idsCliente.push(cliente.lastInsertRowId)
    }

    for (const correo of PENDIENTES) {
      await txn.runAsync(
        `INSERT INTO login (correo, password_hash, salt, rol, estado)
         VALUES (?, ?, ?, NULL, 'pendiente');`,
        [correo, hashCliente, saltCliente]
      )
    }

    const idsProducto: number[] = []
    const stockActual: number[] = []

    for (const producto of PRODUCTOS) {
      const fila = await txn.runAsync(
        `INSERT INTO producto (nombre, descripcion, stock, precio_unitario, precio_compra, imagen_uri, activo)
         VALUES (?, ?, ?, ?, ?, NULL, 1);`,
        [producto.nombre, producto.descripcion, producto.stock, producto.venta, producto.compra]
      )

      idsProducto.push(fila.lastInsertRowId)
      stockActual.push(producto.stock)
    }

    // Un mes de ventas. El stock que queda es el inicial menos lo vendido:
    // si no, el dashboard mostraria numeros que no cuadran con el historial.
    for (let dia = DIAS_DE_HISTORIA; dia >= 0; dia--) {
      const esFinDeSemana = new Date(Date.now() - dia * 86_400_000).getDay() % 6 === 0
      const compras = esFinDeSemana ? enteroEntre(aleatorio, 0, 2) : enteroEntre(aleatorio, 1, 4)

      for (let n = 0; n < compras; n++) {
        const idCliente = idsCliente[enteroEntre(aleatorio, 0, idsCliente.length - 1)]
        const fecha = fechaHace(dia, enteroEntre(aleatorio, 8, 20), enteroEntre(aleatorio, 0, 59))

        const encabezado = await txn.runAsync(
          'INSERT INTO encabezado (id_cliente, fecha_venta, total) VALUES (?, ?, 0);',
          [idCliente, fecha]
        )

        const lineas = enteroEntre(aleatorio, 1, 4)
        const usados = new Set<number>()
        let total = 0

        for (let l = 0; l < lineas; l++) {
          const indice = enteroEntre(aleatorio, 0, idsProducto.length - 1)
          if (usados.has(indice) || stockActual[indice] <= 0) continue
          usados.add(indice)

          const cantidad = Math.min(enteroEntre(aleatorio, 1, 3), stockActual[indice])
          const producto = PRODUCTOS[indice]
          const subtotal = producto.venta * cantidad
          total += subtotal

          await txn.runAsync(
            `INSERT INTO detalle
               (id_encabezado, id_producto, cantidad, precio_unitario, costo_unitario, subtotal)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [
              encabezado.lastInsertRowId,
              idsProducto[indice],
              cantidad,
              producto.venta,
              producto.compra,
              subtotal
            ]
          )

          stockActual[indice] -= cantidad
        }

        if (total === 0) {
          // Compra que quedo sin lineas porque todo lo sorteado estaba agotado.
          await txn.runAsync('DELETE FROM encabezado WHERE id = ?;', [encabezado.lastInsertRowId])
          continue
        }

        await txn.runAsync('UPDATE encabezado SET total = ? WHERE id = ?;', [
          total,
          encabezado.lastInsertRowId
        ])
      }
    }

    for (let i = 0; i < idsProducto.length; i++) {
      await txn.runAsync('UPDATE producto SET stock = ? WHERE id = ?;', [
        stockActual[i],
        idsProducto[i]
      ])
    }

    // Dos productos agotados para que el panel de stock bajo tenga que mostrarlos.
    await txn.runAsync('UPDATE producto SET stock = 0 WHERE id IN (?, ?);', [
      idsProducto[11],
      idsProducto[19]
    ])
  })
}
