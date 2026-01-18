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
  observations?: string;
  isValid: boolean;
  errors: string[];
}

export function ImportLeadsDialog({ open, onOpenChange }: ImportLeadsDialogProps) {
  const { user } = useAuth();
  const importLeads = useImportLeads();
  const { data: origins } = useOrigins();
  const { data: campaigns } = useCampaigns();
  const { data: partners } = usePartners();

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
        Observações: 'Interessado em renda fixa',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'modelo_leads.xlsx');
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
          
          const name = row['Nome']?.toString().trim();
          const email = row['E-mail']?.toString().trim();
          const phone = row['Telefone']?.toString().trim();
          const state = row['Estado']?.toString().trim().toUpperCase();
          const origin = row['Origem']?.toString().trim();
          const campaign = row['Campanha']?.toString().trim();
          const partner = row['Parceiro']?.toString().trim();
          const observations = row['Observações']?.toString().trim();

          if (!name || name.length < 2) {
            errors.push('Nome obrigatório');
          }

          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('E-mail inválido');
          }

          const validStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
            'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
            'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
          if (state && !validStates.includes(state)) {
            errors.push('Estado inválido');
          }

          return {
            name,
            email,
            phone,
            state,
            origin,
            campaign,
            partner,
            observations,
            isValid: errors.length === 0,
            errors,
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
  }, []);

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

        return {
          name: lead.name,
          email: lead.email || null,
          phone: lead.phone || null,
          state: lead.state || null,
          status: 'novo' as const,
          origin_id: originId || null,
          campaign_id: campaignId || null,
          partner_id: partnerId || null,
          observations: lead.observations || null,
          assessor_id: user!.id,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel com os dados dos leads
          </DialogDescription>
        </DialogHeader>

        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm font-medium">Modelo de Planilha</p>
            <p className="text-xs text-muted-foreground">
              Baixe o modelo com as colunas corretas
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
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((lead, index) => (
                    <TableRow key={index} className={!lead.isValid ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        {lead.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{lead.name || '-'}</TableCell>
                      <TableCell>{lead.email || '-'}</TableCell>
                      <TableCell>{lead.phone || '-'}</TableCell>
                      <TableCell>{lead.state || '-'}</TableCell>
                      <TableCell>
                        {!lead.isValid && (
                          <Badge variant="destructive" className="text-[10px]">
                            {lead.errors.join(', ')}
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
