from typing import Dict, Iterable, List, Sequence


def recall_at_k(rankings: Dict[str, Sequence[int]], expected: Dict[str, Iterable[int]], k: int) -> float:
    if not expected:
        return 0.0
    hits = 0
    for query_id, relevant in expected.items():
        relevant_set = set(relevant)
        if relevant_set.intersection(rankings.get(query_id, [])[:k]):
            hits += 1
    return hits / len(expected)


def mean_reciprocal_rank(rankings: Dict[str, Sequence[int]], expected: Dict[str, Iterable[int]]) -> float:
    if not expected:
        return 0.0
    total = 0.0
    for query_id, relevant in expected.items():
        relevant_set = set(relevant)
        for rank, chunk_index in enumerate(rankings.get(query_id, []), start=1):
            if chunk_index in relevant_set:
                total += 1 / rank
                break
    return total / len(expected)


def top1_accuracy(rankings: Dict[str, Sequence[int]], expected: Dict[str, Iterable[int]]) -> float:
    return recall_at_k(rankings, expected, 1)
