# 🧹 Instrucciones para Eliminar Productos de Prueba

## ⚠️ ADVERTENCIA IMPORTANTE

Este proceso eliminará **TODOS** los productos y sus imágenes de la base de datos. 

**SE MANTENDRÁN:**
- ✅ Tiendas configuradas
- ✅ Categorías existentes
- ✅ Grupos de WhatsApp
- ✅ Usuarios administradores

**NO SE PUEDE DESHACER** - Asegúrate de que realmente quieres eliminar todos los productos de prueba.

---

## 📋 Pasos para Ejecutar

### 1. Acceder a Supabase Dashboard

1. Ve a https://supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto
4. En el menú lateral, haz clic en **"SQL Editor"**

### 2. Ejecutar el Script

1. Haz clic en **"New query"** (Nueva consulta)
2. Abre el archivo `limpiar-datos-prueba.sql` de este proyecto
3. Copia TODO el contenido del archivo
4. Pégalo en el editor SQL de Supabase
5. Haz clic en **"Run"** (Ejecutar) o presiona `Ctrl + Enter`

### 3. Verificar Resultados

Después de ejecutar el script, verás una tabla con los resultados:

```
tiendas_restantes: [número de tus tiendas]
categorias_restantes: [número de tus categorías]
productos_restantes: 0
imagenes_restantes: 0
grupos_restantes: [número de tus grupos]
admins_restantes: 2
```

✅ Si `productos_restantes` e `imagenes_restantes` están en 0, la limpieza fue exitosa.

---

## 🎯 ¿Qué se Eliminó?

- ✅ Todos los productos de prueba
- ✅ Todas las imágenes de productos

## 🔒 ¿Qué se Mantuvo?

- ✅ Todas las tiendas configuradas
- ✅ Todas las categorías existentes
- ✅ Todos los grupos de WhatsApp
- ✅ Usuarios administradores (yurisanderaj@gmail.com y yurisanderalmirajimenez@gmail.com)
- ✅ Estructura de la base de datos (tablas, políticas RLS, etc.)
- ✅ Configuración de autenticación

---

## 📝 Próximos Pasos

Después de eliminar los productos de prueba:

1. **Agregar los productos reales** desde el panel admin
2. Las tiendas y categorías ya están configuradas, solo necesitas crear productos
3. Subir las imágenes reales de cada producto
4. Configurar disponibilidad y precios

---

## 🆘 Si Algo Sale Mal

Si ejecutaste el script por error o necesitas restaurar datos:

1. **NO hay backup automático** de los datos eliminados
2. Tendrás que volver a crear todo manualmente desde el panel admin
3. Por eso es importante estar seguro antes de ejecutar

---

## ✅ Confirmación Final

Antes de ejecutar el script, confirma:

- [ ] Estoy seguro de que quiero eliminar TODOS los productos de prueba
- [ ] Entiendo que esto NO se puede deshacer
- [ ] Las tiendas y categorías ya están bien configuradas
- [ ] Tengo acceso al panel admin para crear los productos reales
- [ ] He leído todas las advertencias

Si marcaste todas las casillas, puedes proceder con la ejecución del script.
