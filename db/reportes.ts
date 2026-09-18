import type { SQLiteDatabase } from 'expo-sqlite'
import type { Producto, ResumenTienda } from './tipos'

/** N5 — Nataly, implementado por Camilo para desbloquear C8.
 *  Las agregaciones se hacen en SQL, nunca sumando en JavaScript. */

type FilaProducto = {
  id: number
  nombre: string
  descripcion: string | null
  stock: number
  precio_unitario: number
  precio_compra: number
  imagen_uri: string | null
  activo: number
}

export async function resumenTienda(db: SQLiteDatabase): Promise<ResumenTienda> {
  const ventas = await db.getFirstAsync<{
    compras: number
    ingresos: number | null
    ganancia: number | null
  }>(
    `
      SELECT COUNT(DISTINCT e.id) AS compras,
             SUM(d.subtotal) AS ingresos,
             SUM(d.subtotal - (d.costo_unitario * d.cantidad)) AS ganancia
      FROM encabezado e
      JOIN detalle d ON d.id_encabezado = e.id;
    `
  )

  const clientes = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM cliente;'
  )

  const bajoStock = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM producto WHERE stock <= 5 AND activo = 1;'
  )

  return {
    compras: ventas?.compras ?? 0,
    ingresos: ventas?.ingresos ?? 0,
    ganancia: ventas?.ganancia ?? 0,
    clientes: clientes?.total ?? 0,
    productosBajoStock: bajoStock?.total ?? 0
  }
}

export async function productosBajoStock(db: SQLiteDatabase, limite = 5): Promise<Producto[]> {
  const filas = await db.getAllAsync<FilaProducto>(
    `
      SELECT * FROM producto
      WHERE stock <= ? AND activo = 1
      ORDER BY stock ASC, nombre COLLATE NOCASE ASC;
    `,
    [limite]
  )

  return filas.map(f => ({
    id: f.id,
    nombre: f.nombre,
    descripcion: f.descripcion,
    stock: f.stock,
    precioUnitario: f.precio_unitario,
    precioCompra: f.precio_compra,
    imagenUri: f.imagen_uri,
    activo: f.activo === 1
  }))
}
