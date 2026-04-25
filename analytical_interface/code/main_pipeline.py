"""
Pipeline do pacote Zenodo (deposito publico).

O processamento completo do corpus (limpeza, topicos, metricas) vive em `github/`
no repositorio de desenvolvimento. Aqui ficam apenas os passos necessarios para
validar o `dataset/` e gerar os artefatos estaticos consumidos por `frontend/`.
"""

from __future__ import annotations

import argparse

from export_static_data import main as export_static


def main() -> None:
    parser = argparse.ArgumentParser(description="Pipeline Zenodo")
    parser.add_argument(
        "command",
        nargs="?",
        default="export",
        choices=("export",),
        help="export: valida CSVs em dataset/ e gera JSON + meta em frontend/data e docs/",
    )
    args = parser.parse_args()
    if args.command == "export":
        export_static()


if __name__ == "__main__":
    main()
