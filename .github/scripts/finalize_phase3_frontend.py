from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding='utf-8')
    if new in text:
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


if __name__ == '__main__':
    main()
