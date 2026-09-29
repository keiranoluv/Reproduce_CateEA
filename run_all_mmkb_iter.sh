#!/bin/bash

set -euo pipefail

mkdir -p logs

START_ALL=$(date +%s)

run_job () {
    NAME="$1"
    CMD="$2"

    echo
    echo "=================================================="
    echo "START: $NAME"
    echo "TIME : $(date)"
    echo "=================================================="

    START_JOB=$(date +%s)

    if eval "$CMD"; then
        END_JOB=$(date +%s)
        ELAPSED=$((END_JOB - START_JOB))

        echo "=================================================="
        echo "PASS : $NAME"
        echo "TIME : $(date)"
        echo "ELAPSED: ${ELAPSED}s"
        echo "=================================================="
    else
        END_JOB=$(date +%s)
        ELAPSED=$((END_JOB - START_JOB))

        echo "=================================================="
        echo "FAIL : $NAME"
        echo "TIME : $(date)"
        echo "ELAPSED: ${ELAPSED}s"
        echo "=================================================="

        exit 1
    fi
}

run_job \
    "FBDB15K iterative 20%" \
    "bash myrun_mmkb_il.sh 0 42 FBDB15K 0.2 2>&1 | tee logs/fbdb15k_iter_20.log"

run_job \
    "FBDB15K iterative 50%" \
    "bash myrun_mmkb_il.sh 0 42 FBDB15K 0.5 2>&1 | tee logs/fbdb15k_iter_50.log"

run_job \
    "FBDB15K iterative 80%" \
    "bash myrun_mmkb_il.sh 0 42 FBDB15K 0.8 2>&1 | tee logs/fbdb15k_iter_80.log"

run_job \
    "FBYG15K iterative 20%" \
    "bash myrun_mmkb_il.sh 0 42 FBYG15K 0.2 2>&1 | tee logs/fbyg15k_iter_20.log"

run_job \
    "FBYG15K iterative 50%" \
    "bash myrun_mmkb_il.sh 0 42 FBYG15K 0.5 2>&1 | tee logs/fbyg15k_iter_50.log"

run_job \
    "FBYG15K iterative 80%" \
    "bash myrun_mmkb_il.sh 0 42 FBYG15K 0.8 2>&1 | tee logs/fbyg15k_iter_80.log"

END_ALL=$(date +%s)
TOTAL=$((END_ALL - START_ALL))

echo
echo "=================================================="
echo "ALL MMKB ITERATIVE EXPERIMENTS COMPLETED"
echo "FINISH TIME: $(date)"
echo "TOTAL TIME : ${TOTAL}s"
echo "=================================================="