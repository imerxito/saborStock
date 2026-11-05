import React, { useState, useMemo, useRef } from 'react';
import {
  UtensilsCrossed,
  Package,
  PlusCircle,
  Search,
  X,
  Edit3,
  Trash2,
  Utensils,
  Beer,
  Tag,
  Layers,
  Plus,
  MinusCircle,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  Boxes
} from 'lucide-react';

export type TipoProducto = 'cocina' | 'directo' | 'paquete';

export interface Producto {
  id_producto: number;
  codigo: string;
  nombre: string;
  id_categoria: number;
  precio_venta: number;
  descripcion: string;
  activo: boolean;
  tipo: TipoProducto;
}

export interface Ingrediente {
  id_ingrediente: number;
  codigo: string;
  nombre: string;
  id_unidad: number;
  id_categoria_ingrediente: number;
  stock: number;
  stock_minimo: number;
  precio_referencia: number;
  activo: boolean;
}

export interface Receta {
  id_producto: number;
  id_ingrediente: number;
  cantidad: number;
}

export interface ComponenteCombo {
  id_combo: number;
  id_producto_hijo: number;
  cantidad: number;
}

export interface Categoria {
  id_categoria: number;
  nombre: string;
}

export interface CategoriaIngrediente {
  id_cat_ing: number;
  nombre: string;
}

interface RecetaFormItem {
  id_ingrediente: number;
  cantidad: number;
}

interface ComboFormItem {
  id_producto_hijo: number;
  cantidad: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'danger';
}

const UNIDADES_MAP: Record<number, string> = {
  1: 'Kg',
  2: 'Gramos',
  3: 'Litros',
  4: 'Unidad',
  5: 'Mililitros'
};

const CATEGORIAS_INGREDIENTES: CategoriaIngrediente[] = [
  { id_cat_ing: 1, nombre: 'Carnes & Proteínas' },
  { id_cat_ing: 2, nombre: 'Lácteos & Quesos' },
  { id_cat_ing: 3, nombre: 'Verduras & Vegetales' },
  { id_cat_ing: 4, nombre: 'Bebidas & Embotellados' },
  { id_cat_ing: 5, nombre: 'Salsas & Aliños' },
  { id_cat_ing: 6, nombre: 'Panadería' }
];

const INITIAL_CATEGORIAS_PRODUCTO: Categoria[] = [
  { id_categoria: 1, nombre: 'Platos Fuertes' },
  { id_categoria: 2, nombre: 'Entradas & Arepas' },
  { id_categoria: 3, nombre: 'Bebidas Individuales' },
  { id_categoria: 4, nombre: 'Sixpacks & Packs' },
  { id_categoria: 5, nombre: 'Postres & Dulces' },
  { id_categoria: 6, nombre: 'Combos Especiales' },
  { id_categoria: 7, nombre: 'Acompañamientos' },
  { id_categoria: 8, nombre: 'Cafetería' }
];

const LISTA_INSUMOS_BASE: Ingrediente[] = [
  { id_ingrediente: 1, codigo: 'ING-CAR-01', nombre: 'Carne Molida Premium (Kg)', id_unidad: 1, id_categoria_ingrediente: 1, stock: 15.5, stock_minimo: 5.0, precio_referencia: 28000, activo: true },
  { id_ingrediente: 2, codigo: 'ING-CAR-02', nombre: 'Pechuga de Pollo Fileteada (Kg)', id_unidad: 1, id_categoria_ingrediente: 1, stock: 22.0, stock_minimo: 8.0, precio_referencia: 22000, activo: true },
  { id_ingrediente: 3, codigo: 'ING-PAN-01', nombre: 'Pan Brioche Hamburguesa (Und)', id_unidad: 4, id_categoria_ingrediente: 6, stock: 48.0, stock_minimo: 20.0, precio_referencia: 2000, activo: true },
  { id_ingrediente: 4, codigo: 'ING-PAN-02', nombre: 'Pan Arabe para Wrap (Und)', id_unidad: 4, id_categoria_ingrediente: 6, stock: 30.0, stock_minimo: 10.0, precio_referencia: 1500, activo: true },
  { id_ingrediente: 5, codigo: 'ING-QSO-01', nombre: 'Queso Cheddar Laminado (Und)', id_unidad: 4, id_categoria_ingrediente: 2, stock: 12.0, stock_minimo: 15.0, precio_referencia: 1200, activo: true },
  { id_ingrediente: 6, codigo: 'ING-QSO-02', nombre: 'Queso Mozzarella Rallado (Kg)', id_unidad: 1, id_categoria_ingrediente: 2, stock: 10.0, stock_minimo: 4.0, precio_referencia: 24000, activo: true },
  { id_ingrediente: 7, codigo: 'ING-VER-01', nombre: 'Tomate Orgánico (Kg)', id_unidad: 1, id_categoria_ingrediente: 3, stock: 3.2, stock_minimo: 4.0, precio_referencia: 4500, activo: true },
  { id_ingrediente: 8, codigo: 'ING-VER-02', nombre: 'Lechuga Crespa Fresca (Kg)', id_unidad: 1, id_categoria_ingrediente: 3, stock: 5.0, stock_minimo: 2.0, precio_referencia: 3800, activo: true },
  { id_ingrediente: 9, codigo: 'ING-BEB-01', nombre: 'Cerveza Club Colombia 330ml', id_unidad: 4, id_categoria_ingrediente: 4, stock: 72.0, stock_minimo: 24.0, precio_referencia: 3800, activo: true },
  { id_ingrediente: 10, codigo: 'ING-BEB-02', nombre: 'Coca-Cola 400ml Botella', id_unidad: 4, id_categoria_ingrediente: 4, stock: 36.0, stock_minimo: 12.0, precio_referencia: 2500, activo: true },
  { id_ingrediente: 11, codigo: 'ING-SAL-01', nombre: 'Salsa Especial de la Casa (Ml)', id_unidad: 5, id_categoria_ingrediente: 5, stock: 1500.0, stock_minimo: 300.0, precio_referencia: 20, activo: true },
  { id_ingrediente: 12, codigo: 'ING-SAL-02', nombre: 'Aliño de Ajo y Finas Hierbas (Ml)', id_unidad: 5, id_categoria_ingrediente: 5, stock: 800.0, stock_minimo: 200.0, precio_referencia: 25, activo: true }
];

