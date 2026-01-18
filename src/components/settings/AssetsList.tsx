import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Asset } from '@/types/database';

interface AssetsListProps {
  assets: Asset[];
  isLoading: boolean;
  onCreate: (code: string, name?: string) => Promise<void>;
  onUpdate: (id: string, data: { code?: string; name?: string; active?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  createPending?: boolean;
  updatePending?: boolean;
  deletePending?: boolean;
}

export function AssetsList({
  assets,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  createPending,
  updatePending,
  deletePending,
}: AssetsListProps) {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Asset | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');

  const filteredItems = assets.filter(
    (item) =>
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newCode.trim()) {
      toast.error('Código é obrigatório');
      return;
    }
    try {
      await onCreate(newCode.trim().toUpperCase(), newName.trim() || undefined);
      toast.success('Ativo criado com sucesso');
      setIsCreateOpen(false);
      setNewCode('');
      setNewName('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar');
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !editCode.trim()) return;
    try {
      await onUpdate(selectedItem.id, { 
        code: editCode.trim().toUpperCase(), 
        name: editName.trim() || undefined 
      });
      toast.success('Ativo atualizado com sucesso');
      setIsEditOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar');
    }
  };

  const handleToggleActive = async (item: Asset) => {
    try {
      await onUpdate(item.id, { active: !item.active });
      toast.success(`Ativo ${item.active ? 'desativado' : 'ativado'}`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await onDelete(selectedItem.id);
      toast.success('Ativo excluído com sucesso');
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir');
    }
  };

  const openEdit = (item: Asset) => {
    setSelectedItem(item);
    setEditCode(item.code);
    setEditName(item.name || '');
    setIsEditOpen(true);
  };

  const openDelete = (item: Asset) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Ativos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os ativos disponíveis para contratos
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ativos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {search ? 'Nenhum ativo encontrado' : 'Nenhum ativo cadastrado'}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-bold">{item.code}</TableCell>
                  <TableCell className="text-muted-foreground">{item.name || '-'}</TableCell>
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
            <DialogTitle>Adicionar Ativo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Código (ex: WINFUT)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="font-mono"
            />
            <Input
              placeholder="Nome (opcional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
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
            <DialogTitle>Editar Ativo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Código"
              value={editCode}
              onChange={(e) => setEditCode(e.target.value.toUpperCase())}
              className="font-mono"
            />
            <Input
              placeholder="Nome (opcional)"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
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
            <AlertDialogTitle>Excluir Ativo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedItem?.code}"? Esta ação não pode ser desfeita.
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
