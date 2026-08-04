import json
from pathlib import Path
from types import SimpleNamespace

from app.services.rag_metrics import mean_reciprocal_rank, recall_at_k, top1_accuracy
from app.services.rag_service import RAGService


def test_hybrid_benchmark_quality():
    path = Path(__file__).parents[1] / "benchmarks" / "rag_quality_dataset.json"
    dataset = json.loads(path.read_text(encoding="utf-8"))
    chunks = [SimpleNamespace(page_end=item["page_number"], **item) for item in dataset["chunks"]]
    rankings = {}
    expected = {}
    for item in dataset["queries"]:
        ranked = RAGService.rerank_chunks(item["query"], chunks, dense_scores={})
        rankings[item["id"]] = [chunk.chunk_index for chunk, _ in ranked]
        expected[item["id"]] = item["relevant"]

    assert recall_at_k(rankings, expected, 3) >= 1.0
    assert mean_reciprocal_rank(rankings, expected) >= 0.9
    assert top1_accuracy(rankings, expected) >= 0.8


def test_reranker_boosts_preferred_page():
    chunks = [
        SimpleNamespace(chunk_index=0, page_number=1, page_end=1, section_title="Тема", content="Определение функции"),
        SimpleNamespace(chunk_index=1, page_number=5, page_end=5, section_title="Тема", content="Определение функции"),
    ]
    ranked = RAGService.rerank_chunks("определение функции", chunks, {0: 0.7, 1: 0.7}, preferred_pages=[5])
    assert ranked[0][0].chunk_index == 1


def test_irrelevant_chunk_stays_below_threshold():
    chunk = SimpleNamespace(
        chunk_index=0, page_number=1, page_end=1,
        section_title="Ботаника", content="Строение корневой системы растения",
    )
    ranked = RAGService.rerank_chunks("формула Ньютона Лейбница", [chunk], dense_scores={})
    assert ranked[0][1] < 0.32


def test_distinctive_subject_term_rescues_formula_heavy_chunk():
    chunks = [
        SimpleNamespace(
            chunk_index=0, page_number=33, page_end=34,
            section_title="Механика жидкостей",
            content="Уравнение Бернулли: плотность жидкости, скорость, высота и давление.",
        ),
        SimpleNamespace(
            chunk_index=1, page_number=71, page_end=71,
            section_title="Физическая кинетика",
            content="Физический смысл уравнений кинетики и их слагаемых.",
        ),
    ]

    ranked = RAGService.rerank_chunks(
        "Запишите уравнение Бернулли и объясните физический смысл его слагаемых",
        chunks,
        dense_scores={1: 0.55},
    )

    assert ranked[0][0].chunk_index == 0
    assert ranked[0][1] >= 0.40
