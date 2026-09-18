import type { SQLiteDatabase } from 'expo-sqlite'
import type { CompraCompleta, CompraResumen, Detalle, ItemCompra } from './tipos'

/** Archivo compartido. `crearCompra` es de Camilo (C5); las consultas de
 *  lectura son de Nataly (N5), implementadas por Camilo para desbloquear C6.
 *  Nadie reordena ni reformatea el archivo. */

type FilaProducto = {
  nombre: string
  stock: number
  precio_unitario: number
  precio_compra: number
}

type FilaResumen = {
  id: number
  id_cliente: number
  fecha_venta: string
  total: number
  nombre_cliente: string
  items: number
}

type FilaDetalle = {
  id: number
  id_encabezado: number
  id_producto: number
  cantidad: number
  precio_unitario: number
  costo_unitario: number
  subtotal: number
  nombre_producto: string
}

const mapResumen = (f: FilaResumen): CompraResumen => ({
  id: f.id,
  idCliente: f.id_cliente,
  fechaVenta: f.fecha_venta,
  total: f.total,
  nombreCliente: f.nombre_cliente,
  items: f.items
})

const mapDetalle = (f: FilaDetalle): Detalle & { nombreProducto: string } => ({
  id: f.id,
  idEncabezado: f.id_encabezado,
  idProducto: f.id_producto,
  cantidad: f.cantidad,
  precioUnitario: f.precio_unitario,
  costoUnitario: f.costo_unitario,
  subtotal: f.subtotal,
  nombreProducto: f.nombre_producto
})

/**
 * HU-06: encabezado + detalles + descuento de stock, todo o nada.
 *
 * Tres decisiones que no son casuales:
 * 1. Transaccion exclusiva, no la normal: el hilo de JS es cooperativo y otro
 *    `await` podria colarse entre la validacion y el descuento.
 * 2. El stock se valida DENTRO de la transaccion. Validarlo antes deja una
 *    ventana en la que otro cliente compra las mismas unidades.
 * 3. Los precios se leen de la base, no del carrito: el cliente no decide
 *    cuanto cuesta lo que compra.
 */
export async function crearCompra(
  db: SQLiteDatabase,
  idCliente: number,
  items: ItemCompra[]
): Promise<number> {
  if (items.length === 0) {
    throw new Error('La compra no tiene productos.')
  }

  let idEncabezado = 0

  await db.withExclusiveTransactionAsync(async txn => {
    const encabezado = await txn.runAsync(
      `INSERT INTO encabezado (id_cliente, fecha_venta, total)
       VALUES (?, datetime('now'), 0);`,
      [idCliente]
    )
    idEncabezado = encabezado.lastInsertRowId

    let total = 0

    for (const item of items) {
      const producto = await txn.getFirstAsync<FilaProducto>(
        `SELECT nombre, stock, precio_unitario, precio_compra
         FROM producto
         WHERE id = ? AND activo = 1;`,
        [item.idProducto]
      )

      if (!producto) {
        throw new Error(`El producto "${item.nombre}" ya no está disponible.`)
      }
      if (item.cantidad <= 0) {
        throw new Error(`La cantidad de "${producto.nombre}" debe ser mayor a cero.`)
      }
      if (item.cantidad > producto.stock) {
        throw new Error(
          `Solo quedan ${producto.stock} unidad(es) de "${producto.nombre}".`
        )
      }

      const subtotal = producto.precio_unitario * item.cantidad
      total += subtotal

      await txn.runAsync(
        `INSERT INTO detalle
           (id_encabezado, id_producto, cantidad, precio_unitario, costo_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          idEncabezado,
          item.idProducto,
          item.cantidad,
          producto.precio_unitario,
          producto.precio_compra,
          subtotal
        ]
      )

      // El CHECK (stock >= 0) de la tabla es la ultima red: si dos compras
      // corrieran a la vez, la base rechaza la que deje el stock negativo.
      await txn.runAsync('UPDATE producto SET stock = stock - ? WHERE id = ?;', [
        item.cantidad,
        item.idProducto
      ])
    }

    await txn.runAsync('UPDATE encabezado SET total = ? WHERE id = ?;', [total, idEncabezado])
  })

  return idEncabezado
}

export async function comprasDeCliente(
  db: SQLiteDatabase,
  idCliente: number
): Promise<CompraResumen[]> {
  const filas = await db.getAllAsync<FilaResumen>(
    `
      SELECT e.id, e.id_cliente, e.fecha_venta, e.total,
             c.nombre_completo AS nombre_cliente,
             COUNT(d.id) AS items
      FROM encabezado e
      JOIN cliente c ON c.id = e.id_cliente
      LEFT JOIN detalle d ON d.id_encabezado = e.id
      WHERE e.id_cliente = ?
      GROUP BY e.id
      ORDER BY e.fecha_venta DESC;
    `,
    [idCliente]
  )
  return filas.map(mapResumen)
}

export async function todasLasCompras(db: SQLiteDatabase): Promise<CompraResumen[]> {
  const filas = await db.getAllAsync<FilaResumen>(
    `
      SELECT e.id, e.id_cliente, e.fecha_venta, e.total,
             c.nombre_completo AS nombre_cliente,
             COUNT(d.id) AS items
      FROM encabezado e
      JOIN cliente c ON c.id = e.id_cliente
      LEFT JOIN detalle d ON d.id_encabezado = e.id
      GROUP BY e.id
      ORDER BY e.fecha_venta DESC;
    `
  )
  return filas.map(mapResumen)
}

export async function compraCompleta(
  db: SQLiteDatabase,
  idEncabezado: number
): Promise<CompraCompleta> {
  const encabezado = await db.getFirstAsync<FilaResumen>(
    `
      SELECT e.id, e.id_cliente, e.fecha_venta, e.total,
             c.nombre_completo AS nombre_cliente,
             COUNT(d.id) AS items
      FROM encabezado e
      JOIN cliente c ON c.id = e.id_cliente
      LEFT JOIN detalle d ON d.id_encabezado = e.id
      WHERE e.id = ?
      GROUP BY e.id;
    `,
    [idEncabezado]
  )

  if (!encabezado) {
    throw new Error(`No existe la compra ${idEncabezado}.`)
  }

  const detalles = await db.getAllAsync<FilaDetalle>(
    `
      SELECT d.*, p.nombre AS nombre_producto
      FROM detalle d
      JOIN producto p ON p.id = d.id_producto
      WHERE d.id_encabezado = ?
      ORDER BY d.id ASC;
    `,
    [idEncabezado]
  )

  return { encabezado: mapResumen(encabezado), detalles: detalles.map(mapDetalle) }
}
