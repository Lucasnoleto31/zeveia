import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  MapPin, 
  Megaphone, 
  Package, 
  Layers,
  Monitor,
  XCircle,
  BarChart3,
  Users
} from 'lucide-react';
import { ConfigurationList } from '@/components/settings/ConfigurationList';
import { SubproductsList } from '@/components/settings/SubproductsList';
import { AssetsList } from '@/components/settings/AssetsList';
import { UserManagement } from '@/components/settings/UserManagement';
import {
  useOrigins,
  useCreateOrigin,
  useUpdateOrigin,
  useDeleteOrigin,
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useLossReasons,
  useCreateLossReason,
  useUpdateLossReason,
  useDeleteLossReason,
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useSubproducts,
  useCreateSubproduct,
  useUpdateSubproduct,
  useDeleteSubproduct,
  usePlatforms,
  useCreatePlatform,
  useUpdatePlatform,
  useDeletePlatform,
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from '@/hooks/useConfiguration';

export default function SettingsPage() {
  // Origins
  const { data: origins = [], isLoading: originsLoading } = useOrigins();
  const createOrigin = useCreateOrigin();
  const updateOrigin = useUpdateOrigin();
  const deleteOrigin = useDeleteOrigin();

  // Campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  // Loss Reasons
  const { data: lossReasons = [], isLoading: lossReasonsLoading } = useLossReasons();
  const createLossReason = useCreateLossReason();
  const updateLossReason = useUpdateLossReason();
  const deleteLossReason = useDeleteLossReason();

  // Products
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Subproducts
  const { data: subproducts = [], isLoading: subproductsLoading } = useSubproducts();
  const createSubproduct = useCreateSubproduct();
  const updateSubproduct = useUpdateSubproduct();
  const deleteSubproduct = useDeleteSubproduct();

  // Platforms
  const { data: platforms = [], isLoading: platformsLoading } = usePlatforms();
  const createPlatform = useCreatePlatform();
  const updatePlatform = useUpdatePlatform();
  const deletePlatform = useDeletePlatform();

  // Assets
  const { data: assets = [], isLoading: assetsLoading } = useAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie as configurações e tabelas auxiliares do sistema
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="origins" className="gap-2">
              <MapPin className="h-4 w-4" />
              Origens
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="subproducts" className="gap-2">
              <Layers className="h-4 w-4" />
              Subprodutos
            </TabsTrigger>
            <TabsTrigger value="platforms" className="gap-2">
              <Monitor className="h-4 w-4" />
              Plataformas
            </TabsTrigger>
            <TabsTrigger value="assets" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Ativos
            </TabsTrigger>
            <TabsTrigger value="lossReasons" className="gap-2">
              <XCircle className="h-4 w-4" />
              Motivos de Perda
            </TabsTrigger>
          </TabsList>

          {/* Users */}
          <TabsContent value="users">
            <Card>
              <CardContent className="pt-6">
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Origins */}
          <TabsContent value="origins">
            <Card>
              <CardContent className="pt-6">
                <ConfigurationList
                  title="Origem"
                  description="Origens de leads e clientes (indicação, tráfego pago, etc.)"
                  items={origins}
                  isLoading={originsLoading}
                  onCreate={async (name) => { await createOrigin.mutateAsync(name); }}
                  onUpdate={async (id, data) => { await updateOrigin.mutateAsync({ id, ...data }); }}
                  onDelete={async (id) => { await deleteOrigin.mutateAsync(id); }}
                  createPending={createOrigin.isPending}
                  updatePending={updateOrigin.isPending}
                  deletePending={deleteOrigin.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Origins */}
          <TabsContent value="origins">
            <Card>
              <CardContent className="pt-6">
                <ConfigurationList
                  title="Origem"
                  description="Origens de leads e clientes (indicação, tráfego pago, etc.)"
                  items={origins}
                  isLoading={originsLoading}
                  onCreate={async (name) => { await createOrigin.mutateAsync(name); }}
                  onUpdate={async (id, data) => { await updateOrigin.mutateAsync({ id, ...data }); }}
                  onDelete={async (id) => { await deleteOrigin.mutateAsync(id); }}
                  createPending={createOrigin.isPending}
                  updatePending={updateOrigin.isPending}
                  deletePending={deleteOrigin.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns */}
          <TabsContent value="campaigns">
            <Card>
              <CardContent className="pt-6">
                <ConfigurationList
                  title="Campanha"
                  description="Campanhas de marketing e aquisição de clientes"
                  items={campaigns}
                  isLoading={campaignsLoading}
                  onCreate={async (name) => { await createCampaign.mutateAsync(name); }}
                  onUpdate={async (id, data) => { await updateCampaign.mutateAsync({ id, ...data }); }}
                  onDelete={async (id) => { await deleteCampaign.mutateAsync(id); }}
                  createPending={createCampaign.isPending}
                  updatePending={updateCampaign.isPending}
                  deletePending={deleteCampaign.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products */}
          <TabsContent value="products">
            <Card>
              <CardContent className="pt-6">
                <ConfigurationList
                  title="Produto"
                  description="Produtos financeiros oferecidos aos clientes"
                  items={products}
                  isLoading={productsLoading}
                  onCreate={async (name) => { await createProduct.mutateAsync(name); }}
                  onUpdate={async (id, data) => { await updateProduct.mutateAsync({ id, ...data }); }}
                  onDelete={async (id) => { await deleteProduct.mutateAsync(id); }}
                  createPending={createProduct.isPending}
                  updatePending={updateProduct.isPending}
                  deletePending={deleteProduct.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subproducts */}
          <TabsContent value="subproducts">
            <Card>
              <CardContent className="pt-6">
                <SubproductsList
                  products={products}
                  subproducts={subproducts}
                  isLoading={subproductsLoading}
                  onCreate={async (productId, name) => { 
                    await createSubproduct.mutateAsync({ productId, name }); 
                  }}
                  onUpdate={async (id, data) => { 
                    await updateSubproduct.mutateAsync({ id, ...data }); 
                  }}
                  onDelete={async (id) => { await deleteSubproduct.mutateAsync(id); }}
                  createPending={createSubproduct.isPending}
                  updatePending={updateSubproduct.isPending}
                  deletePending={deleteSubproduct.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platforms */}
          <TabsContent value="platforms">
            <Card>
              <CardContent className="pt-6">
                <ConfigurationList
                  title="Plataforma"
                  description="Plataformas de negociação disponíveis"
                  items={platforms}
                  isLoading={platformsLoading}
                  onCreate={async (name) => { await createPlatform.mutateAsync(name); }}
                  onUpdate={async (id, data) => { await updatePlatform.mutateAsync({ id, ...data }); }}
                  onDelete={async (id) => { await deletePlatform.mutateAsync(id); }}
                  createPending={createPlatform.isPending}
                  updatePending={updatePlatform.isPending}
                  deletePending={deletePlatform.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets */}
          <TabsContent value="assets">
            <Card>
              <CardContent className="pt-6">
                <AssetsList
                  assets={assets}
                  isLoading={assetsLoading}
                  onCreate={async (code, name) => { 
                    await createAsset.mutateAsync({ code, name }); 
                  }}
                  onUpdate={async (id, data) => { 
                    await updateAsset.mutateAsync({ id, ...data }); 
                  }}
                  onDelete={async (id) => { await deleteAsset.mutateAsync(id); }}
                  createPending={createAsset.isPending}
                  updatePending={updateAsset.isPending}
                  deletePending={deleteAsset.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loss Reasons */}
          <TabsContent value="lossReasons">
            <Card>
              <CardContent className="pt-6">
                <ConfigurationList
                  title="Motivo de Perda"
                  description="Motivos para perda de leads"
                  items={lossReasons}
                  isLoading={lossReasonsLoading}
                  onCreate={async (name) => { await createLossReason.mutateAsync(name); }}
                  onUpdate={async (id, data) => { await updateLossReason.mutateAsync({ id, ...data }); }}
                  onDelete={async (id) => { await deleteLossReason.mutateAsync(id); }}
                  createPending={createLossReason.isPending}
                  updatePending={updateLossReason.isPending}
                  deletePending={deleteLossReason.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
