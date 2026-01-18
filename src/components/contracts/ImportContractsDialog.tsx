import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useImportContracts } from '@/hooks/useContracts';
import { useClients, useCreateClient } from '@/hooks/useClients';
import { useAssets, usePlatforms } from '@/hooks/useConfiguration';
import { findClientMatchWithMappings, MatchConfidence, MatchMethod } from '@/utils/clientMatcher';
import { useAccountMappings } from '@/hooks/useAccountMappings';
import { parseExcelDate } from '@/utils/excelDateParser';
import { MatchConfidenceBadge } from '@/components/imports/MatchConfidenceBadge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  UserPlus,
} from 'lucide-react';

interface ImportContractsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ClientToCreate {
  name: string;
  accountNumber?: string;
  cpf?: string;
  cnpj?: string;
}

interface ParsedContract {
  date: string;
  accountNumber?: string;
  cpf?: string;
  cnpj?: string;
  clientName?: string;
  assetCode: string;
  platformName: string;
  lotsTraded: number;
  lotsZeroed: number;
  isValid: boolean;
  errors: string[];
  matchedClientId?: string;
  matchedClientName?: string;
  matchConfidence: MatchConfidence;
  matchMethod: MatchMethod;
  needsClientCreation?: boolean;
  clientToCreate?: ClientToCreate;
}

