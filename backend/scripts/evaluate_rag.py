import json
from pathlib import Path
from types import SimpleNamespace

from app.services.rag_metrics import mean_reciprocal_rank, recall_at_k, top1_accuracy
from app.services.rag_service import RAGService


def main() -> None:
    dataset_path = Path(__file__).parents[1] / "benchmarks" / "rag_quality_dataset.json"
    dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
    chunks = [SimpleNamespace(page_end=item["page_number"], **item) for item in dataset["chunks"]]
    rankings = {}
    expected = {}
    for item in dataset["queries"]:
        ranked = RAGService.rerank_chunks(item["query"], chunks, dense_scores={})
        rankings[item["id"]] = [chunk.chunk_index for chunk, _ in ranked]
        expected[item["id"]] = item["relevant"]

    print(f"queries={len(expected)}")
    print(f"Recall@3={recall_at_k(rankings, expected, 3):.3f}")
    print(f"MRR={mean_reciprocal_rank(rankings, expected):.3f}")
    print(f"Top-1 accuracy={top1_accuracy(rankings, expected):.3f}")


if __name__ == "__main__":
    main()
