import type { PermissionCatalogEntry } from './types'

const now = () => new Date().toISOString()

export const INITIAL_MOCK_PERMISSIONS: PermissionCatalogEntry[] = [
    {
        id: 'perm-1',
        key: 'delete_invoice',
        label: 'Eliminar fatura',
        description: 'Permite eliminar faturas',
        usageCount: 3,
        sources: ['InvoiceList / btn_delete'],
        createdAt: now(),
        updatedAt: now()
    },
    {
        id: 'perm-2',
        key: 'audit_invoice',
        label: 'Auditar fatura',
        description: 'Permite auditar faturas',
        usageCount: 2,
        sources: ['InvoiceList / btn_audit'],
        createdAt: now(),
        updatedAt: now()
    },
    {
        id: 'perm-3',
        key: 'publish_invoice',
        label: 'Publicar fatura',
        description: 'Publicar fatura no portal',
        usageCount: 1,
        sources: ['InvoiceDetail / publish_btn'],
        createdAt: now(),
        updatedAt: now()
    },
    {
        id: 'perm-4',
        key: 'manage_access',
        label: 'Gerir acesso',
        description: 'Acesso administrativo à gestão de utilizadores',
        usageCount: 1,
        sources: ['AdminUsers (root assert)'],
        createdAt: now(),
        updatedAt: now()
    },
    {
        id: 'perm-5',
        key: 'finance.audit_invoice',
        label: 'Auditar (finance)',
        description: 'Referência cross-department',
        usageCount: 0,
        createdAt: now(),
        updatedAt: now()
    },
    {
        id: 'perm-6',
        key: 'view_tax_id',
        label: 'Ver NIF',
        description: 'Visualizar identificação fiscal',
        usageCount: 0,
        createdAt: now(),
        updatedAt: now()
    },
    {
        id: 'perm-7',
        key: 'update_invoice',
        label: 'Editar fatura',
        description: 'Atualizar dados da fatura',
        usageCount: 0,
        createdAt: now(),
        updatedAt: now()
    }
]
