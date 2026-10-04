#!/bin/bash

set -euo pipefail

mkdir -p \
    outputs/table3/FBDB15K_noniter_20 \
    outputs/table3/FBDB15K_noniter_50 \
    outputs/table3/FBDB15K_noniter_80 \
    outputs/table3/FBYG15K_noniter_20 \
    outputs/table3/FBYG15K_noniter_50 \
    outputs/table3/FBYG15K_noniter_80

bash myrun_mmkb_noil.sh \
    0 42 FBDB15K 0.2 \
    outputs/table3/FBDB15K_noniter_20 \
    2>&1 | tee outputs/table3/FBDB15K_noniter_20/FBDB15K_noniter_20.log

bash myrun_mmkb_noil.sh \
    0 42 FBDB15K 0.5 \
    outputs/table3/FBDB15K_noniter_50 \
    2>&1 | tee outputs/table3/FBDB15K_noniter_50/FBDB15K_noniter_50.log

bash myrun_mmkb_noil.sh \
    0 42 FBDB15K 0.8 \
    outputs/table3/FBDB15K_noniter_80 \
    2>&1 | tee outputs/table3/FBDB15K_noniter_80/FBDB15K_noniter_80.log

bash myrun_mmkb_noil.sh \
    0 42 FBYG15K 0.2 \
    outputs/table3/FBYG15K_noniter_20 \
    2>&1 | tee outputs/table3/FBYG15K_noniter_20/FBYG15K_noniter_20.log

bash myrun_mmkb_noil.sh \
    0 42 FBYG15K 0.5 \
    outputs/table3/FBYG15K_noniter_50 \
    2>&1 | tee outputs/table3/FBYG15K_noniter_50/FBYG15K_noniter_50.log

bash myrun_mmkb_noil.sh \
    0 42 FBYG15K 0.8 \
    outputs/table3/FBYG15K_noniter_80 \
    2>&1 | tee outputs/table3/FBYG15K_noniter_80/FBYG15K_noniter_80.log