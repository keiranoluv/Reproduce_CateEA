"""Compare all 24 CateEA configurations with Tables 1-4, without training.

Only load locally trusted checkpoints: torch.load(weights_only=False) reads the
metadata and NumPy scalars saved by this repository's training code.
"""

import argparse
import csv
import re
from pathlib import Path

import torch


ROOT = Path(__file__).resolve().parents[1]
PAPER_URL = "https://aclanthology.org/2025.coling-main.399.pdf"
METRICS = ("h1", "h10", "mrr")

# CateEA rows transcribed from the published PDF, Tables 1-4.
# DBP15K order: woSF then wSF; within each: zh_en, ja_en, fr_en.
# MMKB order: FBDB15K then FBYG15K; within each: 20%, 50%, 80%.
PAPER = {
    1: [(0.776, 0.955, 0.839), (0.772, 0.963, 0.840), (0.786, 0.972, 0.855),
        (0.945, 0.993, 0.964), (0.972, 0.998, 0.987), (0.991, 1.000, 0.995)],
    2: [(0.839, 0.971, 0.887), (0.851, 0.978, 0.899), (0.862, 0.985, 0.908),
        (0.974, 0.998, 0.984), (0.992, 0.999, 0.993), (0.997, 1.000, 0.998)],
    3: [(0.493, 0.759, 0.584), (0.674, 0.874, 0.745), (0.799, 0.933, 0.849),
        (0.402, 0.675, 0.497), (0.608, 0.829, 0.686), (0.742, 0.912, 0.805)],
    4: [(0.599, 0.822, 0.675), (0.705, 0.882, 0.764), (0.806, 0.934, 0.853),
        (0.518, 0.745, 0.594), (0.640, 0.844, 0.708), (0.746, 0.915, 0.807)],
}


def configurations():
    for table in range(1, 5):
        mode = "noniter" if table in (1, 3) else "iter"
        if table <= 2:
            names = [f"{dataset}_{mode}_{sf}" for sf in ("woSF", "wSF")
                     for dataset in ("zh_en", "ja_en", "fr_en")]
        else:
            names = [f"{dataset}_{mode}_{rate}" for dataset in ("FBDB15K", "FBYG15K")
                     for rate in (20, 50, 80)]
        for name, paper in zip(names, PAPER[table]):
            yield table, name, paper


def collect(outputs, layout):
    specs = []
    for table, name, paper in configurations():
        folder = f"table{table}" if layout == "tables" else ("dbp15k" if table <= 2 else "mmkb")
        for kind in ("best", "latest"):
            path = outputs / folder / name / f"cateea_checkpoint_{kind}.pt"
            specs.append((table, name, paper, kind, path))
    missing = [str(path) for *_, path in specs if not path.is_file()]
    if missing:
        raise FileNotFoundError("Thiếu checkpoint:\n" + "\n".join(missing))

    rows = []
    cluster_counts = {}
    for table, name, paper, kind, path in specs:
        if path.parent not in cluster_counts:
            counts = set()
            for log in path.parent.glob("*.log"):
                counts.update(int(value) for value in re.findall(
                    r"Total clusters \(including noise\): (\d+)",
                    log.read_text(encoding="utf-8", errors="replace"),
                ))
            cluster_counts[path.parent] = ", ".join(map(str, sorted(counts))) or "unrecorded"
        checkpoint = torch.load(path, map_location="cpu", weights_only=False)
        args = checkpoint["args"]
        row = {
            "table": table, "configuration": name, "checkpoint": kind,
            "epoch": checkpoint["epoch"], "seed": args["seed"],
            "num_clusters_log": cluster_counts[path.parent],
            "classifier_output_dim": int(checkpoint["classifier"]["fc2.weight"].shape[0]),
            "img_dim": args["img_dim"], "attr_dim": args["attr_dim"],
            "source_checkpoint": str(path),
        }
        for metric, value in zip(METRICS, paper):
            row[f"paper_{metric}"] = value
        for label, key in (("test", "test"), ("weighted", "weighted_test")):
            metrics = checkpoint["metrics"][key]
            for metric, value in metrics.items():
                row[f"{label}_{metric}"] = float(value)
            for metric, reference in zip(METRICS, paper):
                value = row[f"{label}_{metric}_avg"]
                if not 0 <= value <= 1:
                    raise ValueError(f"Invalid metric in {path}: {metric}={value}")
                row[f"{label}_{metric}_delta_pp"] = (value - reference) * 100
        # Keep provenance portable when files live under the repository root.
        try:
            row["source_checkpoint"] = str(path.relative_to(ROOT))
        except ValueError:
            pass
        rows.append(row)
        del checkpoint
    return rows


def triple(row, prefix, suffix="", delta=False):
    keys = [f"{prefix}_{metric}{suffix}" for metric in METRICS]
    fmt = "+.2f" if delta else (".3f" if prefix == "paper" else ".4f")
    return " / ".join(format(row[key], fmt) for key in keys)