const INITIAL_PRODUCTOS: Producto[] = [
  { id_producto: 1, codigo: 'PRD-COC-001', nombre: 'Hamburguesa Clásica Especial', id_categoria: 1, precio_venta: 24500, descripcion: 'Hamburguesa artesanal con carne molida, queso cheddar y salsa especial', activo: true, tipo: 'cocina' },
  { id_producto: 2, codigo: 'PRD-DIR-002', nombre: 'Coca-Cola 400ml Personal', id_categoria: 3, precio_venta: 5000, descripcion: 'Gaseosa embotellada de 400ml', activo: true, tipo: 'directo' },
  { id_producto: 3, codigo: 'PRD-PAK-003', nombre: 'Sixpack Cerveza Club Colombia', id_categoria: 4, precio_venta: 36000, descripcion: 'Pack promocional de 6 cervezas de 330ml', activo: true, tipo: 'paquete' },
  { id_producto: 4, codigo: 'PRD-PAK-004', nombre: 'Combo Pareja (2 Hamburguesas + 2 Gaseosas)', id_categoria: 6, precio_venta: 48000, descripcion: 'Combo especial que incluye 2 Hamburguesas Clásicas y 2 Coca-Colas', activo: true, tipo: 'paquete' },
  { id_producto: 5, codigo: 'PRD-COC-005', nombre: 'Wrap de Pollo Crujiente', id_categoria: 1, precio_venta: 21000, descripcion: 'Tortilla de trigo con pollo apanado, lechuga y aliño especial', activo: true, tipo: 'cocina' },
  { id_producto: 6, codigo: 'PRD-COC-006', nombre: 'Arepa Rellena con Pollo y Queso', id_categoria: 2, precio_venta: 16000, descripcion: 'Arepa asada de maíz con pollo desmenuzado y queso mozzarella', activo: true, tipo: 'cocina' },
  { id_producto: 7, codigo: 'PRD-DIR-007', nombre: 'Jugo Natural de Maracuyá', id_categoria: 3, precio_venta: 7000, descripcion: 'Jugo fresco preparado en agua o leche', activo: true, tipo: 'directo' }
];

const INITIAL_RECETAS: Receta[] = [
  { id_producto: 1, id_ingrediente: 1, cantidad: 0.200 },
  { id_producto: 1, id_ingrediente: 3, cantidad: 1.0 },
  { id_producto: 1, id_ingrediente: 5, cantidad: 2.0 },
  { id_producto: 1, id_ingrediente: 7, cantidad: 0.050 },
  { id_producto: 1, id_ingrediente: 11, cantidad: 30.0 },
  { id_producto: 2, id_ingrediente: 10, cantidad: 1.0 },
  { id_producto: 3, id_ingrediente: 9, cantidad: 6.0 },
  { id_producto: 5, id_ingrediente: 2, cantidad: 0.180 },
  { id_producto: 5, id_ingrediente: 4, cantidad: 1.0 },
  { id_producto: 5, id_ingrediente: 8, cantidad: 0.040 },
  { id_producto: 5, id_ingrediente: 12, cantidad: 25.0 },
  { id_producto: 6, id_ingrediente: 2, cantidad: 0.150 },
  { id_producto: 6, id_ingrediente: 6, cantidad: 0.080 }
];

const INITIAL_COMBOS: ComponenteCombo[] = [
  { id_combo: 4, id_producto_hijo: 1, cantidad: 2 },
  { id_combo: 4, id_producto_hijo: 2, cantidad: 2 }
];

