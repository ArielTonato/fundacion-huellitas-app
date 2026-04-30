# Plan — Fase 5: Módulo de Mascotas Extraviadas (Reportes)

## Context

El proyecto Fundación Huellitas tiene completas las Fases 1–4 (auth, módulo adopción) y la Fase 6 (IA generativa). Falta implementar la **Fase 5: módulo de reportes de mascotas extraviadas** (RF-06, RF-07, RF-08).

**Estado actual descubierto en la exploración:**
- `src/modules/mascotas/` existe con subcarpetas (`components`, `hooks`, `schemas`, `services`) **vacías**.
- Las 7 rutas de pantallas (`app/(adoptante)/reportes/*` + `app/(personal)/(tabs)/reportes/*`) existen como **stubs/placeholders**.
- El tipo `Reporte` y `EstadoReporte` ya están definidos en [src/shared/types/models.ts:20,85-100](src/shared/types/models.ts#L85-L100).
- Las reglas de Firestore (`reportes/*`) y Storage (`reportes/{id}/*`) ya están configuradas en [firestore.rules:61-67](firestore.rules#L61) y [storage.rules:32-35](storage.rules#L32).
- Las dependencias necesarias ya están instaladas: `react-native-maps`, `expo-location`, `@react-native-firebase/messaging`, `expo-image-picker`.
- La infraestructura cliente FCM existe en [src/shared/services/notifications/fcm.ts](src/shared/services/notifications/fcm.ts) **pero nunca se llama** — el `fcmToken` jamás se guarda en `users/{uid}`.
- Las tabs de `reportes/index` ya están registradas en ambos layouts; las rutas hijas (`reportar`, `mapa`, `[id]`) están con `href: null` (ocultas hasta que se implementen).
- No existe `functions/src/notifications.ts`.
- El módulo `adopcion` provee patrones **directamente reutilizables** (servicios, hooks, formularios, schemas).

**Decisiones tomadas con el usuario:**
1. **Solo adoptantes crean reportes** — el personal solo gestiona (lista + mapa + detalle).
2. **Notificación a todos los usuarios autenticados con `fcmToken`** (excluyendo al reportador) — pragmático para MVP de fundación local; se puede evolucionar a geohash después.
3. **Agregar `whatsapp: '#25D366'` a `colors.ts`** — mantiene la convención de no hardcodear hex.

---

## Arquitectura

**Backend (Cloud Function):**
- `functions/src/notifications.ts` — trigger `onDocumentCreated` en `reportes/{reporteId}` que envía FCM multicast a todos los users con `fcmToken` (excluyendo `reportadoPor`).

**Cliente — capas (basadas en patrones de `src/modules/adopcion/`):**
1. **Schema** — validación Yup con cross-validation.
2. **Service** — CRUD + lógica de negocio (límite 14 días, cambio de estado).
3. **Hooks** — `onSnapshot` real-time para lista y doc singular.
4. **Componentes** — formulario, card, mapa.
5. **Pantallas** — 4 adoptante + 3 personal (reemplazan stubs).
6. **Setup FCM** — registrar `fcmToken` post-login.
7. **Layout** — exponer rutas ocultas con `href: null`.

---

## Archivos a crear/modificar

### A. Theme
- **MODIFICAR** [src/theme/colors.ts](src/theme/colors.ts)
  - Agregar `whatsapp: '#25D366'`.

### B. Schema — validación
- **CREAR** `src/modules/mascotas/schemas/reporteSchema.ts`
  - Patrón: copiar el cross-validation de [animalSchema.ts:15-24](src/modules/adopcion/schemas/animalSchema.ts#L15) y [solicitudSchema.ts:19-25](src/modules/adopcion/schemas/solicitudSchema.ts#L19).
  - Campos según [models.ts:85-100](src/shared/types/models.ts#L85): `nombre` (req), `especie` (oneOf), `descripcion` (min 20), `fotos` (array min 1, max 3), `ultimaUbicacion` (lat/lng/dirección requeridos), `telefonoContacto` (regex `/^[0-9]{10}$/`).

### C. Service — `reportesService.ts`
- **CREAR** `src/modules/mascotas/services/reportesService.ts`
  - Reusar [storage.ts:33-43 `uploadMultipleImages`](src/shared/services/firebase/storage.ts#L33) con metadata `{ uploadedBy: uid }` (igual que [solicitudesService.ts:30-33](src/modules/adopcion/services/solicitudesService.ts#L30)).
  - Funciones:
    - `crearReporte(data, reportadoPor)` — valida límite 14 días → sube fotos → `setDoc` con `serverTimestamp()` y `estado: 'activo'`.
    - `verificarLimite14Dias(uid)` — query `where('reportadoPor', '==', uid).where('creadoEn', '>=', hace14Dias).limit(1)`. Si existe, lanza error con días restantes.
    - `marcarComoResuelto(reporteId)` — `updateDoc` a `estado: 'resuelto'` (las rules ya validan que sea el creador).

### D. Hooks
- **CREAR** `src/modules/mascotas/hooks/useReportes.ts`
  - Copiar patrón de [useAnimales.ts:52-90](src/modules/adopcion/hooks/useAnimales.ts#L52).
  - Query base: `where('estado', '==', 'activo').orderBy('creadoEn', 'desc')`.
  - Filtro cliente opcional para texto de búsqueda (no indexable).
- **CREAR** `src/modules/mascotas/hooks/useReporte.ts`
  - Copiar patrón de [useAnimal.ts:11-40](src/modules/adopcion/hooks/useAnimal.ts#L11).

### E. Componentes
- **CREAR** `src/modules/mascotas/components/ReporteForm.tsx`
  - Copiar estructura de [AnimalRegistrationForm.tsx](src/modules/adopcion/components/AnimalRegistrationForm.tsx) (RHF + yupResolver + image picker múltiple max 3).
  - Reusar `FormField` ([src/shared/components/FormField.tsx](src/shared/components/FormField.tsx)).
  - Pre-fill de ubicación con `expo-location` (`Location.requestForegroundPermissionsAsync` + `Location.getCurrentPositionAsync` + `Location.reverseGeocodeAsync` para dirección).
  - Map pin picker embebido (`MapView` con `onPress` que actualiza `ultimaUbicacion`).
- **CREAR** `src/modules/mascotas/components/ReporteCard.tsx`
  - Patrón de [AnimalCard.tsx](src/modules/adopcion/components/AnimalCard.tsx).
  - Muestra `fotos[0]`, nombre, especie, dirección truncada, fecha relativa.
- **CREAR** `src/modules/mascotas/components/MapaReportes.tsx`
  - `MapView` (react-native-maps) full-screen.
  - `Marker` por cada reporte activo con callout (nombre + "ver detalle" → router.push a `[id]`).

### F. Pantallas adoptante (reemplazar stubs)
- **REESCRIBIR** [app/(adoptante)/reportes/index.tsx](app/(adoptante)/reportes/index.tsx)
  - Header con TextInput búsqueda + botones flotantes "Mapa" y "Reportar".
  - `FlatList` con `ReporteCard`, `RefreshControl`, `EmptyState` cuando vacío.
- **REESCRIBIR** [app/(adoptante)/reportes/reportar.tsx](app/(adoptante)/reportes/reportar.tsx)
  - Renderiza `ReporteForm`. Al submit exitoso → `Alert` + `router.replace('/reportes')`.
- **REESCRIBIR** [app/(adoptante)/reportes/mapa.tsx](app/(adoptante)/reportes/mapa.tsx)
  - Renderiza `MapaReportes` consumiendo `useReportes()`.
- **REESCRIBIR** [app/(adoptante)/reportes/[id].tsx](app/(adoptante)/reportes/[id].tsx)
  - Carrusel de fotos, datos completos, mapa pequeño con marker.
  - Botón **"Contactar por WhatsApp"** color `Colors.whatsapp`. URL: `https://wa.me/593${telefono.replace(/^0/, '')}` con `Linking.openURL`.
  - Botón **"Mascota encontrada"** visible solo si `reporte.reportadoPor === authUser.uid`. Confirmación + `marcarComoResuelto`.

### G. Pantallas personal (reemplazar stubs)
- **REESCRIBIR** [app/(personal)/(tabs)/reportes/index.tsx](app/(personal)/(tabs)/reportes/index.tsx)
  - Lista con `ReporteCard`, sin botón "Reportar" (personal no crea).
  - Botones "Mapa" y búsqueda igual que adoptante.
- **REESCRIBIR** [app/(personal)/(tabs)/reportes/mapa.tsx](app/(personal)/(tabs)/reportes/mapa.tsx) — idéntico al de adoptante.
- **REESCRIBIR** [app/(personal)/(tabs)/reportes/[id].tsx](app/(personal)/(tabs)/reportes/[id].tsx)
  - Detalle + botón WhatsApp; sin botón "Mascota encontrada" (personal no es el creador, las rules lo bloquearían).

### H. Layouts (exponer rutas)
- **MODIFICAR** [app/(adoptante)/_layout.tsx](app/(adoptante)/_layout.tsx)
  - `reportes/reportar`, `reportes/mapa`, `reportes/[id]` ya están con `href: null` (correcto — siguen ocultas, se acceden vía `router.push`).
  - **Sin cambios** en el layout — solo verificar que las rutas siguen presentes.
- **MODIFICAR** [app/(personal)/(tabs)/_layout.tsx](app/(personal)/(tabs)/_layout.tsx) — idem, no requiere cambios.

### I. FCM client setup
- **MODIFICAR** [src/shared/hooks/useAuth.tsx](src/shared/hooks/useAuth.tsx)
  - Después de cargar `userProfile` en `onAuthStateChanged`: llamar `requestNotificationPermission()` y `registerFcmToken(uid)` ([fcm.ts:13,22](src/shared/services/notifications/fcm.ts#L13)). Suscribir `onFcmTokenRefresh` y limpiar en cleanup.
  - En `signOut`: opcionalmente borrar el `fcmToken` del documento (`updateDocument('users', uid, { fcmToken: null })`).

### J. Cloud Function — notificaciones
- **CREAR** `functions/src/notifications.ts`
  - Trigger: `onDocumentCreated('reportes/{reporteId}')` (firebase-functions v2).
  - Inicializa admin app (mismo patrón que [eliminarCuenta.ts:7-9](functions/src/eliminarCuenta.ts#L7)).
  - Lee `reportadoPor` y datos del reporte.
  - Query `users` `where('fcmToken', '!=', null)` (filtra `reportadoPor` en código).
  - Construye `MulticastMessage` con título "Mascota extraviada" + body con nombre y especie.
  - Envía con `getMessaging().sendEachForMulticast(...)` en chunks de 500 tokens si fueran muchos.
  - Limpia tokens inválidos del response (best-effort: borrar `fcmToken` de users que dieron error).
- **MODIFICAR** [functions/src/index.ts](functions/src/index.ts)
  - Agregar `export { notificarReporte } from './notifications.js';`.

### K. Índices Firestore (declaración)
- **MODIFICAR** `firestore.indexes.json` (crear si no existe)
  - Índice composto: `reportes` → `estado` ASC + `creadoEn` DESC (lista activa).
  - Índice composto: `reportes` → `reportadoPor` ASC + `creadoEn` DESC (límite 14 días).
- Si el archivo no existe, Firebase lo creará automáticamente al detectar la query y mostrará un link en consola; documentar en el commit que el deploy debe correr `firebase deploy --only firestore:indexes`.

---

## Patrones reutilizados (no reimplementar)

| Necesidad | Reusar de |
|---|---|
| Subir fotos con metadata `uploadedBy` | [storage.ts:33-43](src/shared/services/firebase/storage.ts#L33) + [solicitudesService.ts:30-33](src/modules/adopcion/services/solicitudesService.ts#L30) |
| Hook `onSnapshot` con loading/error | [useAnimales.ts:52-90](src/modules/adopcion/hooks/useAnimales.ts#L52) |
| Cross-validation Yup | [solicitudSchema.ts:19-25](src/modules/adopcion/schemas/solicitudSchema.ts#L19) |
| Image picker múltiple con RHF | [AnimalRegistrationForm.tsx:150-176](src/modules/adopcion/components/AnimalRegistrationForm.tsx#L150) |
| `FormField`, `LoadingIndicator`, `EmptyState`, `StatusBadge` | `src/shared/components/` |
| Inicialización de Admin SDK en CF | [eliminarCuenta.ts:7-9](functions/src/eliminarCuenta.ts#L7) |

---

## Orden de implementación sugerido

1. **Theme** (`colors.ts` + `whatsapp`).
2. **Schema** (`reporteSchema.ts`).
3. **Service** (`reportesService.ts` con la lógica de 14 días).
4. **Hooks** (`useReportes`, `useReporte`).
5. **Componentes** (`ReporteCard`, `ReporteForm`, `MapaReportes`).
6. **Pantallas adoptante** (`index`, `reportar`, `mapa`, `[id]`).
7. **Pantallas personal** (`index`, `mapa`, `[id]`).
8. **FCM setup en useAuth** (registrar token).
9. **Cloud Function** `notifications.ts` + export.
10. **Verificación end-to-end**.

---

## Verificación / Definition of Done

| Criterio | Cómo validar |
|---|---|
| TypeScript sin errores | `npx tsc --noEmit` en raíz y en `functions/` |
| Lint del CF | `cd functions && npm run lint` |
| Build de funciones | `cd functions && npm run build` antes de `firebase deploy --only functions` |
| Deploy reglas/índices | `firebase deploy --only firestore:rules,firestore:indexes,storage` |
| Crear reporte | Adoptante completa el formulario → doc aparece en Firestore con `estado: 'activo'`, fotos en `storage/reportes/{id}/`, metadata `uploadedBy` correcta |
| Límite 14 días | Segundo intento de reportar antes de 14 días muestra error indicando días restantes |
| Lista en tiempo real | Crear reporte desde otro device/cuenta → aparece sin recargar |
| Mapa | Pin picker funcional, marcadores muestran callout, "ver detalle" navega |
| WhatsApp | Botón abre `wa.me/593...` (verificar que el 0 inicial se elimina) |
| "Mascota encontrada" | Botón solo visible para creador; al pulsar → estado pasa a `'resuelto'` y desaparece de lista/mapa |
| Notificación push | Crear reporte con cuenta A → cuenta B (con app abierta o cerrada) recibe notificación; cuenta A NO recibe notificación de su propio reporte |
| Token FCM | Al hacer login, `users/{uid}.fcmToken` se popula |
| Reglas | Adoptante no puede editar reporte ajeno (rules deniegan); intento de eliminar falla siempre |

---

## Notas / riesgos

- **Notificaciones push en emulador Android**: requieren Google Services. Probar en device real o emulador con Play Store.
- **`fcmToken: null` en query**: Firestore no permite `where('fcmToken', '!=', null)` en algunas combinaciones; alternativa: query toda la colección `users` y filtrar en código (pequeña escala lo permite).
- **Tokens inválidos**: el response de `sendEachForMulticast` indica cuáles fallaron con código `messaging/registration-token-not-registered`; recomendable limpiarlos del documento del usuario.
- **Permisos de ubicación**: `expo-location` requiere los plugins ya configurados en [app.config.ts](app.config.ts) — verificados.