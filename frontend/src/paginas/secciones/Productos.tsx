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

  const getDetalle = (p: Producto) => {
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

    return { recItems, comboItems, catObj, costoEstimado };
  };

  const renderTipoBadge = (tipo: TipoProducto) => {
    if (tipo === 'cocina') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 font-semibold whitespace-nowrap">
          <Utensils className="w-3 h-3" /> Cocina
        </span>
      );
    }
    if (tipo === 'directo') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/50 font-semibold whitespace-nowrap">
          <Beer className="w-3 h-3" /> Directo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/50 font-semibold whitespace-nowrap">
        <Boxes className="w-3 h-3" /> Combo
      </span>
    );
  };

  const renderEstadoBtn = (p: Producto) => (
    <button
      onClick={(e) => handleToggleActivo(p.id_producto, e)}
      className={`w-20 h-8 sm:h-7 inline-flex items-center justify-center rounded-full text-[10px] sm:text-xs font-semibold transition-all border ${
        p.activo
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/80'
          : 'bg-amber-950/80 text-amber-300 border-amber-700/60 hover:bg-amber-900/80'
      }`}
      title="Haga clic para cambiar estado"
    >
      {p.activo ? '● Activo' : '○ Inactivo'}
    </button>
  );

  const renderAcciones = (p: Producto) => (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => openProductoModal(p)}
        className="flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 text-[#5BC0DE] hover:text-[#F4D6B0] bg-[#0B132B] border border-[#3A506B] rounded-lg"
        title="Editar producto"
      >
        <Edit3 size={14} />
      </button>
      <button
        onClick={() => handleDeleteProducto(p.id_producto)}
        className="flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 text-[#D97706] hover:bg-[#D97706]/20 rounded-lg"
        title="Eliminar"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  const renderDetalle = (p: Producto) => {
    const { recItems, comboItems, costoEstimado } = getDetalle(p);
    return (
      <div className="bg-[#1C2541] p-2.5 sm:p-3.5 rounded-xl border border-[#3A506B] space-y-2.5 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-[#3A506B]/50 pb-2">
          <div className="min-w-0">
            <h4 className="text-[11px] sm:text-xs font-bold text-[#5BC0DE] uppercase flex items-center gap-1.5">
              <Layers size={14} className="shrink-0" /> Componentes y Platos Incluidos ({recItems.length + comboItems.length})
            </h4>
            <p className="text-[10px] sm:text-[11px] text-[#5BC0DE]/70 mt-0.5 break-words">{p.descripcion || 'Sin descripción adicional.'}</p>
          </div>
          <div className="sm:text-right shrink-0">
            <span className="text-[9px] sm:text-[10px] text-[#5BC0DE] block">Costo Estimado</span>
            <span className="font-mono text-xs font-bold text-[#F4D6B0]">{formatCurrency(costoEstimado)}</span>
          </div>
        </div>

        {recItems.length === 0 && comboItems.length === 0 ? (
          <p className="text-xs text-[#5BC0DE]/60 italic py-1">No hay insumos o productos asociados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
            {recItems.map(r => {
              const ing = insumosBase.find(i => i.id_ingrediente === r.id_ingrediente);
              if (!ing) return null;
              const catIng = CATEGORIAS_INGREDIENTES.find(ci => ci.id_cat_ing === ing.id_categoria_ingrediente);
              const subtotal = r.cantidad * ing.precio_referencia;
              return (
                <div key={`ing-${r.id_ingrediente}`} className="bg-[#0B132B] p-2 rounded-lg border border-[#3A506B] text-[11px] sm:text-xs flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-[#F4D6B0] block break-words">{ing.nombre}</span>
                    <span className="text-[9px] sm:text-[10px] text-[#5BC0DE]">{catIng?.nombre || 'Insumo'}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[#5BC0DE] block">{r.cantidad} {UNIDADES_MAP[ing.id_unidad]}</span>
                    <span className="font-mono text-[9px] sm:text-[10px] text-[#5BC0DE]/70">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              );
            })}

            {comboItems.map(c => {
              const prodHijo = productos.find(ph => ph.id_producto === c.id_producto_hijo);
              if (!prodHijo) return null;
              const catProd = categoriasProducto.find(cp => cp.id_categoria === prodHijo.id_categoria);
              return (
                <div key={`prod-${c.id_producto_hijo}`} className="bg-[#0B132B] p-2 rounded-lg border border-purple-500/40 text-[11px] sm:text-xs flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-purple-300 block break-words">{prodHijo.nombre}</span>
                    <span className="text-[9px] sm:text-[10px] text-[#5BC0DE]">{catProd?.nombre || 'Plato'}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-purple-200 block">{c.cantidad} Und</span>
                    <span className="font-mono text-[9px] sm:text-[10px] text-[#5BC0DE]/70">{formatCurrency(prodHijo.precio_venta)} c/u</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-[100dvh] w-full bg-[#0B132B] text-[#F4D6B0] font-sans antialiased flex flex-col overflow-hidden ${modalActive ? 'pointer-events-none select-none' : ''}`}>

      <div className="shrink-0 w-full flex flex-col z-50 bg-[#0B132B] pt-[max(0.5rem,env(safe-area-inset-top))]">
        <header className="bg-[#1C2541] border-b border-[#3A506B] pb-2 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] lg:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#3A506B]/40 border border-[#5BC0DE]/30 text-[#5BC0DE] shrink-0">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F4D6B0] truncate">
                    <span className="sm:hidden">Productos & Fichas</span>
                    <span className="hidden sm:inline">Gestión de Productos & Fichas</span>
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3A506B]/40 text-[#5BC0DE] border border-[#5BC0DE]/30 font-mono font-medium shrink-0 hidden sm:inline-block">
                    Catálogo
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] text-[#5BC0DE]/80">Configuración de platos, insumos por receta y productos de venta directa</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-xs">
              <div className="bg-[#0B132B] border border-[#3A506B] p-1.5 sm:p-2 rounded-xl flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-0.5 sm:gap-2">
                <Package className="w-4 h-4 text-[#5BC0DE]" />
                <div className="text-center sm:text-left">
                  <div className="text-[#5BC0DE]/70 text-[9px]">Total</div>
                  <div className="text-xs sm:text-sm font-bold text-[#F4D6B0]">{stats.totalProductos}</div>
                </div>
              </div>
              <div className="bg-[#0B132B] border border-[#3A506B] p-1.5 sm:p-2 rounded-xl flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-0.5 sm:gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                <div className="text-center sm:text-left">
                  <div className="text-[#5BC0DE]/70 text-[9px]">Cocina</div>
                  <div className="text-xs sm:text-sm font-bold text-[#F4D6B0]">{stats.recetasCocina}</div>
                </div>
              </div>
              <div className="bg-[#0B132B] border border-[#3A506B] p-1.5 sm:p-2 rounded-xl flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-0.5 sm:gap-2">
                <Beer className="w-4 h-4 text-blue-400" />
                <div className="text-center sm:text-left">
                  <div className="text-[#5BC0DE]/70 text-[9px]">Directos</div>
                  <div className="text-xs sm:text-sm font-bold text-[#F4D6B0]">{stats.productosDirectos}</div>
                </div>
              </div>
              <div className="bg-[#0B132B] border border-[#3A506B] p-1.5 sm:p-2 rounded-xl flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-0.5 sm:gap-2">
                <Boxes className="w-4 h-4 text-purple-400" />
                <div className="text-center sm:text-left">
                  <div className="text-[#5BC0DE]/70 text-[9px]">Paquetes</div>
                  <div className="text-xs sm:text-sm font-bold text-[#F4D6B0]">{stats.paquetes}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-[#1C2541] py-2 border-b border-[#3A506B] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] lg:px-6">
          <div className="max-w-7xl mx-auto space-y-2">
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5BC0DE]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por código o nombre..."
                  className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl pl-9 pr-3 py-2 text-base sm:text-xs text-[#F4D6B0] placeholder-[#5BC0DE]/50 focus:outline-none focus:border-[#5BC0DE]"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#0B132B] p-1 rounded-xl border border-[#3A506B] w-full md:w-auto md:shrink-0 overflow-x-auto touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setFilterTipo('todos')}
                  className={`flex-1 md:flex-none justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    filterTipo === 'todos' ? 'bg-[#5BC0DE] text-[#0B132B] shadow' : 'text-[#5BC0DE] hover:bg-[#1C2541]'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterTipo('cocina')}
                  className={`flex flex-1 md:flex-none items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    filterTipo === 'cocina' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-400 hover:bg-emerald-950/40'
                  }`}
                >
                  <Utensils className="w-3 h-3" /> Cocina
                </button>
                <button
                  onClick={() => setFilterTipo('directo')}
                  className={`flex flex-1 md:flex-none items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    filterTipo === 'directo' ? 'bg-blue-600 text-white shadow' : 'text-blue-400 hover:bg-blue-950/40'
                  }`}
                >
                  <Beer className="w-3 h-3" /> Directo
                </button>
                <button
                  onClick={() => setFilterTipo('paquete')}
                  className={`flex flex-1 md:flex-none items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    filterTipo === 'paquete' ? 'bg-purple-600 text-white shadow' : 'text-purple-400 hover:bg-purple-950/40'
                  }`}
                >
                  <Boxes className="w-3 h-3" /> Paquete
                </button>
              </div>

              <div className="grid grid-cols-2 md:flex items-center gap-2 shrink-0 w-full md:w-auto md:justify-end">
                <button
                  onClick={() => { setEditingCatId(null); setFormCatNombre(''); setIsCategoriaModalOpen(true); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B132B] hover:bg-[#3A506B]/50 text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] text-xs font-semibold transition-all"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#5BC0DE]" />
                  <span>Categorías</span>
                </button>

                <button
                  onClick={() => openProductoModal()}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] text-xs font-semibold shadow-md transition-all whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Nuevo Producto</span>
                </button>
              </div>
            </div>

            <div
              ref={categoriasScroll.ref}
              {...categoriasScroll.props}
              className="flex items-center gap-1.5 overflow-x-auto pb-1 touch-pan-x cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:[scrollbar-width:thin] md:[scrollbar-color:#5BC0DE_#0B132B] md:[&::-webkit-scrollbar]:block md:[&::-webkit-scrollbar]:h-1.5 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-[#5BC0DE] md:[&::-webkit-scrollbar-track]:bg-[#0B132B]"
            >
              <span className="text-[10px] font-bold text-[#5BC0DE] uppercase shrink-0 flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3" /> CARTA:
              </span>
              <button
                onClick={() => setSelectedCategoria('todas')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all border shrink-0 ${
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
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow'
                        : 'bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]'
                    }`}
                  >
                    <span>{cat.nombre}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-[#1C2541] text-[#5BC0DE]' : 'bg-[#1C2541] text-[#5BC0DE]/70'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto overscroll-contain w-full max-w-7xl mx-auto p-2 sm:p-3 lg:p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
        <section className="bg-[#1C2541] border border-[#3A506B] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
          <table className="hidden md:table w-full text-left border-collapse">
            <thead className="sticky top-0 z-30 bg-[#1C2541] shadow-md border-b-2 border-[#5BC0DE]">
              <tr className="text-[#5BC0DE] text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 bg-[#1C2541]"></th>
                <th className="py-2.5 px-3 text-[#5BC0DE] bg-[#1C2541]">Código</th>
                <th className="py-2.5 px-3 text-[#5BC0DE] bg-[#1C2541]">Nombre del Producto</th>
                <th className="py-2.5 px-3 text-[#5BC0DE] bg-[#1C2541]">Tipo</th>
                <th className="py-2.5 px-3 text-[#5BC0DE] bg-[#1C2541]">Categoría</th>
                <th className="py-2.5 px-3 text-right text-[#5BC0DE] bg-[#1C2541]">Precio Venta</th>
                <th className="py-2.5 px-3 text-center text-[#5BC0DE] bg-[#1C2541]">Estado</th>
                <th className="py-2.5 px-3 text-center text-[#5BC0DE] bg-[#1C2541]">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#3A506B]/50 text-xs">
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#5BC0DE]/60">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filteredProductos.map(p => {
                  const isExpanded = !!expandedRows[p.id_producto];
                  const { catObj } = getDetalle(p);

                  return (
                    <React.Fragment key={p.id_producto}>
                      <tr
                        onClick={() => toggleRow(p.id_producto)}
                        className={`cursor-pointer transition-colors hover:bg-[#3A506B]/20 ${
                          isExpanded ? 'bg-[#0B132B]/80' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-[#5BC0DE]">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-[#5BC0DE] whitespace-nowrap">
                          {p.codigo}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#F4D6B0]">
                          {p.nombre}
                        </td>
                        <td className="py-2.5 px-3">
                          {renderTipoBadge(p.tipo)}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-[#5BC0DE]">
                          {catObj?.nombre || 'General'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#F4D6B0] whitespace-nowrap">
                          {formatCurrency(p.precio_venta)}
                        </td>

                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {renderEstadoBtn(p)}
                        </td>

                        <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                          {renderAcciones(p)}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#0B132B]">
                          <td colSpan={8} className="p-3 border-b border-[#3A506B]">
                            {renderDetalle(p)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="md:hidden p-2 space-y-2">
            {filteredProductos.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#5BC0DE]/60">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No se encontraron productos.
              </div>
            ) : (
              filteredProductos.map(p => {
                const isExpanded = !!expandedRows[p.id_producto];
                const { catObj } = getDetalle(p);

                return (
                  <div
                    key={p.id_producto}
                    className={`rounded-xl border overflow-hidden ${
                      isExpanded ? 'border-[#5BC0DE]/60 bg-[#0B132B]/80' : 'border-[#3A506B] bg-[#0B132B]/40'
                    }`}
                  >
                    <div
                      onClick={() => toggleRow(p.id_producto)}
                      className="p-2.5 cursor-pointer active:bg-[#3A506B]/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="block font-mono text-[10px] font-bold text-[#5BC0DE]">{p.codigo}</span>
                          <span className="block mt-0.5 text-xs sm:text-sm font-semibold text-[#F4D6B0] break-words leading-snug">{p.nombre}</span>
                        </div>
                        <div className="shrink-0 text-[#5BC0DE] pt-0.5">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {renderTipoBadge(p.tipo)}
                        <span className="text-[10px] text-[#5BC0DE]">{catObj?.nombre || 'General'}</span>
                      </div>

                      <div className="mt-1 font-mono text-sm font-bold text-[#F4D6B0]">
                        {formatCurrency(p.precio_venta)}
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between gap-2 border-t border-[#3A506B]/60 px-2.5 py-1.5"
                      onClick={e => e.stopPropagation()}
                    >
                      {renderEstadoBtn(p)}
                      {renderAcciones(p)}
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#3A506B] p-2">
                        {renderDetalle(p)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* MODAL NUEVO PRODUCTO */}
      {isProductoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center  justify-center sm:p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-3xl sm:rounded-2xl rounded-t-2xl shadow-2xl h-auto max-h-[85dvh] flex flex-col overflow-hidden">

            {/* HEADER MODAL */}
            <div className="px-4 sm:px-6 py-3 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-3 border-b border-[#3A506B] flex items-center justify-between gap-2 bg-[#0B132B] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Package className="w-5 h-5 text-[#5BC0DE] shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-[#F4D6B0] truncate">
                  {editingProductoId ? 'Editar Producto' : 'Nuevo Producto / Combo'}
                </h3>
              </div>
              <button
                onClick={() => setIsProductoModalOpen(false)}
                className="p-2 -mr-2 text-[#5BC0DE] hover:text-[#F4D6B0] rounded-lg hover:bg-[#3A506B]"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMULARIO CON SCROLL */}
            <form onSubmit={handleSaveProducto} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">

                <div className="space-y-1">
                  <label className="block text-[10px] sm:text-xs font-semibold uppercase text-[#5BC0DE]">Tipo de Producto</label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setFormTipo('cocina')}
                      className={`p-2 min-h-[60px] rounded-xl border text-[10px] sm:text-xs font-medium flex flex-col items-center justify-center text-center gap-1 transition-all ${
                        formTipo === 'cocina'
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md font-bold'
                          : 'bg-[#0B132B] border-[#3A506B] text-emerald-400'
                      }`}
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Plato de Cocina</span>
                      <span className="text-[8px] sm:text-[9px] opacity-75">N Ingredientes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormTipo('directo')}
                      className={`p-2 min-h-[60px] rounded-xl border text-[10px] sm:text-xs font-medium flex flex-col items-center justify-center text-center gap-1 transition-all ${
                        formTipo === 'directo'
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md font-bold'
                          : 'bg-[#0B132B] border-[#3A506B] text-blue-400'
                      }`}
                    >
                      <Beer className="w-4 h-4" />
                      <span>Venta Directa</span>
                      <span className="text-[8px] sm:text-[9px] opacity-75">Insumos / Stock</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormTipo('paquete')}
                      className={`p-2 min-h-[60px] rounded-xl border text-[10px] sm:text-xs font-medium flex flex-col items-center justify-center text-center gap-1 transition-all ${
                        formTipo === 'paquete'
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md font-bold'
                          : 'bg-[#0B132B] border-[#3A506B] text-purple-400'
                      }`}
                    >
                      <Boxes className="w-4 h-4" />
                      <span>Combo</span>
                      <span className="text-[8px] sm:text-[9px] opacity-75">Platos Incluidos</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-[#5BC0DE] mb-1">Código (Auto)</label>
                    <input
                      type="text"
                      readOnly
                      value={formProdCodigoAuto}
                      className="w-full bg-[#0B132B] border border-[#3A506B] rounded-lg px-3 py-2 text-base sm:text-sm font-mono text-[#5BC0DE] cursor-not-allowed font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-[#5BC0DE] mb-1">Nombre del Producto</label>
                    <input
                      type="text"
                      required
                      value={formProdNombre}
                      onChange={e => setFormProdNombre(e.target.value)}
                      placeholder="Ej: Hamburguesa Especial"
                      className="w-full bg-[#0B132B] border border-[#3A506B] rounded-lg px-3 py-2 text-base sm:text-sm text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-[#5BC0DE] mb-1">Categoría</label>
                    <select
                      value={formProdCategoria}
                      onChange={e => setFormProdCategoria(Number(e.target.value))}
                      className="w-full bg-[#0B132B] border border-[#3A506B] rounded-lg px-3 py-2 text-base sm:text-sm text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                    >
                      {categoriasProducto.map(c => (
                        <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-[#5BC0DE] mb-1">Precio Venta (COP)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      step="500"
                      min="0"
                      required
                      value={formProdPrecio}
                      onChange={e => setFormProdPrecio(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="25000"
                      className="w-full bg-[#0B132B] border border-[#3A506B] rounded-lg px-3 py-2 text-base sm:text-sm text-[#F4D6B0] font-mono focus:outline-none focus:border-[#5BC0DE]"
                    />
                  </div>

                  <div className="flex items-center pt-0 sm:pt-4 min-h-[44px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formProdActivo}
                        onChange={e => setFormProdActivo(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-[#0B132B] border border-[#3A506B] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#5BC0DE] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5BC0DE] peer-checked:after:bg-[#0B132B]"></div>
                      <span className="ml-2.5 text-xs font-medium text-[#F4D6B0]">Activo</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-[#5BC0DE] mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    value={formProdDescripcion}
                    onChange={e => setFormProdDescripcion(e.target.value)}
                    placeholder="Detalles para la carta o alimentos que componen el combo..."
                    className="w-full bg-[#0B132B] border border-[#3A506B] rounded-lg px-3 py-2 text-base sm:text-sm text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE] resize-none"
                  />
                </div>

                {formTipo === 'paquete' && (
                  <div className="space-y-3 pt-2 border-t border-purple-500/40 bg-purple-950/10 p-2 sm:p-3 rounded-xl border">
                    <h4 className="text-[10px] sm:text-xs font-semibold uppercase text-purple-300 flex items-center gap-1.5">
                      <Boxes size={14} className="shrink-0" /> Productos que integran este Combo
                    </h4>

                    <div
                      ref={productosComboScroll.ref}
                      {...productosComboScroll.props}
                      className="flex gap-1.5 overflow-x-auto pb-1.5 touch-pan-x cursor-grab active:cursor-grabbing select-none [scrollbar-width:thin] [scrollbar-color:#c084fc_#0B132B]"
                    >
                      {categoriasProducto.map(cat => (
                        <button
                          key={cat.id_categoria}
                          type="button"
                          onClick={() => setActiveTabCategoriaProducto(cat.id_categoria)}
                          className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                            activeTabCategoriaProducto === cat.id_categoria
                              ? 'bg-purple-600 text-white border-purple-500 shadow'
                              : 'bg-[#0B132B] text-purple-300 border-[#3A506B] hover:border-purple-400'
                          }`}
                        >
                          {cat.nombre}
                        </button>
                      ))}
                    </div>

                    <div className="bg-[#0B132B] p-2 rounded-lg border border-[#3A506B] max-h-40 overflow-y-auto overscroll-contain space-y-1.5 [scrollbar-width:thin] [scrollbar-color:#c084fc_#0B132B]">
                      <div className="text-[10px] text-purple-300/80 mb-1">Toca <b>[+]</b> para agregar:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {productos
                          .filter(p => p.id_categoria === activeTabCategoriaProducto && p.id_producto !== editingProductoId)
                          .map(prodHijo => {
                            const enCombo = formComboItems.find(c => c.id_producto_hijo === prodHijo.id_producto);
                            return (
                              <div
                                key={prodHijo.id_producto}
                                className="bg-[#1C2541] p-1.5 rounded-lg border border-[#3A506B] flex justify-between items-center transition-all text-[10px] sm:text-xs"
                              >
                                <div className="overflow-hidden pr-1.5">
                                  <span className="font-semibold text-[#F4D6B0] block truncate">{prodHijo.nombre}</span>
                                  <span className="text-[9px] text-purple-300 font-mono">{formatCurrency(prodHijo.precio_venta)}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {enCombo && (
                                    <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded">
                                      {enCombo.cantidad}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleAddProductoCombo(prodHijo)}
                                    className="flex items-center justify-center w-7 h-7 rounded bg-purple-600 text-white hover:bg-purple-500 transition-all"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <h5 className="text-[10px] sm:text-xs font-bold text-purple-200">En este Combo ({formComboItems.length})</h5>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:#c084fc_#0B132B]">
                        {formComboItems.map((item) => {
                          const prodObj = productos.find(p => p.id_producto === item.id_producto_hijo);
                          if (!prodObj) return null;
                          return (
                            <div key={item.id_producto_hijo} className="flex flex-wrap items-center justify-between gap-1.5 bg-[#0B132B] p-2 rounded-lg border border-purple-500/30">
                              <div className="flex-1 min-w-[7rem]">
                                <span className="text-[10px] sm:text-xs font-semibold text-purple-200 block break-words">{prodObj.nombre}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center border border-[#3A506B] rounded-md bg-[#1C2541] overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProductoCombo(item.id_producto_hijo)}
                                    className="flex items-center justify-center w-7 h-7 text-purple-300 hover:bg-[#3A506B]/50"
                                  >
                                    <MinusCircle size={14} />
                                  </button>
                                  <input
                                    type="number"
                                    value={item.cantidad}
                                    onChange={e => updateComboCantidad(item.id_producto_hijo, e.target.value === '' ? 0 : Number(e.target.value))}
                                    className="w-9 bg-transparent text-center text-xs text-[#F4D6B0] font-mono focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddProductoCombo(prodObj)}
                                    className="flex items-center justify-center w-7 h-7 text-purple-300 hover:bg-[#3A506B]/50"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setFormComboItems(prev => prev.filter(c => c.id_producto_hijo !== item.id_producto_hijo))}
                                  className="flex items-center justify-center w-7 h-7 text-[#D97706] hover:bg-[#D97706]/20 rounded-md"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {formComboItems.length === 0 && (
                          <p className="text-[10px] text-purple-300/60 italic py-1 text-center bg-[#0B132B]/40 rounded-lg border border-dashed border-purple-500/30">
                            Selecciona platos para armar el combo.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2 border-t border-[#3A506B]">
                  <h4 className="text-[10px] sm:text-xs font-semibold uppercase text-[#5BC0DE] flex items-center gap-1.5">
                    <Layers size={14} className="shrink-0" />
                    {formTipo === 'cocina' ? 'Ingredientes del Plato' :
                     formTipo === 'directo' ? 'Insumos a Descontar' :
                     'Insumos Adicionales'}
                  </h4>

                  <div
                    ref={insumosTabsScroll.ref}
                    {...insumosTabsScroll.props}
                    className="flex gap-1.5 overflow-x-auto pb-1.5 touch-pan-x cursor-grab active:cursor-grabbing select-none [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]"
                  >
                    {CATEGORIAS_INGREDIENTES.map(catIng => (
                      <button
                        key={catIng.id_cat_ing}
                        type="button"
                        onClick={() => setActiveTabIngrediente(catIng.id_cat_ing)}
                        className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                          activeTabIngrediente === catIng.id_cat_ing
                            ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow'
                            : 'bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]'
                        }`}
                      >
                        {catIng.nombre}
                      </button>
                    ))}
                  </div>

                  <div className="bg-[#0B132B] p-2 rounded-lg border border-[#3A506B] max-h-40 overflow-y-auto overscroll-contain space-y-1.5 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
                    <div className="text-[10px] text-[#5BC0DE]/70 mb-1">Toca <b>[+]</b> para agregar:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {insumosBase
                        .filter(i => i.id_categoria_ingrediente === activeTabIngrediente)
                        .map(ing => {
                          const enReceta = formRecetaItems.find(r => r.id_ingrediente === ing.id_ingrediente);
                          return (
                            <div
                              key={ing.id_ingrediente}
                              className="bg-[#1C2541] p-1.5 rounded-lg border border-[#3A506B] flex justify-between items-center transition-all text-[10px] sm:text-xs"
                            >
                              <div className="overflow-hidden pr-1.5">
                                <span className="font-semibold text-[#F4D6B0] block truncate">{ing.nombre}</span>
                                <span className="text-[9px] text-[#5BC0DE]">Ref: {formatCurrency(ing.precio_referencia)} / {UNIDADES_MAP[ing.id_unidad]}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {enReceta && (
                                  <span className="text-[9px] font-mono bg-[#5BC0DE]/20 text-[#5BC0DE] px-1 py-0.5 rounded">
                                    {enReceta.cantidad}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleAddInsumo(ing)}
                                  className="flex items-center justify-center w-7 h-7 rounded bg-[#5BC0DE] text-[#0B132B] hover:bg-[#5BC0DE]/80 transition-all"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <h5 className="text-[10px] sm:text-xs font-bold text-[#F4D6B0]">Insumos ({formRecetaItems.length})</h5>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
                      {formRecetaItems.map((item) => {
                        const ingObj = insumosBase.find(i => i.id_ingrediente === item.id_ingrediente);
                        if (!ingObj) return null;
                        return (
                          <div key={item.id_ingrediente} className="flex flex-wrap items-center justify-between gap-1.5 bg-[#0B132B] p-2 rounded-lg border border-[#3A506B]">
                            <div className="flex-1 min-w-[7rem]">
                              <span className="text-[10px] sm:text-xs font-semibold text-[#F4D6B0] block break-words">{ingObj.nombre}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center border border-[#3A506B] rounded-md bg-[#1C2541] overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInsumo(item.id_ingrediente)}
                                  className="flex items-center justify-center w-7 h-7 text-[#5BC0DE] hover:bg-[#3A506B]/50"
                                >
                                  <MinusCircle size={14} />
                                </button>
                                <input
                                  type="number"
                                  step="0.001"
                                  min="0.001"
                                  value={item.cantidad}
                                  onChange={e => updateRecetaCantidad(item.id_ingrediente, e.target.value === '' ? 0 : Number(e.target.value))}
                                  className="w-12 bg-transparent text-center text-xs text-[#F4D6B0] font-mono focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddInsumo(ingObj)}
                                  className="flex items-center justify-center w-7 h-7 text-[#5BC0DE] hover:bg-[#3A506B]/50"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormRecetaItems(prev => prev.filter(r => r.id_ingrediente !== item.id_ingrediente))}
                                className="flex items-center justify-center w-7 h-7 text-[#D97706] hover:bg-[#D97706]/20 rounded-md"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {formRecetaItems.length === 0 && (
                        <p className="text-[10px] text-[#5BC0DE]/60 italic py-1 text-center bg-[#0B132B]/40 rounded-lg border border-dashed border-[#3A506B]">
                          Selecciona insumos de las pestañas superiores.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* BOTONES FIJOS AL FONDO */}
              <div className="shrink-0 px-4 sm:px-6 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#1C2541] border-t border-[#3A506B] flex justify-end gap-2 z-10">
                <button
                  type="button"
                  onClick={() => setIsProductoModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#0B132B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs font-semibold border border-[#3A506B] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] text-xs font-semibold shadow-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-top sm:items-center justify-center sm:p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl h-[85dvh] sm:h-auto sm:max-h-[85dvh] flex flex-col overflow-hidden">
            
            {/* HEADER MODAL CATEGORIAS */}
            <div className="px-4 sm:px-6 py-3 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-3 border-b border-[#3A506B] flex items-center justify-between gap-2 bg-[#0B132B] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FolderPlus className="w-5 h-5 text-[#5BC0DE] shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-[#F4D6B0] truncate">Gestionar Categorías</h3>
              </div>
              <button
                onClick={() => setIsCategoriaModalOpen(false)}
                className="p-2 -mr-2 text-[#5BC0DE] hover:text-[#F4D6B0] rounded-lg hover:bg-[#3A506B]"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LISTA CON SCROLL */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
              <form onSubmit={handleSaveCategoria} className="bg-[#0B132B] p-3 sm:p-4 rounded-xl border border-[#3A506B] space-y-3">
                <h4 className="text-[10px] sm:text-xs font-semibold uppercase text-[#5BC0DE]">
                  {editingCatId ? 'Editar Categoría' : 'Nueva Categoría'}
                </h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={formCatNombre}
                    onChange={e => setFormCatNombre(e.target.value)}
                    placeholder="Nombre de la categoría..."
                    className="flex-1 min-w-0 bg-[#1C2541] border border-[#3A506B] rounded-lg px-3 py-2.5 text-base sm:text-sm text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] text-xs font-semibold rounded-lg transition-all shadow shrink-0"
                  >
                    {editingCatId ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="text-[10px] sm:text-xs font-semibold uppercase text-[#5BC0DE]">Categorías ({categoriasProducto.length})</h4>
                <div className="space-y-2">
                  {categoriasProducto.map(cat => {
                    const cantProductos = productos.filter(p => p.id_categoria === cat.id_categoria).length;
                    return (
                      <div key={cat.id_categoria} className="flex items-center justify-between gap-3 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-[#F4D6B0] block break-words">{cat.nombre}</span>
                          <span className="text-[10px] text-[#5BC0DE]">{cantProductos} productos</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => { setEditingCatId(cat.id_categoria); setFormCatNombre(cat.nombre); }}
                            className="flex items-center justify-center w-8 h-8 bg-[#1C2541] text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] rounded-lg"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategoria(cat.id_categoria)}
                            className="flex items-center justify-center w-8 h-8 text-[#D97706] hover:bg-[#D97706]/20 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FOOTER MODAL CATEGORIAS */}
            <div className="shrink-0 px-4 sm:px-6 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[#3A506B] bg-[#0B132B] flex justify-end">
              <button
                onClick={() => setIsCategoriaModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#3A506B] hover:bg-[#3A506B]/80 text-[#F4D6B0] text-xs font-semibold rounded-xl transition-all shadow"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIONES TOAST */}
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-3 right-3 sm:left-auto sm:right-5 z-[1100] pointer-events-none">
        <div className="space-y-1.5 flex flex-col items-stretch sm:items-end">
          {toasts.map(toast => {
            const bgColor = toast.type === 'danger' ? 'bg-[#D97706]/90 border-[#D97706] text-white' :
              toast.type === 'warning' ? 'bg-[#D97706]/90 border-[#D97706] text-white' :
              'bg-[#5BC0DE] border-[#5BC0DE] text-[#0B132B]';
            return (
              <div key={toast.id} className={`px-3 py-2 rounded-lg border shadow-xl text-xs font-medium flex items-center gap-2 transition-all ${bgColor}`}>
                {toast.type === 'danger' ? <AlertOctagon size={14} className="shrink-0" /> : toast.type === 'warning' ? <AlertTriangle size={14} className="shrink-0" /> : <CheckCircle2 size={14} className="shrink-0" />}
                <span>{toast.message}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}