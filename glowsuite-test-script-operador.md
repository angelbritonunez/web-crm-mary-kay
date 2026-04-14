# GlowSuite — Guía de Pruebas: Operador

Marca cada punto con ✅ si funciona bien, o anota qué pasó si algo falla.

> Este script es exclusivo para el rol **operador**.

---

## Antes de empezar

- [ ] La aplicación está abierta en el navegador
- [ ] Estás logueada con tu cuenta de operador

---

## 1. Acceso y restricciones

- [ ] Puedes iniciar sesión correctamente
- [ ] Al entrar, la app te lleva directo a `/admin/users` (no al Dashboard)
- [ ] Intentar entrar a `/dashboard`, `/clients`, `/sales`, `/followups` o `/metrics` te redirige (no tienes acceso)
- [ ] Intentar entrar a `/admin` te redirige (esa ruta es solo para el admin)
- [ ] Sí puedes acceder a tu `/profile`

---

## 2. Gestión de usuarios (/admin/users)

- [ ] La pantalla carga sin errores
- [ ] Aparecen los KPIs: total registrados, activos, inactivos
- [ ] El buscador por nombre funciona para filtrar la tabla
- [ ] La tabla muestra **solo consultoras** (no aparecen operadores ni admins)
- [ ] Cada fila muestra: nombre, email, rol, días de membresía, último acceso, fecha de registro, estado (toggle), notas y acciones

### Crear consultora
- [ ] El botón "Nuevo usuario" abre el formulario
- [ ] El formulario solo muestra el rol "Consultora" (no aparecen otras opciones)
- [ ] Intentar guardar sin email o nombre → muestra mensaje de error
- [ ] Intentar guardar sin teléfono → muestra mensaje de error
- [ ] Al crear correctamente, aparece un modal con las credenciales (email y contraseña temporal)
- [ ] El modal tiene el botón "Enviar por WhatsApp" que abre el chat con el mensaje de bienvenida y las credenciales listas
- [ ] La nueva consultora aparece en la tabla

### Activar / Desactivar
- [ ] El toggle activa o desactiva una consultora correctamente
- [ ] Al activar una consultora, el contador de días de membresía se reinicia a 30

### Resetear contraseña
- [ ] El botón "Reset contraseña" en la fila genera una nueva contraseña temporal
- [ ] La contraseña aparece inline en la tabla, junto a un botón para ocultarla (×)

### Notas
- [ ] Al hacer clic en el campo de notas de una consultora, puedes escribir o editar el texto
- [ ] Al presionar Enter o hacer clic fuera del campo, la nota se guarda

### Restricciones
- [ ] No aparece el botón "Eliminar" para ningún usuario
- [ ] No puedes crear usuarios con otro rol que no sea consultora

---

**Si algo no funciona como se describe, anota en qué paso pasó y qué mensaje apareció.**
