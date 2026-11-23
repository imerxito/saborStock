import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexto/AuthContexto';
import { ProductoServicio } from '../../../servicios/ProductoServicio';
import type {
  Producto,
  Ingrediente,
  Receta,
  ComponenteCombo,
  Categoria,
  CategoriaIngrediente,
  TipoProducto,
} from '../Productos';

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

export const UNIDADES_MAP: Record<number, string> = {
  1: 'Kg',
  2: 'Gramos',
  3: 'Litros',
  4: 'Unidad',
  5: 'Mililitros',
};

export function useProductos() {
  const { usuario } = useAuth();
  const rol = String(usuario?.rol ?? '').toLowerCase();
  const puedeGestionar = rol.includes('due') || rol.includes('admin');

  // ── Data state ──────────────────────────────────────────────────────────────
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriasProducto, setCategoriasProducto] = useState<Categoria[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [componentesCombo, setComponentesCombo] = useState<ComponenteCombo[]>([]);
  const [insumosBase, setInsumosBase] = useState<Ingrediente[]>([]);
  const [categoriasIngrediente, setCategoriasIngrediente] = useState<CategoriaIngrediente[]>([]);

  // ── UI / filter state ────────────────────────────────────────────────────────
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<number | 'todas'>('todas');
  const [filterTipo, setFilterTipo] = useState<'todos' | TipoProducto>('todos');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Modal / form state ───────────────────────────────────────────────────────
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

  // ── Derived / memos ──────────────────────────────────────────────────────────
  const formProdCodigoAuto = useMemo(() => {
    const prefijo = formTipo === 'cocina' ? 'PRD-COC' : formTipo === 'directo' ? 'PRD-DIR' : 'PRD-PAK';
    const idSiguiente = editingProductoId ?? (productos.length ? Math.max(...productos.map(p => p.id_producto)) + 1 : 1);
    const num = String(idSiguiente).padStart(3, '0');
    return `${prefijo}-${num}`;
  }, [formTipo, editingProductoId, productos]);

  const stats = useMemo(() => ({
    totalProductos: productos.length,
    recetasCocina: productos.filter(p => p.tipo === 'cocina').length,
    productosDirectos: productos.filter(p => p.tipo === 'directo').length,
    paquetes: productos.filter(p => p.tipo === 'paquete').length,
  }), [productos]);

  const filteredProductos = useMemo(() => {
    return productos.filter(p => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategoria === 'todas' || p.id_categoria === selectedCategoria;
      const matchTipo = filterTipo === 'todos' || p.tipo === filterTipo;
      return matchSearch && matchCat && matchTipo;
    });
  }, [productos, searchQuery, selectedCategoria, filterTipo]);

  const modalActive = isProductoModalOpen || isCategoriaModalOpen;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const addToast = (message: string, type: 'success' | 'warning' | 'danger' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  // ── Data loader ──────────────────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    try {
      const [prodsData, catsData, insumosData, recetasData, combosData, catsIngData] = await Promise.all([
        ProductoServicio.listar(),
        ProductoServicio.listarCategorias(),
        ProductoServicio.listarInsumos(),
        ProductoServicio.listarRecetas(),
        ProductoServicio.listarComponentesCombo().catch(() => []),
        ProductoServicio.listarCategoriasIngrediente().catch(() => []),
      ]);

      setProductos(prodsData.map(p => ({
        id_producto: p.id_producto,
        codigo: p.codigo,
        nombre: p.nombre,
        id_categoria: p.id_categoria,
        precio_venta: p.precio_venta,
        descripcion: p.descripcion || '',
        activo: p.activo ?? true,
        tipo: (p.tipo as TipoProducto) || 'cocina',
      })));

      if (catsData) {
        setCategoriasProducto(catsData.map(c => ({
          id_categoria: c.id_categoria,
          nombre: c.nombre,
        })));
      }

      setInsumosBase((insumosData || []) as Ingrediente[]);
      setRecetas(recetasData || []);
      setComponentesCombo(
        (combosData || []).map((c) => ({
          id_combo: c.idCombo,
          id_producto_hijo: c.idProductoHijo,
          cantidad: c.cantidad,
        }))
      );
      setCategoriasIngrediente(
        (catsIngData || []).map((c) => ({ id_cat_ing: c.id, nombre: c.nombre }))
      );
    } catch (e) {
      console.warn('Error al sincronizar productos con backend:', e);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // ── Row / table actions ──────────────────────────────────────────────────────
  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleActivo = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const prodActual = productos.find(p => p.id_producto === id);
    if (!prodActual) return;
    const nuevoActivo = !prodActual.activo;
    setProductos(prev =>
      prev.map(p => (p.id_producto === id ? { ...p, activo: nuevoActivo } : p))
    );
    try {
      await ProductoServicio.actualizar(id, { activo: nuevoActivo });
      addToast(nuevoActivo ? 'Producto activado' : 'Producto desactivado', 'success');
    } catch (err) {
      console.warn('Error al actualizar estado del producto:', err);
      // Revertir en caso de error
      setProductos(prev =>
        prev.map(p => (p.id_producto === id ? { ...p, activo: !nuevoActivo } : p))
      );
      addToast('No se pudo cambiar el estado del producto', 'danger');
    }
  };

  // ── Producto modal ───────────────────────────────────────────────────────────
  const openProductoModal = (prod?: Producto) => {
    if (!puedeGestionar) {
      addToast('Solo el Dueño y el Administrador pueden agregar o editar productos', 'warning');
      return;
    }
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

  const handleSaveProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGestionar) {
      addToast('Solo el Dueño y el Administrador pueden guardar productos', 'danger');
      return;
    }
    if (formProdPrecio === '' || !formProdNombre.trim()) return;

    try {
      let prodId = editingProductoId;

      if (editingProductoId) {
        await ProductoServicio.actualizar(editingProductoId, {
          codigo: formProdCodigoAuto,
          nombre: formProdNombre.trim(),
          id_categoria: Number(formProdCategoria),
          precio_venta: Number(formProdPrecio),
          descripcion: formProdDescripcion.trim(),
          activo: formProdActivo,
          tipo: formTipo,
        });
      } else {
        const creado = await ProductoServicio.crear({
          codigo: formProdCodigoAuto,
          nombre: formProdNombre.trim(),
          id_categoria: Number(formProdCategoria),
          precio_venta: Number(formProdPrecio),
          descripcion: formProdDescripcion.trim(),
          activo: formProdActivo,
          tipo: formTipo,
        });
        prodId = creado.id_producto;
      }

      if (prodId) {
        const recetasValidas = formRecetaItems.filter(i => Number(i.cantidad) > 0);
        const recetasActuales = recetas.filter(r => r.id_producto === prodId);

        for (const r of recetasActuales) {
          if (!recetasValidas.some(i => i.id_ingrediente === r.id_ingrediente)) {
            await ProductoServicio.eliminarReceta(prodId, r.id_ingrediente);
          }
        }
        for (const item of recetasValidas) {
          await ProductoServicio.guardarReceta(prodId, item.id_ingrediente, Number(item.cantidad));
        }

        const combosValidos =
          formTipo === 'paquete'
            ? formComboItems.filter(i => Number(i.cantidad) > 0 && i.id_producto_hijo !== prodId)
            : [];
        await ProductoServicio.eliminarComponentesCombo(prodId);
        for (const item of combosValidos) {
          await ProductoServicio.crearComponenteCombo(prodId, item.id_producto_hijo, Number(item.cantidad));
        }
      }

      await cargarDatos();
      setIsProductoModalOpen(false);
      addToast(editingProductoId ? 'Producto actualizado' : 'Producto creado con éxito');
    } catch (err: any) {
      addToast(err?.message || 'Error al guardar producto', 'danger');
    }
  };

  const handleDeleteProducto = async (id: number) => {
    if (!puedeGestionar) {
      addToast('Solo el Dueño y el Administrador pueden eliminar productos', 'danger');
      return;
    }
    if (window.confirm('¿Desea eliminar este producto del sistema?')) {
      try {
        await ProductoServicio.eliminar(id);
        setProductos(prev => prev.filter(p => p.id_producto !== id));
        setRecetas(prev => prev.filter(r => r.id_producto !== id));
        setComponentesCombo(prev => prev.filter(c => c.id_combo !== id && c.id_producto_hijo !== id));
        addToast('Producto eliminado', 'danger');
      } catch (err: any) {
        addToast(err?.message || 'Error al eliminar producto', 'danger');
      }
    }
  };

  // ── Categoría modal ──────────────────────────────────────────────────────────
  const handleSaveCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGestionar) {
      addToast('Solo el Dueño y el Administrador pueden agregar o editar categorías', 'danger');
      return;
    }
    if (!formCatNombre.trim()) return;

    try {
      if (editingCatId) {
        await ProductoServicio.actualizarCategoria(editingCatId, formCatNombre.trim());
        addToast('Categoría actualizada');
      } else {
        await ProductoServicio.crearCategoria(formCatNombre.trim());
        addToast('Categoría agregada');
      }
      setFormCatNombre('');
      setEditingCatId(null);
      await cargarDatos();
    } catch (err: any) {
      addToast(err?.message || 'Error al guardar categoría', 'danger');
    }
  };

  const handleDeleteCategoria = async (id: number) => {
    if (!puedeGestionar) {
      addToast('Solo el Dueño y el Administrador pueden eliminar categorías', 'danger');
      return;
    }
    if (productos.some(p => p.id_categoria === id)) {
      addToast('No se puede eliminar: tiene productos asignados', 'warning');
      return;
    }
    if (window.confirm('¿Eliminar categoría?')) {
      try {
        await ProductoServicio.eliminarCategoria(id);
        setCategoriasProducto(prev => prev.filter(c => c.id_categoria !== id));
        if (selectedCategoria === id) setSelectedCategoria('todas');
        addToast('Categoría eliminada', 'danger');
      } catch (err: any) {
        addToast(err?.message || 'Error al eliminar categoría', 'danger');
      }
    }
  };

  // ── Recipe / combo item handlers ─────────────────────────────────────────────
  const handleAddInsumo = (ingrediente: Ingrediente) => {
    setFormRecetaItems(prev => {
      const existente = prev.find(i => i.id_ingrediente === ingrediente.id_ingrediente);
      if (existente) {
        return prev.map(i =>
          i.id_ingrediente === ingrediente.id_ingrediente
            ? { ...i, cantidad: Number((i.cantidad + 1).toFixed(3)) }
            : i
        );
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
        return prev.map(i =>
          i.id_ingrediente === idIngrediente
            ? { ...i, cantidad: Number((i.cantidad - 1).toFixed(3)) }
            : i
        );
      } else {
        return prev.filter(i => i.id_ingrediente !== idIngrediente);
      }
    });
  };

  const updateRecetaCantidad = (idIngrediente: number, cantidad: number) => {
    setFormRecetaItems(prev =>
      prev.map(item =>
        item.id_ingrediente === idIngrediente ? { ...item, cantidad: Math.max(0, cantidad) } : item
      )
    );
  };

  const handleAddProductoCombo = (productoHijo: Producto) => {
    setFormComboItems(prev => {
      const existente = prev.find(i => i.id_producto_hijo === productoHijo.id_producto);
      if (existente) {
        return prev.map(i =>
          i.id_producto_hijo === productoHijo.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i
        );
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
        return prev.map(i =>
          i.id_producto_hijo === idProductoHijo ? { ...i, cantidad: i.cantidad - 1 } : i
        );
      } else {
        return prev.filter(i => i.id_producto_hijo !== idProductoHijo);
      }
    });
  };

  const updateComboCantidad = (idProductoHijo: number, cantidad: number) => {
    setFormComboItems(prev =>
      prev.map(item =>
        item.id_producto_hijo === idProductoHijo ? { ...item, cantidad: Math.max(0, cantidad) } : item
      )
    );
  };

  // ── Detail helper ────────────────────────────────────────────────────────────
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

  return {
    // Data
    productos,
    categoriasProducto,
    recetas,
    componentesCombo,
    insumosBase,
    categoriasIngrediente,
    // Filtered / derived
    filteredProductos,
    stats,
    modalActive,
    // UI state
    expandedRows,
    searchQuery,
    setSearchQuery,
    selectedCategoria,
    setSelectedCategoria,
    filterTipo,
    setFilterTipo,
    toasts,
    // Modal state
    activeTabIngrediente,
    setActiveTabIngrediente,
    activeTabCategoriaProducto,
    setActiveTabCategoriaProducto,
    isProductoModalOpen,
    setIsProductoModalOpen,
    editingProductoId,
    isCategoriaModalOpen,
    setIsCategoriaModalOpen,
    editingCatId,
    setEditingCatId,
    formCatNombre,
    setFormCatNombre,
    // Product form
    formProdNombre,
    setFormProdNombre,
    formProdCategoria,
    setFormProdCategoria,
    formProdPrecio,
    setFormProdPrecio,
    formProdDescripcion,
    setFormProdDescripcion,
    formProdActivo,
    setFormProdActivo,
    formTipo,
    setFormTipo,
    formProdCodigoAuto,
    // Recipe / combo form
    formRecetaItems,
    setFormRecetaItems,
    formComboItems,
    setFormComboItems,
    // Permisos
    puedeGestionar,
    usuario,
    // Handlers
    cargarDatos,
    toggleRow,
    handleToggleActivo,
    openProductoModal,
    handleSaveProducto,
    handleDeleteProducto,
    handleSaveCategoria,
    handleDeleteCategoria,
    handleAddInsumo,
    handleRemoveInsumo,
    updateRecetaCantidad,
    handleAddProductoCombo,
    handleRemoveProductoCombo,
    updateComboCantidad,
    addToast,
    formatCurrency,
    getDetalle,
  };
}
