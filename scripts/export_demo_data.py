#!/usr/bin/env python3
"""Export a small, auditable static demo from existing predictions; no inference."""

import argparse
import csv
import hashlib
import json
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
PAPER = "https://aclanthology.org/2025.coling-main.399.pdf#page=12"
CONFIGS = {
    "noniter_woSF": "Không lặp · Không dùng tên",
    "noniter_wSF": "Không lặp · Có dùng tên",
    "iter_woSF": "Có lặp · Không dùng tên",
    "iter_wSF": "Có lặp · Có dùng tên",
}
PAPER_CASES = [
    (176, "Slovenian_PrvaLiga", "Premier_League_of_Bosnia_and_Herzegovina"),
    (893, "Hachisuka_Narihiro", "Masahiro_Chono"),
    (22753, "Sone_Arasuke", "Inukai_Tsuyoshi"),
    (8089, "Circuit_de_Monaco", "Autodromo_Enzo_e_Dino_Ferrari"),
    (25225, "&_(Ayumi_Hamasaki_EP)", "A_Complete:_All_Singles"),
    (8853, "Hàm_Nghi", "Tự_Đức"),
    (529, "2010_Winter_Olympics", "2008_Summer_Olympics"),
]
SELECTIONS = {
    "ja_en": [
        "Hàm_Nghi", "Tự_Đức", "Slovenian_PrvaLiga", "Hachisuka_Narihiro",
        "Sone_Arasuke", "Circuit_de_Monaco", "&_(Ayumi_Hamasaki_EP)",
        "2010_Winter_Olympics", "Albert_Einstein", "Ho_Chi_Minh_City",
        "Hanoi", "Japan", "China", "France", "London", "Berlin",
        "William_Shakespeare", "Nelson_Mandela", "The_Beatles", "Microsoft",
        "Lua_(programming_language)", "Smalltalk", "The_Black_Eyed_Peas",
        "Ticket_to_Ride",
    ],
    "zh_en": [
        "Hàm_Nghi", "Tự_Đức", "Paris", "Tokyo", "Kyoto", "Albert_Einstein",
        "Hanoi", "Ho_Chi_Minh_City", "London", "Berlin", "Japan", "China",
        "Napoleon", "Mahatma_Gandhi", "Michael_Jackson", "The_Beatles",
        "Apple_Inc.", "Microsoft", "2010_Winter_Olympics", "Slovenian_PrvaLiga",
        "IPad_Mini_3", "Kara_Hui", "Steve_Jobs", "European_Central_Bank",
    ],
}


def label(uri):
    return unquote(uri.rsplit("/", 1)[-1]).replace("_", " ")


