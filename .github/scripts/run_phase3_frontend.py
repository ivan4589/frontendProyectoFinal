from pathlib import Path


def replace_required(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'No se encontró el ajuste esperado en {path}: {old!r}')
    target.write_text(text.replace(old, new, 1), encoding='utf-8')


def main() -> None:
    if Path('src/api/documents.api.ts').exists():
        print('Phase 3 frontend already applied')
        return

    workflow = Path(
        '.github/workflows/phase3-frontend-implementation.yml'
    ).read_text(encoding='utf-8')
    marker_start = "          python <<'PY'\n"
    marker_end = "\n          PY\n"
    start = workflow.index(marker_start) + len(marker_start)
    end = workflow.index(marker_end, start)
    raw = workflow[start:end]
    script = '\n'.join(
        line[10:] if line.startswith('          ') else line
        for line in raw.splitlines()
    )

    script = script.replace(
        '"      id: string; data: CreateProductRequest }) =>\\n'
        '      updateProduct(id, data),"',
        '"mutationFn: ({ id, data }: { id: string; '
        'data: CreateProductRequest }) =>\\n'
        '      updateProduct(id, data),"',
    )
    script = script.replace(
        '"      id: string; data: UpdateProductRequest }) =>\\n'
        '      updateProduct(id, data),"',
        '"mutationFn: ({ id, data }: { id: string; '
        'data: UpdateProductRequest }) =>\\n'
        '      updateProduct(id, data),"',
    )

    script = script.replace(
        "if old_button not in sales_page:\n"
        "    raise SystemExit('No se encontró botón PDF de ventas')\n"
        "sales_page = sales_page.replace(old_button, new_button, 1)",
        "if old_button in sales_page:\n"
        "    sales_page = sales_page.replace(old_button, new_button, 1)\n"
        "else:\n"
        "    button_start = sales_page.index("
        "'                            <Tooltip title=\\\"Abrir recibo\\\">')\n"
        "    button_end = sales_page.index("
        "'                            </Tooltip>', button_start) + "
        "len('                            </Tooltip>')\n"
        "    sales_page = sales_page[:button_start] + new_button + "
        "sales_page[button_end:]",
    )
    script = script.replace(
        "if old_button not in purchases_page:\n"
        "    raise SystemExit('No se encontró botón PDF de compras')\n"
        "purchases_page = purchases_page.replace(old_button, new_button, 1)",
        "if old_button in purchases_page:\n"
        "    purchases_page = purchases_page.replace(old_button, new_button, 1)\n"
        "else:\n"
        "    button_start = purchases_page.index("
        "'                          <Tooltip title=\\\"Abrir comprobante PDF\\\">')\n"
        "    button_end = purchases_page.index("
        "'                          </Tooltip>', button_start) + "
        "len('                          </Tooltip>')\n"
        "    purchases_page = purchases_page[:button_start] + new_button + "
        "purchases_page[button_end:]",
    )

    exec(compile(script, 'phase3_frontend.py', 'exec'))

    replace_required(
        'src/types/product.types.ts',
        '  purchasePrice?: number;',
        '  purchasePrice: number;',
    )
    replace_required(
        'src/features/products/ProductsPage.tsx',
        '        data: { ...data, changeReason },',
        '        data: { ...data, changeReason: changeReason || undefined },',
    )
    replace_required(
        'src/features/purchases/PurchasesPage.tsx',
        '    queryFn: getProviders,',
        '    queryFn: () => getProviders(),',
    )


if __name__ == '__main__':
    main()
