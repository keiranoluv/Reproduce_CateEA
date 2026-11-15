"""Validate benchmark semantics and provenance, without training dependencies."""

import csv
import hashlib
import json
import unittest
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / "demo"
DATA = json.loads((DEMO / "data/demo.json").read_text())
PROVENANCE = json.loads((DEMO / "data/provenance.json").read_text())


@lru_cache(maxsize=None)
def lines(relative):
    return (ROOT / relative).read_text().splitlines()


class DemoDataTests(unittest.TestCase):
    def test_scope_and_references(self):
        self.assertEqual({d["id"] for d in DATA["datasets"]}, {"ja_en", "zh_en"})
        entities = DATA["entities"]
        for dataset in DATA["datasets"]:
            self.assertEqual(len(dataset["pairs"]), 24)
            self.assertEqual(dataset["candidateCount"], 10500)
            self.assertEqual(len({p["id"] for p in dataset["pairs"]}), 24)
            for pair in dataset["pairs"]:
                self.assertEqual(pair["id"], pair["source"])
                self.assertEqual(entities[pair["source"]]["side"], 1)
                self.assertEqual(entities[pair["target"]]["side"], 2)
                self.assertEqual(entities[pair["target"]]["label"], pair["title"])
                self.assertEqual(set(pair["predictions"]), set(DATA["configurations"]))
                for modes in pair["predictions"].values():
                    self.assertEqual(set(modes), {"test", "weighted"})
                    for prediction in modes.values():
                        self.assertEqual(prediction["groundTruth"], pair["target"])
                        self.assertTrue(1 <= prediction["rank"] <= 10500)
                        self.assertEqual(len(set(prediction["top3"])), 3)
                        for key in prediction["top3"]:
                            self.assertEqual(entities[key]["side"], 2)
                            self.assertEqual(entities[key]["dataset"], dataset["id"])
                        if prediction["rank"] <= 3:
                            self.assertEqual(prediction["top3"][prediction["rank"] - 1], pair["target"])
                        else:
                            self.assertNotIn(pair["target"], prediction["top3"])
                        self.assertIn(prediction["source"]["path"], PROVENANCE["files"])
        for entity in entities.values():
            self.assertLessEqual(len(entity["neighbors"]), 4)
            for edge in entity["neighbors"]:
                neighbor = entities[edge["entity"]]
                self.assertEqual(neighbor["side"], entity["side"])
                self.assertEqual(neighbor["dataset"], entity["dataset"])

    def test_ham_nghi_case_keeps_paper_separate(self):
        case = next(c for c in DATA["paperCases"] if c["sourceId"] == 8853)
        self.assertEqual(case["target"], "Hàm Nghi")
        self.assertEqual(case["withICS"], "Hàm Nghi")
        self.assertEqual(case["withoutICS"], "Tự Đức")
        pair = next(p for p in DATA["datasets"][0]["pairs"] if p["id"] == "ja_en:8853")
        self.assertEqual(pair["target"], "ja_en:19353")
        self.assertEqual(DATA["entities"][pair["source"]]["label"], "咸宜帝")
        for mode in ("test", "weighted"):
            row = pair["predictions"]["noniter_wSF"][mode]
            self.assertEqual(row["rank"], 3)
            self.assertEqual(row["top3"][0], "ja_en:12709")
            self.assertEqual(pair["predictions"]["noniter_woSF"][mode]["rank"], 1)
            self.assertEqual(pair["predictions"]["iter_wSF"][mode]["rank"], 5)
        self.assertEqual(len(DATA["paperCases"]), 7)

    def test_questions_and_metric_scope(self):
        pairs = {p["id"]: p for d in DATA["datasets"] for p in d["pairs"]}
        self.assertEqual(len(DATA["quizzes"]), 6)
        self.assertEqual(len({q["pair"] for q in DATA["quizzes"]}), 6)
        for quiz in DATA["quizzes"]:
            self.assertIn(quiz["pair"], pairs)
        metrics = DATA["metrics"]
        self.assertEqual(len(metrics), 48)
        for kind in ("best", "latest"):
            selected = [r for r in metrics if r["checkpoint"] == kind]
            self.assertEqual(len(selected), 24)
            self.assertEqual(len({r["configuration"] for r in selected}), 24)
            for row in selected:
                for key in ("test_h1_avg", "test_h10_avg", "test_mrr_avg", "weighted_h1_avg"):
                    self.assertTrue(0 <= float(row[key]) <= 1)
                self.assertEqual(row["seed"], "42")

    def test_images_and_bundle(self):
        credits = json.loads((DEMO / "assets/image-sources.json").read_text())
        self.assertEqual({i["entity"] for i in credits["images"]}, {"Hàm Nghi", "Tự Đức", "Bảo Đại"})
        for image in credits["images"]:
            path = DEMO / image["path"]
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), image["sha256"])
            self.assertTrue(image["source_page"].startswith("https://commons.wikimedia.org/wiki/"))
            self.assertIn("Public domain", image["license"])
        self.assertLess(sum(p.stat().st_size for p in DEMO.rglob("*") if p.is_file()), 2 * 1024 * 1024)

    def test_available_input_hashes(self):
        available = [(relative, meta) for relative, meta in PROVENANCE["files"].items() if (ROOT / relative).is_file()]
        if not available:
            self.skipTest("Raw inputs not present in this checkout")
        for relative, meta in available:
            self.assertEqual(hashlib.sha256((ROOT / relative).read_bytes()).hexdigest(), meta["sha256"], relative)

    def test_available_raw_predictions_and_alignments(self):
        checked = 0
        for dataset in DATA["datasets"]:
            for pair in dataset["pairs"]:
                source_id, target_id = pair["source"].split(":")[1], pair["target"].split(":")[1]
                alignment = pair["alignmentSource"]
                if (ROOT / alignment["path"]).is_file():
                    self.assertEqual(lines(alignment["path"])[alignment["line"] - 1].split("\t"), [source_id, target_id])
                for modes in pair["predictions"].values():
                    for prediction in modes.values():
                        source = prediction["source"]
                        if not (ROOT / source["path"]).is_file():
                            continue
                        raw_lines = lines(source["path"])
                        record = next(csv.DictReader([raw_lines[0], raw_lines[source["line"] - 1]]))
                        self.assertEqual(record["query_id"], source_id)
                        self.assertEqual(record["gt_id"], target_id)
                        self.assertEqual(int(record["rank"]) + 1, prediction["rank"])
                        self.assertEqual([record[f"ret{i}"] for i in (1, 2, 3)], [key.split(":")[1] for key in prediction["top3"]])
                        checked += 1
        if not checked:
            self.skipTest("Raw prediction files not present in this checkout")

    def test_available_raw_graph_triples(self):
        checked = 0
        for entity in DATA["entities"].values():
            for edge in entity["neighbors"]:
                source = edge["source"]
                if not (ROOT / source["path"]).is_file():
                    continue
                center = str(entity["numericId"])
                neighbor = str(DATA["entities"][edge["entity"]]["numericId"])
                expected = [center, str(edge["relation"]), neighbor] if edge["direction"] == "out" else [neighbor, str(edge["relation"]), center]
                self.assertEqual(lines(source["path"])[source["line"] - 1].split("\t"), expected)
                checked += 1
        if not checked:
            self.skipTest("Raw graph files not present in this checkout")


if __name__ == "__main__":
    unittest.main()
