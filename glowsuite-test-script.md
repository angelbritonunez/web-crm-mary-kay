# GlowSuite — Guía de Pruebas

Marca cada punto con ✅ si funciona bien, o anota qué pasó si algo falla.

---

## Antes de empezar

- [ ] La aplicación está abierta en el navegador
- [ ] Tienes tu usuario y contraseña a la mano

---

## 1. Entrar y salir de la app

- [ ] Entrar con usuario y contraseña correctos → debe ir al Dashboard
- [ ] Intentar entrar con contraseña incorrecta → debe mostrar un mensaje de error
- [ ] Cerrar sesión desde el menú de usuario (esquina superior derecha) → debe regresar al login
- [ ] Intentar entrar a `/dashboard` sin estar logueada → debe redirigir al login

---

## 2. Dashboard (pantalla principal)

- [ ] La pantalla carga sin errores
- [ ] Aparece tu nombre en el saludo de bienvenida
- [ ] En el hero aparecen: mensajes del día, ventas del mes, ingresos y ganancia
- [ ] Si tienes una meta mensual configurada, aparece la barra de progreso debajo del hero
- [ ] Si tienes seguimientos vencidos, aparece el aviso rosa con el conteo → al tocarlo va a la pestaña Seguimientos
- [ ] Si tienes ventas con saldo pendiente, aparece el aviso naranja de cuentas por cobrar → al tocarlo va a la pestaña Cobros
- [ ] En "Seguimientos del día" aparecen los primeros 3 más urgentes con nombre, tipo (2 días / 2 semanas / 2 meses) y mensaje
- [ ] Cada card muestra el badge de estado de la clienta (Cliente / Prospecto)
- [ ] El botón "Enviar por WhatsApp" abre el chat con el mensaje listo
- [ ] El botón "Editar mensaje" muestra un campo de texto con el mensaje
- [ ] Al guardar el mensaje editado, la card se actualiza sin recargar la página
- [ ] El botón "Marcar enviado" elimina la card del mini-listado del Dashboard
- [ ] Si hay más de 3, aparece el link "Ver X más" que lleva a /followups
- [ ] La columna derecha muestra las últimas clientas registradas con su estado (Cliente / Prospecto)
- [ ] Al tocar una clienta de la lista va a su perfil

---

## 3. Clientas

### Ver la lista
- [ ] Al entrar a Clientes aparece toda tu lista
- [ ] El contador del encabezado muestra el número correcto de clientas y prospectos
- [ ] Buscar por nombre funciona
- [ ] Al tocar una clienta va a su perfil

### Filtrar por estado
- [ ] El selector de filtro muestra las opciones: Todos / Cliente / Prospecto
- [ ] Al seleccionar "Cliente" solo aparecen clientas con estado Cliente
- [ ] Al seleccionar "Prospecto" solo aparecen las prospectos
- [ ] Al seleccionar "Todos" vuelve a mostrar la lista completa
- [ ] El filtro y la búsqueda por nombre funcionan juntos

### Agregar una clienta nueva
- [ ] Llenar nombre, teléfono, tipo de piel y guardar
- [ ] Intentar guardar sin seleccionar tipo de piel → debe pedir que lo selecciones
- [ ] Después de guardar, va directo al perfil de la clienta recién creada
- [ ] No existe la opción "Dejar para después" al crear clientas

### Editar una clienta
- [ ] Cambiar el nombre o teléfono de una clienta y guardar
- [ ] Aparece el mensaje de confirmación "Cambios guardados"
- [ ] Al recargar la página los cambios siguen ahí

### Eliminar una clienta
- [ ] Al confirmar la eliminación, regresa a la lista
- [ ] La clienta ya no aparece en la lista

---

## 4. Registrar una venta

- [ ] Los productos cargan correctamente en el formulario
- [ ] Puedes buscar un producto por nombre
- [ ] Puedes filtrar por categoría (Skincare / Makeup)
- [ ] Al agregar productos el total se actualiza solo
- [ ] Puedes buscar y seleccionar una clienta
- [ ] Aplicar un descuento ajusta el total correctamente
- [ ] **Venta pagada completa:** registrar y confirmar que va a la pantalla de ventas
- [ ] **Venta con abono parcial:**
  - [ ] Seleccionar "Abono parcial" e ingresar un monto menor al total
  - [ ] Aparece el saldo pendiente antes de guardar
  - [ ] Al guardar, la venta queda con estado "Abono parcial"
- [ ] Agregar una nota y fecha → aparecen en el historial de la clienta

---

## 5. Historial de ventas de una clienta

- [ ] En el perfil de la clienta, la pestaña "Historial de ventas" muestra sus compras
- [ ] Las ventas pagadas tienen el badge verde "Pagado"
- [ ] Las ventas con abono tienen el badge naranja "Abono parcial" y muestra el saldo pendiente
- [ ] Las ventas sin pago tienen el badge amarillo "Pendiente"
- [ ] Puedes registrar un abono desde el historial
- [ ] Cuando el abono cubre el total, la venta cambia a "Pagado"

---

## 6. Seguimientos de una clienta

- [ ] En el perfil de la clienta, la pestaña "Seguimientos" muestra los recordatorios
- [ ] Aparecen los 3 seguimientos (2 días, 2 semanas, 2 meses)
- [ ] Los vencidos aparecen marcados en rojo
- [ ] Los enviados aparecen marcados en verde

