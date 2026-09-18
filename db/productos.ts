import type { SQLiteDatabase } from 'expo-sqlite'
import type { Producto, ProductoInput } from './tipos'

type ProductoRow = {
  id: number
  nombre: string
  descripcion: string | null
  stock: number
  precio_unitario: number
  precio_compra: number
  imagen_uri: string | null
  activo: number
}

type ProductoNormalizado = {
  nombre: string
  descripcion: string | null
  stock: number
  precioUnitario: number
  precioCompra: number
  imagenUri: string | null
}

const mapProducto = (row: ProductoRow): Producto => ({
  id: row.id,
  nombre: row.nombre,
  descripcion: row.descripcion,
  stock: row.stock,
  precioUnitario: row.precio_unitario,
  precioCompra: row.precio_compra,
  imagenUri: row.imagen_uri,
  activo: row.activo === 1
})

const normalizarProducto = (producto: ProductoInput) => ({
  nombre: producto.nombre.trim(),
  descripcion: producto.descripcion?.trim() || null,
  stock: producto.stock,
  precioUnitario: producto.precioUnitario,
  precioCompra: producto.precioCompra,
  imagenUri: producto.imagenUri?.trim() || null
})

export async function listarProductos(
  db: SQLiteDatabase,
  opciones: { incluirInactivos?: boolean; termino?: string } = {}
): Promise<Producto[]> {
  const incluirInactivos = opciones.incluirInactivos ?? false
  const termino = opciones.termino?.trim()
  const filtros: string[] = []
  const parametros: (string | number)[] = []

  if (!incluirInactivos) {
    filtros.push('activo = 1')
  }

  if (termino) {
    filtros.push('(nombre LIKE ? COLLATE NOCASE OR descripcion LIKE ? COLLATE NOCASE)')
    parametros.push(`%${termino}%`, `%${termino}%`)
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : ''
  const productos = await db.getAllAsync<ProductoRow>(
    `
      SELECT id, nombre, descripcion, stock, precio_unitario, precio_compra, imagen_uri, activo
      FROM producto
      ${where}
      ORDER BY activo DESC, nombre COLLATE NOCASE ASC;
    `,
    ...parametros
  )

  return productos.map(mapProducto)
}

export async function obtenerProductoPorId(
  db: SQLiteDatabase,
  idProducto: number
): Promise<Producto | null> {
  const producto = await db.getFirstAsync<ProductoRow>(
    `
      SELECT id, nombre, descripcion, stock, precio_unitario, precio_compra, imagen_uri, activo
      FROM producto
      WHERE id = ?;
    `,
    idProducto
  )

  return producto ? mapProducto(producto) : null
}

export async function crearProducto(db: SQLiteDatabase, producto: ProductoInput): Promise<number> {
  const datos = normalizarProducto(producto)
  validarProducto(datos)

  const resultado = await db.runAsync(
    `
      INSERT INTO producto (
        nombre,
        descripcion,
        stock,
        precio_unitario,
        precio_compra,
        imagen_uri
      )
      VALUES (?, ?, ?, ?, ?, ?);
    `,
    datos.nombre,
    datos.descripcion,
    datos.stock,
    datos.precioUnitario,
    datos.precioCompra,
    datos.imagenUri
  )

  return resultado.lastInsertRowId
}

export async function actualizarProducto(
  db: SQLiteDatabase,
  idProducto: number,
  producto: ProductoInput
): Promise<void> {
  const datos = normalizarProducto(producto)
  validarProducto(datos)

  await db.runAsync(
    `
      UPDATE producto
      SET
        nombre = ?,
        descripcion = ?,
        stock = ?,
        precio_unitario = ?,
        precio_compra = ?,
        imagen_uri = ?
      WHERE id = ?;
    `,
    datos.nombre,
    datos.descripcion,
    datos.stock,
    datos.precioUnitario,
    datos.precioCompra,
    datos.imagenUri,
    idProducto
  )
}

export async function aumentarStock(
  db: SQLiteDatabase,
  idProducto: number,
  cantidad: number
): Promise<void> {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad debe ser un entero mayor que cero.')
  }

  await db.runAsync(
    `
      UPDATE producto
      SET stock = stock + ?
      WHERE id = ?;
    `,
    cantidad,
    idProducto
  )
}

export async function cambiarEstadoProducto(
  db: SQLiteDatabase,
  idProducto: number,
  activo: boolean
): Promise<void> {
  await db.runAsync(
    `
      UPDATE producto
      SET activo = ?
      WHERE id = ?;
    `,
    activo ? 1 : 0,
    idProducto
  )
}

function validarProducto(producto: ProductoInput | ProductoNormalizado) {
  if (producto.nombre.trim().length === 0) {
    throw new Error('El nombre del producto es obligatorio.')
  }

  if (!Number.isInteger(producto.stock) || producto.stock < 0) {
    throw new Error('El stock debe ser un entero igual o mayor que cero.')
  }

  if (!Number.isFinite(producto.precioUnitario) || producto.precioUnitario < 0) {
    throw new Error('El precio unitario debe ser igual o mayor que cero.')
  }

  if (!Number.isFinite(producto.precioCompra) || producto.precioCompra < 0) {
    throw new Error('El precio de compra debe ser igual o mayor que cero.')
  }
}
