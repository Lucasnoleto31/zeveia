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
import { useImportLeads } from '@/hooks/useLeads';
import { useOrigins, useCampaigns, useLossReasons } from '@/hooks/useConfiguration';
import { usePartners } from '@/hooks/usePartners';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { parseExcelDate } from '@/utils/excelDateParser';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedLead {
  name: string;
  email?: string;
  phone?: string;
  state?: string;
  origin?: string;
  campaign?: string;
  partner?: string;
  assessor?: string;
  status?: string;
  closedAt?: string;
  lossReason?: string;
  observations?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_STATUSES = ['novo', 'em_contato', 'troca_assessoria', 'convertido', 'perdido'];
const VALID_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export function ImportLeadsDialog({ open, onOpenChange }: ImportLeadsDialogProps) {
  const { user } = useAuth();
  const importLeads = useImportLeads();
  const { data: origins } = useOrigins();
  const { data: campaigns } = useCampaigns();
  const { data: partners } = usePartners();
  const { data: profiles } = useProfiles();
  const { data: lossReasons } = useLossReasons();

  const [parsedData, setParsedData] = useState<ParsedLead[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadTemplate = () => {
    const template = [
      {
        Nome: 'João Silva',
        'E-mail': 'joao@email.com',
        Telefone: '(11) 99999-9999',
        Estado: 'SP',
        Origem: 'Indicação',
        Campanha: 'Orgânico',
        Parceiro: '',
        Assessor: 'Artur Fonseca',
        Status: 'novo',
        'Data Fechamento': '',
        'Motivo Perda': '',
        Observações: 'Interessado em renda fixa',
      },
      {
        Nome: 'Maria Santos',
        'E-mail': 'maria@email.com',
        Telefone: '(21) 98888-8888',
        Estado: 'RJ',
        Origem: 'Site',
        Campanha: '',
        Parceiro: '',
        Assessor: 'Lucas Noleto',
        Status: 'perdido',
        'Data Fechamento': '24/12/2024',
        'Motivo Perda': 'Sem interesse',
        Observações: 'Não retornou contato',
      },
      {
        Nome: 'Pedro Souza',
        'E-mail': 'pedro@email.com',
        Telefone: '(31) 97777-7777',
        Estado: 'MG',
        Origem: 'Indicação',
        Campanha: '',
        Parceiro: '',
        Assessor: 'Artur Fonseca',
        Status: 'convertido',
        'Data Fechamento': '15/01/2025',
        'Motivo Perda': '',
        Observações: 'Fechou conta',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'modelo_leads.xlsx');
  };

  const normalizeStatus = (status?: string): string => {
    if (!status) return 'novo';
    const normalized = status.toLowerCase().trim()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    // Map common variations
    const statusMap: Record<string, string> = {
      'em_contato': 'em_contato',
      'em contato': 'em_contato',
      'troca_assessoria': 'troca_assessoria',
      'troca assessoria': 'troca_assessoria',
      'convertido': 'convertido',
      'ganho': 'convertido',
      'fechado': 'convertido',
      'perdido': 'perdido',
      'perda': 'perdido',
      'novo': 'novo',
    };
    
    return statusMap[normalized] || normalized;
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

        const parsed: ParsedLead[] = jsonData.map((row: any) => {
          const errors: string[] = [];
          const warnings: string[] = [];
          
          const name = row['Nome']?.toString().trim();
          const email = row['E-mail']?.toString().trim();
          const phone = row['Telefone']?.toString().trim();
          const state = row['Estado']?.toString().trim().toUpperCase();
          const origin = row['Origem']?.toString().trim();
          const campaign = row['Campanha']?.toString().trim();
          const partner = row['Parceiro']?.toString().trim();
          const assessor = row['Assessor']?.toString().trim();
          const rawStatus = row['Status']?.toString().trim();
          const status = normalizeStatus(rawStatus);
          const closedAt = row['Data Fechamento']?.toString().trim();
          const lossReason = row['Motivo Perda']?.toString().trim();
          const observations = row['Observações']?.toString().trim();

          // Required validations
          if (!name || name.length < 2) {
            errors.push('Nome obrigatório');
          }

          if (!assessor) {
            errors.push('Assessor obrigatório');
          } else {
            const foundAssessor = profiles?.find(p => 
              p.name?.toLowerCase() === assessor.toLowerCase()
            );
            if (!foundAssessor) {
              errors.push(`Assessor "${assessor}" não encontrado`);
            }
          }

          // Optional validations
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('E-mail inválido');
          }

          if (state && !VALID_STATES.includes(state)) {
            errors.push('Estado inválido');
          }

          // Status validation
          if (rawStatus && !VALID_STATUSES.includes(status)) {
            errors.push(`Status "${rawStatus}" inválido`);
          }

          // Loss reason validation (required if status = perdido)
          if (status === 'perdido') {
            if (!lossReason) {
              errors.push('Motivo de perda obrigatório');
            } else {
              const foundReason = lossReasons?.find(r => 
                r.name.toLowerCase() === lossReason.toLowerCase()
              );
              if (!foundReason) {
                errors.push(`Motivo "${lossReason}" não encontrado`);
              }
            }
          }

          // Closed date validation for final statuses
          if ((status === 'convertido' || status === 'perdido') && !closedAt) {
            warnings.push('Data de fechamento não informada');
          }

          // Origin/Campaign/Partner warnings
          if (origin) {
            const foundOrigin = origins?.find(o => 
              o.name.toLowerCase() === origin.toLowerCase()
            );
            if (!foundOrigin) {
              warnings.push(`Origem "${origin}" não encontrada`);
            }
          }

          if (campaign) {
            const foundCampaign = campaigns?.find(c => 
              c.name.toLowerCase() === campaign.toLowerCase()
            );
            if (!foundCampaign) {
              warnings.push(`Campanha "${campaign}" não encontrada`);
            }
          }

          if (partner) {
            const foundPartner = partners?.find(p => 
              p.name.toLowerCase() === partner.toLowerCase()
            );
            if (!foundPartner) {
              warnings.push(`Parceiro "${partner}" não encontrado`);
            }
          }

          return {
            name,
            email,
            phone,
            state,
            origin,
            campaign,
            partner,
            assessor,
            status,
            closedAt,
            lossReason,
            observations,
            isValid: errors.length === 0,
            errors,
            warnings,
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
  }, [profiles, origins, campaigns, partners, lossReasons]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && parseFile(files[0]),
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    const validLeads = parsedData.filter(l => l.isValid);
    if (validLeads.length === 0) {
      toast.error('Nenhum lead válido para importar');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const leadsToImport = validLeads.map(lead => {
        const originId = origins?.find(o => o.name.toLowerCase() === lead.origin?.toLowerCase())?.id;
        const campaignId = campaigns?.find(c => c.name.toLowerCase() === lead.campaign?.toLowerCase())?.id;
        const partnerId = partners?.find(p => p.name.toLowerCase() === lead.partner?.toLowerCase())?.id;
        const assessorId = profiles?.find(p => p.name?.toLowerCase() === lead.assessor?.toLowerCase())?.user_id;
        const lossReasonId = lossReasons?.find(r => r.name.toLowerCase() === lead.lossReason?.toLowerCase())?.id;

        // Parse closed date
        const closedDateParsed = lead.closedAt ? parseExcelDate(lead.closedAt) : null;

        return {
          name: lead.name,
          email: lead.email || null,
          phone: lead.phone || null,
          state: lead.state || null,
          status: (lead.status || 'novo') as 'novo' | 'em_contato' | 'troca_assessoria' | 'convertido' | 'perdido',
          origin_id: originId || null,
          campaign_id: campaignId || null,
          partner_id: partnerId || null,
          loss_reason_id: lossReasonId || null,
          observations: lead.observations || null,
          assessor_id: assessorId || user!.id,
          // Set converted_at or lost_at based on status
          converted_at: lead.status === 'convertido' ? closedDateParsed : null,
          lost_at: lead.status === 'perdido' ? closedDateParsed : null,
        };
      });

      // Import in batches
      const batchSize = 100;
      for (let i = 0; i < leadsToImport.length; i += batchSize) {
        const batch = leadsToImport.slice(i, i + batchSize);
        await importLeads.mutateAsync(batch as any);
        setProgress(Math.round(((i + batch.length) / leadsToImport.length) * 100));
      }

      toast.success(`${validLeads.length} leads importados com sucesso!`);
      onOpenChange(false);
      setParsedData([]);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar leads');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const validCount = parsedData.filter(l => l.isValid).length;
  const invalidCount = parsedData.filter(l => !l.isValid).length;
  const warningCount = parsedData.filter(l => l.isValid && l.warnings.length > 0).length;

  const getStatusBadge = (status?: string) => {
    const statusColors: Record<string, string> = {
      novo: 'bg-blue-100 text-blue-700',
      em_contato: 'bg-yellow-100 text-yellow-700',
      troca_assessoria: 'bg-purple-100 text-purple-700',
      convertido: 'bg-green-100 text-green-700',
      perdido: 'bg-red-100 text-red-700',
    };
    const statusLabels: Record<string, string> = {
      novo: 'Novo',
      em_contato: 'Em Contato',
      troca_assessoria: 'Troca Assessoria',
      convertido: 'Convertido',
      perdido: 'Perdido',
    };
    return (
      <Badge className={`text-[10px] ${statusColors[status || 'novo'] || ''}`}>
        {statusLabels[status || 'novo'] || status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel com os dados dos leads. Suporta importação com assessor, status e data de fechamento.
          </DialogDescription>
        </DialogHeader>

        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm font-medium">Modelo de Planilha</p>
            <p className="text-xs text-muted-foreground">
              Baixe o modelo com as colunas corretas (inclui assessor, status e data de fechamento)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Baixar Modelo
          </Button>
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
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceitos: .xlsx, .xls
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
            <div className="flex gap-4">
              <Alert className="flex-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <span className="font-medium text-green-600">{validCount}</span> leads válidos
                </AlertDescription>
              </Alert>
              {warningCount > 0 && (
                <Alert className="flex-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription>
                    <span className="font-medium text-yellow-600">{warningCount}</span> com avisos
                  </AlertDescription>
                </Alert>
              )}
              {invalidCount > 0 && (
                <Alert className="flex-1" variant="destructive">
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Assessor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Fecham.</TableHead>
                    <TableHead>Validação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((lead, index) => (
                    <TableRow key={index} className={!lead.isValid ? 'bg-destructive/5' : lead.warnings.length > 0 ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                      <TableCell>
                        {lead.isValid ? (
                          lead.warnings.length > 0 ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{lead.name || '-'}</TableCell>
                      <TableCell>{lead.assessor || '-'}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>{lead.closedAt || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {lead.errors.map((error, i) => (
                            <Badge key={i} variant="destructive" className="text-[10px]">
                              {error}
                            </Badge>
                          ))}
                          {lead.warnings.map((warning, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] text-yellow-600 border-yellow-300">
                              {warning}
                            </Badge>
                          ))}
                        </div>
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
              Importar {validCount} Leads
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
