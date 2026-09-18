const FORMATO = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

export const pesos = (valor: number) => FORMATO.format(valor)

export const fechaLegible = (iso: string) => {
  const fecha = new Date(iso.replace(' ', 'T') + 'Z')
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
