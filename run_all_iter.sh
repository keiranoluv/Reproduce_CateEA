#!/bin/bash

set -euo pipefail

mkdir -p \
    outputs/table2/zh_en_iter_woSF \
    outputs/table2/ja_en_iter_woSF \
    outputs/table2/fr_en_iter_woSF \
    outputs/table2/zh_en_iter_wSF \
    outputs/table2/ja_en_iter_wSF \
    outputs/table2/fr_en_iter_wSF

bash myrun_dbp15k_il_woSF.sh \
    zh_en \
    outputs/table2/zh_en_iter_woSF \
    2>&1 | tee outputs/table2/zh_en_iter_woSF/zh_en_iter_woSF.log

bash myrun_dbp15k_il_woSF.sh \
    ja_en \
    outputs/table2/ja_en_iter_woSF \
    2>&1 | tee outputs/table2/ja_en_iter_woSF/ja_en_iter_woSF.log

bash myrun_dbp15k_il_woSF.sh \
    fr_en \
    outputs/table2/fr_en_iter_woSF \
    2>&1 | tee outputs/table2/fr_en_iter_woSF/fr_en_iter_woSF.log

bash myrun_dbp15k_il_wname.sh \
    zh_en \
    outputs/table2/zh_en_iter_wSF \
    2>&1 | tee outputs/table2/zh_en_iter_wSF/zh_en_iter_wSF.log

bash myrun_dbp15k_il_wname.sh \
    ja_en \
    outputs/table2/ja_en_iter_wSF \
    2>&1 | tee outputs/table2/ja_en_iter_wSF/ja_en_iter_wSF.log

bash myrun_dbp15k_il_wname.sh \
    fr_en \
    outputs/table2/fr_en_iter_wSF \
    2>&1 | tee outputs/table2/fr_en_iter_wSF/fr_en_iter_wSF.log