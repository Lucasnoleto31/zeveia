import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Product, Subproduct } from '@/types/database';

interface SubproductsListProps {
  products: Product[];
  subproducts: Subproduct[];
  isLoading: boolean;
  onCreate: (productId: string, name: string) => Promise<void>;
  onUpdate: (id: string, data: { name?: string; active?: boolean; productId?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  createPending?: boolean;
  updatePending?: boolean;
  deletePending?: boolean;
}

export function SubproductsList({
  products,
  subproducts,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  createPending,
  updatePending,
  deletePending,
}: SubproductsListProps) {
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Subproduct | null>(null);
  const [newName, setNewName] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [editName, setEditName] = useState('');
  const [editProductId, setEditProductId] = useState('');

  const filteredItems = subproducts.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesProduct = filterProduct === 'all' || item.product_id === filterProduct;
    return matchesSearch && matchesProduct;
  });

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name || 'Desconhecido';
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newProductId) {
      toast.error('Nome e produto são obrigatórios');
      return;
    }
    try {
      await onCreate(newProductId, newName.trim());
      toast.success('Subproduto criado com sucesso');
      setIsCreateOpen(false);
      setNewName('');
      setNewProductId('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar');
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !editName.trim() || !editProductId) return;
    try {
      await onUpdate(selectedItem.id, { name: editName.trim(), productId: editProductId });
      toast.success('Subproduto atualizado com sucesso');
      setIsEditOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar');
    }
  };

  const handleToggleActive = async (item: Subproduct) => {
    try {
      await onUpdate(item.id, { active: !item.active });
      toast.success(`Subproduto ${item.active ? 'desativado' : 'ativado'}`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await onDelete(selectedItem.id);
      toast.success('Subproduto excluído com sucesso');
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir');
    }
  };

  const openEdit = (item: Subproduct) => {
    setSelectedItem(item);
    setEditName(item.name);
    setEditProductId(item.product_id);
    setIsEditOpen(true);
  };

  const openDelete = (item: Subproduct) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Subprodutos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os subprodutos vinculados a cada produto
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={products.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar subprodutos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os produtos</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Crie um produto primeiro para poder adicionar subprodutos
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {search || filterProduct !== 'all'
            ? 'Nenhum subproduto encontrado'
            : 'Nenhum subproduto cadastrado'}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getProductName(item.product_id)}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={item.active}
                        onCheckedChange={() => handleToggleActive(item)}
                        disabled={updatePending}
                      />
                      <Badge variant={item.active ? 'default' : 'secondary'}>
                        {item.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDelete(item)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Subproduto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={newProductId} onValueChange={setNewProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {products.filter(p => p.active).map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Nome do subproduto"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createPending}>
              {createPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Subproduto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={editProductId} onValueChange={setEditProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Nome do subproduto"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={updatePending}>
              {updatePending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Subproduto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedItem?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
