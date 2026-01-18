import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DialogDescription,
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
import { Pencil, Loader2, Search, Shield, User, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useProfilesWithRoles, 
  useUpdateUserRole, 
  useUpdateProfile,
  ProfileWithRole 
} from '@/hooks/useProfiles';
import { AppRole } from '@/types/database';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function UserManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRoleChangeOpen, setIsRoleChangeOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileWithRole | null>(null);
  const [editName, setEditName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('assessor');

  const { data: users = [], isLoading } = useProfilesWithRoles();
  const updateRole = useUpdateUserRole();
  const updateProfile = useUpdateProfile();

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditProfile = async () => {
    if (!selectedUser || !editName.trim()) return;
    try {
      await updateProfile.mutateAsync({ id: selectedUser.id, name: editName.trim() });
      toast.success('Perfil atualizado com sucesso');
      setIsEditOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil');
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    try {
      await updateRole.mutateAsync({ userId: selectedUser.user_id, role: newRole });
      toast.success(`Role alterado para ${newRole === 'socio' ? 'Sócio' : 'Assessor'}`);
      setIsRoleChangeOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar role');
    }
  };

  const openEdit = (userProfile: ProfileWithRole) => {
    setSelectedUser(userProfile);
    setEditName(userProfile.name);
    setIsEditOpen(true);
  };

  const openRoleChange = (userProfile: ProfileWithRole) => {
    setSelectedUser(userProfile);
    setNewRole(userProfile.role);
    setIsRoleChangeOpen(true);
  };

  const getRoleIcon = (role: AppRole) => {
    return role === 'socio' ? Crown : User;
  };

  const getRoleBadge = (role: AppRole) => {
    const Icon = getRoleIcon(role);
    return (
      <Badge 
        variant={role === 'socio' ? 'default' : 'secondary'}
        className={cn(
          'gap-1',
          role === 'socio' && 'bg-amber-500 hover:bg-amber-600'
        )}
      >
        <Icon className="h-3 w-3" />
        {role === 'socio' ? 'Sócio' : 'Assessor'}
      </Badge>
    );
  };

  const sociosCount = users.filter(u => u.role === 'socio').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Usuários</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os usuários e suas permissões no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Crown className="h-3 w-3" />
            {sociosCount} Sócio{sociosCount !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" />
            {users.length - sociosCount} Assessor{users.length - sociosCount !== 1 ? 'es' : ''}
          </Badge>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userProfile) => {
                const isCurrentUser = userProfile.user_id === user?.id;
                const isLastSocio = userProfile.role === 'socio' && sociosCount === 1;
                
                return (
                  <TableRow key={userProfile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {userProfile.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{userProfile.name}</p>
                          {isCurrentUser && (
                            <p className="text-xs text-muted-foreground">(você)</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {userProfile.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRoleChange(userProfile)}
                        disabled={isLastSocio}
                        className="p-0 h-auto hover:bg-transparent"
                        title={isLastSocio ? 'Não é possível remover o último sócio' : 'Alterar role'}
                      >
                        {getRoleBadge(userProfile.role)}
                      </Button>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(userProfile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(userProfile)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {selectedUser?.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedUser?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>
            <Input
              placeholder="Nome"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditProfile()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditProfile} disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <AlertDialog open={isRoleChangeOpen} onOpenChange={setIsRoleChangeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Alterar Permissão
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Alterar a permissão de <strong>{selectedUser?.name}</strong>:
                </p>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assessor">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Assessor</p>
                          <p className="text-xs text-muted-foreground">
                            Acesso básico: gerenciar seus próprios leads e clientes
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="socio">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <div>
                          <p className="font-medium">Sócio</p>
                          <p className="text-xs text-muted-foreground">
                            Acesso total: visualizar todos os dados e configurações
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {newRole === 'socio' && selectedUser?.role !== 'socio' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⚠️ Sócios têm acesso total ao sistema, incluindo dados de todos os assessores e configurações.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangeRole}
              disabled={updateRole.isPending || newRole === selectedUser?.role}
            >
              {updateRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
