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
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useImportClients, useClients } from '@/hooks/useClients';
import { useOrigins, useCampaigns } from '@/hooks/useConfiguration';
import { usePartners } from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  User,
  Building2,
  AlertCircle
} from 'lucide-react';

// Parse Brazilian number format (1.500.000,00 or R$ 1.500.000,00)
const parseBrazilianNumber = (value: string | undefined): number | null => {
  if (!value) return null;
  
  let cleaned = value.toString()
    .replace(/R\$\s*/gi, '')
    .replace(/\s/g, '')
    .trim();
  
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

interface ImportClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedClient {
  type: 'pf' | 'pj';
  name: string;
  accountNumber?: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  state?: string;
  patrimony?: string;
  profile?: string;
  origin?: string;
  campaign?: string;
  partner?: string;
  matchedPartnerId?: string;
  matchedPartnerName?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  isNewAccount: boolean;
}

export function ImportClientsDialog({ open, onOpenChange }: ImportClientsDialogProps) {
  const { user } = useAuth();
  const importClients = useImportClients();
  const { data: existingClients } = useClients({});
  const { data: origins } = useOrigins();
  const { data: campaigns } = useCampaigns();
  const { data: partners } = usePartners();

  const [importType, setImportType] = useState<'pf' | 'pj'>('pf');
  const [parsedData, setParsedData] = useState<ParsedClient[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadTemplate = (type: 'pf' | 'pj') => {
    const templatePF = [
      {
        'Número Conta': '123456',
        Nome: 'João Silva',
        CPF: '123.456.789-00',
        'Data Nascimento': '1990-01-15',
        Sexo: 'Masculino',
        'Estado Civil': 'Casado',
        Estado: 'SP',
        'E-mail': 'joao@email.com',
        Telefone: '(11) 99999-9999',
        Patrimônio: '100000',
        Perfil: 'Moderado',
        Origem: 'Indicação',
        Campanha: 'Orgânico',
        Parceiro: '',
      },
    ];

    const templatePJ = [
      {
        'Número Conta': '789012',
        'Razão Social': 'Empresa LTDA',
        'Nome Fantasia': 'Empresa',
        CNPJ: '00.000.000/0001-00',
        Estado: 'SP',
        'E-mail': 'contato@empresa.com',
        Telefone: '(11) 3333-3333',
        Patrimônio: '500000',
        Perfil: 'Arrojado',
        'Nome Responsável': 'Maria Santos',
        'CPF Responsável': '987.654.321-00',
        'Cargo Responsável': 'Diretora',
        Origem: 'Site',
        Campanha: 'Orgânico',
        Parceiro: '',
      },
    ];

    const template = type === 'pf' ? templatePF : templatePJ;
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type === 'pf' ? 'Clientes PF' : 'Clientes PJ');
    XLSX.writeFile(wb, `modelo_clientes_${type}.xlsx`);
  };

  const normalizeDocument = (doc: string | null | undefined): string => {
    if (!doc) return '';
    return doc.replace(/\D/g, '');
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

        const validProfiles = ['conservador', 'moderado', 'arrojado', 'agressivo'];
        const validStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
          'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
          'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

        const parsed: ParsedClient[] = jsonData.map((row: any) => {
          const errors: string[] = [];
          const warnings: string[] = [];
          
          // Determine type based on columns
          const isPJ = row['Razão Social'] || row['CNPJ'];
          const type = isPJ ? 'pj' : 'pf';

          const accountNumber = row['Número Conta']?.toString().trim() || row['Numero Conta']?.toString().trim();
          const name = isPJ ? row['Razão Social']?.toString().trim() : row['Nome']?.toString().trim();
          const cpf = row['CPF']?.toString().trim();
          const cnpj = row['CNPJ']?.toString().trim();
          const email = row['E-mail']?.toString().trim();
          const phone = row['Telefone']?.toString().trim();
          const state = row['Estado']?.toString().trim().toUpperCase();
          const patrimony = row['Patrimônio']?.toString().trim();
          const profile = row['Perfil']?.toString().trim().toLowerCase();
          const origin = row['Origem']?.toString().trim();
          const campaign = row['Campanha']?.toString().trim();
          const partner = row['Parceiro']?.toString().trim();

          // Check for duplicates
          let isDuplicate = false;
          let isNewAccount = false;

          if (existingClients) {
            const normalizedCpf = normalizeDocument(cpf);
            const normalizedCnpj = normalizeDocument(cnpj);
            const normalizedAccountNumber = accountNumber?.toLowerCase().trim();

            // Check if same account number exists
            const existingByAccount = existingClients.find(
              (c) => c.account_number?.toLowerCase().trim() === normalizedAccountNumber
            );
            
            // Check if same CPF/CNPJ exists
            const existingByDocument = existingClients.find((c) => {
              if (type === 'pf' && normalizedCpf) {
                return normalizeDocument(c.cpf) === normalizedCpf;
              }
              if (type === 'pj' && normalizedCnpj) {
                return normalizeDocument(c.cnpj) === normalizedCnpj;
              }
              return false;
            });

            if (existingByAccount) {
              isDuplicate = true;
              errors.push('Conta já cadastrada');
            } else if (existingByDocument && !accountNumber) {
              isDuplicate = true;
              errors.push('CPF/CNPJ já cadastrado sem número de conta');
            } else if (existingByDocument && accountNumber) {
              // Same document, different account - it's a new account for existing client
              isNewAccount = true;
              warnings.push(`Nova conta para cliente: ${existingByDocument.name}`);
            }
          }

          if (!name || name.length < 2) {
            errors.push(isPJ ? 'Razão social obrigatória' : 'Nome obrigatório');
          }

          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('E-mail inválido');
          }

          if (state && !validStates.includes(state)) {
            errors.push('Estado inválido');
          }

          if (profile && !validProfiles.includes(profile)) {
            errors.push('Perfil inválido');
          }

          // Match partner
          const matchedPartner = partners?.find(
            p => p.name.toLowerCase().trim() === partner?.toLowerCase().trim()
          );

          if (partner && !matchedPartner) {
            warnings.push(`Parceiro "${partner}" não encontrado`);
          }

          return {
            type,
            name,
            accountNumber,
            cpf,
            cnpj,
            email,
            phone,
            state,
            patrimony,
            profile,
            origin,
            campaign,
            partner,
            matchedPartnerId: matchedPartner?.id,
            matchedPartnerName: matchedPartner?.name,
            isValid: errors.length === 0,
            errors,
            warnings,
            isDuplicate,
            isNewAccount,
          };
        });

        setParsedData(parsed);
        // Auto-detect import type from first valid row
        const firstValid = parsed.find(p => p.isValid);
        if (firstValid) {
          setImportType(firstValid.type);
        }
      } catch (error) {
        toast.error('Erro ao processar arquivo');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  }, [existingClients, partners]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && parseFile(files[0]),
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    const validClients = parsedData.filter(c => c.isValid);
    if (validClients.length === 0) {
      toast.error('Nenhum cliente válido para importar');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const clientsToImport = validClients.map(client => {
        const originId = origins?.find(o => o.name.toLowerCase() === client.origin?.toLowerCase())?.id;
        const campaignId = campaigns?.find(c => c.name.toLowerCase() === client.campaign?.toLowerCase())?.id;
        const partnerId = partners?.find(p => p.name.toLowerCase() === client.partner?.toLowerCase())?.id;

        const base: any = {
          type: client.type,
          name: client.name,
          account_number: client.accountNumber || null,
          email: client.email || null,
          phone: client.phone || null,
          state: client.state || null,
          patrimony: parseBrazilianNumber(client.patrimony),
          profile: client.profile || null,
          origin_id: originId || null,
          campaign_id: campaignId || null,
          partner_id: partnerId || null,
          assessor_id: user!.id,
          active: true,
        };

        if (client.type === 'pf') {
          base.cpf = client.cpf || null;
        } else {
          base.company_name = client.name;
          base.cnpj = client.cnpj || null;
        }

        return base;
      });

      // Import in batches
      const batchSize = 100;
      for (let i = 0; i < clientsToImport.length; i += batchSize) {
        const batch = clientsToImport.slice(i, i + batchSize);
        await importClients.mutateAsync(batch);
        setProgress(Math.round(((i + batch.length) / clientsToImport.length) * 100));
      }

      toast.success(`${validClients.length} clientes importados com sucesso!`);
      onOpenChange(false);
      setParsedData([]);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar clientes');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const validCount = parsedData.filter(c => c.isValid).length;
  const invalidCount = parsedData.filter(c => !c.isValid).length;
  const newAccountCount = parsedData.filter(c => c.isNewAccount && c.isValid).length;
  const matchedPartnerCount = parsedData.filter(c => c.isValid && c.matchedPartnerId).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel com os dados dos clientes. 
            Clientes com mesmo CPF/CNPJ e número de conta diferente serão importados como novas contas.
          </DialogDescription>
        </DialogHeader>

        {/* Download Templates */}
        <div className="flex gap-4">
          <div className="flex-1 flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Modelo PF</p>
                <p className="text-xs text-muted-foreground">Pessoa Física</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadTemplate('pf')}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Modelo PJ</p>
                <p className="text-xs text-muted-foreground">Pessoa Jurídica</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadTemplate('pj')}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Upload Area */}
        {parsedData.length === 0 && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
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
                  <span className="font-medium text-green-600">{validCount}</span> clientes válidos
                </AlertDescription>
              </Alert>
              {newAccountCount > 0 && (
                <Alert className="flex-1 min-w-[140px]">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription>
                    <span className="font-medium text-blue-600">{newAccountCount}</span> novas contas
                  </AlertDescription>
                </Alert>
              )}
              {matchedPartnerCount > 0 && (
                <Alert className="flex-1 min-w-[140px]">
                  <User className="h-4 w-4 text-purple-500" />
                  <AlertDescription>
                    <span className="font-medium text-purple-600">{matchedPartnerCount}</span> com parceiro
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
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((client, index) => (
                    <TableRow 
                      key={index} 
                      className={
                        !client.isValid 
                          ? 'bg-destructive/5' 
                          : client.isNewAccount 
                            ? 'bg-blue-50 dark:bg-blue-950/20' 
                            : ''
                      }
                    >
                      <TableCell>
                        {client.isValid ? (
                          client.isNewAccount ? (
                            <AlertCircle className="h-4 w-4 text-blue-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {client.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {client.accountNumber || '-'}
                      </TableCell>
                      <TableCell className="font-medium">{client.name || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {client.type === 'pf' ? client.cpf : client.cnpj}
                      </TableCell>
                      <TableCell>
                        {client.partner ? (
                          client.matchedPartnerName ? (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                              ✓ {client.matchedPartnerName}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-amber-600">
                              ⚠ {client.partner}
                            </Badge>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!client.isValid ? (
                          <Badge variant="destructive" className="text-[10px]">
                            {client.errors.join(', ')}
                          </Badge>
                        ) : client.warnings.length > 0 ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {client.warnings.join(', ')}
                          </Badge>
                        ) : null}
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
            <Button 
              onClick={handleImport} 
              disabled={isProcessing || validCount === 0}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Importar {validCount} Clientes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
