"""
SIF-Sense AI — Text Preprocessor
Cleans and normalizes safety report text for NLP analysis.
"""

import re
import string


# Domain-specific abbreviation normalization
DOMAIN_NORMALIZATIONS = {
    "cs": "confined space",
    "wah": "working at height",
    "ppe": "personal protective equipment",
    "ptw": "permit to work",
    "loto": "lockout tagout",
    "hot work": "hot work",
    "h2s": "hydrogen sulfide",
    "co": "carbon monoxide",
    "o2": "oxygen",
    "lel": "lower explosive limit",
    "scba": "self contained breathing apparatus",
    "msds": "material safety data sheet",
    "jha": "job hazard analysis",
    "hra": "health risk assessment",
    "arc flash": "electrical arc flash",
    "hi-vis": "high visibility",
    "sop": "standard operating procedure",
    "tlv": "threshold limit value",
    "prv": "pressure relief valve",
    "psv": "pressure safety valve",
}


def preprocess(text: str) -> str:
    """
    Full preprocessing pipeline:
    1. Lowercase
    2. Remove excessive symbols
    3. Normalize domain abbreviations
    4. Remove extra whitespace
    """
    if not text:
        return ""

    # Step 1: Lowercase
    text = text.lower()

    # Step 2: Replace common punctuation that adds no semantic value
    text = re.sub(r"[!]{2,}", "!", text)
    text = re.sub(r"[?]{2,}", "?", text)
    text = re.sub(r"[.]{3,}", "...", text)

    # Step 3: Remove non-ASCII but keep alphanumeric + common punctuation
    text = re.sub(r"[^\x00-\x7F]+", " ", text)

    # Step 4: Normalize domain abbreviations (word-boundary aware)
    for abbrev, expansion in DOMAIN_NORMALIZATIONS.items():
        text = re.sub(r"\b" + re.escape(abbrev) + r"\b", expansion, text)

    # Step 5: Remove URLs
    text = re.sub(r"http\S+|www\.\S+", "", text)

    # Step 6: Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


def tokenize(text: str) -> list[str]:
    """Simple whitespace + punctuation tokenizer."""
    # Remove remaining punctuation for tokenization
    clean = re.sub(r"[^\w\s]", " ", text)
    return [tok for tok in clean.split() if len(tok) > 1]


def get_preprocessed(text: str) -> dict:
    """Return both cleaned text and token list."""
    cleaned = preprocess(text)
    tokens = tokenize(cleaned)
    return {
        "original": text,
        "cleaned": cleaned,
        "tokens": tokens,
        "token_count": len(tokens)
    }
