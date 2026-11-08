import hashlib
from typing import List


def chunk_text(
    text: str,
    chunk_size: int = 400,
    overlap: int = 60
) -> List[dict]:
    """
    Split text into overlapping passages.

    Offsets refer to the original, unmodified text.
    Passage IDs are deterministic.
    """

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero.")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be >= 0 and smaller than chunk_size.")

    if not text:
        return []

    chunks = []
    text_length = len(text)
    start = 0
    chunk_index = 0

    while start < text_length:
        end = min(start + chunk_size, text_length)

        # Prefer a whitespace boundary near the end of the chunk.
        if end < text_length:
            boundary = max(
                text.rfind(" ", start, end),
                text.rfind("\n", start, end),
                text.rfind("\t", start, end)
            )

            if boundary > start:
                end = boundary

        # Preserve original offsets while trimming passage whitespace.
        actual_start = start
        actual_end = end

        while actual_start < actual_end and text[actual_start].isspace():
            actual_start += 1

        while actual_end > actual_start and text[actual_end - 1].isspace():
            actual_end -= 1

        chunk_text_str = text[actual_start:actual_end]

        if chunk_text_str:
            hash_input = (
                f"{chunk_index}:{actual_start}:{actual_end}:{chunk_text_str}"
            )
            passage_id = hashlib.sha256(
                hash_input.encode("utf-8")
            ).hexdigest()[:16]

            chunks.append({
                "passage_id": passage_id,
                "chunk_index": chunk_index,
                "text": chunk_text_str,
                "span_start": actual_start,
                "span_end": actual_end
            })

            chunk_index += 1

        if end >= text_length:
            break

        next_start = end - overlap

        if next_start <= start:
            raise ValueError("Chunking failed to make forward progress.")

        start = next_start

    return chunks