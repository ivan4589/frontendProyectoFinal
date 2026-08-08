# Publicación y monitoreo del frontend

## Configuración

La compilación de producción requiere `VITE_API_URL` con una URL HTTPS absoluta. `VITE_MONITORING_URL` es opcional y debe apuntar a un recolector HTTPS que acepte JSON sin secretos embebidos. `VITE_RELEASE` debe identificar de forma inmutable la versión desplegada, por ejemplo el SHA del commit.

Las variables `VITE_` son públicas: nunca colocar en ellas contraseñas, tokens, DSN privados ni credenciales. Generar el artefacto con `npm ci`, `npm run lint:production`, `npm test` y `npm run build`. El lint global heredado conserva hallazgos anteriores y debe corregirse en un cambio independiente para no ocultar la revisión funcional de esta fase.

## Manejo de errores

- El límite global de React muestra una recuperación segura ante errores de renderizado.
- Los errores no controlados, promesas rechazadas, consultas y mutaciones fallidas se reportan al endpoint configurado con límite de frecuencia.
- Las solicitudes incluyen `X-Request-Id`; los errores del backend pueden correlacionarse con sus logs usando esa misma cabecera.
- La interfaz muestra acceso denegado cuando el rol no posee el permiso requerido. La autorización real continúa aplicándose en el backend.

El reporte no incluye tokens, cookies ni cuerpos de solicitudes. El proveedor de monitoreo debe aplicar retención, control de acceso y eliminación de datos sensibles.

## Configuración del hosting

Servir únicamente por HTTPS y hacer fallback de rutas a `index.html`. Configurar como mínimo:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
```

Ajustar `connect-src`, `img-src`, `font-src` y `style-src` de la política CSP a los dominios realmente usados por la aplicación. Los mapas de fuente se generan ocultos: subirlos al proveedor de monitoreo y excluirlos del artefacto público.

El archivo `vercel.json` configura el fallback de React Router, caché inmutable para assets versionados y encabezados de seguridad. En Vercel se debe definir `VITE_API_URL=https://api.yungasdistribuidora.cc` y un `VITE_RELEASE` inmutable antes de construir.

## Validación previa y alertas

Probar cada ruta con ADMIN, VENDEDOR y COBRADOR; confirmar que el menú y el enrutador coinciden con la matriz, y que el backend devuelve 403 aunque se invoque manualmente una ruta prohibida. Abrir dos pestañas y repetir una operación económica con la misma clave para comprobar idempotencia.

Alertar por aumento de errores de renderizado, errores de red sostenidos, respuestas 5xx y versiones del frontend que apunten a una API distinta de la autorizada.
