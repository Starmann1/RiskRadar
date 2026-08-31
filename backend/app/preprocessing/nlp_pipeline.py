import re
from typing import List, Dict, Tuple, Any, Optional
import spacy
from spacy.tokens import Doc, Span, Token

from app.preprocessing.abbreviations import expand_oilfield_abbreviations, OILFIELD_ABBREVIATIONS
from app.preprocessing.negation_detector import NegationDetector

# Initialize singleton spaCy linguistic pipeline
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.blank("en")
    if "sentencizer" not in nlp.pipe_names:
        nlp.add_pipe("sentencizer")

negation_detector = NegationDetector(nlp)

def clean_text(text: str) -> str:
    """Standardizes whitespace, line breaks, and non-printable characters."""
    if not text:
        return ""
    # Normalize unicode quotes and dashes
    cleaned = text.replace("“", "\"").replace("”", "\"").replace("‘", "'").replace("’", "'")
    cleaned = cleaned.replace("—", " - ").replace("–", " - ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def expand_abbreviations(text: str) -> str:
    """Expands oilfield specific abbreviations while retaining original context in parentheses."""
    return expand_oilfield_abbreviations(text)

def process_with_spacy(text: str) -> Doc:
    """
    Runs the raw safety narrative through the full spaCy linguistic pipeline:
    Tokenization, POS tagging, Dependency Parsing, Sentence Boundary Detection.
    """
    cleaned = clean_text(text)
    return nlp(cleaned)

def extract_spacy_sentence_spans(text: str) -> List[Dict[str, Any]]:
    """
    Extracts individual sentences along with exact character start and end offsets via spaCy.
    """
    cleaned = clean_text(text)
    doc = nlp(cleaned)
    spans = []
    for sent in doc.sents:
        sent_text = sent.text.strip()
        if sent_text:
            spans.append({
                "text": sent_text,
                "start_char": sent.start_char,
                "end_char": sent.end_char,
                "root_verb": sent.root.lemma_ if hasattr(sent, "root") else "",
                "token_count": len(sent)
            })
    
    if not spans and cleaned:
        # Fallback if sentencizer yielded nothing
        spans.append({
            "text": cleaned,
            "start_char": 0,
            "end_char": len(cleaned),
            "root_verb": "",
            "token_count": len(cleaned.split())
        })
    return spans

def split_sentences(text: str) -> List[str]:
    """Splits narrative into clean sentence strings."""
    spans = extract_spacy_sentence_spans(text)
    return [s["text"] for s in spans]

def detect_negations(text: str) -> List[Dict[str, Any]]:
    """Detects safety-critical negation cues with character spans."""
    return negation_detector.detect_negations(clean_text(text))

def detect_temporal_contradictions(sentences: List[str]) -> List[Dict[str, str]]:
    """
    Identifies contradictory state claims across sequential sentences
    (e.g., Sentence 1: 'Isolation completed' vs Sentence 2: 'Isolation could not be confirmed').
    Per the Technical Specification (Chapter 31), the later, more specific operative statement governs (Last Link in Chain Principle).
    """
    contradictions = []
    positive_claim = None
    negative_claim = None

    positive_keywords = ["completed", "done", "signed", "verified", "isolated", "closed", "secured"]
    negative_keywords = ["not confirmed", "could not be confirmed", "not verified", "mismatch", "unverified", "failed to", "was not verified", "not tested"]

    for idx, s in enumerate(sentences):
        s_lower = s.lower()
        if any(w in s_lower for w in ["isolation", "permit", "loto", "ptw", "barrier", "lockout"]):
            is_negative = any(neg in s_lower for neg in negative_keywords)
            is_positive = any(pos in s_lower for pos in positive_keywords) and not is_negative

            if is_positive and not positive_claim:
                positive_claim = s
            elif is_negative:
                negative_claim = s

    if positive_claim and negative_claim:
        contradictions.append({
            "claim_a": positive_claim,
            "claim_b": negative_claim,
            "governing_claim": negative_claim,
            "reason": "Later, more specific operative statement governs barrier status (DEKRA Last Link Principle)"
        })

    return contradictions

def detect_sparse_narrative(text: str) -> Tuple[bool, List[str]]:
    """
    Detects sparse, vague, or under-specified safety observations that lack
    concrete equipment, energy, or barrier descriptions.
    """
    cleaned = clean_text(text)
    words = cleaned.split()
    missing_elements = []

    # Check for ambiguous single-phrase reports (e.g. 'Safety issue observed near process area')
    vague_phrases = ["safety issue observed", "reported for awareness", "observation made at site", "unsafe condition noted", "please inspect"]
    is_explicitly_vague = any(vp in cleaned.lower() for vp in vague_phrases) and len(words) < 16

    if is_explicitly_vague or (len(words) < 8 and not any(k in cleaned.lower() for k in ["flange", "valve", "crane", "pressure", "harness", "loto", "ptw", "gas"])):
        missing_elements.append("Sparse/vague narrative text with insufficient operational detail")

    is_sparse = len(missing_elements) > 0
    return is_sparse, missing_elements

def preprocess_narrative(narrative_text: str) -> Dict[str, Any]:
    """
    Runs the comprehensive NLP preprocessing pipeline:
    1. Text normalization
    2. Abbreviation expansion
    3. Sentence segmentation with char offsets
    4. Dependency negation detection
    5. Temporal contradiction resolution
    6. Missing-information / sparsity analysis
    """
    cleaned = clean_text(narrative_text)
    sentence_spans = extract_spacy_sentence_spans(cleaned)
    sentences = [s["text"] for s in sentence_spans]
    negations = detect_negations(cleaned)
    contradictions = detect_temporal_contradictions(sentences)
    is_sparse, missing_elements = detect_sparse_narrative(cleaned)
    expanded_text = expand_abbreviations(cleaned)

    return {
        "cleaned_text": cleaned,
        "expanded_text": expanded_text,
        "sentences": sentences,
        "sentence_spans": sentence_spans,
        "negations": negations,
        "contradictions": contradictions,
        "is_sparse": is_sparse,
        "missing_elements": missing_elements,
        "word_count": len(cleaned.split()),
        "char_length": len(cleaned)
    }
