'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase, Tienda, Producto, Categoria, ImagenProducto, GrupoWhatsApp } from '@/lib/supabase';
import { formatearHora, formatearDias } from '@/lib/formatters';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Search, ArrowLeft, Phone, X, ChevronLeft, ChevronRight, Clock, Package } from 'lucide-react';
import ModalGruposWhatsApp from './components/ModalGruposWhatsApp';

interface ProductoConImagenes extends Producto {
  imagenes: ImagenProducto[];
  categoria: Categoria | null;
}

export default function TiendaPage() {
  const params = useParams();
  const router = useRouter();
  const tiendaId = params.id as string;

  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [productos, setProductos] = useState<ProductoConImagenes[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [grupos, setGrupos] = useState<GrupoWhatsApp[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoConImagenes | null>(null);
  const [imagenActual, setImagenActual] = useState(0);
  const [mostrarVolverArriba, setMostrarVolverArriba] = useState(false);
  const [productosVistos, setProductosVistos] = useState<Set<string>>(new Set());
  const [mostrarModalGrupos, setMostrarModalGrupos] = useState(false);
  const [busquedaExpandida, setBusquedaExpandida] = useState(false);
  const [mostrarFlechaIzq, setMostrarFlechaIzq] = useState(false);
  const [mostrarFlechaDer, setMostrarFlechaDer] = useState(false);
  const categoriasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [tiendaId]);

  useEffect(() => {
    const handleScroll = () => {
      setMostrarVolverArriba(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Cargar productos vistos desde localStorage al montar el componente
    const vistos = localStorage.getItem(`productos-vistos-${tiendaId}`);
    if (vistos) {
      try {
        setProductosVistos(new Set(JSON.parse(vistos)));
      } catch (error) {
        console.error('Error al cargar productos vistos:', error);
      }
    }
  }, [tiendaId]);

  // Scroll al inicio cuando cambia la categoría
  useEffect(() => {
    // Hacer scroll al inicio de los productos, considerando el header sticky
    const headerElement = document.querySelector('header');
    const mainElement = document.querySelector('main');
    
    if (headerElement && mainElement) {
      const headerHeight = headerElement.offsetHeight;
      const mainTop = mainElement.getBoundingClientRect().top + window.scrollY;
      
      // Scroll a la posición del main menos la altura del header (con un pequeño margen)
      window.scrollTo({
        top: mainTop - headerHeight - 10,
        behavior: 'smooth'
      });
    }
  }, [categoriaSeleccionada]);

  const fetchData = async () => {
    try {
      const { data: tiendaData, error: tiendaError } = await supabase
        .from('tiendas')
        .select('*')
        .eq('id', tiendaId)
        .eq('activa', true)
        .single();

      if (tiendaError) throw tiendaError;
      setTienda(tiendaData);

      // Cargar grupos de WhatsApp
      const { data: gruposData, error: gruposError } = await supabase
        .from('grupos_whatsapp')
        .select('*')
        .eq('tienda_id', tiendaId)
        .eq('activo', true)
        .order('orden');

      if (gruposError) {
        console.error('Error al cargar grupos:', gruposError);
      }

      setGrupos(gruposData || []);

      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('*')
        .eq('tienda_id', tiendaId)
        .eq('activa', true)
        .order('nombre');

      setCategorias(categoriasData || []);

      // Cargar TODOS los productos (lazy loading se encarga del rendimiento)
      const { data: productosData } = await supabase
        .from('productos')
        .select('*')
        .eq('tienda_id', tiendaId)
        .eq('activo', true)
        .order('nombre');

      if (productosData && productosData.length > 0) {
        // OPTIMIZACIÓN: Cargar TODAS las imágenes en una sola consulta
        const productosIds = productosData.map(p => p.id);
        const { data: todasImagenes } = await supabase
          .from('imagenes_producto')
          .select('*')
          .in('producto_id', productosIds)
          .order('orden');

        // OPTIMIZACIÓN: Cargar TODAS las categorías necesarias en una sola consulta
        const categoriasIds = [...new Set(productosData.map(p => p.categoria_id).filter(Boolean))];
        const { data: todasCategorias } = await supabase
          .from('categorias')
          .select('*')
          .in('id', categoriasIds);

        // Crear un mapa de imágenes por producto
        const imagenesPorProducto = (todasImagenes || []).reduce((acc, img) => {
          if (!acc[img.producto_id]) acc[img.producto_id] = [];
          acc[img.producto_id].push(img);
          return acc;
        }, {} as Record<string, ImagenProducto[]>);

        // Crear un mapa de categorías por ID
        const categoriasPorId = (todasCategorias || []).reduce((acc, cat) => {
          acc[cat.id] = cat;
          return acc;
        }, {} as Record<string, Categoria>);

        // Combinar datos sin hacer consultas adicionales
        const productosConImagenes = productosData.map((producto) => ({
          ...producto,
          imagenes: imagenesPorProducto[producto.id] || [],
          categoria: producto.categoria_id ? categoriasPorId[producto.categoria_id] : null,
        }));

        setProductos(productosConImagenes);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter((producto) => {
    const matchCategoria = categoriaSeleccionada === null || producto.categoria_id === categoriaSeleccionada;
    const matchBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  const abrirMaps = () => {
    if (tienda?.latitud && tienda?.longitud) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${tienda.latitud},${tienda.longitud}`,
        '_blank'
      );
    }
  };

  const abrirModal = (producto: ProductoConImagenes) => {
    setProductoSeleccionado(producto);
    setImagenActual(0);
    document.body.style.overflow = 'hidden';
    
    // Marcar producto como visto
    marcarProductoComoVisto(producto.id);
  };

  const marcarProductoComoVisto = (productoId: string) => {
    setProductosVistos((prevVistos) => {
      const nuevosVistos = new Set(prevVistos);
      nuevosVistos.add(productoId);
      
      // Guardar en localStorage
      try {
        localStorage.setItem(
          `productos-vistos-${tiendaId}`,
          JSON.stringify(Array.from(nuevosVistos))
        );
      } catch (error) {
        console.error('Error al guardar productos vistos:', error);
      }
      
      return nuevosVistos;
    });
  };

  const cerrarModal = () => {
    setProductoSeleccionado(null);
    setImagenActual(0);
    document.body.style.overflow = 'unset';
  };

  const siguienteImagen = () => {
    if (productoSeleccionado && productoSeleccionado.imagenes.length > 0) {
      setImagenActual((prev) => (prev + 1) % productoSeleccionado.imagenes.length);
    }
  };

  const anteriorImagen = () => {
    if (productoSeleccionado && productoSeleccionado.imagenes.length > 0) {
      setImagenActual((prev) => 
        prev === 0 ? productoSeleccionado.imagenes.length - 1 : prev - 1
      );
    }
  };

  const volverArriba = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Funciones para scroll de categorías
  const scrollCategorias = (direccion: 'izq' | 'der') => {
    if (categoriasRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = direccion === 'izq' 
        ? categoriasRef.current.scrollLeft - scrollAmount
        : categoriasRef.current.scrollLeft + scrollAmount;
      
      categoriasRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const actualizarFlechasCategorias = () => {
    if (categoriasRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriasRef.current;
      setMostrarFlechaIzq(scrollLeft > 10);
      setMostrarFlechaDer(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = categoriasRef.current;
    if (container) {
      actualizarFlechasCategorias();
      container.addEventListener('scroll', actualizarFlechasCategorias);
      window.addEventListener('resize', actualizarFlechasCategorias);
      
      return () => {
        container.removeEventListener('scroll', actualizarFlechasCategorias);
        window.removeEventListener('resize', actualizarFlechasCategorias);
      };
    }
  }, [categorias]);

  // Formatear horarios con memoización
  const horariosFormateados = useMemo(() => {
    if (!tienda || !tienda.hora_apertura || !tienda.hora_cierre || !tienda.dias_laborales || tienda.dias_laborales.length === 0) {
      return null;
    }

    const apertura = formatearHora(tienda.hora_apertura);
    const cierre = formatearHora(tienda.hora_cierre);
    const dias = formatearDias(tienda.dias_laborales);

    return `${dias}: ${apertura} - ${cierre}`;
  }, [tienda]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tienda) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Tienda no encontrada</p>
          <button onClick={() => router.push('/')} className="text-blue-600 hover:underline">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header compacto */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-3 py-2">
          {/* Título y botón volver en una línea */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => router.push('/')}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-bold text-gray-900 truncate flex-1">{tienda.nombre}</h1>
            
            {/* Solo botón de búsqueda arriba */}
            <button
              onClick={() => setBusquedaExpandida(true)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="font-medium">Buscar</span>
            </button>
          </div>

          {/* Horarios compactos */}
          {horariosFormateados && (
            <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-blue-50 rounded text-xs text-blue-900">
              <Clock className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="font-medium">{horariosFormateados}</span>
            </div>
          )}

          {/* Botones de acción debajo de horarios */}
          <div className="flex gap-2 mb-2">
            {tienda.latitud && tienda.longitud && (
              <button
                onClick={abrirMaps}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs flex-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="font-medium">Ubicación</span>
              </button>
            )}
            {tienda.telefono && (
              <a
                href={`tel:${tienda.telefono}`}
                className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs flex-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="font-medium">Llamar</span>
              </a>
            )}
            {grupos.length > 0 && (
              <button
                onClick={() => setMostrarModalGrupos(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs flex-1"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="font-medium">Grupos Whatsaap</span>
              </button>
            )}
          </div>

          {/* Buscador expandible */}
          {busquedaExpandida && (
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onBlur={() => {
                  if (!busqueda) setBusquedaExpandida(false);
                }}
                autoFocus
                className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => {
                  setBusqueda('');
                  setBusquedaExpandida(false);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Categorías compactas */}
          {categorias.length > 0 && (
            <div className="mb-2">
              <div 
                ref={categoriasRef}
                className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <button
                  onClick={() => setCategoriaSeleccionada(null)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors text-xs ${
                    categoriaSeleccionada === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Todas ({productos.length})
                </button>
                {categorias.map((categoria) => {
                  const count = productos.filter(p => p.categoria_id === categoria.id).length;
                  return (
                    <button
                      key={categoria.id}
                      onClick={() => setCategoriaSeleccionada(categoria.id)}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors text-xs ${
                        categoriaSeleccionada === categoria.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {categoria.nombre} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Indicador de scroll más pequeño */}
              {categorias.length > 2 && (
                <p className="text-center text-[10px] text-gray-400 mt-0.5 flex items-center justify-center gap-0.5">
                  <ChevronLeft className="w-2.5 h-2.5" />
                  <span>Desliza para ver más</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </p>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Productos - 2 columnas en móvil */}
      <main className="container mx-auto px-3 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {productosFiltrados.map((producto) => {
            // Verificar si el producto es nuevo (últimos 7 días)
            const fechaCreacion = new Date(producto.fecha_creacion);
            const hoy = new Date();
            const diasDiferencia = Math.floor((hoy.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
            const esNuevo = diasDiferencia <= 7;
            
            // Verificar si el usuario ya vio este producto
            const yaVisto = productosVistos.has(producto.id);
            
            // Mostrar badge solo si es nuevo Y no ha sido visto
            const mostrarBadgeNuevo = esNuevo && !yaVisto;

            return (
              <div
                key={producto.id}
                onClick={() => abrirModal(producto)}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer active:scale-95"
              >
                <div className="aspect-square bg-gray-200 relative">
                  {producto.imagenes.length > 0 ? (
                    <img
                      src={producto.imagenes[0].url_imagen}
                      alt={producto.nombre}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Sin imagen
                    </div>
                  )}
                  {!producto.disponible && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                        No disponible
                      </span>
                    </div>
                  )}
                  {mostrarBadgeNuevo && producto.disponible && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                        ✨ Nuevo
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                    {producto.nombre}
                  </h3>
                  {producto.descripcion && (
                    <p className="text-xs text-gray-600 mb-1.5 line-clamp-2">
                      {producto.descripcion}
                    </p>
                  )}
                  <p className="text-base font-bold text-blue-600">
                    ${producto.precio.toLocaleString('es-CU')} <span className="text-xs">{producto.moneda}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {productosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No se encontraron productos
            </p>
          </div>
        )}
      </main>

      {/* Modal de producto - Diseño mejorado */}
      {productoSeleccionado && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3"
          onClick={cerrarModal}
        >
          <div 
            className="bg-gray-50 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header compacto con gradiente */}
            <div className="shrink-0 bg-linear-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-white pr-8 line-clamp-1">
                {productoSeleccionado.nombre}
              </h2>
              <button
                onClick={cerrarModal}
                className="shrink-0 p-1.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto">
              {/* Galería de imágenes - más compacta */}
              {productoSeleccionado.imagenes.length > 0 ? (
                <div>
                  <div className="relative bg-gray-50">
                    <img
                      src={productoSeleccionado.imagenes[imagenActual].url_imagen}
                      alt={productoSeleccionado.nombre}
                      className="w-full h-64 object-contain"
                    />
                    
                    {productoSeleccionado.imagenes.length > 1 && (
                      <>
                        <button
                          onClick={anteriorImagen}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-1.5 hover:bg-gray-100 transition-all"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          onClick={siguienteImagen}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-1.5 hover:bg-gray-100 transition-all"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                        {/* Indicador de imagen actual */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                          {imagenActual + 1} / {productoSeleccionado.imagenes.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Miniaturas - más compactas */}
                  {productoSeleccionado.imagenes.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto px-3 py-2 bg-gray-50 scrollbar-hide">
                      {productoSeleccionado.imagenes.map((imagen, index) => (
                        <button
                          key={index}
                          onClick={() => setImagenActual(index)}
                          className={`shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                            index === imagenActual
                              ? 'border-blue-600 ring-2 ring-blue-200'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={imagen.url_imagen}
                            alt={`${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400">
                  <Package className="w-16 h-16" />
                </div>
              )}

              {/* Detalles del producto - más compactos */}
              <div className="p-4 space-y-3">
                {/* Precio destacado */}
                <div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-700">
                        ${productoSeleccionado.precio.toLocaleString('es-CU')}
                      </span>
                      <span className="text-sm text-blue-600 font-medium">{productoSeleccionado.moneda}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      productoSeleccionado.disponible 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        productoSeleccionado.disponible ? 'bg-white' : 'bg-white'
                      }`}></span>
                      {productoSeleccionado.disponible ? 'Disponible' : 'Agotado'}
                    </span>
                  </div>
                </div>

                {/* Categoría */}
                {productoSeleccionado.categoria && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Categoría:</span>
                    <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                      {productoSeleccionado.categoria.nombre}
                    </span>
                  </div>
                )}

                {/* Descripción */}
                {productoSeleccionado.descripcion && (
                  <div className="border-t pt-3">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Descripción
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                      {productoSeleccionado.descripcion}
                    </p>
                  </div>
                )}

                {/* Botón de contacto - más atractivo */}
                {tienda.whatsapp && (
                  <a
                    href={`https://wa.me/${tienda.whatsapp.replace(/[^0-9]/g, '')}?text=Hola, estoy interesado en: ${productoSeleccionado.nombre}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Consultar por WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante de WhatsApp / Grupos */}
      {grupos.length > 0 ? (
        <button
          onClick={() => setMostrarModalGrupos(true)}
          className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 animate-pulse-slow"
          aria-label="Ver grupos de WhatsApp"
        >
          <svg
            className="w-7 h-7"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </button>
      ) : tienda.whatsapp ? (
        <a
          href={`https://wa.me/${tienda.whatsapp.replace(/[^0-9]/g, '')}?text=Hola, me gustaría consultar sobre sus productos`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 animate-pulse-slow"
          aria-label="Contactar por WhatsApp"
        >
          <svg
            className="w-7 h-7"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </a>
      ) : null}

      {/* Modal de Grupos de WhatsApp */}
      {mostrarModalGrupos && grupos.length > 0 && (
        <ModalGruposWhatsApp
          grupos={grupos}
          nombreTienda={tienda.nombre}
          onClose={() => setMostrarModalGrupos(false)}
        />
      )}

      {/* Botón Volver Arriba */}
      {mostrarVolverArriba && (
        <button
          onClick={volverArriba}
          className="fixed bottom-6 right-24 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Volver arriba"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}
