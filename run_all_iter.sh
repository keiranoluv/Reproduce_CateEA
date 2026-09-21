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
    "ZH-EN iterative w/o SF" \
    "bash myrun_dbp15k_il_woSF.sh zh_en 2>&1 | tee logs/zh_en_iter_woSF.log"

run_job \
    "JA-EN iterative w/o SF" \
    "bash myrun_dbp15k_il_woSF.sh ja_en 2>&1 | tee logs/ja_en_iter_woSF.log"

run_job \
    "FR-EN iterative w/o SF" \
    "bash myrun_dbp15k_il_woSF.sh fr_en 2>&1 | tee logs/fr_en_iter_woSF.log"

run_job \
    "ZH-EN iterative w/ SF" \
    "bash myrun_dbp15k_il_wname.sh zh_en 2>&1 | tee logs/zh_en_iter_wSF.log"

run_job \
    "JA-EN iterative w/ SF" \
    "bash myrun_dbp15k_il_wname.sh ja_en 2>&1 | tee logs/ja_en_iter_wSF.log"

run_job \
    "FR-EN iterative w/ SF" \
    "bash myrun_dbp15k_il_wname.sh fr_en 2>&1 | tee logs/fr_en_iter_wSF.log"

END_ALL=$(date +%s)
TOTAL=$((END_ALL - START_ALL))

echo
echo "=================================================="
echo "ALL ITERATIVE EXPERIMENTS COMPLETED"
echo "FINISH TIME: $(date)"
echo "TOTAL TIME : ${TOTAL}s"
echo "=================================================="