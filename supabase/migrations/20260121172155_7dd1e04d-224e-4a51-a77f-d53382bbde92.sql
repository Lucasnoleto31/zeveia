-- Add columns to support business opportunities from existing clients
ALTER TABLE leads ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN target_product_id uuid REFERENCES products(id) ON DELETE SET NULL;

-- Create index for better query performance when fetching client opportunities
CREATE INDEX idx_leads_client_id ON leads(client_id) WHERE client_id IS NOT NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN leads.client_id IS 'Reference to existing client for reactivation/cross-selling opportunities';
COMMENT ON COLUMN leads.target_product_id IS 'Target product for cross-selling opportunities';