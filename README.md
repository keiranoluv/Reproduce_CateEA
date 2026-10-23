# CateEA - Tái lập thực nghiệm

Repository phục vụ tái lập thực nghiệm bài báo **CateEA: Enhancing Entity Alignment via Implicit Category Supervision (CateEA)**.

Mã nguồn được kế thừa từ [CateEA của tác giả](https://github.com/Melkor0007/CateEA), bổ sung script tái lập và web demo tương tác. Các bảng kết quả tái lập nằm trong `results/`; phân tích thực nghiệm được trình bày trong báo cáo đồ án.

- [Paper](https://aclanthology.org/2025.coling-main.399/) · [Mã nguồn tác giả](https://github.com/Melkor0007/CateEA)
- [Kết quả và so sánh với paper](results/comparison.md) · [Số liệu CSV](results/comparison.csv)
- [Web demo — CateEA / Match Lab](https://keiranoluv.github.io/Reproduce_CateEA/) · [Hướng dẫn demo](demo/README.md)

## 1. Phạm vi

Các script chạy **24 cấu hình CateEA thuộc Table 1–4**. Mỗi cấu hình sinh H@1, H@10, H@50, MR và MRR; không cần chạy riêng từng chỉ số.

| Bảng | Dataset | Chế độ | Số cấu hình |
|---|---|---|---:|
| Table 1 | DBP15K: ZH–EN, JA–EN, FR–EN | Non-iterative, có/không SF | 6 |
| Table 2 | DBP15K: ZH–EN, JA–EN, FR–EN | Iterative, có/không SF | 6 |
| Table 3 | FB15K–DB15K, FB15K–YAGO15K | Non-iterative, train 20%/50%/80% | 6 |
| Table 4 | FB15K–DB15K, FB15K–YAGO15K | Iterative, train 20%/50%/80% | 6 |

**SF** là surface features (tên entity); **iterative** bổ sung các cặp alignment dự đoán vào tập train. `FBDB15K` tương ứng FB15K–DB15K; `FBYG15K` tương ứng FB15K–YAGO15K.

Đây là **bốn bảng chính**, chưa phải toàn bộ thực nghiệm của paper: chưa có script tổng chạy ablation (Figure 3), khảo sát seed/category (Figure 4), đồ thị và case study ở phụ lục. Các script không chạy lại mô hình baseline trong bảng.

## 2. Cài đặt

Môi trường đã dùng: Ubuntu 24.04, Python 3.12, NVIDIA RTX 5090 32 GB, PyTorch `2.13.0+cu130`. Cần GPU NVIDIA và driver hỗ trợ bản PyTorch CUDA đã cài; code hiện mặc định dùng CUDA.

Trên Ubuntu, chuẩn bị Python headers và compiler để build `scikit-learn-extra` cho Python 3.12 (bỏ qua nếu máy đã có):

```bash
sudo apt-get update
sudo apt-get install -y python3.12-venv python3.12-dev build-essential
```

```bash
git clone https://github.com/keiranoluv/Reproduce_CateEA.git
cd Reproduce_CateEA

python3.12 -m venv cateea
source cateea/bin/activate
python -m pip install --upgrade pip
python -m pip install torch==2.13.0 \
    --index-url https://download.pytorch.org/whl/cu130
python -m pip install -r requirements-build.txt
python -m pip install --no-build-isolation -r requirements.txt

python -m pip check
python -c "import torch; print(torch.__version__, torch.version.cuda, torch.cuda.is_available())"
python src/myrun.py --help
```

Kiểm tra CUDA trong môi trường trên trả về `2.13.0+cu130 13.0 True`. Với GPU khác, chọn bản cài theo [hướng dẫn PyTorch](https://pytorch.org/get-started/locally/). Các lệnh bên dưới chạy từ root repository, sau khi kích hoạt môi trường.

`requirements.txt` ghim các thư viện runtime theo môi trường đã chạy; `pandas` được ghim cùng `seaborn`. PyTorch được cài riêng theo GPU và tự kéo các gói CUDA phụ thuộc, nên không ghim lại `nvidia-*`, `cuda-toolkit` hay `triton` trong file này. Code dùng đặc trưng ảnh có sẵn và không import `torchvision`.

`scikit-learn-extra==0.3.0` chưa có wheel Python 3.12 trên [PyPI](https://pypi.org/project/scikit-learn-extra/0.3.0/#files). `requirements-build.txt` cài NumPy/Cython/setuptools/wheel trước; `--no-build-isolation` dùng các phiên bản đó khi build extension. Giữ NumPy `1.26.4` và cài theo thứ tự trên. Các file này ghim runtime chính và công cụ build, không phải lockfile của toàn bộ dependency bắc cầu.

## 3. Dữ liệu và symlink

Tải `mmkg.zip` từ nguồn dữ liệu của [MEAformer](https://github.com/zjukg/MEAformer) ([Google Drive](https://drive.google.com/file/d/1VIWcc3KDcLcRImeSrF2AyhetBLq_gsnx/view)). Giải nén và đặt `DBP15K/`, `embedding/`, `pkls/`, `FBDB15K/`, `FBYG15K/` vào `data/`.

Các lệnh train sử dụng **vector đặc trưng ảnh có sẵn trong `.pkl`**, không cần tải ảnh JPG/PNG hay chạy pretrain/trích xuất ResNet. Paper mô tả đặc trưng từ ResNet-152 pretrained (mục 3.2.3, 4.1.3).

Code đọc graph MMKB qua `data/mmkb-datasets/`; dữ liệu giải nén nằm ở `FBDB15K/norm/` và `FBYG15K/norm/`. Tạo symlink để giữ nguyên dữ liệu nguồn. Đồng thời tạo alias `*_GA_*.pkl` vì loader hiện dùng mẫu tên này với `FBDB15K` và `FBYG15K`:

```bash
mkdir -p data/mmkb-datasets
ln -sfn ../FBDB15K/norm data/mmkb-datasets/FBDB15K
ln -sfn ../FBYG15K/norm data/mmkb-datasets/FBYG15K

ln -sfn FBDB15K_id_img_feature_dict.pkl data/pkls/FBDB15K_GA_id_img_feature_dict.pkl
ln -sfn FBYG15K_id_img_feature_dict.pkl data/pkls/FBYG15K_GA_id_img_feature_dict.pkl
```

Đích symlink được tính từ thư mục chứa link. Cấu trúc cần có:

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
├── embedding/glove.6B.300d.txt
├── pkls/
│   ├── zh_en_GA_id_img_feature_dict.pkl
│   ├── ja_en_GA_id_img_feature_dict.pkl
│   ├── fr_en_GA_id_img_feature_dict.pkl
│   ├── FBDB15K_id_img_feature_dict.pkl
│   ├── FBYG15K_id_img_feature_dict.pkl
│   ├── FBDB15K_GA_id_img_feature_dict.pkl -> FBDB15K_id_img_feature_dict.pkl
│   └── FBYG15K_GA_id_img_feature_dict.pkl -> FBYG15K_id_img_feature_dict.pkl
├── FBDB15K/norm/
├── FBYG15K/norm/
└── mmkb-datasets/
    ├── FBDB15K -> ../FBDB15K/norm
    └── FBYG15K -> ../FBYG15K/norm
```

Mỗi thư mục graph cần `ent_ids_1`, `ent_ids_2`, `triples_1`, `triples_2`, `ill_ent_ids`, `training_attrs_1`, `training_attrs_2`. DBP15K hiện vẫn nạp GloVe và tên đã dịch khi chạy không SF, nên cần chuẩn bị cả hai.

Kiểm tra đường dẫn trước khi train:

```bash
python scripts/check_data.py
```

## 4. Logging W&B

Các script bật Weights & Biases. Chọn một cách trước khi chạy:

```bash
# Đồng bộ lên tài khoản của bạn
wandb login

# Hoặc chỉ lưu W&B trên máy, không cần đăng nhập
export WANDB_MODE=offline
```

Project là `CateEA-Reproduction`. Muốn tắt W&B hoàn toàn, đặt `WANDB_MODE=disabled`.

## 5. Chạy toàn bộ hoặc từng bảng

Chạy đủ 24 cấu hình CateEA của bốn bảng chính, tuần tự trên GPU 0:

```bash
bash scripts/run_all_main.sh
```

Hoặc chạy từng nhóm, mỗi lệnh gồm 6 cấu hình:

```bash
# Table 1
bash scripts/dbp15k/run_all_dbp15k_noniter.sh

# Table 2
bash scripts/dbp15k/run_all_dbp15k_iter.sh

# Table 3
bash scripts/mmkb/run_all_mmkb_noniter.sh

# Table 4
bash scripts/mmkb/run_all_mmkb_iter.sh
```

`run_all` lưu console vào `train.log` và dừng khi một cấu hình lỗi. Chạy lại cùng cấu hình sử dụng lại thư mục đầu ra và ghi đè log/checkpoint; script không tự resume checkpoint.

## 6. Chạy một cấu hình

Một cấu hình tương ứng bộ H@1/H@10/MRR của một dataset và một thiết lập trong bảng. Thay các biến trong ví dụ để chọn ô khác.

### DBP15K — Table 1 và Table 2

`dataset`: `zh_en`, `ja_en`, `fr_en`; `sf`: `woSF`, `wSF`. Tỷ lệ train là 30%.

```bash
set -o pipefail
dataset=zh_en
sf=woSF

# Table 1: non-iterative (đối số: dataset, rate, output_dir)
out="outputs/dbp15k/${dataset}_noniter_${sf}"
mkdir -p "$out"
bash "scripts/dbp15k/myrun_dbp15k_noniter_${sf}.sh" \
    "$dataset" 0.3 "$out" 2>&1 | tee "$out/train.log"

# Table 2: iterative (đối số: dataset, output_dir)
out="outputs/dbp15k/${dataset}_iter_${sf}"
mkdir -p "$out"
bash "scripts/dbp15k/myrun_dbp15k_iter_${sf}.sh" \
    "$dataset" "$out" 2>&1 | tee "$out/train.log"
```

Script DBP15K chọn GPU 0 và seed 42 trực tiếp trong file. Để đổi GPU, sửa `CUDA_VISIBLE_DEVICES=0` trong script tương ứng.

### MMKB — Table 3 và Table 4

`dataset`: `FBDB15K`, `FBYG15K`; `rate`: `0.2`, `0.5`, `0.8`; `mode`: `noniter`, `iter`. MMKB không dùng SF.

```bash
set -o pipefail
gpu=0
seed=42
dataset=FBDB15K
rate=0.2
mode=noniter  # Table 3; đổi thành iter để chạy Table 4

rate_pct="${rate#0.}0"
out="outputs/mmkb/${dataset}_${mode}_${rate_pct}"
mkdir -p "$out"
# Đối số: gpu, seed, dataset, rate, output_dir
bash "scripts/mmkb/myrun_mmkb_${mode}.sh" \
    "$gpu" "$seed" "$dataset" "$rate" "$out" 2>&1 | tee "$out/train.log"
```

## 7. Cấu hình và đầu ra

Các script dùng 1.000 epoch, AdamW, learning rate `0.0005`, batch size `512`, GAT hidden size `300`, `tau=0.1`, `tau2=0.4`, CSLS `k=3`; đánh giá mỗi 50 epoch. Iterative bắt đầu tìm cặp từ epoch 500, mỗi 5 epoch.

Cấu hình repo hiện dùng **5 category** trong `src/myrun.py`; embedding image/attribute là **400 ở DBP15K**, **300 ở MMKB**. Paper ghi 10 category và embedding các modality ngoài GAT là 400. Các giá trị trong repo được giữ nguyên theo những lượt chạy đã lưu. [Nguồn: paper, mục 4.1.3](https://aclanthology.org/2025.coling-main.399.pdf).

```text
outputs/
├── dbp15k/<dataset>_<noniter|iter>_<woSF|wSF>/
└── mmkb/<dataset>_<noniter|iter>_<20|50|80>/
```

| File | Nội dung |
|---|---|
| `train.log` | Console khi dùng `run_all` hoặc `tee` như ví dụ |
| `cateea_checkpoint_best.pt` | Checkpoint có H@1 trung bình hai chiều cao nhất của `test` |
| `cateea_checkpoint_latest.pt` | Checkpoint ở lần đánh giá cuối |
| `pred.txt` | Dự đoán `test` tại epoch cuối |
| `pred_weighted.txt` | Dự đoán có category weighting tại epoch cuối |

`test` đánh giá thông thường; `weighted_test` thêm category weighting. Cả hai được đánh giá trong cùng lượt train. Checkpoint tốt nhất được chọn bằng **test H@1**, không phải weighted H@1; dự đoán epoch cuối có thể khác checkpoint tốt nhất. Code chạy đủ số epoch, không tự early-stop.

Kết quả cũ ở `outputs/table1`–`table4`, khác đường dẫn script hiện tại. Dữ liệu, checkpoint, log và W&B không được commit vào Git.

## 8. Tổng hợp kết quả

Số liệu nằm ở [results/comparison.md](results/comparison.md), tách khỏi hướng dẫn này. CSV chứa cả best/latest và chỉ số từng chiều.

Tạo lại bảng từ các checkpoint cũ có trên máy:

```bash
python scripts/summarize_results.py --layout tables
```

Sau khi chạy đủ các script hiện tại:

```bash
python scripts/summarize_results.py --layout datasets
```

Hai lệnh cập nhật `results/comparison.md` và `results/comparison.csv`; không train lại. Script báo lỗi nếu thiếu checkpoint của bất kỳ cấu hình nào.

## 9. Web demo — CateEA / Match Lab

**Demo:** https://keiranoluv.github.io/Reproduce_CateEA/

Demo tương tác gồm 48 cặp test JA–EN/ZH–EN, 6 câu hỏi và case **Hàm Nghi – Tự Đức**
trong Appendix A.5 / Table 6. Có thể xem riêng kết quả paper và dự đoán tái lập
thật từ các file đã lưu. Không cần checkpoint, GPU hoặc backend.

```bash
python -m http.server 4173 --directory demo
```

Mở http://localhost:4173. [Hướng dẫn, nguồn dữ liệu và giới hạn demo](demo/README.md).
GitHub Actions kiểm tra rồi deploy thư mục `demo/` lên Pages khi push lên `main`,
tương tự DSoM.

## 10. Nguồn

- [CateEA — COLING 2025](https://aclanthology.org/2025.coling-main.399/)
- [Mã nguồn CateEA](https://github.com/Melkor0007/CateEA)
- [Repository tái lập](https://github.com/keiranoluv/Reproduce_CateEA)
- [W&B các lượt chạy đã lưu](https://forge.coreweave.com/wandb/keiranoluv-hcmus/cateea-reproduction?nw=nwuserkeiranoluv)