def export(root, destination):
    tracked = {}

    def read_lines(path):
        relative = str(path.relative_to(root))
        raw = path.read_bytes()
        tracked[relative] = {"sha256": hashlib.sha256(raw).hexdigest(),
                             "bytes": len(raw), "lines": len(raw.splitlines())}
        return raw.decode("utf-8-sig").splitlines()

    result = {"schemaVersion": 1, "paperUrl": PAPER,
              "configurations": CONFIGS, "datasets": [], "entities": {},
              "paperCases": [], "metrics": [], "quizzes": []}
    entities = result["entities"]
    for lang, desired in SELECTIONS.items():
        folder = root / "data" / "DBP15K" / lang
        names, sides, name_sources = {}, {}, {}
        for side in (1, 2):
            path = folder / f"ent_ids_{side}"
            for line_number, line in enumerate(read_lines(path), 1):
                entity_id, uri = line.split("\t", 1)
                names[entity_id], sides[entity_id] = uri, side
                name_sources[entity_id] = {"path": str(path.relative_to(root)), "line": line_number}

        def key(entity_id):
            return f"{lang}:{entity_id}"

        predictions = {}
        candidate_count = None
        for config in CONFIGS:
            table = "table2" if config.startswith("iter_") else "table1"
            run = root / "outputs" / table / f"{lang}_{config}"
            predictions[config] = {}
            for mode, filename in (("test", "pred.txt"), ("weighted", "pred_weighted.txt")):
                path = run / filename
                rows = list(csv.DictReader(read_lines(path)))
                candidate_count = len(rows)
                indexed = {}
                for line_number, row in enumerate(rows, 2):
                    row = {k: int(v) for k, v in row.items()}
                    indexed[str(row["query_id"])] = {
                        "rank": row["rank"] + 1,
                        "top3": [key(str(row[f"ret{i}"])) for i in (1, 2, 3)],
                        "groundTruth": key(str(row["gt_id"])),
                        "source": {"path": str(path.relative_to(root)), "line": line_number},
                    }
                predictions[config][mode] = indexed

        reference = predictions["noniter_woSF"]["test"]
        by_target = {names[row["groundTruth"].split(":")[1]].rsplit("/", 1)[-1]: query
                     for query, row in reference.items()}
        missing = set(desired) - set(by_target)
        if missing:
            raise ValueError(f"Missing selected test queries for {lang}: {sorted(missing)}")
        pairs, required = [], set()
        alignment_path = folder / "ill_ent_ids"
        alignments = {tuple(line.split("\t")): i for i, line in enumerate(read_lines(alignment_path), 1)}
        for target_name in desired:
            query = by_target[target_name]
            target_key = reference[query]["groundTruth"]
            target_id = target_key.split(":")[1]
            assert (query, target_id) in alignments
            row = {"id": key(query), "source": key(query), "target": target_key,
                   "title": label(names[target_id]), "predictions": {},
                   "alignmentSource": {"path": str(alignment_path.relative_to(root)),
                                       "line": alignments[(query, target_id)]}}
            required.update((query, target_id))
            for config, modes in predictions.items():
                row["predictions"][config] = {mode: index[query] for mode, index in modes.items()}
                for prediction in row["predictions"][config].values():
                    assert prediction["groundTruth"] == target_key
                    required.update(k.split(":")[1] for k in prediction["top3"])
            pairs.append(row)

        graph = {entity_id: [] for entity_id in required}
        for side in (1, 2):
            path = folder / f"triples_{side}"
            for line_number, line in enumerate(read_lines(path), 1):
                head, relation, tail = line.split("\t")
                source = {"path": str(path.relative_to(root)), "line": line_number}
                if head in graph:
                    graph[head].append({"entity": key(tail), "relation": int(relation),
                                        "direction": "out", "source": source})
                if tail in graph:
                    graph[tail].append({"entity": key(head), "relation": int(relation),
                                        "direction": "in", "source": source})
        attrs = {}
        uri_to_id = {uri: entity_id for entity_id, uri in names.items()}
        for side in (1, 2):
            path = folder / f"training_attrs_{side}"
            for line_number, line in enumerate(read_lines(path), 1):
                uri, *properties = line.split("\t")
                entity_id = uri_to_id.get(uri)
                if entity_id in required:
                    attrs[entity_id] = {"properties": properties[:8], "total": len(properties),
                                        "source": {"path": str(path.relative_to(root)), "line": line_number}}

        neighbor_ids = set()
        for entity_id, edges in graph.items():
            # Distinct neighbors make the small graph readable; keep exact source triples.
            chosen, seen = [], set()
            for edge in sorted(edges, key=lambda e: (e["direction"] != "out", e["source"]["line"])):
                if edge["entity"] not in seen and edge["entity"] != key(entity_id):
                    seen.add(edge["entity"])
                    chosen.append(edge)
                if len(chosen) == 4:
                    break
            graph[entity_id] = chosen
            neighbor_ids.update(e["entity"].split(":")[1] for e in chosen)
        for entity_id in sorted(required | neighbor_ids, key=int):
            entities[key(entity_id)] = {
                "id": key(entity_id), "numericId": int(entity_id),
                "label": label(names[entity_id]), "uri": names[entity_id],
                "side": sides[entity_id], "dataset": lang,
                "source": name_sources[entity_id], "neighbors": graph.get(entity_id, []),
                "attributes": attrs.get(entity_id, {"properties": [], "total": 0}),
            }
        result["datasets"].append({"id": lang, "label": "JA–EN" if lang == "ja_en" else "ZH–EN",
                                   "sourceLanguage": "Nhật" if lang == "ja_en" else "Trung",
                                   "candidateCount": candidate_count, "pairs": pairs})

    for source_id, target, without in PAPER_CASES:
        result["paperCases"].append({"sourceId": source_id, "source": f"ja_en:{source_id}",
                                     "target": target.replace("_", " "),
                                     "withICS": target.replace("_", " "),
                                     "withoutICS": without.replace("_", " "),
                                     "url": PAPER, "table": 6})
    csv_path = root / "demo" / "data" / "reproduction-metrics.csv"
    for row in csv.DictReader(read_lines(csv_path)):
        result["metrics"].append({k: row[k] for k in (
            "table", "configuration", "checkpoint", "epoch", "seed", "paper_h1", "paper_h10",
            "paper_mrr", "test_h1_avg", "test_h10_avg", "test_mrr_avg", "weighted_h1_avg",
            "weighted_h10_avg", "weighted_mrr_avg")})
    result["quizzes"] = [
        {"pair": "ja_en:8853", "title": "Hai vị vua, hai danh tính", "hint": "咸宜帝 là tên tiếng Nhật của một vị vua triều Nguyễn. Cùng triều đại chưa đủ để xác định cùng người.", "extra": "Tự Đức"},
        {"pair": "zh_en:9867", "title": "Một thành phố, hai cách gọi", "hint": "Tìm cùng một thành phố qua tên gốc và ngữ cảnh đồ thị."},
        {"pair": "ja_en:4957", "title": "Nhận ra một nhà khoa học", "hint": "Các ứng viên đều có thể là người nổi tiếng. Hãy đối chiếu danh tính cụ thể."},
        {"pair": "ja_en:176", "title": "Cùng bóng đá, khác giải đấu", "hint": "Đây là một case trong Table 6. Tên nguồn 1.SNL chỉ một giải vô địch quốc gia."},
        {"pair": "ja_en:8089", "title": "Đường đua nào ở Monaco?", "hint": "Đối chiếu địa điểm trong các nút lân cận; giống chủ đề chưa đủ."},
        {"pair": "zh_en:6450", "title": "Thành phố hay vùng lân cận?", "hint": "京都市 chỉ chính thành phố Kyoto. Phân biệt với những địa danh ở gần."},
    ]
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "demo.json").write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
    provenance = {"schemaVersion": 1, "exporter": "scripts/export_demo_data.py",
                  "paper": {"url": PAPER, "section": "Appendix A.5", "table": 6,
                            "note": "Hàng 8853: nhãn PDF lỗi dấu được chuẩn hóa thành Tự Đức theo tên entity. Figure 6 minh họa case Hachisuka Narihiro."},
                  "files": tracked, "predictionEpoch": 999, "rankBase": 1,
                  "notes": ["Snapshot dự đoán cuối epoch, không chạy inference trong trình duyệt.",
                            "Mỗi top3 lấy từ toàn bộ 10.500 ứng viên test của cấu hình.",
                            "Không có điểm số trong pred.txt; demo chỉ dùng thứ hạng.",
                            "Relation IDs giữ nguyên vì dữ liệu local không kèm bảng tên quan hệ.",
                            "training_attrs chỉ lưu tên thuộc tính, không có giá trị.",
                            "Đồ thị ngữ cảnh không phải attribution nhân quả của mô hình.",
                            "Ảnh tư liệu bổ sung không được xác nhận là ảnh gốc tạo embedding."]}
    (destination / "provenance.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n")
    print(f"Exported {sum(len(d['pairs']) for d in result['datasets'])} pairs, {len(entities)} entities to {destination}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path, default=ROOT / "demo" / "data")
    args = parser.parse_args()
    export(args.root.resolve(), args.output.resolve())
