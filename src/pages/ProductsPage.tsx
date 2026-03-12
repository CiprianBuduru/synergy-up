import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, LayoutGrid, TableIcon, Plus, Copy, Pencil, Package, ChevronDown, Filter, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion, AnimatePresence } from 'framer-motion';
import { checkEligibility } from '@/lib/eligibility-engine';
import EligibilityReasoningPanel from '@/components/EligibilityReasoningPanel';
import type { Product } from '@/types';

const ALL_CATEGORIES = [
  'Textile promoționale', 'Papetărie corporate', 'Instrumente de scris', 'Accesorii birou',
  'Accesorii IT promo', 'Ceramică și sticlă', 'Produse eco', 'Produse outdoor',
  'Produse evenimente', 'Materiale print', 'Materiale expoziționale', 'Cadouri corporate',
  'Produse lifestyle', 'Produse protocol', 'Produse pentru kituri', 'Produse promo diverse',
  'Produse pentru HR / onboarding', 'Produse pentru marketing', 'Produse pentru conferințe',
  'Produse tech corporate',
];

const ALL_CAEN = ['7311', '1812', '1814', '1723'];
const ALL_OPS = [
  'Personalizare textile', 'Tipărire materiale', 'Legătorie', 'Montaj materiale promo',
  'Ambalare kituri', 'Branding produse', 'Realizare papetărie', 'Pregătire materiale promo',
];

const emptyProduct = (): Omit<Product, 'id'> => ({
  name: '', slug: '', category: ALL_CATEGORIES[0], description: '',
  base_product_type: '', internal_operations_json: [], supporting_caen_codes_json: [],
  eligible_logic: '', suggested_industries_json: [], suitable_departments_json: [],
  suitable_for_json: [], usable_in_kits: true, active: true, notes: '',
});

