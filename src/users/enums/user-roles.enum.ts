export enum UserRole {
  // Roles de la aplicación (Web/Cliente)
  CLIENT = 'CLIENT', // Usuario estándar que compra tours/productos.

  // Roles de Administración (Panel)
  ADMIN = 'ADMIN', // Acceso total a todas las funciones (pedidos, tours, productos, otros usuarios).
  EDITOR = 'EDITOR', // Puede gestionar tours, productos y contenido (sin modificar roles o ajustes críticos).
  SUPPORT = 'SUPPORT', // Acceso para ver pedidos y atender consultas de clientes.
}
