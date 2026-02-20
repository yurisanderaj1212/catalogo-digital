-- ============================================
-- SCRIPT PARA ELIMINAR SOLO PRODUCTOS DE PRUEBA
-- ============================================
-- Este script elimina ÚNICAMENTE los productos y sus imágenes.
-- MANTIENE: Tiendas, Categorías, Grupos de WhatsApp y Admins
-- ============================================

-- PASO 1: Eliminar todas las imágenes de productos
-- (Se eliminan primero por la foreign key)
DELETE FROM imagenes_producto;

-- PASO 2: Eliminar todos los productos
DELETE FROM productos;

-- ============================================
-- VERIFICACIÓN: Contar registros restantes
-- ============================================
SELECT 
  (SELECT COUNT(*) FROM tiendas) as tiendas_restantes,
  (SELECT COUNT(*) FROM categorias) as categorias_restantes,
  (SELECT COUNT(*) FROM productos) as productos_restantes,
  (SELECT COUNT(*) FROM imagenes_producto) as imagenes_restantes,
  (SELECT COUNT(*) FROM grupos_whatsapp) as grupos_restantes,
  (SELECT COUNT(*) FROM admins) as admins_restantes;

-- ============================================
-- RESULTADO ESPERADO:
-- tiendas_restantes: [número actual de tiendas]
-- categorias_restantes: [número actual de categorías]
-- productos_restantes: 0
-- imagenes_restantes: 0
-- grupos_restantes: [número actual de grupos]
-- admins_restantes: 2 (tus usuarios admin)
-- ============================================
