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
import { useImportRevenues } from '@/hooks/useRevenues';
import { useClients, useCreateClient } from '@/hooks/useClients';
import { useProducts, useSubproducts } from '@/hooks/useConfiguration';
import { findClientMatch, findClientMatchWithMappings, MatchConfidence, MatchMethod } from '@/utils/clientMatcher';
import { useAccountMappings } from '@/hooks/useAccountMappings';
import { parseExcelDate } from '@/utils/excelDateParser';
import { MatchConfidenceBadge } from '@/components/imports/MatchConfidenceBadge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  UserPlus,
} from 'lucide-react';

interface ImportRevenuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ClientToCreate {
  accountNumber?: string;
  cpf?: string;
  cnpj?: string;
  name?: string;
}

interface ParsedRevenue {
  date: string;
  accountNumber?: string;
  cpf?: string;
  cnpj?: string;
  clientName?: string;
  productName: string;
  subproductName?: string;
  grossRevenue: number;
  taxes: number;
  bankShare: number;
  ourShare: number;
  isValid: boolean;
  errors: string[];
  matchedClientId?: string;
  matchedClientName?: string;
  matchConfidence: MatchConfidence;
  matchMethod: MatchMethod;
  needsClientCreation: boolean;
  clientToCreate?: ClientToCreate;
}

