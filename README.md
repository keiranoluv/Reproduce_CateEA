# CateEA
Code for our paper CateEA


```
DBP15K
│
├── Non-iterative
│   ├── w/o SF
│   │   ├── ZH-EN ✅: ``
│   │   ├── JA-EN ✅: ``
│   │   └── FR-EN ✅: ``
│   │
│   └── w/ SF         
│
└── Iterative
    ├── w/o SF        
    │   ├── ZH-EN
    │   ├── JA-EN
    │   └── FR-EN
    │
    └── w/ SF          
```




----------
Code chạy dataset với non-iter + wSF

```
w/ SF:
- KHÔNG truyền --w_name
- KHÔNG truyền --w_char
- NÊN set:
    --name_dim 400
    --char_dim 400
```

ZH-EN non-iter + wSF:
```
CUDA_VISIBLE_DEVICES=0 python3 -u src/myrun.py \
    --file_dir data/DBP15K/zh_en \
    --rate 0.3 \
    --lr .0005 \
    --epochs 1000 \
    --hidden_units "300,300,300" \
    --check_point 50 \
    --bsize 512 \
    --semi_learn_step 5 \
    --csls \
    --csls_k 3 \
    --seed 42 \
    --tau 0.1 \
    --tau2 4.0 \
    --structure_encoder "gat" \
    --img_dim 400 \
    --attr_dim 400 \
    --name_dim 400 \
    --char_dim 400 \
    --save_path save/zh_en_noniter_wSF \
    2>&1 | tee zh_en_noniter_wSF.log
```

JA-EN:
```
CUDA_VISIBLE_DEVICES=0 python3 -u src/myrun.py \
    --file_dir data/DBP15K/ja_en \
    --rate 0.3 \
    --lr .0005 \
    --epochs 1000 \
    --hidden_units "300,300,300" \
    --check_point 50 \
    --bsize 512 \
    --semi_learn_step 5 \
    --csls \
    --csls_k 3 \
    --seed 42 \
    --tau 0.1 \
    --tau2 4.0 \
    --structure_encoder "gat" \
    --img_dim 400 \
    --attr_dim 400 \
    --name_dim 400 \
    --char_dim 400 \
    --save_path save/ja_en_noniter_wSF \
    2>&1 | tee ja_en_noniter_wSF.log
```

```
CUDA_VISIBLE_DEVICES=0 python3 -u src/myrun.py \
    --file_dir data/DBP15K/fr_en \
    --rate 0.3 \
    --lr .0005 \
    --epochs 1000 \
    --hidden_units "300,300,300" \
    --check_point 50 \
    --bsize 512 \
    --semi_learn_step 5 \
    --csls \
    --csls_k 3 \
    --seed 42 \
    --tau 0.1 \
    --tau2 4.0 \
    --structure_encoder "gat" \
    --img_dim 400 \
    --attr_dim 400 \
    --name_dim 400 \
    --char_dim 400 \
    --save_path save/fr_en_noniter_wSF \
    2>&1 | tee fr_en_noniter_wSF.log
```