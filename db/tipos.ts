export type RolUsuario = 'cliente' | 'administrador'

export type EstadoCuenta = 'pendiente' | 'activo' | 'inactivo'

/** HU-01, HU-02, HU-03. El rol es null mientras la cuenta esta pendiente. */
export type Cuenta = {
  id: number
  correo: string
  rol: RolUsuario | null
  estado: EstadoCuenta
}

export type Solicitud = {
  id: number
  correo: string
  creadoEn: string
}

export type Cliente = {
  id: number
  idLogin: number
  nombreCompleto: string
  fechaNacimiento: string
  correo: string
}

export type ClienteResumen = Cliente & {
  totalCompras: number
  totalGastado: number
  ultimaCompra: string | null
}

export type Producto = {
  id: number
  nombre: string
  descripcion: string | null
  stock: number
  precioUnitario: number
  precioCompra: number
  imagenUri: string | null
  activo: boolean
}

export type ProductoInput = {
  nombre: string
  descripcion?: string
  stock: number
  precioUnitario: number
  precioCompra: number
  imagenUri?: string | null
}

export type ItemCompra = {
  idProducto: number
  nombre: string
  cantidad: number
  precioUnitario: number
  precioCompra: number
}

export type Encabezado = {
  id: number
  idCliente: number
  fechaVenta: string
  total: number
}

export type Detalle = {
  id: number
  idEncabezado: number
  idProducto: number
  cantidad: number
  precioUnitario: number
  costoUnitario: number
  subtotal: number
}

export type CompraResumen = Encabezado & {
  nombreCliente: string
  items: number
}

export type CompraCompleta = {
  encabezado: CompraResumen
  detalles: (Detalle & { nombreProducto: string })[]
}

export type ResumenTienda = {
  compras: number
  ingresos: number
  ganancia: number
  clientes: number
  productosBajoStock: number
}
