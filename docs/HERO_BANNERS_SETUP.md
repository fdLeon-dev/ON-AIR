# Configuración de Imágenes Hero/Banners

## Descripción
Las imágenes del hero carousel (banners) en Peak Sport se almacenan en **Supabase Storage** en el bucket `productos` y se configran desde `/admin/banners`.

## Cómo Obtener URLs de Supabase Storage

### Paso 1: Subir imagen a Supabase Storage
1. Ve a **Supabase Dashboard** → **Storage**
2. Selecciona el bucket **`productos`**
3. Haz clic en **Upload** y sube tu imagen
4. La imagen se guardará con un nombre como: `hero-banner-1.jpg`

### Paso 2: Generar URL Pública
1. Dentro del bucket, busca el archivo que subiste
2. Haz clic en los **3 puntos** (⋮) junto al archivo
3. Selecciona **Copy URL**
4. Se copiará una URL como esta:
```
https://lowledhmivhniidpfefb.supabase.co/storage/v1/object/public/productos/hero-banner-1.jpg
```

### Paso 3: Usar la URL en Admin Panel
1. Ve a `/admin/banners` en tu sitio
2. En la sección **Carrusel Izquierdo** o **Carrusel Derecho**
3. Haz clic en **Agregar imagen**
4. Pega la URL completa en el campo de texto
5. **Haz clic en Guardar**

## Formato de URL

La URL debe seguir este formato:
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/productos/[NOMBRE_ARCHIVO]
```

**Reemplaza:**
- `[PROJECT_ID]`: Tu ID de proyecto Supabase (ej: `lowledhmivhniidpfefb`)
- `[NOMBRE_ARCHIVO]`: El nombre del archivo que subiste

## Ejemplo Completo

**Archivo subido:** `promo-verano-2025.jpg`

**URL generada:** 
```
https://lowledhmivhniidpfefb.supabase.co/storage/v1/object/public/productos/promo-verano-2025.jpg
```

**En el panel de admin:** Copiar y pegar esta URL exacta

## Configuración de Carrusel

Después de agregar imágenes, puedes:

- **Activar carrusel**: Checkbox "Activar carrusel"
- **Reproducción automática**: Checkbox "Reproducción automática"
- **Repetición infinita**: Checkbox "Repetición infinita"
- **Pausar al pasar el mouse**: Checkbox "Pausar al pasar el mouse"
- **Tipo de transición**: Elige entre "fade" (desvanecimiento) o "slide" (deslizamiento)
- **Intervalo**: Tiempo en ms entre cambios (default: 3000ms = 3 segundos)
- **Duración transición**: Tiempo en ms de la animación (default: 300ms)

## Drag & Drop

Puedes reordenar las imágenes:
1. Haz clic y arrastra una imagen
2. Suéltala en la posición deseada
3. El orden se guarda automáticamente

## Requisitos

- Las imágenes deben estar en el **bucket `productos`** de Supabase Storage
- URLs deben ser **públicas** (no requieren autenticación)
- Soporta formatos: **JPG, PNG, WebP, GIF**
- Se recomienda comprimir imágenes (máx ~500KB cada una)

## Troubleshooting

### "Imagen no carga" (404)
- ✅ Verifica que el archivo existe en Supabase Storage
- ✅ Verifica que copió la URL correcta (no cortó al final)
- ✅ Verifica que el bucket está en modo "Public" (no privado)

### "Error al guardar"
- ✅ Verifica que estés autenticado como admin
- ✅ Verifica tu conexión a internet
- ✅ Prueba con Ctrl+Shift+K para ver console errors

### ¿Cómo sé que mi URL es correcta?
- ✅ Abre la URL en una nueva pestaña del navegador
- ✅ Si ves la imagen, la URL es correcta
- ✅ Si ves un 404, algo está mal con la URL

---

**Más información:** Ver `/src/components/dashboard/hero-config-manager.tsx`