export function ImportRevenuesDialog({ open, onOpenChange }: ImportRevenuesDialogProps) {
  const { user } = useAuth();
  const importRevenues = useImportRevenues();
  const createClient = useCreateClient();
  const { data: clients } = useClients({});
  const { data: products } = useProducts();
  const { data: subproducts } = useSubproducts();
  const { data: accountMappings } = useAccountMappings();

  const [parsedData, setParsedData] = useState<ParsedRevenue[]>([]);
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
        Produto: 'Nome do Produto',
        Subproduto: 'Opcional',
        'Receita Bruta': '1000.00',
        Impostos: '150.00',
        'Repasse Banco': '350.00',
        'Nossa Parte': '500.00',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Receitas');
    XLSX.writeFile(wb, 'modelo_receitas.xlsx');
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

        const parsed: ParsedRevenue[] = jsonData.map((row: any) => {
          const errors: string[] = [];

          const rawDate = row['Data'];
          const date = parseExcelDate(rawDate);
          const accountNumber = row['Número Conta']?.toString().trim() || row['Numero Conta']?.toString().trim();
          const cpf = row['CPF']?.toString().trim();
          const cnpj = row['CNPJ']?.toString().trim();
          const clientName = row['Cliente']?.toString().trim();
          const productName = row['Produto']?.toString().trim();
          const subproductName = row['Subproduto']?.toString().trim();
          const grossRevenue = parseFloat(row['Receita Bruta']) || 0;
          const taxes = parseFloat(row['Impostos']) || 0;
          const bankShare = parseFloat(row['Repasse Banco']) || 0;
          const ourShare = parseFloat(row['Nossa Parte']) || 0;

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
              // Cliente não encontrado - marcar para criação automática como inativo
              needsClientCreation = true;
              clientToCreate = {
                accountNumber,
                cpf,
                cnpj,
                name: clientName,
              };
            }
          }

          // Validate product exists
          const product = products?.find(
            (p) => p.name.toLowerCase() === productName?.toLowerCase()
          );
          if (!product) {
            errors.push('Produto não encontrado');
          }

          // Validate values
          if (grossRevenue < 0) errors.push('Receita bruta inválida');
          if (taxes < 0) errors.push('Impostos inválidos');
          if (bankShare < 0) errors.push('Repasse banco inválido');

          return {
            date,
            accountNumber,
            cpf,
            cnpj,
            clientName,
            productName,
            subproductName,
            grossRevenue,
            taxes,
            bankShare,
            ourShare,
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
  }, [clients, products, accountMappings]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && parseFile(files[0]),
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    const validRevenues = parsedData.filter((r) => r.isValid);
    if (validRevenues.length === 0) {
      toast.error('Nenhuma receita válida para importar');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // 1. Identificar clientes que precisam ser criados
      const revenuesNeedingClients = validRevenues.filter(r => r.needsClientCreation);
      
      // 2. Agrupar por identificador único (conta/cpf/cnpj/nome)
      const uniqueClientsToCreate = new Map<string, ClientToCreate>();
      revenuesNeedingClients.forEach(r => {
        const key = r.clientToCreate?.accountNumber || 
                    r.clientToCreate?.cpf || 
                    r.clientToCreate?.cnpj ||
                    r.clientToCreate?.name;
        if (key && !uniqueClientsToCreate.has(key)) {
          uniqueClientsToCreate.set(key, r.clientToCreate!);
        }
      });

      // 3. Criar clientes inativos
      const createdClientIds = new Map<string, string>();
      let clientsCreated = 0;
      const totalClients = uniqueClientsToCreate.size;
      
      for (const [key, clientData] of uniqueClientsToCreate) {
        const isPJ = !!clientData.cnpj;
        const newClient = await createClient.mutateAsync({
          type: isPJ ? 'pj' : 'pf',
          name: clientData.name || `Cliente ${clientData.accountNumber || clientData.cpf || clientData.cnpj}`,
          account_number: clientData.accountNumber || null,
          cpf: clientData.cpf || null,
          cnpj: clientData.cnpj || null,
          active: false, // INATIVO - cliente que já migrou
          assessor_id: user!.id,
        });
        createdClientIds.set(key, newClient.id);
        clientsCreated++;
        setProgress(Math.round((clientsCreated / (totalClients + validRevenues.length)) * 50));
      }

      // 4. Mapear receitas para os client_ids (existentes ou criados)
      const revenuesToImport = validRevenues.map((revenue) => {
        const product = products?.find(
          (p) => p.name.toLowerCase() === revenue.productName?.toLowerCase()
        );
        const subproduct = subproducts?.find(
          (s) => s.name.toLowerCase() === revenue.subproductName?.toLowerCase()
        );

        let clientId = revenue.matchedClientId;
        
        if (revenue.needsClientCreation && revenue.clientToCreate) {
          const key = revenue.clientToCreate.accountNumber || 
                      revenue.clientToCreate.cpf || 
                      revenue.clientToCreate.cnpj ||
                      revenue.clientToCreate.name;
          if (key) {
            clientId = createdClientIds.get(key);
          }
        }

        return {
          date: revenue.date,
          client_id: clientId!,
          product_id: product!.id,
          subproduct_id: subproduct?.id || null,
          gross_revenue: revenue.grossRevenue,
          taxes: revenue.taxes,
          bank_share: revenue.bankShare,
          our_share: revenue.ourShare,
        };
      });

      // 5. Importar receitas em lotes
      const batchSize = 100;
      for (let i = 0; i < revenuesToImport.length; i += batchSize) {
        const batch = revenuesToImport.slice(i, i + batchSize);
        await importRevenues.mutateAsync(batch);
        setProgress(50 + Math.round(((i + batch.length) / revenuesToImport.length) * 50));
      }

      const clientMsg = totalClients > 0 ? ` e ${totalClients} clientes inativos criados` : '';
      toast.success(`${validRevenues.length} receitas importadas${clientMsg}!`);
      onOpenChange(false);
      setParsedData([]);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar receitas');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.filter((r) => !r.isValid).length;
  const lowConfidenceCount = parsedData.filter(
    (r) => r.isValid && r.matchConfidence === 'low'
  ).length;
  
  // Contar clientes únicos que serão criados
  const clientsToCreateCount = new Set(
    parsedData
      .filter(r => r.isValid && r.needsClientCreation)
      .map(r => r.clientToCreate?.accountNumber || r.clientToCreate?.cpf || r.clientToCreate?.cnpj || r.clientToCreate?.name)
      .filter(Boolean)
  ).size;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Receitas</DialogTitle>
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
                  <span className="font-medium text-green-600">{validCount}</span> receitas válidas
                </AlertDescription>
              </Alert>
              {clientsToCreateCount > 0 && (
                <Alert className="flex-1 min-w-[140px]">
                  <UserPlus className="h-4 w-4 text-yellow-500" />
                  <AlertDescription>
                    <span className="font-medium text-yellow-600">{clientsToCreateCount}</span> clientes a criar (inativos)
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
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Nossa Parte</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((revenue, index) => (
                    <TableRow
                      key={index}
                      className={
                        !revenue.isValid 
                          ? 'bg-destructive/5' 
                          : revenue.needsClientCreation
                            ? 'bg-yellow-50 dark:bg-yellow-950/20'
                            : revenue.matchConfidence === 'low' 
                              ? 'bg-orange-50 dark:bg-orange-950/20' 
                              : ''
                      }
                    >
                      <TableCell>
                        {revenue.needsClientCreation ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]">
                            <UserPlus className="h-3 w-3 mr-1" />
                            Novo
                          </Badge>
                        ) : (
                          <MatchConfidenceBadge
                            confidence={revenue.matchConfidence}
                            matchedBy={revenue.matchMethod}
                            clientName={revenue.matchedClientName}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {revenue.date}
                      </TableCell>
                      <TableCell className="font-medium">
                        {revenue.needsClientCreation 
                          ? <span className="text-yellow-700">{revenue.clientName || revenue.accountNumber || revenue.cpf || revenue.cnpj || '-'}</span>
                          : (revenue.matchedClientName || revenue.clientName || '-')
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{revenue.productName || '-'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(revenue.ourShare)}
                      </TableCell>
                      <TableCell>
                        {!revenue.isValid && (
                          <Badge variant="destructive" className="text-[10px]">
                            {revenue.errors.join(', ')}
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
              Importar {validCount} Receitas
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
