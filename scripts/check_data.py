"""Check the file paths used by the five supported datasets, without training."""

from pathlib import Path
import sys


def main():
    root = Path(__file__).resolve().parents[1]
    data = root / "data"
    required = [data / "embedding/glove.6B.300d.txt"]
    graph_files = (
        "ent_ids_1", "ent_ids_2", "triples_1", "triples_2", "ill_ent_ids",
        "training_attrs_1", "training_attrs_2",
    )
    for dataset in ("zh_en", "ja_en", "fr_en"):
        required.extend(data / "DBP15K" / dataset / name for name in graph_files)
        required.append(data / "DBP15K/translated_ent_name" / f"dbp_{dataset}.json")
        required.append(data / "pkls" / f"{dataset}_GA_id_img_feature_dict.pkl")
    for dataset in ("FBDB15K", "FBYG15K"):
        required.extend(data / "mmkb-datasets" / dataset / name for name in graph_files)
        required.append(data / "pkls" / f"{dataset}_GA_id_img_feature_dict.pkl")

    missing = [path for path in required if not path.is_file() or path.stat().st_size == 0]
    if missing:
        for path in missing:
            print(f"MISSING/EMPTY: {path.relative_to(root)}", file=sys.stderr)
        print("Xem README, mục dữ liệu và symlink.", file=sys.stderr)
        return 1
    print(f"PASS: {len(required)} đường dẫn tồn tại và không rỗng (gồm đích symlink).")
    print("Kiểm tra đường dẫn, không kiểm tra nội dung/ID trong dữ liệu.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