export function ImportContractsDialog({ open, onOpenChange }: ImportContractsDialogProps) {
  const importContracts = useImportContracts();
  const createClient = useCreateClient();
  const { user } = useAuth();
  const { data: clients } = useClients({});
  const { data: assets } = useAssets();
  const { data: platforms } = usePlatforms();
  const { data: accountMappings } = useAccountMappings();

  const [parsedData, setParsedData] = useState<ParsedContract[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadTemplate = () => {
    const template = [
      {
        Data: '2024-01-15',
        'Número Conta': '123456',
        CPF: '',
        CNPJ: '',
        Cliente: '',
        Ativo: 'WIN',
        Plataforma: 'Nome da Plataforma',
        'Lotes Operados': 100,
        'Lotes Zerados': 80,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contratos');
    XLSX.writeFile(wb, 'modelo_contratos.xlsx');
  };

  const parseFile = useCallback((file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsed: ParsedContract[] = jsonData.map((row: any) => {
          const errors: string[] = [];

          const rawDate = row['Data'];
          const date = parseExcelDate(rawDate);
          const accountNumber = row['Número Conta']?.toString().trim() || row['Numero Conta']?.toString().trim();
          const cpf = row['CPF']?.toString().trim();
          const cnpj = row['CNPJ']?.toString().trim();
          const clientName = row['Cliente']?.toString().trim();
          const assetCode = row['Ativo']?.toString().trim().toUpperCase();
          const platformName = row['Plataforma']?.toString().trim();
          const lotsTraded = parseInt(row['Lotes Operados']) || 0;
          const lotsZeroed = parseInt(row['Lotes Zerados']) || 0;

          // Validate date
          if (!date) {
            errors.push('Data inválida');
          }

          // Find client using hierarchical matching
          let matchedClientId: string | undefined;
          let matchedClientName: string | undefined;
          let matchConfidence: MatchConfidence = null;
          let matchMethod: MatchMethod = null;
          let needsClientCreation = false;
          let clientToCreate: ClientToCreate | undefined;

          if (clients) {
            const matchResult = findClientMatchWithMappings(clients, accountMappings || [], {
              accountNumber,
              cpf,
              cnpj,
              name: clientName,
            });

            if (matchResult.client) {
              matchedClientId = matchResult.client.id;
              matchedClientName = matchResult.client.name;
              matchConfidence = matchResult.confidence;
              matchMethod = matchResult.matchedBy;
            } else {
              // Cliente não encontrado - preparar para criação como inativo
              needsClientCreation = true;
              const generatedName = clientName || `Cliente ${accountNumber || cpf || cnpj || 'Importado'}`;
              clientToCreate = {
                name: generatedName,
                accountNumber,
                cpf,
                cnpj,
              };
              matchedClientName = generatedName;
              // NÃO adiciona erro - registro continua válido para criação
            }
          }

          // Validate asset exists
          const asset = assets?.find(
            (a) => a.code.toLowerCase() === assetCode?.toLowerCase()
          );
          if (!asset) {
            errors.push('Ativo não encontrado');
          }

          // Validate platform exists
          const platform = platforms?.find(
            (p) => p.name.toLowerCase() === platformName?.toLowerCase()
          );
          if (!platform) {
            errors.push('Plataforma não encontrada');
          }

          // Validate values
          if (lotsTraded < 0) errors.push('Lotes operados inválido');
          if (lotsZeroed < 0) errors.push('Lotes zerados inválido');
          if (lotsZeroed > lotsTraded) errors.push('Lotes zerados > operados');

          return {
            date,
            accountNumber,
            cpf,
            cnpj,
            clientName,
            assetCode,
            platformName,
            lotsTraded,
            lotsZeroed,
            isValid: errors.length === 0,
            errors,
            matchedClientId,
            matchedClientName,
            matchConfidence,
            matchMethod,
            needsClientCreation,
            clientToCreate,
          };
        });

        setParsedData(parsed);
      } catch (error) {
        toast.error('Erro ao processar arquivo');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  }, [clients, assets, platforms, accountMappings]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && parseFile(files[0]),
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    const validContracts = parsedData.filter((c) => c.isValid);
    if (validContracts.length === 0) {
      toast.error('Nenhum contrato válido para importar');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Fase 1: Criar clientes que não existem (inativos)
      const contractsNeedingClients = validContracts.filter((c) => c.needsClientCreation && c.clientToCreate);
      const clientIdMap = new Map<string, string>();

      if (contractsNeedingClients.length > 0) {
        // Agrupar por identificador único (cpf, cnpj ou accountNumber)
        const uniqueClients = new Map<string, ClientToCreate>();
        for (const contract of contractsNeedingClients) {
          const key = contract.clientToCreate!.cpf || contract.clientToCreate!.cnpj || contract.clientToCreate!.accountNumber || contract.clientToCreate!.name;
          if (!uniqueClients.has(key)) {
            uniqueClients.set(key, contract.clientToCreate!);
          }
        }

        let clientsCreated = 0;
        for (const [key, clientData] of uniqueClients) {
          const newClient = await createClient.mutateAsync({
            name: clientData.name,
            account_number: clientData.accountNumber || null,
            cpf: clientData.cpf || null,
            cnpj: clientData.cnpj || null,
            active: false, // Criar como inativo
            assessor_id: user?.id || null,
            type: clientData.cnpj ? 'pj' : 'pf',
          });
          clientIdMap.set(key, newClient.id);
          clientsCreated++;
          setProgress(Math.round((clientsCreated / uniqueClients.size) * 30)); // 30% para criação de clientes
        }
      }

      // Fase 2: Preparar e importar contratos
      const contractsToImport = validContracts.map((contract) => {
        const asset = assets?.find(
          (a) => a.code.toLowerCase() === contract.assetCode?.toLowerCase()
        );
        const platform = platforms?.find(
          (p) => p.name.toLowerCase() === contract.platformName?.toLowerCase()
        );

        let clientId = contract.matchedClientId;
        if (contract.needsClientCreation && contract.clientToCreate) {
          const key = contract.clientToCreate.cpf || contract.clientToCreate.cnpj || contract.clientToCreate.accountNumber || contract.clientToCreate.name;
          clientId = clientIdMap.get(key);
        }

        return {
          date: contract.date,
          client_id: clientId!,
          asset_id: asset!.id,
          platform_id: platform!.id,
          lots_traded: contract.lotsTraded,
          lots_zeroed: contract.lotsZeroed,
        };
      });

      // Import in batches
      const batchSize = 100;
      for (let i = 0; i < contractsToImport.length; i += batchSize) {
        const batch = contractsToImport.slice(i, i + batchSize);
        await importContracts.mutateAsync(batch);
        setProgress(30 + Math.round(((i + batch.length) / contractsToImport.length) * 70)); // 70% para importação
      }

      const newClientsCount = clientIdMap.size;
      const message = newClientsCount > 0
        ? `${validContracts.length} contratos importados! ${newClientsCount} clientes inativos criados.`
        : `${validContracts.length} contratos importados com sucesso!`;
      toast.success(message);
      onOpenChange(false);
      setParsedData([]);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar contratos');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const validCount = parsedData.filter((c) => c.isValid).length;
  const invalidCount = parsedData.filter((c) => !c.isValid).length;
  const lowConfidenceCount = parsedData.filter(
    (c) => c.isValid && c.matchConfidence === 'low' && !c.needsClientCreation
  ).length;
  const newClientsCount = parsedData.filter(
    (c) => c.isValid && c.needsClientCreation
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Contratos</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel. Use Número da Conta, CPF/CNPJ ou Nome do Cliente para vincular.
          </DialogDescription>
        </DialogHeader>

        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Modelo de Importação</p>
              <p className="text-xs text-muted-foreground">
                Prioridade: Número Conta → CPF/CNPJ → Nome
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
        </div>

        {/* Upload Area */}
        {parsedData.length === 0 && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? 'Solte o arquivo aqui...'
                : 'Arraste um arquivo Excel ou clique para selecionar'}
            </p>
          </div>
        )}

        {/* Processing */}
        {isProcessing && progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              Importando... {progress}%
            </p>
          </div>
        )}

        {/* Preview */}
        {parsedData.length > 0 && (
          <>
            <div className="flex gap-4 flex-wrap">
              <Alert className="flex-1 min-w-[140px]">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <span className="font-medium text-green-600">{validCount}</span> contratos válidos
                </AlertDescription>
              </Alert>
              {newClientsCount > 0 && (
                <Alert className="flex-1 min-w-[140px]">
                  <UserPlus className="h-4 w-4 text-blue-500" />
                  <AlertDescription>
                    <span className="font-medium text-blue-600">{newClientsCount}</span> novos clientes (inativos)
                  </AlertDescription>
                </Alert>
              )}
              {lowConfidenceCount > 0 && (
                <Alert className="flex-1 min-w-[140px]">
                  <XCircle className="h-4 w-4 text-orange-500" />
                  <AlertDescription>
                    <span className="font-medium text-orange-600">{lowConfidenceCount}</span> por nome (verificar)
                  </AlertDescription>
                </Alert>
              )}
              {invalidCount > 0 && (
                <Alert className="flex-1 min-w-[140px]" variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-medium">{invalidCount}</span> com erros
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">Match</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-right">Operados</TableHead>
                    <TableHead className="text-right">Zerados</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((contract, index) => (
                    <TableRow
                      key={index}
                      className={
                        !contract.isValid 
                          ? 'bg-destructive/5' 
                          : contract.needsClientCreation
                            ? 'bg-blue-50 dark:bg-blue-950/20'
                            : contract.matchConfidence === 'low' 
                              ? 'bg-orange-50 dark:bg-orange-950/20' 
                              : ''
                      }
                    >
                      <TableCell>
                        {contract.needsClientCreation ? (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                            <UserPlus className="h-3 w-3 mr-1" />
                            Novo
                          </Badge>
                        ) : (
                          <MatchConfidenceBadge
                            confidence={contract.matchConfidence}
                            matchedBy={contract.matchMethod}
                            clientName={contract.matchedClientName}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {contract.date}
                      </TableCell>
                      <TableCell className="font-medium">
                        {contract.matchedClientName || contract.clientName || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {contract.assetCode || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>{contract.platformName || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {contract.lotsTraded}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {contract.lotsZeroed}
                      </TableCell>
                      <TableCell>
                        {!contract.isValid && (
                          <Badge variant="destructive" className="text-[10px]">
                            {contract.errors.join(', ')}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {parsedData.length > 50 && (
              <p className="text-xs text-muted-foreground text-center">
                Mostrando 50 de {parsedData.length} registros
              </p>
            )}
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setParsedData([]);
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          {parsedData.length > 0 && (
            <Button onClick={handleImport} disabled={isProcessing || validCount === 0}>
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Importar {validCount} Contratos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