---

## 7. Workspace de Seguimientos y Cobros (/followups)

Esta pantalla tiene dos pestañas en una sola vista.

### Pestaña: Seguimientos 2+2+2
- [ ] La pestaña muestra el conteo de seguimientos pendientes en el badge rosa
- [ ] Puedes filtrar por: Todos / Vencidos / Hoy / Próximos
- [ ] El filtro "Vencidos" aparece resaltado en rosa si hay seguimientos vencidos
- [ ] Cada tarjeta muestra: nombre de la clienta, teléfono, tipo de seguimiento (2 días / 2 semanas / 2 meses), fecha y mensaje
- [ ] Cada tarjeta muestra el badge del estado de la clienta (Cliente / Prospecto)
- [ ] Los seguimientos vencidos tienen el badge "Vencido" en rosa
- [ ] Los seguimientos de hoy tienen el badge "Hoy" en amarillo
- [ ] El botón "Editar mensaje" abre un campo de texto para modificar el mensaje
- [ ] Al guardar el mensaje editado, la tarjeta se actualiza sin recargar la página
- [ ] El botón "Enviar por WhatsApp" abre una conversación con el mensaje listo para enviar
- [ ] El botón "Marcar enviado" elimina el seguimiento de la lista

### Pestaña: Cobros pendientes
- [ ] La pestaña muestra el conteo de cobros pendientes en el badge naranja
- [ ] Aparece el resumen: total de ventas con saldo y monto total adeudado
- [ ] Cada tarjeta muestra: nombre de la clienta, teléfono, fecha de compra, saldo pendiente, total de la venta y estado (Sin pago / Abono parcial)
- [ ] Cada tarjeta muestra el badge **"Cliente"**
- [ ] Cada tarjeta muestra el preview del mensaje de cobro
- [ ] El botón "Editar mensaje" abre un campo de texto para modificar el mensaje de cobro
- [ ] Al guardar el mensaje editado, la tarjeta se actualiza sin recargar la página
- [ ] El botón "Enviar cobro por WhatsApp" abre WhatsApp con el mensaje (editado o por defecto)
- [ ] El botón "Registrar abono" abre un formulario inline con campo de monto y selector de método (Efectivo / Transferencia)
- [ ] El monto del abono no puede superar el saldo pendiente
- [ ] Al guardar el abono, el saldo se actualiza en la tarjeta sin recargar la página
- [ ] Cuando el abono salda la deuda completa, la tarjeta desaparece de la lista
- [ ] Si no hay cobros pendientes, aparece el mensaje "¡Sin cobros pendientes!"

---

## 8. Métricas

- [ ] La pantalla de Métricas carga sin errores
- [ ] Puedes cambiar entre Esta semana / Este mes / Mes anterior / Este año
- [ ] Los números de ingresos, ganancia y ventas se ven correctos
- [ ] La gráfica de ingresos se muestra
- [ ] Aparecen los productos más vendidos
- [ ] Aparece el desglose por método de pago
- [ ] En "Este mes", si tienes meta configurada, aparece la barra de progreso

---

## 9. Mi perfil

- [ ] Puedes editar tu nombre y teléfono y guardar correctamente
- [ ] Puedes configurar una meta mensual en RD$ y guardarla
- [ ] La meta aparece reflejada en el Dashboard y en Métricas

---

## 10. Flujo completo — prospecto sin venta (ciclo 2+2+2)

Prueba el ciclo de seguimiento para una prospecto nueva sin venta registrada:

1. [ ] Crea una clienta nueva como **Prospecto** con seguimientos activados
2. [ ] Entra al perfil → pestaña Seguimientos → confirma que tiene 3 seguimientos generados (2 días, 2 semanas, 2 meses)
3. [ ] Ve a /followups → pestaña Seguimientos → encuentra los seguimientos de esa prospecto
4. [ ] Confirma que las tarjetas muestran el badge **"Prospecto"**
5. [ ] Edita el mensaje de uno de los seguimientos y guárdalo
6. [ ] Marca el seguimiento como enviado → desaparece de la lista

---

## 11. Flujo completo — venta con crédito (prueba final)

Haz esta prueba como si fuera una venta real:

1. [ ] Crea una clienta nueva como prospecto
2. [ ] Regístrala una venta con abono parcial
3. [ ] Entra al perfil de la clienta y confirma que ahora aparece como **"Cliente"**
4. [ ] Confirma que tiene 3 seguimientos generados automáticamente
5. [ ] Entra a /followups → pestaña Seguimientos, encuentra el seguimiento de esa clienta
6. [ ] Confirma que la tarjeta muestra el badge **"Cliente"**
7. [ ] Edita el mensaje del seguimiento y guárdalo
8. [ ] Marca el seguimiento como enviado → desaparece de la lista
9. [ ] Ve a la pestaña Cobros → confirma que aparece la venta con saldo pendiente y badge **"Cliente"**
10. [ ] Registra un abono que salde la deuda completa → la tarjeta desaparece
11. [ ] Regresa al perfil de la clienta y confirma que la venta cambió a "Pagado"
12. [ ] Entra a Métricas y confirma que la venta aparece en "Este mes"
13. [ ] Verifica que el Dashboard ya no muestra la alerta de cobros pendientes para esa clienta

---

**Si algo no funciona como se describe, anota en qué paso pasó y qué mensaje apareció.**
