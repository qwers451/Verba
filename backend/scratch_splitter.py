from langchain_text_splitters import MarkdownTextSplitter

markdown_text = """
# Header 1
Some text here.
| col1 | col2 |
|---|---|
| val1 | val2 |
| val3 | val4 |
More text here.
"""

splitter = MarkdownTextSplitter(chunk_size=50, chunk_overlap=0)
chunks = splitter.split_text(markdown_text)
for i, c in enumerate(chunks):
    print(f"--- Chunk {i} ---")
    print(c)
