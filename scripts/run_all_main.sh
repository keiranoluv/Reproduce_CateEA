#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

bash scripts/dbp15k/run_all_dbp15k_noniter.sh
bash scripts/dbp15k/run_all_dbp15k_iter.sh
bash scripts/mmkb/run_all_mmkb_noniter.sh
bash scripts/mmkb/run_all_mmkb_iter.sh