function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    isDown.current = true;
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
  };

  const onMouseLeave = () => { isDown.current = false; };
  const onMouseUp = () => { isDown.current = false; };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  return { ref, props: { onMouseDown, onMouseLeave, onMouseUp, onMouseMove } };
}

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>(INITIAL_PRODUCTOS);
  const [categoriasProducto, setCategoriasProducto] = useState<Categoria[]>(INITIAL_CATEGORIAS_PRODUCTO);
  const [recetas, setRecetas] = useState<Receta[]>(INITIAL_RECETAS);
  const [componentesCombo, setComponentesCombo] = useState<ComponenteCombo[]>(INITIAL_COMBOS);
  const [insumosBase] = useState<Ingrediente[]>(LISTA_INSUMOS_BASE);

  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<number | 'todas'>('todas');
  const [filterTipo, setFilterTipo] = useState<'todos' | TipoProducto>('todos');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const categoriasScroll = useDragScroll();
  const insumosTabsScroll = useDragScroll();
  const productosComboScroll = useDragScroll();

  const [activeTabIngrediente, setActiveTabIngrediente] = useState<number>(1);
  const [activeTabCategoriaProducto, setActiveTabCategoriaProducto] = useState<number>(1);

  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);
  const [editingProductoId, setEditingProductoId] = useState<number | null>(null);

  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [formCatNombre, setFormCatNombre] = useState('');

  const [formProdNombre, setFormProdNombre] = useState('');
  const [formProdCategoria, setFormProdCategoria] = useState(1);
  const [formProdPrecio, setFormProdPrecio] = useState<number | ''>('');
  const [formProdDescripcion, setFormProdDescripcion] = useState('');
  const [formProdActivo, setFormProdActivo] = useState(true);
  const [formTipo, setFormTipo] = useState<TipoProducto>('cocina');
  
  const [formRecetaItems, setFormRecetaItems] = useState<RecetaFormItem[]>([]);
  const [formComboItems, setFormComboItems] = useState<ComboFormItem[]>([]);

  const formProdCodigoAuto = useMemo(() => {
    const prefijo = formTipo === 'cocina' ? 'PRD-COC' : formTipo === 'directo' ? 'PRD-DIR' : 'PRD-PAK';
    const idSiguiente = editingProductoId ?? (productos.length ? Math.max(...productos.map(p => p.id_producto)) + 1 : 1);
    const num = String(idSiguiente).padStart(3, '0');
    return `${prefijo}-${num}`;
  }, [formTipo, editingProductoId, productos]);

  const addToast = (message: string, type: 'success' | 'warning' | 'danger' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const stats = useMemo(() => ({
    totalProductos: productos.length,
    recetasCocina: productos.filter(p => p.tipo === 'cocina').length,
    productosDirectos: productos.filter(p => p.tipo === 'directo').length,
    paquetes: productos.filter(p => p.tipo === 'paquete').length
  }), [productos]);

  const filteredProductos = useMemo(() => {
    return productos.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategoria === 'todas' || p.id_categoria === selectedCategoria;
      const matchTipo = filterTipo === 'todos' || p.tipo === filterTipo;
      return matchSearch && matchCat && matchTipo;
    });
  }, [productos, searchQuery, selectedCategoria, filterTipo]);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleActivo = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductos(prev => prev.map(p => {
      if (p.id_producto === id) {
        return { ...p, activo: !p.activo };
      }
      return p;
    }));
  };

  const openProductoModal = (prod?: Producto) => {
    if (prod) {
      setEditingProductoId(prod.id_producto);
      setFormProdNombre(prod.nombre);
      setFormProdCategoria(prod.id_categoria);
      setFormProdPrecio(prod.precio_venta);
      setFormProdDescripcion(prod.descripcion || '');
      setFormProdActivo(prod.activo);
      setFormTipo(prod.tipo || 'cocina');

      const itemsIng = recetas
        .filter(r => r.id_producto === prod.id_producto)
        .map(r => ({ id_ingrediente: r.id_ingrediente, cantidad: r.cantidad }));
      setFormRecetaItems(itemsIng);

      const itemsCombo = componentesCombo
        .filter(c => c.id_combo === prod.id_producto)
        .map(c => ({ id_producto_hijo: c.id_producto_hijo, cantidad: c.cantidad }));
      setFormComboItems(itemsCombo);
    } else {
      setEditingProductoId(null);
      setFormProdNombre('');
      setFormProdCategoria(categoriasProducto[0]?.id_categoria || 1);
      setFormProdPrecio('');
      setFormProdDescripcion('');
      setFormProdActivo(true);
      setFormTipo('cocina');
      setFormRecetaItems([]);
      setFormComboItems([]);
    }
    setActiveTabIngrediente(1);
    setActiveTabCategoriaProducto(categoriasProducto[0]?.id_categoria || 1);
    setIsProductoModalOpen(true);
  };

  const handleSaveProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (formProdPrecio === '' || !formProdNombre.trim()) return;

    const prodId = editingProductoId ?? (productos.length ? Math.max(...productos.map(p => p.id_producto)) + 1 : 1);
    const newProducto: Producto = {
      id_producto: prodId,
      codigo: formProdCodigoAuto,
      nombre: formProdNombre.trim(),
      id_categoria: Number(formProdCategoria),
      precio_venta: Number(formProdPrecio),
      descripcion: formProdDescripcion.trim(),
      activo: formProdActivo,
      tipo: formTipo
    };

    if (editingProductoId) {
      setProductos(prev => prev.map(p => p.id_producto === editingProductoId ? newProducto : p));
    } else {
      setProductos(prev => [...prev, newProducto]);
    }

    const updatedRecetas = recetas.filter(r => r.id_producto !== prodId);
    const newRecetaRows: Receta[] = formRecetaItems
      .filter(item => Number(item.cantidad) > 0)
      .map(item => ({
        id_producto: prodId,
        id_ingrediente: item.id_ingrediente,
        cantidad: Number(item.cantidad)
      }));
    setRecetas([...updatedRecetas, ...newRecetaRows]);

    const updatedCombos = componentesCombo.filter(c => c.id_combo !== prodId);
    if (formTipo === 'paquete') {
      const newComboRows: ComponenteCombo[] = formComboItems
        .filter(item => Number(item.cantidad) > 0)
        .map(item => ({
          id_combo: prodId,
          id_producto_hijo: item.id_producto_hijo,
          cantidad: Number(item.cantidad)
        }));
      setComponentesCombo([...updatedCombos, ...newComboRows]);
    } else {
      setComponentesCombo(updatedCombos);
    }

    setIsProductoModalOpen(false);
    addToast(editingProductoId ? 'Producto actualizado' : 'Producto creado con éxito');
  };

  const handleDeleteProducto = (id: number) => {
    if (window.confirm('¿Desea eliminar este producto del sistema?')) {
      setProductos(prev => prev.filter(p => p.id_producto !== id));
      setRecetas(prev => prev.filter(r => r.id_producto !== id));
      setComponentesCombo(prev => prev.filter(c => c.id_combo !== id && c.id_producto_hijo !== id));
      addToast('Producto eliminado', 'danger');
    }
  };

  const handleSaveCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCatNombre.trim()) return;

    if (editingCatId) {
      setCategoriasProducto(prev => prev.map(c => c.id_categoria === editingCatId ? { ...c, nombre: formCatNombre.trim() } : c));
      addToast('Categoría actualizada');
    } else {
      const newId = categoriasProducto.length ? Math.max(...categoriasProducto.map(c => c.id_categoria)) + 1 : 1;
      setCategoriasProducto(prev => [...prev, { id_categoria: newId, nombre: formCatNombre.trim() }]);
      addToast('Categoría agregada');
    }
    setFormCatNombre('');
    setEditingCatId(null);
  };

  const handleDeleteCategoria = (id: number) => {
    if (productos.some(p => p.id_categoria === id)) {
      addToast('No se puede eliminar: tiene productos asignados', 'warning');
      return;
    }
    if (window.confirm('¿Eliminar categoría?')) {
      setCategoriasProducto(prev => prev.filter(c => c.id_categoria !== id));
      if (selectedCategoria === id) setSelectedCategoria('todas');
      addToast('Categoría eliminada', 'danger');
    }
  };

  const handleAddInsumo = (ingrediente: Ingrediente) => {
    setFormRecetaItems(prev => {
      const existente = prev.find(i => i.id_ingrediente === ingrediente.id_ingrediente);
      if (existente) {
        return prev.map(i => i.id_ingrediente === ingrediente.id_ingrediente ? { ...i, cantidad: Number((i.cantidad + 1).toFixed(3)) } : i);
      } else {
        return [...prev, { id_ingrediente: ingrediente.id_ingrediente, cantidad: 1 }];
      }
    });
  };

  const handleRemoveInsumo = (idIngrediente: number) => {
    setFormRecetaItems(prev => {
      const existente = prev.find(i => i.id_ingrediente === idIngrediente);
      if (!existente) return prev;
      if (existente.cantidad > 1) {
        return prev.map(i => i.id_ingrediente === idIngrediente ? { ...i, cantidad: Number((i.cantidad - 1).toFixed(3)) } : i);
      } else {
        return prev.filter(i => i.id_ingrediente !== idIngrediente);
      }
    });
  };

  const updateRecetaCantidad = (idIngrediente: number, cantidad: number) => {
    setFormRecetaItems(prev => prev.map(item => item.id_ingrediente === idIngrediente ? { ...item, cantidad: Math.max(0, cantidad) } : item));
  };

  const handleAddProductoCombo = (productoHijo: Producto) => {
    setFormComboItems(prev => {
      const existente = prev.find(i => i.id_producto_hijo === productoHijo.id_producto);
      if (existente) {
        return prev.map(i => i.id_producto_hijo === productoHijo.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i);
      } else {
        return [...prev, { id_producto_hijo: productoHijo.id_producto, cantidad: 1 }];
      }
    });
  };

  const handleRemoveProductoCombo = (idProductoHijo: number) => {
    setFormComboItems(prev => {
      const existente = prev.find(i => i.id_producto_hijo === idProductoHijo);
      if (!existente) return prev;
      if (existente.cantidad > 1) {
        return prev.map(i => i.id_producto_hijo === idProductoHijo ? { ...i, cantidad: i.cantidad - 1 } : i);
      } else {
        return prev.filter(i => i.id_producto_hijo !== idProductoHijo);
      }
    });
  };

  const updateComboCantidad = (idProductoHijo: number, cantidad: number) => {
    setFormComboItems(prev => prev.map(item => item.id_producto_hijo === idProductoHijo ? { ...item, cantidad: Math.max(0, cantidad) } : item));
  };

  const modalActive = isProductoModalOpen || isCategoriaModalOpen;

  return (
    <div className={`h-full w-full bg-[#0B132B] text-[#F4D6B0] font-sans antialiased flex flex-col overflow-hidden ${modalActive ? 'pointer-events-none select-none' : ''}`}>

      {/* HEADER PRINCIPAL Y FILTROS FIJOS */}
      <div className="shrink-0 w-full flex flex-col z-50 bg-[#0B132B]">
        
        {/* HEADER */}
        <header className="bg-[#1C2541] border-b border-[#3A506B] px-4 lg:px-6 py-2">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#3A506B]/40 border border-[#5BC0DE]/30 text-[#5BC0DE]">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-[#F4D6B0]">Gestión de Productos & Fichas Técnicas</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3A506B]/40 text-[#5BC0DE] border border-[#5BC0DE]/30 font-mono font-medium">
                    Catálogo
                  </span>
                </div>
                <p className="text-[11px] text-[#5BC0DE]/80">Configuración de platos, insumos por receta y productos de venta directa</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="bg-[#0B132B] border border-[#3A506B] p-2 rounded-xl flex items-center gap-2">
                <Package className="w-4 h-4 text-[#5BC0DE]" />
                <div>
                  <div className="text-[#5BC0DE]/70 text-[9px]">Total</div>
                  <div className="text-xs sm:text-sm font-bold text-[#F4D6B0]">{stats.totalProductos}</div>
                </div>
              </div>
              <div className="bg-[#0B132B] border border-[#3A506B] p-2 rounded-xl flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[#5BC0DE]/70 text-[9px]">Cocina</div>
                  <div className="text-xs sm:text-sm font-bold text-[#F4D6B0]">{stats.recetasCocina}</div>
                </div>
              </div>
              <div className="bg-[#0B132B] border border-[#3A506B] p-2 rounded-xl flex items-center gap-2">
                <Beer className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-[#5BC0DE]/70 text-[9px]">Directos</div>
                  <div className="text-xs sm:text-sm font-bold text-[#F4D6B0]">{stats.productosDirectos}</div>
                </div>
              </div>
              <div className="bg-[#0B132B] border border-[#3A506B] p-2 rounded-xl flex items-center gap-2">
                <Boxes className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-[#5BC0DE]/70 text-[9px]">Paquetes</div>
                  <div className="text-xs sm:text-sm font-bold text-[#F4D6B0]">{stats.paquetes}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* FILTROS */}
        <div className="bg-[#1C2541] px-4 lg:px-6 py-2 border-b border-[#3A506B]">
          <div className="max-w-7xl mx-auto space-y-2.5">
            <div className="flex flex-col md:flex-row gap-2.5 items-center">
              
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por código o nombre..."
                  className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F4D6B0] placeholder-[#5BC0DE]/50 focus:outline-none focus:border-[#5BC0DE]"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#0B132B] p-1 rounded-xl border border-[#3A506B] shrink-0">
                <button
                  onClick={() => setFilterTipo('todos')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterTipo === 'todos' ? 'bg-[#5BC0DE] text-[#0B132B] shadow' : 'text-[#5BC0DE] hover:bg-[#1C2541]'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterTipo('cocina')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterTipo === 'cocina' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-400 hover:bg-emerald-950/40'
                  }`}
                >
                  <Utensils className="w-3 h-3" /> Cocina
                </button>
                <button
                  onClick={() => setFilterTipo('directo')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterTipo === 'directo' ? 'bg-blue-600 text-white shadow' : 'text-blue-400 hover:bg-blue-950/40'
                  }`}
                >
                  <Beer className="w-3 h-3" /> Directo
                </button>
                <button
                  onClick={() => setFilterTipo('paquete')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterTipo === 'paquete' ? 'bg-purple-600 text-white shadow' : 'text-purple-400 hover:bg-purple-950/40'
                  }`}
                >
                  <Boxes className="w-3 h-3" /> Paquete
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                <button
                  onClick={() => { setEditingCatId(null); setFormCatNombre(''); setIsCategoriaModalOpen(true); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B132B] hover:bg-[#3A506B]/50 text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] text-xs font-semibold transition-all"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#5BC0DE]" />
                  <span>Categorías</span>
                </button>

                <button
                  onClick={() => openProductoModal()}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] text-xs font-semibold shadow-md transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Nuevo Producto</span>
                </button>
              </div>
            </div>

            <div 
              ref={categoriasScroll.ref}
              {...categoriasScroll.props}
              className="flex items-center gap-1.5 overflow-x-auto pb-1 cursor-grab active:cursor-grabbing select-none scrollbar-thin scrollbar-thumb-[#5BC0DE] scrollbar-track-[#0B132B]"
            >
              <span className="text-[11px] font-bold text-[#5BC0DE] uppercase shrink-0 flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3" /> CARTA:
              </span>
              <button
                onClick={() => setSelectedCategoria('todas')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  selectedCategoria === 'todas'
                    ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow'
                    : 'bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]'
                }`}
              >
                Todas ({productos.length})
              </button>

              {categoriasProducto.map((cat) => {
                const count = productos.filter(p => p.id_categoria === cat.id_categoria).length;
                const isSelected = selectedCategoria === cat.id_categoria;
                return (
                  <button
                    key={cat.id_categoria}
                    onClick={() => setSelectedCategoria(cat.id_categoria)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow'
                        : 'bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]'
                    }`}
                  >
                    <span>{cat.nombre}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[#1C2541] text-[#5BC0DE]' : 'bg-[#1C2541] text-[#5BC0DE]/70'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL CON SCROLL AISLADO */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 overflow-hidden flex flex-col min-h-0">
        <section className="bg-[#1C2541] border border-[#3A506B] rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col min-h-0">
          
          <div className="flex-1 overflow-auto [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B] relative">
            <table className="w-full text-left border-collapse min-w-[750px]">
              
              {/* ENCABEZADO STICKY */}
              <thead className="sticky top-0 z-30 bg-[#1C2541] shadow-md border-b-2 border-[#5BC0DE]">
                <tr className="text-[#5BC0DE] text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 bg-[#1C2541]"></th>
                  <th className="py-3 px-4 text-[#5BC0DE] bg-[#1C2541]">Código</th>
                  <th className="py-3 px-4 text-[#5BC0DE] bg-[#1C2541]">Nombre del Producto</th>
                  <th className="py-3 px-4 text-[#5BC0DE] bg-[#1C2541]">Tipo</th>
                  <th className="py-3 px-4 text-[#5BC0DE] bg-[#1C2541]">Categoría</th>
                  <th className="py-3 px-4 text-right text-[#5BC0DE] bg-[#1C2541]">Precio Venta</th>
                  <th className="py-3 px-4 text-center text-[#5BC0DE] bg-[#1C2541]">Estado</th>
                  <th className="py-3 px-4 text-center text-[#5BC0DE] bg-[#1C2541]">Acciones</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-[#3A506B]/50 text-sm">
                {filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#5BC0DE]/60">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No se encontraron productos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredProductos.map(p => {
                    const isExpanded = !!expandedRows[p.id_producto];
                    const recItems = recetas.filter(r => r.id_producto === p.id_producto);
                    const comboItems = componentesCombo.filter(c => c.id_combo === p.id_producto);
                    const catObj = categoriasProducto.find(c => c.id_categoria === p.id_categoria);

                    let costoEstimado = 0;
                    recItems.forEach(r => {
                      const ing = insumosBase.find(i => i.id_ingrediente === r.id_ingrediente);
                      if (ing) costoEstimado += r.cantidad * ing.precio_referencia;
                    });
                    comboItems.forEach(c => {
                      const prodHijo = productos.find(ph => ph.id_producto === c.id_producto_hijo);
                      if (prodHijo) costoEstimado += c.cantidad * (prodHijo.precio_venta * 0.6);
                    });

                    return (
                      <React.Fragment key={p.id_producto}>
                        <tr
                          onClick={() => toggleRow(p.id_producto)}
                          className={`cursor-pointer transition-colors hover:bg-[#3A506B]/20 ${
                            isExpanded ? 'bg-[#0B132B]/80' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center text-[#5BC0DE]">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs font-bold text-[#5BC0DE]">
                            {p.codigo}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#F4D6B0]">
                            {p.nombre}
                          </td>
                          <td className="py-3 px-4">
                            {p.tipo === 'cocina' && (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 font-semibold">
                                <Utensils size={12} /> Cocina
                              </span>
                            )}
                            {p.tipo === 'directo' && (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/50 font-semibold">
                                <Beer size={12} /> Directo
                              </span>
                            )}
                            {p.tipo === 'paquete' && (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/50 font-semibold">
                                <Boxes size={12} /> Combo / Paquete
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-[#5BC0DE]">
                            {catObj?.nombre || 'General'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#F4D6B0]">
                            {formatCurrency(p.precio_venta)}
                          </td>
                          
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleToggleActivo(p.id_producto, e)}
                              className={`w-24 h-7 inline-flex items-center justify-center rounded-full text-xs font-semibold transition-all border ${
                                p.activo
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/80'
                                  : 'bg-amber-950/80 text-amber-300 border-amber-700/60 hover:bg-amber-900/80'
                              }`}
                              title="Haga clic para cambiar estado"
                            >
                              {p.activo ? '● Activo' : '○ Inactivo'}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openProductoModal(p)}
                                className="p-1.5 text-[#5BC0DE] hover:text-[#F4D6B0] bg-[#0B132B] border border-[#3A506B] rounded-lg"
                                title="Editar producto"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteProducto(p.id_producto)}
                                className="p-1.5 text-[#D97706] hover:bg-[#D97706]/20 rounded-lg"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-[#0B132B]">
                            <td colSpan={8} className="p-4 border-b border-[#3A506B]">
                              <div className="bg-[#1C2541] p-4 rounded-xl border border-[#3A506B] space-y-3">
                                <div className="flex justify-between items-center border-b border-[#3A506B]/50 pb-2">
                                  <div>
                                    <h4 className="text-xs font-bold text-[#5BC0DE] uppercase flex items-center gap-1.5">
                                      <Layers size={14} /> Detalle de Componentes / Insumos y Platos Incluidos ({recItems.length + comboItems.length})
                                    </h4>
                                    <p className="text-[11px] text-[#5BC0DE]/70 mt-0.5">{p.descripcion || 'Sin descripción adicional.'}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] text-[#5BC0DE] block">Costo Directo Estimado</span>
                                    <span className="font-mono text-xs font-bold text-[#F4D6B0]">{formatCurrency(costoEstimado)}</span>
                                  </div>
                                </div>

                                {recItems.length === 0 && comboItems.length === 0 ? (
                                  <p className="text-xs text-[#5BC0DE]/60 italic py-2">No hay insumos o productos asociados a este registro.</p>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {recItems.map(r => {
                                      const ing = insumosBase.find(i => i.id_ingrediente === r.id_ingrediente);
                                      if (!ing) return null;
                                      const catIng = CATEGORIAS_INGREDIENTES.find(ci => ci.id_cat_ing === ing.id_categoria_ingrediente);
                                      const subtotal = r.cantidad * ing.precio_referencia;
                                      return (
                                        <div key={`ing-${r.id_ingrediente}`} className="bg-[#0B132B] p-2.5 rounded-lg border border-[#3A506B] text-xs flex justify-between items-center">
                                          <div>
                                            <span className="font-semibold text-[#F4D6B0] block">{ing.nombre}</span>
                                            <span className="text-[10px] text-[#5BC0DE]">{catIng?.nombre || 'Insumo'}</span>
                                          </div>
                                          <div className="text-right">
                                            <span className="font-mono text-[#5BC0DE] block">{r.cantidad} {UNIDADES_MAP[ing.id_unidad]}</span>
                                            <span className="font-mono text-[10px] text-[#5BC0DE]/70">{formatCurrency(subtotal)}</span>
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {comboItems.map(c => {
                                      const prodHijo = productos.find(ph => ph.id_producto === c.id_producto_hijo);
                                      if (!prodHijo) return null;
                                      const catProd = categoriasProducto.find(cp => cp.id_categoria === prodHijo.id_categoria);
                                      return (
                                        <div key={`prod-${c.id_producto_hijo}`} className="bg-[#0B132B] p-2.5 rounded-lg border border-purple-500/40 text-xs flex justify-between items-center">
                                          <div>
                                            <span className="font-semibold text-purple-300 block">{prodHijo.nombre}</span>
                                            <span className="text-[10px] text-[#5BC0DE]">{catProd?.nombre || 'Producto de Carta'}</span>
                                          </div>
                                          <div className="text-right">
                                            <span className="font-mono text-purple-200 block">{c.cantidad} Und</span>
                                            <span className="font-mono text-[10px] text-[#5BC0DE]/70">{formatCurrency(prodHijo.precio_venta)} c/u</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* MODAL NUEVO PRODUCTO */}
      {isProductoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-3xl rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-[#3A506B] flex items-center justify-between bg-[#0B132B] shrink-0">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#5BC0DE]" />
                <h3 className="text-lg font-bold text-[#F4D6B0]">
                  {editingProductoId ? 'Editar Producto / Combo' : 'Agregar Nuevo Producto / Combo'}
                </h3>
              </div>
              <button onClick={() => setIsProductoModalOpen(false)} className="text-[#5BC0DE] hover:text-[#F4D6B0]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProducto} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-[#5BC0DE] scrollbar-track-[#0B132B]">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-[#5BC0DE]">Tipo de Manejo de Producto</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormTipo('cocina')}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                      formTipo === 'cocina'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md font-bold'
                        : 'bg-[#0B132B] border-[#3A506B] text-emerald-400'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    <span>Plato de Cocina</span>
                    <span className="text-[9px] opacity-75">N Ingredientes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTipo('directo')}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                      formTipo === 'directo'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md font-bold'
                        : 'bg-[#0B132B] border-[#3A506B] text-blue-400'
                    }`}
                  >
                    <Beer className="w-4 h-4" />
                    <span>Venta Directa</span>
                    <span className="text-[9px] opacity-75">Insumos / Stock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTipo('paquete')}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                      formTipo === 'paquete'
                        ? 'bg-purple-600 border-purple-500 text-white shadow-md font-bold'
                        : 'bg-[#0B132B] border-[#3A506B] text-purple-400'
                    }`}
                  >
                    <Boxes className="w-4 h-4" />
                    <span>Combo / Paquete</span>
                    <span className="text-[9px] opacity-75">Incluye Platos de Comida</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#5BC0DE] mb-1">Código (Generado Automáticamente)</label>
                  <input
                    type="text"
                    readOnly
                    value={formProdCodigoAuto}
                    className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl px-3.5 py-2 text-sm font-mono text-[#5BC0DE] cursor-not-allowed font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5BC0DE] mb-1">Nombre del Producto o Combo</label>
                  <input
                    type="text"
                    required
                    value={formProdNombre}
                    onChange={e => setFormProdNombre(e.target.value)}
                    placeholder="Ej: Hamburguesa Especial o Combo Pareja de Comida"
                    className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl px-3.5 py-2 text-sm text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#5BC0DE] mb-1">Categoría de Carta</label>
                  <select
                    value={formProdCategoria}
                    onChange={e => setFormProdCategoria(Number(e.target.value))}
                    className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl px-3 py-2 text-sm text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                  >
                    {categoriasProducto.map(c => (
                      <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5BC0DE] mb-1">Precio Venta (COP)</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    required
                    value={formProdPrecio}
                    onChange={e => setFormProdPrecio(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="25000"
                    className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl px-3.5 py-2 text-sm text-[#F4D6B0] font-mono focus:outline-none focus:border-[#5BC0DE]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formProdActivo}
                      onChange={e => setFormProdActivo(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#0B132B] border border-[#3A506B] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#5BC0DE] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5BC0DE] peer-checked:after:bg-[#0B132B]"></div>
                    <span className="ml-3 text-sm font-medium text-[#F4D6B0]">Activo</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5BC0DE] mb-1">Descripción Comercial</label>
                <textarea
                  rows={2}
                  value={formProdDescripcion}
                  onChange={e => setFormProdDescripcion(e.target.value)}
                  placeholder="Detalles para la carta o alimentos que componen el combo..."
                  className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl px-3.5 py-2 text-sm text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE] resize-none"
                />
              </div>

              {formTipo === 'paquete' && (
                <div className="space-y-4 pt-3 border-t border-purple-500/40 bg-purple-950/10 p-4 rounded-xl border">
                  <h4 className="text-xs font-semibold uppercase text-purple-300 flex items-center gap-1.5">
                    <Boxes size={14} /> Productos de Comida y Bebidas que integran este Combo
                  </h4>

                  <div 
                    ref={productosComboScroll.ref}
                    {...productosComboScroll.props}
                    className="flex gap-2 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing select-none scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-[#0B132B]"
                  >
                    {categoriasProducto.map(cat => (
                      <button
                        key={cat.id_categoria}
                        type="button"
                        onClick={() => setActiveTabCategoriaProducto(cat.id_categoria)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                          activeTabCategoriaProducto === cat.id_categoria
                            ? 'bg-purple-600 text-white border-purple-500 shadow'
                            : 'bg-[#0B132B] text-purple-300 border-[#3A506B] hover:border-purple-400'
                        }`}
                      >
                        {cat.nombre}
                      </button>
                    ))}
                  </div>

                  <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] max-h-40 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-[#0B132B]">
                    <div className="text-[11px] text-purple-300/80 mb-1">Haz clic en <b>[+]</b> para agregar platos o bebidas al combo:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {productos
                        .filter(p => p.id_categoria === activeTabCategoriaProducto && p.id_producto !== editingProductoId)
                        .map(prodHijo => {
                          const enCombo = formComboItems.find(c => c.id_producto_hijo === prodHijo.id_producto);
                          return (
                            <div 
                              key={prodHijo.id_producto}
                              className="bg-[#1C2541] p-2 rounded-lg border border-[#3A506B] flex justify-between items-center transition-all text-xs"
                            >
                              <div className="overflow-hidden pr-2">
                                <span className="font-semibold text-[#F4D6B0] block truncate">{prodHijo.nombre}</span>
                                <span className="text-[10px] text-purple-300 font-mono">{formatCurrency(prodHijo.precio_venta)}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {enCombo && (
                                  <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                                    {enCombo.cantidad}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleAddProductoCombo(prodHijo)}
                                  className="p-1 rounded bg-purple-600 text-white hover:bg-purple-500 transition-all"
                                  title="Agregar producto al combo"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h5 className="text-xs font-bold text-purple-200">Platos / Productos en este Combo ({formComboItems.length})</h5>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-[#0B132B]">
                      {formComboItems.map((item) => {
                        const prodObj = productos.find(p => p.id_producto === item.id_producto_hijo);
                        if (!prodObj) return null;
                        return (
                          <div key={item.id_producto_hijo} className="flex items-center justify-between gap-2 bg-[#0B132B] p-2.5 rounded-xl border border-purple-500/30">
                            <div className="flex-1">
                              <span className="text-xs font-semibold text-purple-200 block">{prodObj.nombre}</span>
                              <span className="text-[10px] text-[#5BC0DE]">Precio Carta: {formatCurrency(prodObj.precio_venta)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-[#3A506B] rounded-lg bg-[#1C2541] overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductoCombo(item.id_producto_hijo)}
                                  className="p-1.5 text-purple-300 hover:bg-[#3A506B]/50 transition-colors"
                                  title="Disminuir"
                                >
                                  <MinusCircle size={14} />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.cantidad}
                                  onChange={e => updateComboCantidad(item.id_producto_hijo, e.target.value === '' ? 0 : Number(e.target.value))}
                                  className="w-12 bg-transparent text-center text-xs text-[#F4D6B0] font-mono focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddProductoCombo(prodObj)}
                                  className="p-1.5 text-purple-300 hover:bg-[#3A506B]/50 transition-colors"
                                  title="Aumentar"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setFormComboItems(prev => prev.filter(c => c.id_producto_hijo !== item.id_producto_hijo));
                                }}
                                className="p-1.5 text-[#D97706] hover:bg-[#D97706]/20 rounded-lg transition-colors"
                                title="Eliminar del combo"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {formComboItems.length === 0 && (
                        <p className="text-xs text-purple-300/60 italic py-2 text-center bg-[#0B132B]/40 rounded-xl border border-dashed border-purple-500/30">
                          Selecciona platos de comida o bebidas de las pestañas superiores para armar este combo.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-3 border-t border-[#3A506B]">
                <h4 className="text-xs font-semibold uppercase text-[#5BC0DE] flex items-center gap-1.5">
                  <Layers size={14} /> 
                  {formTipo === 'cocina' ? 'Ficha Técnica / Ingredientes del Plato' : 
                   formTipo === 'directo' ? 'Insumos y Descuento de Stock (Venta Directa)' : 
                   'Insumos Adicionales de Inventario'}
                </h4>

                <div 
                  ref={insumosTabsScroll.ref}
                  {...insumosTabsScroll.props}
                  className="flex gap-2 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing select-none scrollbar-thin scrollbar-thumb-[#5BC0DE] scrollbar-track-[#0B132B]"
                >
                  {CATEGORIAS_INGREDIENTES.map(catIng => (
                    <button
                      key={catIng.id_cat_ing}
                      type="button"
                      onClick={() => setActiveTabIngrediente(catIng.id_cat_ing)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                        activeTabIngrediente === catIng.id_cat_ing
                          ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow'
                          : 'bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]'
                      }`}
                    >
                      {catIng.nombre}
                    </button>
                  ))}
                </div>

                <div className="bg-[#0B132B] p-3 rounded-xl border border-[#3A506B] max-h-40 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-[#5BC0DE] scrollbar-track-[#0B132B]">
                  <div className="text-[11px] text-[#5BC0DE]/70 mb-1">Haz clic en <b>[+]</b> para agregar o sumar insumos:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {insumosBase
                      .filter(i => i.id_categoria_ingrediente === activeTabIngrediente)
                      .map(ing => {
                        const enReceta = formRecetaItems.find(r => r.id_ingrediente === ing.id_ingrediente);
                        return (
                          <div 
                            key={ing.id_ingrediente}
                            className="bg-[#1C2541] p-2 rounded-lg border border-[#3A506B] flex justify-between items-center transition-all text-xs"
                          >
                            <div className="overflow-hidden pr-2">
                              <span className="font-semibold text-[#F4D6B0] block truncate">{ing.nombre}</span>
                              <span className="text-[10px] text-[#5BC0DE]">Ref: {formatCurrency(ing.precio_referencia)} / {UNIDADES_MAP[ing.id_unidad]}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {enReceta && (
                                <span className="text-[10px] font-mono bg-[#5BC0DE]/20 text-[#5BC0DE] px-1.5 py-0.5 rounded">
                                  {enReceta.cantidad}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleAddInsumo(ing)}
                                className="p-1 rounded bg-[#5BC0DE] text-[#0B132B] hover:bg-[#5BC0DE]/80 transition-all"
                                title="Agregar / Sumar 1"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h5 className="text-xs font-bold text-[#F4D6B0]">Insumos Directos de Stock ({formRecetaItems.length})</h5>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#5BC0DE] scrollbar-track-[#0B132B]">
                    {formRecetaItems.map((item) => {
                      const ingObj = insumosBase.find(i => i.id_ingrediente === item.id_ingrediente);
                      if (!ingObj) return null;
                      return (
                        <div key={item.id_ingrediente} className="flex items-center justify-between gap-2 bg-[#0B132B] p-2.5 rounded-xl border border-[#3A506B]">
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-[#F4D6B0] block">{ingObj.nombre}</span>
                            <span className="text-[10px] text-[#5BC0DE]">Unidad: {UNIDADES_MAP[ingObj.id_unidad]}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-[#3A506B] rounded-lg bg-[#1C2541] overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleRemoveInsumo(item.id_ingrediente)}
                                className="p-1.5 text-[#5BC0DE] hover:bg-[#3A506B]/50 transition-colors"
                                title="Disminuir"
                              >
                                <MinusCircle size={14} />
                              </button>
                              <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={item.cantidad}
                                onChange={e => updateRecetaCantidad(item.id_ingrediente, e.target.value === '' ? 0 : Number(e.target.value))}
                                className="w-16 bg-transparent text-center text-xs text-[#F4D6B0] font-mono focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddInsumo(ingObj)}
                                className="p-1.5 text-[#5BC0DE] hover:bg-[#3A506B]/50 transition-colors"
                                title="Aumentar"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setFormRecetaItems(prev => prev.filter(r => r.id_ingrediente !== item.id_ingrediente));
                              }}
                              className="p-1.5 text-[#D97706] hover:bg-[#D97706]/20 rounded-lg transition-colors"
                              title="Eliminar línea"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {formRecetaItems.length === 0 && (
                      <p className="text-xs text-[#5BC0DE]/60 italic py-2 text-center bg-[#0B132B]/40 rounded-xl border border-dashed border-[#3A506B]">
                        Usa los tabs superiores y presiona [+] para asignar insumos directos de stock.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#3A506B] flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProductoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0B132B] text-[#5BC0DE] hover:text-[#F4D6B0] text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] text-sm font-semibold shadow-lg transition-colors"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATEGORÍAS */}
      {isCategoriaModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-[#3A506B] flex items-center justify-between bg-[#0B132B] shrink-0">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#5BC0DE]" />
                <h3 className="text-lg font-bold text-[#F4D6B0]">Gestionar Categorías de Carta</h3>
              </div>
              <button onClick={() => setIsCategoriaModalOpen(false)} className="text-[#5BC0DE] hover:text-[#F4D6B0]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#5BC0DE] scrollbar-track-[#0B132B]">
              <form onSubmit={handleSaveCategoria} className="bg-[#0B132B] p-4 rounded-xl border border-[#3A506B] space-y-3">
                <h4 className="text-xs font-semibold uppercase text-[#5BC0DE]">
                  {editingCatId ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formCatNombre}
                    onChange={e => setFormCatNombre(e.target.value)}
                    placeholder="Nombre de la categoría..."
                    className="flex-1 bg-[#1C2541] border border-[#3A506B] rounded-xl px-3.5 py-2 text-sm text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] text-xs font-semibold rounded-xl transition-all shadow shrink-0"
                  >
                    {editingCatId ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-[#5BC0DE]">Categorías Existentes ({categoriasProducto.length})</h4>
                <div className="space-y-2">
                  {categoriasProducto.map(cat => {
                    const cantProductos = productos.filter(p => p.id_categoria === cat.id_categoria).length;
                    return (
                      <div key={cat.id_categoria} className="flex items-center justify-between bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
                        <div>
                          <span className="text-sm font-bold text-[#F4D6B0] block">{cat.nombre}</span>
                          <span className="text-[10px] text-[#5BC0DE]">{cantProductos} productos asignados</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setEditingCatId(cat.id_categoria); setFormCatNombre(cat.nombre); }}
                            className="p-1.5 bg-[#1C2541] text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] rounded-lg text-xs"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategoria(cat.id_categoria)}
                            className="p-1.5 text-[#D97706] hover:bg-[#D97706]/20 rounded-lg text-xs"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#3A506B] bg-[#0B132B] flex justify-end shrink-0">
              <button
                onClick={() => setIsCategoriaModalOpen(false)}
                className="px-4 py-2 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] text-xs font-semibold rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIONES TOAST */}
      <div className="fixed bottom-5 right-5 z-[1100] space-y-2 pointer-events-none">
        <div className="space-y-2">
          {toasts.map(toast => {
            const bgColor = toast.type === 'danger' ? 'bg-[#D97706]/90 border-[#D97706] text-white' :
              toast.type === 'warning' ? 'bg-[#D97706]/90 border-[#D97706] text-white' :
              'bg-[#5BC0DE] border-[#5BC0DE] text-[#0B132B]';
            return (
              <div key={toast.id} className={`px-4 py-3 rounded-xl border shadow-xl text-xs font-medium flex items-center gap-2.5 transition-all ${bgColor}`}>
                {toast.type === 'danger' ? <AlertOctagon size={16} /> : toast.type === 'warning' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                <span>{toast.message}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}