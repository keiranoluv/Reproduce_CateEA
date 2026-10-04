#!/bin/bash

set -euo pipefail

mkdir -p \
    outputs/table4/FBDB15K_iter_20 \
    outputs/table4/FBDB15K_iter_50 \
    outputs/table4/FBDB15K_iter_80 \
    outputs/table4/FBYG15K_iter_20 \
    outputs/table4/FBYG15K_iter_50 \
    outputs/table4/FBYG15K_iter_80

bash myrun_mmkb_il.sh \
    0 42 FBDB15K 0.2 \
    outputs/table4/FBDB15K_iter_20 \
    2>&1 | tee outputs/table4/FBDB15K_iter_20/FBDB15K_iter_20.log

bash myrun_mmkb_il.sh \
    0 42 FBDB15K 0.5 \
    outputs/table4/FBDB15K_iter_50 \
    2>&1 | tee outputs/table4/FBDB15K_iter_50/FBDB15K_iter_50.log

bash myrun_mmkb_il.sh \
    0 42 FBDB15K 0.8 \
    outputs/table4/FBDB15K_iter_80 \
    2>&1 | tee outputs/table4/FBDB15K_iter_80/FBDB15K_iter_80.log

bash myrun_mmkb_il.sh \
    0 42 FBYG15K 0.2 \
    outputs/table4/FBYG15K_iter_20 \
    2>&1 | tee outputs/table4/FBYG15K_iter_20/FBYG15K_iter_20.log

bash myrun_mmkb_il.sh \
    0 42 FBYG15K 0.5 \
    outputs/table4/FBYG15K_iter_50 \
    2>&1 | tee outputs/table4/FBYG15K_iter_50/FBYG15K_iter_50.log

bash myrun_mmkb_il.sh \
    0 42 FBYG15K 0.8 \
    outputs/table4/FBYG15K_iter_80 \
    2>&1 | tee outputs/table4/FBYG15K_iter_80/FBYG15K_iter_80.log