#!/usr/bin/env bash
set -euo pipefail

# Always execute from the repository root.
cd "$(dirname "$0")/../.."

for dataset in zh_en ja_en fr_en; do
    for sf in woSF wSF; do
        output_dir="outputs/dbp15k/${dataset}_iter_${sf}"
        mkdir -p "$output_dir"

        echo "START: ${dataset} iter ${sf}"

        bash "scripts/dbp15k/myrun_dbp15k_iter_${sf}.sh" \
            "$dataset" \
            "$output_dir" \
            2>&1 | tee "${output_dir}/train.log"

        echo "PASS: ${dataset} iter ${sf}"
    done
done
