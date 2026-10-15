# CateEA — Tái lập thực nghiệm

Repository này chứa mã nguồn và các script phục vụ tái lập thực nghiệm của bài báo **CateEA**, thuộc đồ án môn **Học máy với dữ liệu đồ thị (MTH084)**.

Mã nguồn được kế thừa từ [repository chính thức của tác giả](https://github.com/Melkor0007/CateEA) và bổ sung các công cụ phục vụ việc tái lập thực nghiệm.

Tài liệu này chỉ trình bày các bước chuẩn bị môi trường, dữ liệu và câu lệnh thực thi. Kết quả thực nghiệm và các phân tích được trình bày trong báo cáo đồ án.

## 1. Yêu cầu môi trường

### Phần cứng và phần mềm

Môi trường được sử dụng trong quá trình tái lập:

| Thành phần | Cấu hình |
|---|---|
| Hệ điều hành | Ubuntu 24.04 |
| GPU | NVIDIA GeForce RTX 5090 |
| VRAM | 32 GB |
| Python | 3.12 |
| Nền tảng | NVIDIA CUDA |

Khuyến nghị sử dụng GPU NVIDIA hỗ trợ CUDA để huấn luyện.

### Cài đặt

Clone repository:

```bash
git clone https://github.com/keiranoluv/Reproduce_CateEA.git
cd Reproduce_CateEA
```

Tạo môi trường ảo:

```bash
python3 -m venv cateea
source cateea/bin/activate
```

Cài đặt thư viện:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Kiểm tra GPU:

```bash
nvidia-smi
python -c "import torch; print(torch.cuda.is_available())"
```

## 2. Chuẩn bị dữ liệu

Dữ liệu phải được chuẩn bị theo đúng cấu trúc thư mục mà chương trình yêu cầu.

### DBP15K

Các cặp ngôn ngữ được sử dụng:

- `zh_en`: Trung – Anh
- `ja_en`: Nhật – Anh
- `fr_en`: Pháp – Anh

Cấu trúc dữ liệu:

```text
data/
├── DBP15K/
│   ├── zh_en/
│   ├── ja_en/
│   ├── fr_en/
│   └── translated_ent_name/
│       ├── dbp_zh_en.json
│       ├── dbp_ja_en.json
│       └── dbp_fr_en.json
├── embedding/
│   └── glove.6B.300d.txt
└── pkls/
    ├── zh_en_GA_id_img_feature_dict.pkl
    ├── ja_en_GA_id_img_feature_dict.pkl
    └── fr_en_GA_id_img_feature_dict.pkl
```

Mỗi thư mục ngôn ngữ cần chứa các tệp entity IDs, triples, alignment links và attributes tương ứng.

### MMKB

Hai bộ dữ liệu:

- `FBDB15K`
- `FBYG15K`

Cấu trúc dữ liệu:

```text
data/
└── mmkb-datasets/
    ├── FBDB15K/
    └── FBYG15K/
```

Các tệp image features phải nằm trong thư mục tương ứng của mỗi bộ dữ liệu.

## 3. Chạy thực nghiệm DBP15K

DBP15K hỗ trợ bốn cấu hình:

| Cấu hình | Script |
|---|---|
| Non-iterative, w/o SF | `myrun_dbp15k_noniter_woSF.sh` |
| Non-iterative, w/ SF | `myrun_dbp15k_noniter_wSF.sh` |
| Iterative, w/o SF | `myrun_dbp15k_iter_woSF.sh` |
| Iterative, w/ SF | `myrun_dbp15k_iter_wSF.sh` |

Trong đó, SF là *Surface Features*.

### 3.1. Non-iterative

Không sử dụng Surface Features:

```bash
mkdir -p outputs/dbp15k/zh_en_noniter_woSF

bash scripts/dbp15k/myrun_dbp15k_noniter_woSF.sh \
    zh_en 0.3 outputs/dbp15k/zh_en_noniter_woSF
```

Có sử dụng Surface Features:

```bash
mkdir -p outputs/dbp15k/zh_en_noniter_wSF

bash scripts/dbp15k/myrun_dbp15k_noniter_wSF.sh \
    zh_en 0.3 outputs/dbp15k/zh_en_noniter_wSF
```

Để thực hiện trên các cặp ngôn ngữ khác, thay `zh_en` bằng `ja_en` hoặc `fr_en`, đồng thời thay đường dẫn output.

Chạy tất cả cấu hình non-iterative:

```bash
bash scripts/dbp15k/run_all_dbp15k_noniter.sh
```

### 3.2. Iterative

Không sử dụng Surface Features:

```bash
mkdir -p outputs/dbp15k/zh_en_iter_woSF

bash scripts/dbp15k/myrun_dbp15k_iter_woSF.sh \
    zh_en outputs/dbp15k/zh_en_iter_woSF
```

Có sử dụng Surface Features:

```bash
mkdir -p outputs/dbp15k/zh_en_iter_wSF

bash scripts/dbp15k/myrun_dbp15k_iter_wSF.sh \
    zh_en outputs/dbp15k/zh_en_iter_wSF
```

Chạy tất cả cấu hình iterative:

```bash
bash scripts/dbp15k/run_all_dbp15k_iter.sh
```

## 4. Chạy thực nghiệm MMKB

Các bộ dữ liệu:

- FBDB15K
- FBYG15K

Các tỷ lệ dữ liệu huấn luyện:

- 20%
- 50%
- 80%

### 4.1. Non-iterative

Chạy một cấu hình:

```bash
mkdir -p outputs/mmkb/FBDB15K_noniter_20

bash scripts/mmkb/myrun_mmkb_noniter.sh \
    0 42 FBDB15K 0.2 \
    outputs/mmkb/FBDB15K_noniter_20
```

Chạy toàn bộ cấu hình:

```bash
bash scripts/mmkb/run_all_mmkb_noniter.sh
```

### 4.2. Iterative

Chạy một cấu hình:

```bash
mkdir -p outputs/mmkb/FBDB15K_iter_20

bash scripts/mmkb/myrun_mmkb_iter.sh \
    0 42 FBDB15K 0.2 \
    outputs/mmkb/FBDB15K_iter_20
```

Chạy toàn bộ cấu hình:

```bash
bash scripts/mmkb/run_all_mmkb_iter.sh
```

## 5. Cấu hình thực nghiệm

Các script chứa các tham số được sử dụng khi huấn luyện.

Cấu hình DBP15K:

| Tham số | Giá trị |
|---|---|
| Epochs | 1000 |
| Learning rate | 0.0005 |
| Batch size | 512 |
| Hidden units | 300, 300, 300 |
| Checkpoint interval | 50 |
| Seed | 42 |
| Tau | 0.1 |
| Tau2 | 0.4 |
| CSLS k | 3 |
| Structure encoder | GAT |
| Image dimension | 400 |
| Attribute dimension | 400 |

Các cấu hình sử dụng Surface Features có thêm:

```text
--name_dim 400
--char_dim 400
```

Các cấu hình iterative có thêm:

```text
--il
--il_start 500
--semi_learn_step 5
```

Để tái lập đúng cấu hình, nên sử dụng các shell script được cung cấp thay vì tự thay đổi tham số trong chương trình Python.

## 6. Log và kết quả đầu ra

Mỗi thí nghiệm lưu các tệp đầu ra trong thư mục được chỉ định.

Cấu trúc dự kiến:

```text
outputs/
├── dbp15k/
│   ├── zh_en_noniter_woSF/
│   ├── zh_en_noniter_wSF/
│   ├── zh_en_iter_woSF/
│   └── zh_en_iter_wSF/
└── mmkb/
    ├── FBDB15K_noniter_20/
    └── FBDB15K_iter_20/
```

Các tệp có thể được tạo:

- `*.log`: thông tin quá trình huấn luyện và đánh giá.
- `*.pt`: checkpoint của mô hình.
- `pred.txt`: tệp dự đoán thông thường.
- `pred_weighted.txt`: tệp dự đoán có trọng số.

Để lưu log cho một lần chạy:

```bash
bash scripts/dbp15k/myrun_dbp15k_noniter_woSF.sh \
    zh_en 0.3 outputs/dbp15k/zh_en_noniter_woSF \
    2>&1 | tee outputs/dbp15k/zh_en_noniter_woSF/train.log
```

Các script hiện tại cũng hỗ trợ ghi log qua Weights & Biases. Cần đăng nhập trước nếu bật tính năng này:

```bash
wandb login
```

## 7. Lưu ý về tái lập

Khi thực hiện lại thí nghiệm:

- Chạy lệnh tại thư mục gốc của repository.
- Sử dụng cấu trúc dữ liệu đúng quy định.
- Giữ nguyên các tham số của cấu hình cần tái lập.
- Đảm bảo có đủ bộ nhớ GPU.
- Kiểm tra quá trình huấn luyện hoàn tất và lưu đầy đủ log.
- Ghi nhận phiên bản mã nguồn và môi trường để thuận tiện đối chiếu.

## 8. Nguồn mã

Mã nguồn gốc:

https://github.com/Melkor0007/CateEA

Repository tái lập thực nghiệm:

https://github.com/keiranoluv/Reproduce_CateEA

Các kết quả thực nghiệm, nội dung phân tích và so sánh được trình bày trong báo cáo đồ án.