export default function ProductsPage() {
  const { products, addProduct, updateProduct } = useData();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCaen, setFilterCaen] = useState<string>('all');
  const [filterOp, setFilterOp] = useState<string>('all');
  const [filterKits, setFilterKits] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Omit<Product, 'id'> & { id?: string }>(emptyProduct());
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'duplicate'>('create');

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterCaen !== 'all' && !p.supporting_caen_codes_json.includes(filterCaen)) return false;
      if (filterOp !== 'all' && !p.internal_operations_json.includes(filterOp)) return false;
      if (filterKits === 'yes' && !p.usable_in_kits) return false;
      if (filterKits === 'no' && p.usable_in_kits) return false;
      if (filterActive === 'active' && !p.active) return false;
      if (filterActive === 'inactive' && p.active) return false;
      return true;
    });
  }, [products, search, filterCategory, filterCaen, filterOp, filterKits, filterActive]);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.active).length,
    kits: products.filter(p => p.usable_in_kits).length,
    categories: new Set(products.map(p => p.category)).size,
  }), [products]);

  function openCreate() {
    setEditingProduct(emptyProduct());
    setDialogMode('create');
    setDialogOpen(true);
  }
  function openEdit(p: Product) {
    setEditingProduct({ ...p });
    setDialogMode('edit');
    setDialogOpen(true);
  }
  function openDuplicate(p: Product) {
    const { id, ...rest } = p;
    setEditingProduct({ ...rest, name: `${rest.name} (copie)` });
    setDialogMode('duplicate');
    setDialogOpen(true);
  }

  function handleSave() {
    const slug = editingProduct.name
      .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const data = { ...editingProduct, slug };

    if (dialogMode === 'edit' && data.id) {
      updateProduct(data as Product);
    } else {
      const { id, ...rest } = data;
      addProduct(rest as Omit<Product, 'id'>);
    }
    setDialogOpen(false);
  }

  function setField<K extends keyof Product>(key: K, val: Product[K]) {
    setEditingProduct(prev => ({ ...prev, [key]: val }));
  }

  function toggleArrayItem(key: 'internal_operations_json' | 'supporting_caen_codes_json', item: string) {
    setEditingProduct(prev => {
      const arr = (prev as any)[key] as string[];
      return { ...prev, [key]: arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item] };
    });
  }

  const hasActiveFilters = filterCategory !== 'all' || filterCaen !== 'all' || filterOp !== 'all' || filterKits !== 'all' || filterActive !== 'all';

  function clearFilters() {
    setFilterCategory('all');
    setFilterCaen('all');
    setFilterOp('all');
    setFilterKits('all');
    setFilterActive('all');
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Bibliotecă Produse</h1>
            <p className="text-sm text-muted-foreground">
              {stats.total} produse · {stats.active} active · {stats.categories} categorii · {stats.kits} utilizabile în kituri
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Produs nou
          </Button>
        </div>

        {/* Search + View + Filter toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Caută produs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant={showFilters ? 'secondary' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="h-4 w-4" />
              Filtre
              {hasActiveFilters && <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 text-[10px]">{[filterCategory, filterCaen, filterOp, filterKits, filterActive].filter(f => f !== 'all').length}</Badge>}
            </Button>
            <Tabs value={view} onValueChange={v => setView(v as 'cards' | 'table')}>
              <TabsList className="h-9">
                <TabsTrigger value="cards" className="px-2"><LayoutGrid className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="table" className="px-2"><TableIcon className="h-4 w-4" /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <Card>
                <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Categorie</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate</SelectItem>
                        {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">CAEN suport</Label>
                    <Select value={filterCaen} onValueChange={setFilterCaen}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate</SelectItem>
                        {ALL_CAEN.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Operațiune internă</Label>
                    <Select value={filterOp} onValueChange={setFilterOp}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate</SelectItem>
                        {ALL_OPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Utilizabil în kituri</Label>
                    <Select value={filterKits} onValueChange={setFilterKits}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate</SelectItem>
                        <SelectItem value="yes">Da</SelectItem>
                        <SelectItem value="no">Nu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select value={filterActive} onValueChange={setFilterActive}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="col-span-full gap-1 text-xs text-muted-foreground">
                      <X className="h-3 w-3" /> Șterge filtrele
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">{filtered.length} produse afișate</p>

        {/* Card View */}
        {view === 'cards' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} onEdit={() => openEdit(product)} onDuplicate={() => openDuplicate(product)} />
            ))}
          </div>
        )}

        {/* Table View */}
        {view === 'table' && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produs</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Operațiuni</TableHead>
                  <TableHead>CAEN</TableHead>
                  <TableHead className="text-center">Kituri</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{product.category}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.internal_operations_json.slice(0, 2).map(op => (
                          <Badge key={op} variant="secondary" className="text-[10px]">{op}</Badge>
                        ))}
                        {product.internal_operations_json.length > 2 && (
                          <Badge variant="secondary" className="text-[10px]">+{product.internal_operations_json.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {product.supporting_caen_codes_json.map(c => (
                          <Badge key={c} className="bg-accent/20 text-accent-foreground text-[10px]">{c}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.usable_in_kits && <Package className="mx-auto h-4 w-4 text-accent" />}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.active ? 'default' : 'secondary'} className={`text-[10px] ${product.active ? 'bg-success text-success-foreground' : ''}`}>
                        {product.active ? 'Activ' : 'Inactiv'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(product)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDuplicate(product)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Niciun produs găsit</p>
          </div>
        )}
      </div>

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Produs nou' : dialogMode === 'edit' ? 'Editează produs' : 'Duplică produs'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Nume</Label>
                <Input value={editingProduct.name} onChange={e => setField('name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categorie</Label>
                <Select value={editingProduct.category} onValueChange={v => setField('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Descriere</Label>
              <Textarea value={editingProduct.description} onChange={e => setField('description', e.target.value)} rows={2} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tip produs de bază</Label>
              <Input value={editingProduct.base_product_type} onChange={e => setField('base_product_type', e.target.value)} placeholder="ex: textile, papetărie, print..." />
            </div>

            {/* Operations */}
            <div className="space-y-2">
              <Label className="text-xs">Operațiuni interne</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_OPS.map(op => (
                  <Badge
                    key={op}
                    variant={editingProduct.internal_operations_json.includes(op) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleArrayItem('internal_operations_json', op)}
                  >
                    {op}
                  </Badge>
                ))}
              </div>
            </div>

            {/* CAEN */}
            <div className="space-y-2">
              <Label className="text-xs">Coduri CAEN suport</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_CAEN.map(c => (
                  <Badge
                    key={c}
                    variant={editingProduct.supporting_caen_codes_json.includes(c) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleArrayItem('supporting_caen_codes_json', c)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Eligibility Logic */}
            <div className="space-y-1">
              <Label className="text-xs">Logica de eligibilitate</Label>
              <Textarea value={editingProduct.eligible_logic} onChange={e => setField('eligible_logic', e.target.value)} rows={2} placeholder="De ce este eligibil acest produs..." />
            </div>

            {/* Eligibility Preview */}
            {editingProduct.name && (
              <EligibilityReasoningPanel 
                result={checkEligibility(editingProduct.name)} 
                title="Preview eligibilitate produs" 
              />
            )}

            {/* Industries & Departments */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Industrii sugerate (separate prin virgulă)</Label>
                <Input
                  value={editingProduct.suggested_industries_json.join(', ')}
                  onChange={e => setField('suggested_industries_json', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Departamente potrivite (separate prin virgulă)</Label>
                <Input
                  value={editingProduct.suitable_departments_json.join(', ')}
                  onChange={e => setField('suitable_departments_json', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={editingProduct.usable_in_kits} onCheckedChange={v => setField('usable_in_kits', v)} />
                <Label className="text-xs">Utilizabil în kituri</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingProduct.active} onCheckedChange={v => setField('active', v)} />
                <Label className="text-xs">Activ</Label>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Note</Label>
              <Textarea value={editingProduct.notes} onChange={e => setField('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulează</Button>
            <Button onClick={handleSave} disabled={!editingProduct.name}>
              {dialogMode === 'edit' ? 'Salvează' : 'Creează'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function ProductCard({ product, onEdit, onDuplicate }: { product: Product; onEdit: () => void; onDuplicate: () => void }) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Badge variant="outline" className="mb-2 text-[10px]">{product.category}</Badge>
            <CardTitle className="text-sm leading-tight">{product.name}</CardTitle>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Pencil className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate}><Copy className="h-3 w-3" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>

        {/* Operations */}
        <div className="flex flex-wrap gap-1">
          {product.internal_operations_json.map(op => (
            <Badge key={op} variant="secondary" className="text-[10px]">{op}</Badge>
          ))}
        </div>

        {/* CAEN + badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {product.supporting_caen_codes_json.map(c => (
            <Badge key={c} className="bg-accent/20 text-accent-foreground text-[10px] border-0">CAEN {c}</Badge>
          ))}
          {product.usable_in_kits && (
            <Badge className="bg-info/15 text-info text-[10px] border-0 gap-1">
              <Package className="h-2.5 w-2.5" /> Kituri
            </Badge>
          )}
          <Badge variant={product.active ? 'default' : 'secondary'} className={`ml-auto text-[10px] ${product.active ? 'bg-success text-success-foreground' : ''}`}>
            {product.active ? 'Activ' : 'Inactiv'}
          </Badge>
        </div>

        {/* Eligibility preview */}
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-[10px] font-medium text-muted-foreground">Eligibilitate:</p>
          <p className="text-[10px] leading-relaxed text-foreground">{product.eligible_logic}</p>
        </div>
      </CardContent>
    </Card>
  );
}