def write_report(rows, output_dir):
    best = [row for row in rows if row["checkpoint"] == "best"]
    latest = [row for row in rows if row["checkpoint"] == "latest"]
    lines = [
        "# CateEA: Kết quả tái lập và đối chiếu paper", "",
        f"Nguồn tham chiếu: các dòng **CateEA** trong Table 1-4 của [paper COLING 2025]({PAPER_URL}).",
        "Chỉ tổng hợp số liệu và chênh lệch; chưa đưa ra nhận xét hay giải thích nguyên nhân.", "",
        "## Quy ước", "",
        "- Mỗi ô ba số có thứ tự **H@1 / H@10 / MRR**; giá trị nằm trong [0, 1].",
        "- `test` và `weighted` đều lấy trung bình hai chiều l2r/r2l do code lưu trong checkpoint.",
        "- `weighted` là `weighted_test`, có category weighting; không gộp hai cách đánh giá.",
        "- Các bảng dưới lấy `cateea_checkpoint_best.pt`: chọn theo **test H@1 trung bình** cao nhất trong các lần đánh giá, không chọn riêng theo weighted hay từng metric.",
        "- Epoch là chỉ số bắt đầu từ 0; epoch 999 tương ứng hoàn tất 1.000 epoch.",
        "- Δ = (tái lập − paper) × 100, đơn vị điểm trên thang 0-100 (pp). Tính trước khi làm tròn; paper có ba chữ số thập phân.",
        "- Đây là kết quả một seed cho mỗi cấu hình, không phải trung bình nhiều seed.",
        "- Quy ước trung bình hai chiều và chọn checkpoint trên là của repo; không giả định paper dùng cùng quy tắc chọn epoch/chiều đánh giá.", "",
        "## Cấu hình đọc từ checkpoint", "",
        "| Bảng | Số run | Seed | Cluster (log) | Đầu ra classifier | Image dim | Attribute dim | Epoch cuối |",
        "|---|---:|---|---|---|---|---|---|",
    ]
    for table in range(1, 5):
        group = [row for row in best if row["table"] == table]
        values = [", ".join(str(v) for v in sorted({row[key] for row in group}))
                  for key in ("seed", "num_clusters_log", "classifier_output_dim", "img_dim", "attr_dim")]
        epochs = ", ".join(str(v) for v in sorted({row["epoch"] for row in latest if row["table"] == table}))
        lines.append(f"| Table {table} | {len(group)} | " + " | ".join(values) + f" | {epochs} |")
    lines += ["", "Số cluster được đọc từ log cùng thư mục checkpoint; `unrecorded` nghĩa là không có log ghi số cluster. Đầu ra classifier được đọc từ `fc2.weight`. `ImprovedClassifier` trong repo tạo `num_classes + 1` đầu ra, nên 5 cluster tương ứng 6 đầu ra; hai đại lượng được ghi riêng.",
              "", "Paper mục 4.1.3 ghi 10 category và embedding ngoài GAT là 400; bảng trên ghi cấu hình thực tế từ checkpoint/log.", ""]
    for table in range(1, 5):
        lines += [f"## Table {table}", "",
                  "| Cấu hình | Epoch best | Paper | Tái lập test | Δ test (pp) | Tái lập weighted | Δ weighted (pp) |",
                  "|---|---:|---|---|---|---|---|"]
        for row in best:
            if row["table"] != table:
                continue
            lines.append(f"| `{row['configuration']}` | {row['epoch']} | " + " | ".join([
                triple(row, "paper"), triple(row, "test", "_avg"),
                triple(row, "test", "_delta_pp", delta=True),
                triple(row, "weighted", "_avg"),
                triple(row, "weighted", "_delta_pp", delta=True),
            ]) + " |")
        lines.append("")
    lines += ["## Dữ liệu và cách tạo lại", "",
              "[comparison.csv](comparison.csv) chứa 48 dòng: 24 cấu hình × best/latest, kèm đường dẫn checkpoint, chỉ số hai chiều, trung bình, giá trị paper và Δ. `latest` là lần đánh giá cuối, không phải best.", "",
              "Các bảng lấy trực tiếp giá trị trong checkpoint, không lấy số đã làm tròn từ console hoặc giá trị cực đại độc lập của từng metric trên W&B. Không sử dụng các log chỉ chứa `MOCK PYTHON`.", "",
              "Các file `.pt` không được commit; CSV và bảng này là bản tổng hợp để đọc khi chưa tải checkpoint. Chỉ nạp checkpoint có nguồn tin cậy.", "",
              "```bash", "# Kết quả cũ: outputs/table1 ... outputs/table4",
              "python scripts/summarize_results.py --layout tables", "",
              "# Kết quả từ script hiện tại: outputs/dbp15k và outputs/mmkb",
              "python scripts/summarize_results.py --layout datasets", "```", "",
              "Các lệnh tạo lại cả Markdown và CSV; không train mô hình.", ""]
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "comparison.md").write_text("\n".join(lines), encoding="utf-8")
    # All rows have the same metric schema; preserve checkpoint precision in CSV.
    fields = list(rows[0])
    if any(set(row) != set(fields) for row in rows):
        raise ValueError("Checkpoint metric schemas differ; cannot write a consistent CSV")
    with (output_dir / "comparison.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--layout", choices=("tables", "datasets"), default="tables")
    parser.add_argument("--outputs-root", type=Path, default=ROOT / "outputs")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "results")
    args = parser.parse_args()
    rows = collect(args.outputs_root.resolve(), args.layout)
    write_report(rows, args.output_dir.resolve())
    print(f"Đã tổng hợp {len(rows) // 2} cấu hình, {len(rows)} checkpoint vào {args.output_dir}")


if __name__ == "__main__":
    main()
