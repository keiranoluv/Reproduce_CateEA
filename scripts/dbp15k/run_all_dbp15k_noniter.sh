#!/usr/bin/env bash
set -euo pipefail

# Always execute from the repository root.
cd "$(dirname "$0")/../.."

for dataset in zh_en ja_en fr_en; do
    for sf in woSF wSF; do
        output_dir="outputs/dbp15k/${dataset}_noniter_${sf}"
        mkdir -p "$output_dir"

        echo "START: ${dataset} noniter ${sf}"

        bash "scripts/dbp15k/myrun_dbp15k_noniter_${sf}.sh" \
            "$dataset" \
            0.3 \
            "$output_dir" \
            2>&1 | tee "${output_dir}/train.log"

        echo "PASS: ${dataset} noniter ${sf}"
    done
done
