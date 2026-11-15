# CateEA: Kết quả tái lập và đối chiếu paper

Nguồn tham chiếu: các dòng **CateEA** trong Table 1-4 của [paper COLING 2025](https://aclanthology.org/2025.coling-main.399.pdf).
Chỉ tổng hợp số liệu và chênh lệch; chưa đưa ra nhận xét hay giải thích nguyên nhân.

## Quy ước

- Mỗi ô ba số có thứ tự **H@1 / H@10 / MRR**; giá trị nằm trong [0, 1].
- `test` và `weighted` đều lấy trung bình hai chiều l2r/r2l do code lưu trong checkpoint.
- `weighted` là `weighted_test`, có category weighting; không gộp hai cách đánh giá.
- Các bảng dưới lấy `cateea_checkpoint_best.pt`: chọn theo **test H@1 trung bình** cao nhất trong các lần đánh giá, không chọn riêng theo weighted hay từng metric.
- Epoch là chỉ số bắt đầu từ 0; epoch 999 tương ứng hoàn tất 1.000 epoch.
- Δ = (tái lập − paper) × 100, đơn vị điểm trên thang 0-100 (pp). Tính trước khi làm tròn; paper có ba chữ số thập phân.
- Đây là kết quả một seed cho mỗi cấu hình, không phải trung bình nhiều seed.
- Quy ước trung bình hai chiều và chọn checkpoint trên là của repo; không giả định paper dùng cùng quy tắc chọn epoch/chiều đánh giá.

## Cấu hình đọc từ checkpoint

| Bảng | Số run | Seed | Cluster (log) | Đầu ra classifier | Image dim | Attribute dim | Epoch cuối |
|---|---:|---|---|---|---|---|---|
| Table 1 | 6 | 42 | 5 | 6 | 400 | 400 | 999 |
| Table 2 | 6 | 42 | 5 | 6 | 400 | 400 | 999 |
| Table 3 | 6 | 42 | 5 | 6 | 300 | 300 | 999 |
| Table 4 | 6 | 42 | 5 | 6 | 300 | 300 | 999 |

Số cluster được đọc từ log cùng thư mục checkpoint; `unrecorded` nghĩa là không có log ghi số cluster. Đầu ra classifier được đọc từ `fc2.weight`. `ImprovedClassifier` trong repo tạo `num_classes + 1` đầu ra, nên 5 cluster tương ứng 6 đầu ra; hai đại lượng được ghi riêng.

Paper mục 4.1.3 ghi 10 category và embedding ngoài GAT là 400; bảng trên ghi cấu hình thực tế từ checkpoint/log.

## Table 1

| Cấu hình | Epoch best | Paper | Tái lập test | Δ test (pp) | Tái lập weighted | Δ weighted (pp) |
|---|---:|---|---|---|---|---|
| `zh_en_noniter_woSF` | 649 | 0.776 / 0.955 / 0.839 | 0.7379 / 0.9484 / 0.8127 | -3.81 / -0.66 / -2.63 | 0.7375 / 0.9482 / 0.8127 | -3.85 / -0.68 / -2.63 |
| `ja_en_noniter_woSF` | 849 | 0.772 / 0.963 / 0.840 | 0.7606 / 0.9619 / 0.8334 | -1.14 / -0.11 / -0.66 | 0.7602 / 0.9619 / 0.8334 | -1.18 / -0.11 / -0.66 |
| `fr_en_noniter_woSF` | 899 | 0.786 / 0.972 / 0.855 | 0.7824 / 0.9724 / 0.8528 | -0.36 / +0.04 / -0.22 | 0.7814 / 0.9725 / 0.8522 | -0.46 / +0.05 / -0.28 |
| `zh_en_noniter_wSF` | 849 | 0.945 / 0.993 / 0.964 | 0.9414 / 0.9924 / 0.9610 | -0.36 / -0.06 / -0.30 | 0.9420 / 0.9927 / 0.9613 | -0.30 / -0.03 / -0.27 |
| `ja_en_noniter_wSF` | 749 | 0.972 / 0.998 / 0.987 | 0.9715 / 0.9985 / 0.9826 | -0.05 / +0.05 / -0.44 | 0.9713 / 0.9985 / 0.9825 | -0.07 / +0.05 / -0.45 |
| `fr_en_noniter_wSF` | 599 | 0.991 / 1.000 / 0.995 | 0.9901 / 0.9999 / 0.9943 | -0.09 / -0.01 / -0.07 | 0.9901 / 0.9998 / 0.9943 | -0.09 / -0.02 / -0.07 |

## Table 2

| Cấu hình | Epoch best | Paper | Tái lập test | Δ test (pp) | Tái lập weighted | Δ weighted (pp) |
|---|---:|---|---|---|---|---|
| `zh_en_iter_woSF` | 899 | 0.839 / 0.971 / 0.887 | 0.7960 / 0.9573 / 0.8551 | -4.30 / -1.37 / -3.19 | 0.7958 / 0.9569 / 0.8548 | -4.32 / -1.41 / -3.22 |
| `ja_en_iter_woSF` | 999 | 0.851 / 0.978 / 0.899 | 0.8264 / 0.9708 / 0.8810 | -2.46 / -0.72 / -1.80 | 0.8268 / 0.9707 / 0.8811 | -2.42 / -0.73 / -1.79 |
| `fr_en_iter_woSF` | 949 | 0.862 / 0.985 / 0.908 | 0.8475 / 0.9805 / 0.8976 | -1.45 / -0.45 / -1.04 | 0.8477 / 0.9800 / 0.8978 | -1.43 / -0.50 / -1.02 |
| `zh_en_iter_wSF` | 999 | 0.974 / 0.998 / 0.984 | 0.9723 / 0.9971 / 0.9822 | -0.17 / -0.09 / -0.18 | 0.9724 / 0.9971 / 0.9822 | -0.16 / -0.09 / -0.18 |
| `ja_en_iter_wSF` | 849 | 0.992 / 0.999 / 0.993 | 0.9883 / 0.9997 / 0.9931 | -0.37 / +0.07 / +0.01 | 0.9884 / 0.9997 / 0.9931 | -0.36 / +0.07 / +0.01 |
| `fr_en_iter_wSF` | 749 | 0.997 / 1.000 / 0.998 | 0.9965 / 1.0000 / 0.9981 | -0.05 / +0.00 / +0.01 | 0.9964 / 1.0000 / 0.9981 | -0.06 / +0.00 / +0.01 |

## Table 3

| Cấu hình | Epoch best | Paper | Tái lập test | Δ test (pp) | Tái lập weighted | Δ weighted (pp) |
|---|---:|---|---|---|---|---|
| `FBDB15K_noniter_20` | 849 | 0.493 / 0.759 / 0.584 | 0.4972 / 0.7659 / 0.5901 | +0.42 / +0.69 / +0.61 | 0.4888 / 0.7565 / 0.5818 | -0.42 / -0.25 / -0.22 |
| `FBDB15K_noniter_50` | 899 | 0.674 / 0.874 / 0.745 | 0.6658 / 0.8682 / 0.7380 | -0.82 / -0.58 / -0.70 | 0.6601 / 0.8616 / 0.7320 | -1.39 / -1.24 / -1.30 |
| `FBDB15K_noniter_80` | 849 | 0.799 / 0.933 / 0.849 | 0.7720 / 0.9164 / 0.8260 | -2.70 / -1.66 / -2.30 | 0.7716 / 0.9161 / 0.8252 | -2.74 / -1.69 / -2.38 |
| `FBYG15K_noniter_20` | 749 | 0.402 / 0.675 / 0.497 | 0.3937 / 0.6694 / 0.4887 | -0.83 / -0.56 / -0.83 | 0.3884 / 0.6626 / 0.4822 | -1.36 / -1.24 / -1.48 |
| `FBYG15K_noniter_50` | 399 | 0.608 / 0.829 / 0.686 | 0.6141 / 0.8295 / 0.6904 | +0.61 / +0.05 / +0.44 | 0.6019 / 0.8183 / 0.6784 | -0.61 / -1.07 / -0.76 |
| `FBYG15K_noniter_80` | 499 | 0.742 / 0.912 / 0.805 | 0.7440 / 0.9118 / 0.8058 | +0.20 / -0.02 / +0.08 | 0.7422 / 0.9082 / 0.8036 | +0.02 / -0.38 / -0.14 |

## Table 4

| Cấu hình | Epoch best | Paper | Tái lập test | Δ test (pp) | Tái lập weighted | Δ weighted (pp) |
|---|---:|---|---|---|---|---|
| `FBDB15K_iter_20` | 949 | 0.599 / 0.822 / 0.675 | 0.6238 / 0.8260 / 0.6951 | +2.48 / +0.40 / +2.01 | 0.6231 / 0.8245 / 0.6939 | +2.41 / +0.25 / +1.89 |
| `FBDB15K_iter_50` | 999 | 0.705 / 0.882 / 0.764 | 0.7062 / 0.8703 / 0.7644 | +0.12 / -1.17 / +0.04 | 0.7055 / 0.8693 / 0.7635 | +0.05 / -1.27 / -0.05 |
| `FBDB15K_iter_80` | 749 | 0.806 / 0.934 / 0.853 | 0.8018 / 0.9269 / 0.8469 | -0.42 / -0.71 / -0.61 | 0.8018 / 0.9255 / 0.8465 | -0.42 / -0.85 / -0.65 |
| `FBYG15K_iter_20` | 899 | 0.518 / 0.745 / 0.594 | 0.5234 / 0.7397 / 0.5979 | +0.54 / -0.53 / +0.39 | 0.5217 / 0.7346 / 0.5958 | +0.37 / -1.04 / +0.18 |
| `FBYG15K_iter_50` | 799 | 0.640 / 0.844 / 0.708 | 0.6478 / 0.8340 / 0.7128 | +0.78 / -1.00 / +0.48 | 0.6443 / 0.8253 / 0.7081 | +0.43 / -1.87 / +0.01 |
| `FBYG15K_iter_80` | 749 | 0.746 / 0.915 / 0.807 | 0.7544 / 0.9009 / 0.8092 | +0.84 / -1.41 / +0.22 | 0.7471 / 0.8933 / 0.7998 | +0.11 / -2.17 / -0.72 |

## Dữ liệu và cách tạo lại

[comparison.csv](comparison.csv) chứa 48 dòng: 24 cấu hình × best/latest, kèm đường dẫn checkpoint, chỉ số hai chiều, trung bình, giá trị paper và Δ. `latest` là lần đánh giá cuối, không phải best.

Các bảng lấy trực tiếp giá trị trong checkpoint, không lấy số đã làm tròn từ console hoặc giá trị cực đại độc lập của từng metric trên W&B. Không sử dụng các log chỉ chứa `MOCK PYTHON`.

Các file `.pt` không được commit; CSV và bảng này là bản tổng hợp để đọc khi chưa tải checkpoint. Chỉ nạp checkpoint có nguồn tin cậy.

```bash
# Kết quả cũ: outputs/table1 ... outputs/table4
python scripts/summarize_results.py --layout tables

# Kết quả từ script hiện tại: outputs/dbp15k và outputs/mmkb
python scripts/summarize_results.py --layout datasets
```

Các lệnh tạo lại cả Markdown và CSV; không train mô hình.
