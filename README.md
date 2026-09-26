# 🍰 Pastelería Barriguitas - Experiencia Web Interactiva

Sitio web oficial e interactivo para **Pastelería Barriguitas**. Permite a los clientes explorar productos artesanales, armar su pastel o pedido interactivo paso a paso, calcular presupuestos y señas del 50%, ver galería de fotos, leer y publicar reseñas verificadas estilo Google Maps, consultar promociones semanales y coordinar pedidos directamente por WhatsApp.

---

## ✨ Características Principales

1. **🎨 Minijuego Interactivo de Pasteles:**
   - Selección dinámica de productos (Pasteles temáticos, Tartas artesanales, Galletas y dulces, Boxes de degustación).
   - Elección de tamaños por kilo con cálculo automático de precios.
   - Selección de rellenos y coberturas.
   - Decoraciones temáticas: Granja mágica, Rayas y flores, 15 Años, Bodas elegantes.
2. **🚚 Módulo de Entrega y Presupuesto:**
   - Envío a domicilio en moto vs. Retiro en taller.
   - Cálculo automático de seña del 50%.
   - Coordinación inmediata por WhatsApp con mensaje preformateado o pago de seña online.
3. **📸 Galería de Pasteles con Carrusel:**
   - Visualización de 3 creaciones simultáneas en PC y 1 en móvil.
   - Filtros por categoría (Infantiles, Adultos, 15 Años, Bodas).
   - Navegación interactiva con flechas y paginación por puntos.
4. **⭐ Reseñas Google Maps:**
   - Carrusel de comentarios con calificación 4.9 estrellas.
   - Rotación automática de 5 segundos con barra de progreso interactiva.
   - Formulario público para que los clientes agreguen nuevas opiniones.
5. **🎁 Combos y Promociones Semanales:**
   - Promociones destacadas con cálculo de ahorro y botón directo a WhatsApp.
6. **📱 Experiencia Móvil Optimizada:**
   - Encabezado minimalista con la marca y menú hamburguesa desplegable.
   - Orden intuitivo de navegación y enlaces directos a Instagram y Facebook.
   - Favicon personalizado con la mascota de Barriguitas.
7. **🔐 Panel de Administración (dmin.html):**
   - Acceso privado y encriptado con SHA-256 (Usuario: dmin / Clave: arriguitas2026).
   - Configuración de precio del kilo de pastel con cálculo automático de todos los tamaños.
   - Gestión de promociones, galería y reseñas.
   - Sincronización en la nube con Firebase Firestore mediante una API protegida.

---

## 🚀 Despliegue en GitHub Pages

Para publicar esta web gratis en GitHub Pages:
1. Ir a **Settings** en el repositorio de GitHub.
2. En la sección **Pages** (lateral izquierdo):
   - **Source**: Seleccionar Deploy from a branch.
   - **Branch**: master (o main), carpeta /pasteleria (o /root si se crea un redirect).
3. Guardar y tu sitio estará en línea en minutos.

## 🔐 Configuración de Firebase

La aplicación ya no conecta la base de datos desde el navegador ni muestra SQL en el panel.

- Las lecturas públicas y los envíos de reseñas/pedidos pasan por `api/data.js`.
- Las escrituras administrativas requieren un token de Firebase Authentication con el custom claim `admin: true`.
- La colección `barriguitas_fillings` se inicializa en Firestore con el catálogo inicial la primera vez que se consulta y se administra desde la pestaña Rellenos del panel.
- La API devuelve al público solo rellenos activos; el panel autenticado puede crear, activar, ocultar y eliminar rellenos.
- Las promociones almacenan su imagen opcional en `image_url`, gestionable desde el panel. El ajuste `delivery` de `barriguitas_store_settings` controla si el cliente puede elegir envío a domicilio.
- Las credenciales del SDK Admin solo se configuran en el servidor mediante las variables de `.env.example`; nunca se deben subir al repositorio.
- Publica `firestore.rules` para impedir accesos directos al proyecto; la API usa el SDK Admin y no queda limitada por esas reglas.
- El despliegue debe soportar funciones Node (por ejemplo, Vercel). GitHub Pages por sí solo solo sirve archivos estáticos y no puede ejecutar `/api`.

Para configurar el panel:

1. Crea un usuario administrador en Firebase Authentication.
2. Asigna el custom claim `admin: true` usando un entorno seguro con Firebase Admin SDK.
3. Configura las variables de `.env.example` en el proveedor de despliegue.
4. Instala dependencias con `npm install` y despliega.

El proyecto Firebase asociado es `barriguita-dda93` (también está declarado en `.firebaserc`). Esto permite desplegar las reglas con `firebase deploy --only firestore:rules` después de iniciar sesión con Firebase CLI.

Los cambios guardados desde el panel se escriben en Firestore y quedan disponibles para todos los visitantes. `localStorage` solo conserva una copia local para mejorar la experiencia cuando la API no responde; el panel muestra un error y no debe considerarse guardado en la nube hasta que la operación termine correctamente.
