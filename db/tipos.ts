export type RolUsuario = 'cliente' | 'administrador'

export type Cliente = {
  id: number
  idUsuario: number
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
