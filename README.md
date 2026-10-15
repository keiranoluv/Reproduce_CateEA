# CateEA — Tái lập thực nghiệm

Repository phục vụ tái lập thực nghiệm bài báo **CateEA** trong khuôn khổ đồ án môn **Học máy với dữ liệu đồ thị (MTH084)**.

Mã nguồn được kế thừa từ [CateEA của tác giả](https://github.com/Melkor0007/CateEA) và bổ sung các script phục vụ tái lập. Kết quả và phân tích thực nghiệm được trình bày trong báo cáo đồ án.

## 1. Môi trường thực nghiệm

| Thành phần | Cấu hình |
|---|---|
| Hệ điều hành | Ubuntu 24.04 |
| GPU | NVIDIA GeForce RTX 5090 (32 GB) |
| Python | 3.12 |
| Nền tảng | NVIDIA CUDA |

**Cài đặt:**

```bash
git clone https://github.com/keiranoluv/Reproduce_CateEA.git
cd Reproduce_CateEA

python3 -m venv cateea
source cateea/bin/activate

python -m pip install --upgrade pip

# Install PyTorch with CUDA 13.0
python -m pip install torch==2.13.0 torchvision==0.28.0 \
    --index-url https://download.pytorch.org/whl/cu130

# Install remaining dependencies
python -m pip install -r requirements.txt
```

Kiểm tra môi trường:

```bash
python -c "import torch; print(torch.__version__, torch.version.cuda, torch.cuda.is_available())"
python -m pip check
```

Kỳ vọng:

```
2.13.0+cu130 13.0 True
No broken requirements found.
```

## 2. Chuẩn bị dữ liệu

Tải bộ dữ liệu `mmkg.zip` từ [MEAformer](https://github.com/zjukg/MEAformer) ([Google Drive](https://drive.google.com/file/d/1VIWcc3KDcLcRImeSrF2AyhetBLq_gsnx/view)).

Sau khi tải và giải nén, đặt các thư mục `DBP15K/`, `embedding/`, `pkls/`, `FBDB15K/` và `FBYG15K/` vào thư mục `data/` tại root repository.

**Cấu hình đường dẫn MMKB**

Dữ liệu MMKB nằm trong các thư mục `FBDB15K/norm/` và `FBYG15K/norm/`, trong khi mã nguồn CateEA yêu cầu đường dẫn `data/mmkb-datasets/`.

Tạo symbolic links để sử dụng dữ liệu mà không cần sao chép:

```bash
mkdir -p data/mmkb-datasets

ln -s ../FBDB15K/norm data/mmkb-datasets/FBDB15K
ln -s ../FBYG15K/norm data/mmkb-datasets/FBYG15K
```

**Cấu trúc dữ liệu sau khi chuẩn bị:**

```text
data/
├── DBP15K/
│   ├── zh_en/
│   ├── ja_en/
│   ├── fr_en/
│   └── translated_ent_name/
├── embedding/
│   └── glove.6B.300d.txt
├── pkls/
│   ├── zh_en_GA_id_img_feature_dict.pkl
│   ├── ja_en_GA_id_img_feature_dict.pkl
│   └── fr_en_GA_id_img_feature_dict.pkl
├── FBDB15K/
│   └── norm/
├── FBYG15K/
│   └── norm/
└── mmkb-datasets/
    ├── FBDB15K -> ../FBDB15K/norm
    └── FBYG15K -> ../FBYG15K/norm
```

Các đường dẫn trên cần được giữ nguyên để mã nguồn CateEA có thể tìm thấy dữ liệu tương ứng.

## 3. Chạy thực nghiệm

Chạy các lệnh dưới đây từ thư mục gốc repository.

Các script được cấu hình với **1000 epochs**, learning rate `0.0005`, batch size `512`, seed `42` và CSLS `k=3`. Các tham số chi tiết được lưu trực tiếp trong từng script.

### 3.1. DBP15K

Gồm ba cặp ngôn ngữ `zh_en`, `ja_en`, `fr_en`, với tỷ lệ huấn luyện 30%.

Chạy toàn bộ các cấu hình:

```bash
# Non-iterative (w/ SF và w/o SF)
bash scripts/dbp15k/run_all_dbp15k_noniter.sh

# Iterative (w/ SF và w/o SF)
bash scripts/dbp15k/run_all_dbp15k_iter.sh
```

Mỗi lệnh thực hiện tuần tự 6 thí nghiệm.

Để chạy riêng một cấu hình, sử dụng các script trong `scripts/dbp15k/`. Ví dụ:

```bash
# Non-iterative, không sử dụng Surface Features
mkdir -p outputs/dbp15k/zh_en_noniter_woSF

bash scripts/dbp15k/myrun_dbp15k_noniter_woSF.sh \
    zh_en 0.3 outputs/dbp15k/zh_en_noniter_woSF
```

Thay `zh_en` bằng `ja_en` hoặc `fr_en` và điều chỉnh đường dẫn đầu ra khi cần.

### 3.2. MMKB

Gồm hai bộ dữ liệu `FBDB15K`, `FBYG15K`, với tỷ lệ huấn luyện 20%, 50% và 80%.

Chạy toàn bộ cấu hình:

```bash
# Non-iterative
bash scripts/mmkb/run_all_mmkb_noniter.sh

# Iterative
bash scripts/mmkb/run_all_mmkb_iter.sh
```

Mỗi lệnh thực hiện tuần tự 6 thí nghiệm.

Ví dụ chạy riêng một cấu hình:

```bash
mkdir -p outputs/mmkb/FBDB15K_noniter_20

bash scripts/mmkb/myrun_mmkb_noniter.sh \
    0 42 FBDB15K 0.2 \
    outputs/mmkb/FBDB15K_noniter_20
```

## 4. Đầu ra và logging

Các script lưu đầu ra tại:

```text
outputs/
├── dbp15k/
└── mmkb/
```

Tùy giai đoạn thực thi, các tệp có thể bao gồm:

- `train.log`: log huấn luyện và đánh giá khi sử dụng script `run_all`.
- `*.pt`: checkpoint mô hình.
- `pred.txt`, `pred_weighted.txt`: các tệp dự đoán được xuất ở epoch cuối.

Các script cũng bật logging qua **Weights & Biases (W&B)**. Đăng nhập trước khi chạy:

```bash
wandb login
```

Để tái lập nhất quán, giữ nguyên các tham số trong script, sử dụng đúng cấu trúc dữ liệu và thực thi từ thư mục gốc repository.

## 5. Nguồn mã

- **Mã nguồn gốc:** https://github.com/Melkor0007/CateEA
- **Repository tái lập:** https://github.com/keiranoluv/Reproduce_CateEA
- **Kết quả tái lập:** [WandB](https://forge.coreweave.com/wandb/keiranoluv-hcmus/cateea-reproduction?nw=nwuserkeiranoluv)

Ngoài ra các kết quả thực nghiệm, so sánh và phân tích được trình bày riêng trong báo cáo đồ án.