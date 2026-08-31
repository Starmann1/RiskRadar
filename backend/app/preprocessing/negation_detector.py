import re
from typing import List, Dict, Any, Tuple
import spacy
from spacy.matcher import Matcher

class NegationDetector:
    """
    Linguistic dependency parser and pattern matcher for safety-critical negations.
    Distinguishes 'not verified' (unverified barrier), 'not worn' (missing barrier),
    and 'no personnel were inside' (zero exposure).
    """

    def __init__(self, nlp_model=None):
        if nlp_model is not None:
            self.nlp = nlp_model
        else:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except Exception:
                self.nlp = spacy.blank("en")
                if "sentencizer" not in self.nlp.pipe_names:
                    self.nlp.add_pipe("sentencizer")

        self.matcher = Matcher(self.nlp.vocab)
        self._register_patterns()

    def _register_patterns(self):
        patterns = [
            [{"LOWER": "not"}, {"LOWER": {"IN": ["verified", "performed", "confirmed", "tested", "isolated", "locked", "tagged", "secured", "rigged", "calibrated"]}}],
            [{"LOWER": "failed"}, {"LOWER": "to"}],
            [{"LOWER": "could"}, {"LOWER": "not"}, {"LOWER": "be"}, {"LOWER": {"IN": ["confirmed", "verified", "isolated", "tested"]}}],
            [{"LOWER": "without"}, {"OP": "?"}, {"LOWER": {"IN": ["testing", "confirming", "verifying", "authorization", "permit", "harness", "barrier", "signing", "isolating"]}}],
            [{"LOWER": "no"}, {"LOWER": {"IN": ["personnel", "worker", "technician", "crew", "person"]}}, {"LOWER": {"IN": ["was", "were"]}}, {"LOWER": {"IN": ["inside", "exposed", "present", "injured", "struck"]}}],
            [{"LOWER": "no"}, {"LOWER": "injury"}, {"LOWER": {"IN": ["occurred", "sustained", "reported", "recorded"]}}],
            [{"LOWER": "zero"}, {"LOWER": {"IN": ["infractions", "injuries", "violations", "anomalies"]}}],
            [{"LOWER": "neither"}, {"OP": "*"}, {"LOWER": "nor"}]
        ]
        for i, pat in enumerate(patterns):
            self.matcher.add(f"NEG_PAT_{i}", [pat])

    def detect_negations(self, text: str) -> List[Dict[str, Any]]:
        """
        Extracts all negations with exact start/end character offsets, target claim, and polarity scope.
        """
        if not text:
            return []

        doc = self.nlp(text)
        negations: List[Dict[str, Any]] = []

        # 1. Pattern Matcher
        matches = self.matcher(doc)
        for match_id, start, end in matches:
            span = doc[start:end]
            negations.append({
                "pattern": span.text,
                "span": span.sent.text if span.sent else span.text,
                "char_start": span.start_char,
                "char_end": span.end_char,
                "method": "spacy_matcher",
                "negation_type": "EXPLICIT_SAFETY_NEGATION"
            })

        # 2. Syntactic Dependency Parsing (neg modifier check)
        for token in doc:
            if token.dep_ == "neg":
                head = token.head
                # Expand to head verb/adj phrase
                start_i = max(0, min(token.i, head.i) - 1)
                end_i = min(len(doc), max(token.i, head.i) + 2)
                span_token = doc[start_i:end_i]
                
                # Check if already captured by pattern matcher
                if not any(n["char_start"] <= token.idx <= n["char_end"] for n in negations):
                    negations.append({
                        "pattern": span_token.text,
                        "span": token.sent.text if token.sent else span_token.text,
                        "char_start": span_token.start_char,
                        "char_end": span_token.end_char,
                        "method": "spacy_dependency_neg",
                        "negation_type": "SYNTACTIC_DEPENDENCY"
                    })

        # 3. Regex Fallback for Compound Safety Phrases
        regex_patterns = [
            (r"\bnot\s+(?:physically\s+)?(?:verified|confirmed|performed|isolated|tested|calibrated|secured)\b", "UNVERIFIED_ACTION"),
            (r"\bwithout\s+(?:first\s+)?(?:testing|confirming|verifying|authorization|permit|harness|securing)\b", "MISSING_ACTION"),
            (r"\bno\s+personnel\s+were\s+inside\b", "ZERO_EXPOSURE"),
            (r"\bno\s+worker\s+was\s+exposed\b", "ZERO_EXPOSURE"),
            (r"\bzero\s+(?:infractions|injuries|violations)\b", "ZERO_DEFECT"),
            (r"\bno\s+anomal(?:y|ies)\s+noted\b", "INTACT_CONTROL")
        ]

        for pat, n_type in regex_patterns:
            for m in re.finditer(pat, text, re.IGNORECASE):
                if not any(n["char_start"] <= m.start() <= n["char_end"] for n in negations):
                    negations.append({
                        "pattern": m.group(0),
                        "span": text[max(0, m.start() - 20):min(len(text), m.end() + 30)].strip(),
                        "char_start": m.start(),
                        "char_end": m.end(),
                        "method": "regex_fallback",
                        "negation_type": n_type
                    })

        return negations
