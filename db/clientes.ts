import type { SQLiteDatabase } from 'expo-sqlite'
import type { Cliente, ClienteResumen } from './tipos'

type ClienteRow = {
  id: number
  id_usuario: number
  nombre_completo: string
  fecha_nacimiento: string
  correo: string
}

type ClienteResumenRow = ClienteRow & {
  total_compras: number
  total_gastado: number | null
  ultima_compra: string | null
}

const mapCliente = (row: ClienteRow): Cliente => ({
  id: row.id,
  idUsuario: row.id_usuario,
  nombreCompleto: row.nombre_completo,
  fechaNacimiento: row.fecha_nacimiento,
  correo: row.correo
})

const mapClienteResumen = (row: ClienteResumenRow): ClienteResumen => ({
  ...mapCliente(row),
  totalCompras: row.total_compras,
  totalGastado: row.total_gastado ?? 0,
  ultimaCompra: row.ultima_compra
})

export async function listarClientes(db: SQLiteDatabase): Promise<ClienteResumen[]> {
  const clientes = await db.getAllAsync<ClienteResumenRow>(`
    SELECT
      c.id,
      c.id_usuario,
      c.nombre_completo,
      c.fecha_nacimiento,
      c.correo,
      COUNT(v.id) AS total_compras,
      COALESCE(SUM(v.total), 0) AS total_gastado,
      MAX(v.fecha_venta) AS ultima_compra
    FROM clientes c
    LEFT JOIN ventas_encabezado v ON v.id_cliente = c.id
    GROUP BY c.id
    ORDER BY c.nombre_completo COLLATE NOCASE ASC;
  `)

  return clientes.map(mapClienteResumen)
}

export async function buscarClientes(db: SQLiteDatabase, termino: string): Promise<ClienteResumen[]> {
  const busqueda = `%${termino.trim()}%`

  const clientes = await db.getAllAsync<ClienteResumenRow>(
    `
      SELECT
        c.id,
        c.id_usuario,
        c.nombre_completo,
        c.fecha_nacimiento,
        c.correo,
        COUNT(v.id) AS total_compras,
        COALESCE(SUM(v.total), 0) AS total_gastado,
        MAX(v.fecha_venta) AS ultima_compra
      FROM clientes c
      LEFT JOIN ventas_encabezado v ON v.id_cliente = c.id
      WHERE c.nombre_completo LIKE ? COLLATE NOCASE
        OR c.correo LIKE ? COLLATE NOCASE
      GROUP BY c.id
      ORDER BY c.nombre_completo COLLATE NOCASE ASC;
    `,
    busqueda,
    busqueda
  )

  return clientes.map(mapClienteResumen)
}

export async function obtenerClientePorId(
  db: SQLiteDatabase,
  idCliente: number
): Promise<Cliente | null> {
  const cliente = await db.getFirstAsync<ClienteRow>(
    `
      SELECT id, id_usuario, nombre_completo, fecha_nacimiento, correo
      FROM clientes
      WHERE id = ?;
    `,
    idCliente
  )

  return cliente ? mapCliente(cliente) : null
}
