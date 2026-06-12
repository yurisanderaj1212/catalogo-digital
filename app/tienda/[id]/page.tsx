'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase, Tienda, Producto, Categoria, ImagenProducto, GrupoWhatsApp } from '@/lib/supabase';
import { formatearHora, formatearDias } from '@/lib/formatters';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Search, ArrowLeft, Phone, X, ChevronLeft, ChevronRight, Clock, Package } from 'lucide-react';
import ModalGruposWhatsApp from './components/ModalGruposWhatsApp';

interface ProductoConImagenes extends Producto {
  imagenes: (ImagenProducto & { url_original?: string })[];
  categoria: Categoria | null;
}

export default function TiendaPage() {
  const params = useParams();
  const router = useRouter();
  const tiendaId = params.id as string;

  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [productos, setProductos] = useState<ProductoConImagenes[]>([]);
  const [gruposWA, setGruposWA] = useState<GrupoWhatsApp[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  // Categoria visible durante scroll (solo afecta la pill activa, no filtra)
  const [categoriaVisible, setCategoriaVisible] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoConImagenes | null>(null);
  const [imagenActual, setImagenActual] = useState(0);
  const [mostrarVolverArriba, setMostrarVolverArriba] = useState(false);
  const [productosVistos, setProductosVistos] = useState<Set<string>>(new Set());
  const [mostrarModalGrupos, setMostrarModalGrupos] = useState(false);
  const [busquedaExpandida, setBusquedaExpandida] = useState(false);
  const [imagenesHD, setImagenesHD] = useState<Record<string, boolean>>({});

  // Refs — usar HTMLDivElement para evitar conflicto de tipos con <header>
  const categoriasScrollRef = useRef<HTMLDivElement>(null);
  const pillsRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const headerWrapRef = useRef<HTMLDivElement>(null);
  const seccionesRefs = useRef<Record<string, HTMLElement | null>>({});

  // Categorias derivadas de productos reales de esta tienda
  const categorias = useMemo(() => {
    const mapa = new Map<string, Categoria>();
    productos.forEach((p) => {
      if (p.categoria && !mapa.has(p.categoria.id)) {
        mapa.set(p.categoria.id, p.categoria);
      }
    });
    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos]);

  useEffect(() => { fetchData(); }, [tiendaId]);

  useEffect(() => {
    const onScroll = () => { setMostrarVolverArriba(window.scrollY > 400); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const vistos = localStorage.getItem(`productos-vistos-${tiendaId}`);
    if (vistos) {
      try { setProductosVistos(new Set(JSON.parse(vistos))); } catch {}
    }
  }, [tiendaId]);

  // Auto-scroll pill activa al centro — usa categoriaVisible en modo scroll, categoriaSeleccionada en modo filtro
  useEffect(() => {
    if (!categoriasScrollRef.current) return;
    const activeKey = categoriaSeleccionada !== null
      ? categoriaSeleccionada
      : (categoriaVisible ?? 'todas');
    const pill = pillsRefs.current[activeKey];
    if (pill) {
      const c = categoriasScrollRef.current;
      c.scrollTo({ left: pill.offsetLeft - c.clientWidth / 2 + pill.offsetWidth / 2, behavior: 'smooth' });
    }
  }, [categoriaSeleccionada, categoriaVisible]);

  // IntersectionObserver: detecta que seccion de categoria es visible durante scroll
  useEffect(() => {
    if (categoriaSeleccionada !== null || busqueda !== '') return;

    const headerHeight = headerWrapRef.current?.offsetHeight ?? 80;

    const observer = new IntersectionObserver(
      (entries) => {
        // Buscamos la entrada que cruza el umbral superior del viewport (justo debajo del header)
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.catId ?? null;
            setCategoriaVisible(id);
          }
        });
      },
      {
        rootMargin: `-${headerHeight + 8}px 0px -60% 0px`,
        threshold: 0,
      }
    );

    // Observar todas las secciones registradas
    Object.values(seccionesRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categoriaSeleccionada, busqueda, productos]);

  const optimizarImagenCloudinary = (url: string, ancho = 400): string => {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/w_${ancho},q_auto,f_auto/`);
  };

  const fetchData = async () => {
    try {
      const [tiendaRes, gruposRes, ptRes] = await Promise.all([
        supabase.from('tiendas').select('*').eq('id', tiendaId).eq('activa', true).single(),
        supabase.from('grupos_whatsapp').select('*').eq('tienda_id', tiendaId).eq('activo', true).order('orden'),
        supabase.from('productos_tiendas').select('producto_id').eq('tienda_id', tiendaId),
      ]);

      if (tiendaRes.error) throw tiendaRes.error;
      setTienda(tiendaRes.data);
      setGruposWA(gruposRes.data || []);

      const ptData = ptRes.data;
      if (!ptData || ptData.length === 0) { setProductos([]); setLoading(false); return; }

      const productosIds = ptData.map((pt: any) => pt.producto_id);
      const { data: prodData } = await supabase.from('productos').select('*').in('id', productosIds).eq('activo', true).order('nombre');

      if (prodData && prodData.length > 0) {
        const ids = prodData.map((p: any) => p.id);
        const catIds = [...new Set(prodData.map((p: any) => p.categoria_id).filter(Boolean))];

        const [imgRes, catRes] = await Promise.all([
          supabase.from('imagenes_producto').select('*').in('producto_id', ids).order('orden'),
          catIds.length > 0 ? supabase.from('categorias').select('*').in('id', catIds) : Promise.resolve({ data: [] }),
        ]);

        const imgPorProducto = (imgRes.data || []).reduce((acc: any, img: any) => {
          if (!acc[img.producto_id]) acc[img.producto_id] = [];
          acc[img.producto_id].push({ ...img, url_imagen: optimizarImagenCloudinary(img.url_imagen, 400), url_original: img.url_imagen });
          return acc;
        }, {} as Record<string, any[]>);

        const catPorId = (catRes.data || []).reduce((acc: any, cat: any) => { acc[cat.id] = cat; return acc; }, {} as Record<string, Categoria>);

        setProductos(prodData.map((p: any) => ({
          ...p,
          imagenes: imgPorProducto[p.id] || [],
          categoria: p.categoria_id ? catPorId[p.categoria_id] : null,
        })));
      }
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  const productosFiltrados = useMemo(() =>
    productos.filter((p) =>
      (categoriaSeleccionada === null || p.categoria_id === categoriaSeleccionada) &&
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    ),
  [productos, categoriaSeleccionada, busqueda]);

  // Agrupar por categoria para el layout en secciones
  const productosPorCategoria = useMemo(() => {
    if (categoriaSeleccionada !== null || busqueda !== '') {
      return [{ categoria: null as Categoria | null, productos: productosFiltrados }];
    }
    const grupos: { categoria: Categoria | null; productos: ProductoConImagenes[] }[] =
      categorias.map((cat) => ({ categoria: cat, productos: productos.filter((p) => p.categoria_id === cat.id) }));
    const sinCat = productos.filter((p) => !p.categoria_id);
    if (sinCat.length > 0) grupos.push({ categoria: null, productos: sinCat });
    return grupos.filter((g) => g.productos.length > 0);
  }, [productos, categorias, categoriaSeleccionada, busqueda, productosFiltrados]);

  const seleccionarCategoria = (catId: string | null) => {
    setCategoriaSeleccionada(catId);
    setCategoriaVisible(null);
    setTimeout(() => {
      const key = catId ?? 'todas';
      const sec = seccionesRefs.current[key];
      if (sec) {
        const h = headerWrapRef.current?.offsetHeight ?? 80;
        window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY - h - 8, behavior: 'smooth' });
      }
    }, 50);
  };

  const abrirMaps = () => {
    if (tienda?.latitud && tienda?.longitud)
      window.open(`https://www.google.com/maps/search/?api=1&query=${tienda.latitud},${tienda.longitud}`, '_blank');
  };

  const abrirModal = (producto: ProductoConImagenes) => {
    setProductoSeleccionado(producto);
    setImagenActual(0);
    document.body.style.overflow = 'hidden';
    marcarComoVisto(producto.id);
    producto.imagenes.forEach((img) => {
      const i = new Image();
      i.onload = () => setImagenesHD((prev) => ({ ...prev, [img.url_imagen]: true }));
      i.src = optimizarImagenCloudinary(img.url_original || img.url_imagen, 800);
    });
  };

  const marcarComoVisto = (id: string) => {
    setProductosVistos((prev) => {
      const n = new Set(prev); n.add(id);
      try { localStorage.setItem(`productos-vistos-${tiendaId}`, JSON.stringify([...n])); } catch {}
      return n;
    });
  };

  const cerrarModal = () => {
    setProductoSeleccionado(null); setImagenActual(0); setImagenesHD({});
    document.body.style.overflow = 'unset';
  };

  const siguienteImagen = () => {
    if (productoSeleccionado?.imagenes.length)
      setImagenActual((p) => (p + 1) % productoSeleccionado.imagenes.length);
  };

  const anteriorImagen = () => {
    if (productoSeleccionado?.imagenes.length)
      setImagenActual((p) => p === 0 ? productoSeleccionado.imagenes.length - 1 : p - 1);
  };

  const horariosFormateados = useMemo(() => {
    if (!tienda?.hora_apertura || !tienda?.hora_cierre || !tienda?.dias_laborales?.length) return null;
    return `${formatearDias(tienda.dias_laborales)}: ${formatearHora(tienda.hora_apertura)} - ${formatearHora(tienda.hora_cierre)}`;
  }, [tienda]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (!tienda) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl text-gray-600 mb-4">Tienda no encontrada</p>
        <button onClick={() => router.push('/')} className="text-blue-600 hover:underline">Volver al inicio</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Wrapper div para el ref del header (evita tipo HTMLElement) */}
      <div ref={headerWrapRef} className="sticky top-0 z-20">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-3 py-2">

            {/* Fila: navegacion y busqueda */}
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => router.push('/')} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg transition-all shadow-sm text-xs font-medium">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
              <h1 className="text-base font-bold text-gray-900 truncate flex-1">{tienda.nombre}</h1>
              <button onClick={() => setBusquedaExpandida(true)} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs">
                <Search className="w-3.5 h-3.5" />
                <span className="font-medium">Buscar</span>
              </button>
            </div>

            {/* Horarios */}
            {horariosFormateados && (
              <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-blue-50 rounded text-xs text-blue-900">
                <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="font-medium">{horariosFormateados}</span>
              </div>
            )}

            {/* Botones de accion */}
            <div className="flex gap-2 mb-2">
              {tienda.latitud && tienda.longitud && (
                <button onClick={abrirMaps} className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs flex-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-medium">Ubicacion</span>
                </button>
              )}
              {tienda.telefono && (
                <a href={`tel:${tienda.telefono}`} className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs flex-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="font-medium">Llamar</span>
                </a>
              )}
              {gruposWA.length > 0 && (
                <button onClick={() => setMostrarModalGrupos(true)} className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs flex-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  <span className="font-medium">Grupos WhatsApp</span>
                </button>
              )}
            </div>

            {/* Buscador expandible */}
            {busquedaExpandida && (
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input type="text" placeholder="Buscar productos..." value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onBlur={() => { if (!busqueda) setBusquedaExpandida(false); }}
                  autoFocus
                  className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button onClick={() => { setBusqueda(''); setBusquedaExpandida(false); }} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Pills de categorias con auto-scroll */}
            {categorias.length > 0 && (
              <div ref={categoriasScrollRef} className="flex gap-1.5 overflow-x-auto pb-1 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <button
                  ref={(el) => { pillsRefs.current['todas'] = el; }}
                  onClick={() => seleccionarCategoria(null)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors text-xs font-medium ${
                    categoriaSeleccionada === null && categoriaVisible === null
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Todas ({productos.length})
                </button>
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    ref={(el) => { pillsRefs.current[cat.id] = el; }}
                    onClick={() => seleccionarCategoria(cat.id)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors text-xs font-medium ${
                      categoriaSeleccionada === cat.id || (categoriaSeleccionada === null && busqueda === '' && categoriaVisible === cat.id)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {cat.nombre} ({productos.filter((p) => p.categoria_id === cat.id).length})
                  </button>
                ))}
              </div>
            )}

          </div>
        </header>
      </div>

      {/* Catalogo organizado por secciones de categoria */}
      <main className="container mx-auto px-3 py-4 space-y-8">
        {productosPorCategoria.map((grupo, index) => {
          const secKey = grupo.categoria?.id ?? 'todas';
          const mostrarEncabezado = categoriaSeleccionada === null && busqueda === '';
          return (
            <section key={secKey + index} data-cat-id={grupo.categoria?.id ?? null} ref={(el) => { seccionesRefs.current[secKey] = el; }}>
              {mostrarEncabezado && (
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    {grupo.categoria?.nombre ?? 'Sin categoria'}
                  </h2>
                  <span className="text-xs text-gray-400">({grupo.productos.length})</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {grupo.productos.map((producto) => {
                  const dias = Math.floor((Date.now() - new Date(producto.fecha_creacion).getTime()) / 86400000);
                  const mostrarBadge = dias <= 7 && !productosVistos.has(producto.id) && producto.disponible;
                  return (
                    <div key={producto.id} onClick={() => abrirModal(producto)} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer active:scale-95">
                      <div className="aspect-square bg-gray-200 relative">
                        {producto.imagenes.length > 0 ? (
                          <img src={producto.imagenes[0].url_imagen} alt={producto.nombre} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin imagen</div>
                        )}
                        {!producto.disponible && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">No disponible</span>
                          </div>
                        )}
                        {mostrarBadge && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">Nuevo</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">{producto.nombre}</h3>
                        {producto.descripcion && <p className="text-xs text-gray-600 mb-1.5 line-clamp-2">{producto.descripcion}</p>}
                        {producto.tipo_venta === 'unidad_caja' && producto.precio_caja ? (
                          <div>
                            <p className="text-xs text-gray-500">{producto.precio.toLocaleString('es-CU')} {producto.moneda}/u</p>
                            <p className="text-sm font-bold text-blue-600">Caja: ${producto.precio_caja.toLocaleString('es-CU')} <span className="text-xs">{producto.moneda}</span></p>
                          </div>
                        ) : producto.tipo_venta === 'carnico' ? (
                          <div>
                            {(producto.unidad_peso === 'kg' || producto.unidad_peso === 'ambos') && (
                              <p className="text-sm font-bold text-blue-600">${producto.precio.toLocaleString('es-CU')} {producto.moneda}/kg</p>
                            )}
                            {(producto.unidad_peso === 'lb' || producto.unidad_peso === 'ambos') && producto.precio_por_libra && (
                              <p className="text-sm font-bold text-blue-600">${Math.round(producto.precio_por_libra).toLocaleString('es-CU')} {producto.moneda}/lb</p>
                            )}
                          </div>
                        ) : producto.tipo_venta === 'paquete' ? (
                          <div>
                            {producto.unidades_por_caja && (
                              <p className="text-xs text-gray-500">Paquete x{producto.unidades_por_caja}u</p>
                            )}
                            <p className="text-base font-bold text-blue-600">${producto.precio.toLocaleString('es-CU')} <span className="text-xs">{producto.moneda}</span></p>
                          </div>
                        ) : (
                          <p className="text-base font-bold text-blue-600">
                            ${producto.precio.toLocaleString('es-CU')} <span className="text-xs">{producto.moneda}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {productosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No se encontraron productos</p>
          </div>
        )}
      </main>

      {/* Modal de producto */}
      {productoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3" onClick={cerrarModal}>
          <div className="bg-gray-50 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="shrink-0 bg-blue-600 px-4 py-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-white pr-8 line-clamp-1">{productoSeleccionado.nombre}</h2>
              <button onClick={cerrarModal} className="shrink-0 p-1.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {productoSeleccionado.imagenes.length > 0 ? (
                <div>
                  <div className="relative bg-gray-50">
                    <img
                      src={imagenesHD[productoSeleccionado.imagenes[imagenActual].url_imagen]
                        ? optimizarImagenCloudinary(productoSeleccionado.imagenes[imagenActual].url_original || productoSeleccionado.imagenes[imagenActual].url_imagen, 800)
                        : productoSeleccionado.imagenes[imagenActual].url_imagen}
                      alt={productoSeleccionado.nombre}
                      className="w-full h-64 object-contain transition-all duration-300"
                    />
                    {productoSeleccionado.imagenes.length > 1 && (
                      <>
                        <button onClick={anteriorImagen} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-1.5 hover:bg-gray-100 transition-all">
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button onClick={siguienteImagen} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-1.5 hover:bg-gray-100 transition-all">
                          <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                          {imagenActual + 1} / {productoSeleccionado.imagenes.length}
                        </div>
                      </>
                    )}
                  </div>
                  {productoSeleccionado.imagenes.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto px-3 py-2 bg-gray-50" style={{ scrollbarWidth: 'none' }}>
                      {productoSeleccionado.imagenes.map((img, i) => (
                        <button key={i} onClick={() => setImagenActual(i)} className={`shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${i === imagenActual ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'}`}>
                          <img src={img.url_imagen} alt={`${i + 1}`} className="w-full h-full object-cover" />
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

              <div className="p-4 space-y-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-baseline justify-between">
                    <div className="flex flex-col gap-1">
                      {productoSeleccionado.tipo_venta === 'unidad_caja' && productoSeleccionado.precio_caja ? (
                        <div>
                          <p className="text-sm text-blue-500">Por unidad: ${productoSeleccionado.precio.toLocaleString('es-CU')} {productoSeleccionado.moneda}</p>
                          <p className="text-xl font-bold text-blue-700">Caja ({productoSeleccionado.unidades_por_caja}u): ${productoSeleccionado.precio_caja.toLocaleString('es-CU')} <span className="text-sm">{productoSeleccionado.moneda}</span></p>
                        </div>
                      ) : productoSeleccionado.tipo_venta === 'carnico' ? (
                        <div className="space-y-0.5">
                          {(productoSeleccionado.unidad_peso === 'kg' || productoSeleccionado.unidad_peso === 'ambos') && (
                            <p className="text-xl font-bold text-blue-700">${productoSeleccionado.precio.toLocaleString('es-CU')} <span className="text-sm font-medium">{productoSeleccionado.moneda}/kg</span></p>
                          )}
                          {(productoSeleccionado.unidad_peso === 'lb' || productoSeleccionado.unidad_peso === 'ambos') && productoSeleccionado.precio_por_libra && (
                            <p className="text-xl font-bold text-blue-700">${Math.round(productoSeleccionado.precio_por_libra).toLocaleString('es-CU')} <span className="text-sm font-medium">{productoSeleccionado.moneda}/lb</span></p>
                          )}
                        </div>
                      ) : productoSeleccionado.tipo_venta === 'paquete' ? (
                        <div>
                          {productoSeleccionado.unidades_por_caja && (
                            <p className="text-sm text-blue-500">Paquete x{productoSeleccionado.unidades_por_caja} unidades</p>
                          )}
                          <span className="text-2xl font-bold text-blue-700">${productoSeleccionado.precio.toLocaleString('es-CU')}</span>
                          <span className="text-sm text-blue-600 font-medium ml-1">{productoSeleccionado.moneda}</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-blue-700">${productoSeleccionado.precio.toLocaleString('es-CU')}</span>
                          <span className="text-sm text-blue-600 font-medium">{productoSeleccionado.moneda}</span>
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${productoSeleccionado.disponible ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      {productoSeleccionado.disponible ? 'Disponible' : 'Agotado'}
                    </span>
                  </div>
                </div>

                {productoSeleccionado.categoria && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Categoria:</span>
                    <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                      {productoSeleccionado.categoria.nombre}
                    </span>
                  </div>
                )}

                {productoSeleccionado.descripcion && (
                  <div className="border-t pt-3">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">Descripcion</h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{productoSeleccionado.descripcion}</p>
                  </div>
                )}

                {tienda.whatsapp && (
                  <a href={`https://wa.me/${tienda.whatsapp.replace(/[^0-9]/g, '')}?text=Hola, estoy interesado en: ${productoSeleccionado.nombre}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all shadow-md">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Consultar por WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Boton flotante WhatsApp */}
      {tienda.whatsapp && (
        <a href={`https://wa.me/${tienda.whatsapp.replace(/[^0-9]/g, '')}?text=Hola, me gustaria consultar sobre sus productos`}
          target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Contactar por WhatsApp">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        </a>
      )}

      {/* Modal Grupos WhatsApp */}
      {mostrarModalGrupos && gruposWA.length > 0 && (
        <ModalGruposWhatsApp grupos={gruposWA} nombreTienda={tienda.nombre} onClose={() => setMostrarModalGrupos(false)} />
      )}

      {/* Boton Volver Arriba */}
      {mostrarVolverArriba && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-24 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Volver arriba">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}
