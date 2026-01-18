import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Client } from '@/types/database';
import { useFindDuplicates, useMergeClients } from '@/hooks/useMergeClients';
import { 
  Users, 
  Building2, 
  AlertTriangle, 
  Loader2,
  ArrowRight,
  Trash2,
  Archive,
  CheckCircle2
} from 'lucide-react';

interface MergeClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
}

export function MergeClientsDialog({ open, onOpenChange, clients }: MergeClientsDialogProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [targetClientId, setTargetClientId] = useState<string | null>(null);
  const [deleteSourceClients, setDeleteSourceClients] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const duplicateGroups = useFindDuplicates(clients);
  const mergeClients = useMergeClients();

  const selectedGroupClients = useMemo(() => {
    if (!selectedGroup) return [];
    return duplicateGroups.find(g => g.key === selectedGroup)?.clients || [];
  }, [selectedGroup, duplicateGroups]);

  const sourceClientIds = useMemo(() => {
    if (!targetClientId) return [];
    return selectedGroupClients.filter(c => c.id !== targetClientId).map(c => c.id);
  }, [targetClientId, selectedGroupClients]);

  const handleMerge = () => {
    if (!targetClientId || sourceClientIds.length === 0) return;
    setShowConfirmDialog(true);
  };

  const confirmMerge = async () => {
    if (!targetClientId || sourceClientIds.length === 0) return;
    
    await mergeClients.mutateAsync({
      targetClientId,
      sourceClientIds,
      deleteSourceClients,
    });

    setShowConfirmDialog(false);
    setSelectedGroup(null);
    setTargetClientId(null);
    onOpenChange(false);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  const resetState = () => {
    setSelectedGroup(null);
    setTargetClientId(null);
    setDeleteSourceClients(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mesclar Clientes Duplicados
            </DialogTitle>
            <DialogDescription>
              Unifique clientes com mesmo CPF/CNPJ transferindo todo o histórico para um único registro.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {duplicateGroups.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium">Nenhum duplicado encontrado!</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Todos os clientes possuem CPF/CNPJ únicos.
                </p>
              </div>
            ) : !selectedGroup ? (
              // Step 1: Select duplicate group
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Foram encontrados <strong>{duplicateGroups.length}</strong> grupos de clientes duplicados.
                  Selecione um grupo para iniciar o merge:
                </p>
                {duplicateGroups.map((group) => (
                  <div
                    key={group.key}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedGroup(group.key)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {group.clients[0].type === 'pf' ? 'CPF' : 'CNPJ'}: {group.key.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                          </Badge>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                            {group.clients.length} registros
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.clients.map((client) => (
                            <span key={client.id} className="text-sm">
                              {client.type === 'pf' ? client.name : client.company_name}
                              {client.account_number && (
                                <span className="text-muted-foreground"> (Conta: {client.account_number})</span>
                              )}
                              {group.clients.indexOf(client) < group.clients.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Step 2: Select target client and options
              <div className="space-y-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedGroup(null);
                    setTargetClientId(null);
                  }}
                >
                  ← Voltar para lista de duplicados
                </Button>

                <div>
                  <h3 className="text-sm font-medium mb-3">
                    Selecione o cliente que receberá todos os dados:
                  </h3>
                  <RadioGroup value={targetClientId || ''} onValueChange={setTargetClientId}>
                    <div className="space-y-3">
                      {selectedGroupClients.map((client) => (
                        <div
                          key={client.id}
                          className={`border rounded-lg p-4 transition-colors ${
                            targetClientId === client.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value={client.id} id={client.id} className="mt-1" />
                            <Label htmlFor={client.id} className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2 mb-1">
                                {client.type === 'pf' ? (
                                  <Users className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Building2 className="h-4 w-4 text-purple-600" />
                                )}
                                <span className="font-medium">
                                  {client.type === 'pf' ? client.name : client.company_name}
                                </span>
                                {targetClientId === client.id && (
                                  <Badge className="bg-primary text-primary-foreground">
                                    Cliente Destino
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                                {client.account_number && (
                                  <span>Conta: {client.account_number}</span>
                                )}
                                <span>
                                  {client.type === 'pf' ? `CPF: ${client.cpf}` : `CNPJ: ${client.cnpj}`}
                                </span>
                                {client.email && <span>Email: {client.email}</span>}
                                {client.patrimony && <span>Patrimônio: {formatCurrency(client.patrimony)}</span>}
                              </div>
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {targetClientId && sourceClientIds.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            O que será transferido:
                          </p>
                          <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1 list-disc list-inside">
                            <li>Todas as receitas dos clientes selecionados</li>
                            <li>Todos os contratos (day trade)</li>
                            <li>Todos os custos de plataforma</li>
                            <li>Todas as interações e notas</li>
                            <li>Todos os alertas</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 border rounded-lg">
                      <Checkbox
                        id="deleteSource"
                        checked={deleteSourceClients}
                        onCheckedChange={(checked) => setDeleteSourceClients(checked === true)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="deleteSource" className="flex items-center gap-2 cursor-pointer">
                          {deleteSourceClients ? (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          ) : (
                            <Archive className="h-4 w-4 text-muted-foreground" />
                          )}
                          {deleteSourceClients 
                            ? 'Excluir permanentemente os clientes duplicados' 
                            : 'Apenas desativar os clientes duplicados'
                          }
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {deleteSourceClients 
                            ? 'Os clientes serão removidos do sistema. Esta ação não pode ser desfeita.'
                            : 'Os clientes serão marcados como inativos e podem ser reativados depois.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {selectedGroup && targetClientId && (
              <Button 
                onClick={handleMerge}
                disabled={mergeClients.isPending}
              >
                {mergeClients.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mesclando...
                  </>
                ) : (
                  <>
                    Mesclar {sourceClientIds.length} cliente(s)
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Merge de Clientes</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a transferir todo o histórico de{' '}
                <strong>{sourceClientIds.length} cliente(s)</strong> para o cliente destino.
              </p>
              {deleteSourceClients && (
                <p className="text-destructive font-medium">
                  ⚠️ Os clientes de origem serão excluídos permanentemente.
                </p>
              )}
              <p>Esta ação não pode ser desfeita. Deseja continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMerge}>
              Confirmar Merge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
