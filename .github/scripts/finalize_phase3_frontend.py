from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding='utf-8')
    if new and new in text:
        return
    if old not in text:
        raise RuntimeError(f'No se encontró el bloque esperado en {path}')
    target.write_text(text.replace(old, new, 1), encoding='utf-8')


def main() -> None:
    replace_once(
        'src/features/reports/ReportsPage.tsx',
        '''  const pdfMutation = useMutation({
    mutationFn: () => generateAnalyticsReportPdf(activeKey!, requestFilters),
    onSuccess: (result) => {
      void downloadProtectedDocument(result.pdfUrl, `${activeKey || "reporte"}.pdf`);
    },
  });

  const matrixPdfMutation = useMutation({
    mutationFn: () => generateSalesMatrixPdf(requestFilters),
    onSuccess: (result) => {
      void downloadProtectedDocument(result.pdfUrl, `${activeKey || "reporte"}.pdf`);
    },
  });''',
        '''  const pdfMutation = useMutation({
    mutationFn: async () => {
      const result = await generateAnalyticsReportPdf(activeKey!, requestFilters);
      await downloadProtectedDocument(
        result.pdfUrl,
        `${activeKey || "reporte"}.pdf`,
      );
    },
  });

  const matrixPdfMutation = useMutation({
    mutationFn: async () => {
      const result = await generateSalesMatrixPdf(requestFilters);
      await downloadProtectedDocument(
        result.pdfUrl,
        "reporte-matriz-ventas.pdf",
      );
    },
  });''',
    )

    replace_once(
        'src/features/clients/ClientsPage.tsx',
        '''  const summary = useMemo(() => {
    return {
      total: clients.length,
      normal: clients.filter((client) => client.type === 'NORMAL').length,
      especial: clients.filter((client) => client.type === 'ESPECIAL').length,
      camino: clients.filter((client) => client.type === 'CAMINO').length,
      locations: locations.length,
    };
  }, [clients, locations]);''',
        '''  const summary = useMemo(() => {
    const activeClients = clients.filter((client) => client.isActive !== false);

    return {
      total: activeClients.length,
      normal: activeClients.filter((client) => client.type === 'NORMAL').length,
      especial: activeClients.filter((client) => client.type === 'ESPECIAL').length,
      camino: activeClients.filter((client) => client.type === 'CAMINO').length,
      locations: locations.length,
    };
  }, [clients, locations]);''',
    )

    replace_once(
        'src/features/products/ProductsPage.tsx',
        '''                        <Typography variant="body2">
                          {getProviderName(product, providers)}
                        </Typography>''',
        '''                        <Typography variant="body2">
                          {isAdmin
                            ? getProviderName(product, providers)
                            : 'Información restringida'}
                        </Typography>''',
    )

    replace_once(
        'src/features/inventory/InventoryPage.tsx',
        "import { ErrorMessage } from '../../components/common/ErrorMessage';",
        "import { ErrorMessage } from '../../components/common/ErrorMessage';\nimport { downloadProtectedDocument } from '../../api/documents.api';",
    )
    replace_once(
        'src/features/inventory/InventoryPage.tsx',
        '''function openPdf(pdfUrl: string) {
  const absoluteUrl =
    pdfUrl.startsWith('http://') ||
    pdfUrl.startsWith('https://')
      ? pdfUrl
      : `${
          import.meta.env.VITE_API_URL ||
          'http://localhost:3000'
        }${pdfUrl}`;

  window.open(
    absoluteUrl,
    '_blank',
    'noopener,noreferrer',
  );
}

''',
        '',
    )
    replace_once(
        'src/features/inventory/InventoryPage.tsx',
        '''  const pdfMutation = useMutation({
    mutationFn: generateCentralInventoryPdf,
    onSuccess: (result) => openPdf(result.pdfUrl),
  });''',
        '''  const pdfMutation = useMutation({
    mutationFn: async () => {
      const result = await generateCentralInventoryPdf();
      await downloadProtectedDocument(
        result.pdfUrl,
        'inventario-central.pdf',
      );
    },
  });''',
    )

    replace_once(
        'src/features/collections/CollectionsPage.tsx',
        "import { ErrorMessage } from '../../components/common/ErrorMessage';",
        "import { ErrorMessage } from '../../components/common/ErrorMessage';\nimport { downloadProtectedDocument } from '../../api/documents.api';",
    )
    replace_once(
        'src/features/collections/CollectionsPage.tsx',
        '''function openPdf(pdfUrl: string) {
  const absoluteUrl =
    pdfUrl.startsWith('http://') ||
    pdfUrl.startsWith('https://')
      ? pdfUrl
      : `${
          import.meta.env.VITE_API_URL ||
          'http://localhost:3000'
        }${pdfUrl}`;

  window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
}

''',
        '',
    )
    replace_once(
        'src/features/collections/CollectionsPage.tsx',
        '''      if (kind === 'GENERAL') {
        return generateGeneralDebtPdf();
      }

      if (kind === 'ASSIGNMENTS') {
        return generateAssignmentsPdf();
      }

      if (!userId) {
        throw new Error(
          'No se encontró el usuario del reporte.',
        );
      }

      return generateUserAssignmentsPdf(userId);
    },
    onSuccess: (result) => {
      setActionError(null);
      openPdf(result.pdfUrl);
    },''',
        '''      const result =
        kind === 'GENERAL'
          ? await generateGeneralDebtPdf()
          : kind === 'ASSIGNMENTS'
            ? await generateAssignmentsPdf()
            : userId
              ? await generateUserAssignmentsPdf(userId)
              : (() => {
                  throw new Error('No se encontró el usuario del reporte.');
                })();

      await downloadProtectedDocument(
        result.pdfUrl,
        kind === 'GENERAL'
          ? 'reporte-general-deudas.pdf'
          : kind === 'ASSIGNMENTS'
            ? 'reporte-asignaciones.pdf'
            : `reporte-cobrador-${userId}.pdf`,
      );
    },
    onSuccess: () => {
      setActionError(null);
    },''',
    )


if __name__ == '__main__':
    main()
