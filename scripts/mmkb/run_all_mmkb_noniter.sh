#!/usr/bin/env bash
set -euo pipefail

# Always execute from the repository root.
cd "$(dirname "$0")/../.."

for dataset in FBDB15K FBYG15K; do
    for rate in 0.2 0.5 0.8; do
        rate_pct="${rate#0.}0"
        output_dir="outputs/mmkb/${dataset}_noniter_${rate_pct}"
        mkdir -p "$output_dir"

        echo "START: ${dataset} noniter ${rate}"

        bash scripts/mmkb/myrun_mmkb_noniter.sh \
            0 42 "$dataset" "$rate" "$output_dir" \
            2>&1 | tee "${output_dir}/train.log"

        echo "PASS: ${dataset} noniter ${rate}"
    done
done
