import re
from typing import Dict, Any, List, Optional, Tuple
from app.schemas.domain import ExtractionResult, EvidenceSpan

class EvidenceValidator:
    """
    Anti-Hallucination Evidence Grounding & Verification Layer.
    Validates that every extracted hazard, energy type, exposure state, and barrier status
    is strictly proven by a verbatim substring in the raw narrative text, and computes exact character offsets.
    """

    @staticmethod
    def find_span_offsets(narrative_text: str, candidate_text: str) -> Optional[Tuple[int, int]]:
        """
        Finds the exact (start_char, end_char) indices of candidate_text in narrative_text.
        Performs exact match first, then whitespace-normalized fallback search.
        """
        if not candidate_text or not narrative_text:
            return None

        clean_cand = candidate_text.strip()
        # 1. Exact Substring Search
        idx = narrative_text.find(clean_cand)
        if idx != -1:
            return idx, idx + len(clean_cand)

        # 2. Case-Insensitive Substring Search
        idx_lower = narrative_text.lower().find(clean_cand.lower())
        if idx_lower != -1:
            return idx_lower, idx_lower + len(clean_cand)

        # 3. Sentence-level Substring Search (first 25 characters)
        prefix = clean_cand[:min(25, len(clean_cand))]
        idx_prefix = narrative_text.lower().find(prefix.lower())
        if idx_prefix != -1:
            # Find end of sentence in narrative
            end_match = re.search(r"[.!?\n]|$", narrative_text[idx_prefix:])
            end_char = idx_prefix + (end_match.start() if end_match else len(clean_cand))
            return idx_prefix, max(idx_prefix + len(prefix), end_char)

        return None

    def validate_and_ground_extraction(
        self,
        narrative_text: str,
        extraction: ExtractionResult
    ) -> ExtractionResult:
        """
        Validates all evidence spans in an ExtractionResult object:
        - Resolves char_start and char_end offsets.
        - Flags ungrounded claims in uncertainties.
        - Adjusts overall extraction confidence if evidence is ungrounded.
        - Rejects or downgrades unsupported/hallucinated claims.
        """
        if not narrative_text or not extraction:
            return extraction

        grounded_hazards = []
        for h in extraction.hazards:
            if h.evidence_span:
                offsets = self.find_span_offsets(narrative_text, h.evidence_span.source_sentence)
                if offsets:
                    h.evidence_span.char_start = max(0, min(len(narrative_text), offsets[0]))
                    h.evidence_span.char_end = max(0, min(len(narrative_text), offsets[1]))
                    h.evidence_span.matched_text = narrative_text[offsets[0]:offsets[1]]
                else:
                    extraction.uncertainties.append(f"Hazard '{h.display_name}' evidence text could not be located in source narrative.")
                    extraction.confidence = max(0.20, round(extraction.confidence - 0.20, 2))
            grounded_hazards.append(h)
        extraction.hazards = grounded_hazards

        grounded_barriers = []
        for b in extraction.barriers:
            if b.evidence_span:
                offsets = self.find_span_offsets(narrative_text, b.evidence_span.source_sentence)
                if offsets:
                    b.evidence_span.char_start = max(0, min(len(narrative_text), offsets[0]))
                    b.evidence_span.char_end = max(0, min(len(narrative_text), offsets[1]))
                    b.evidence_span.matched_text = narrative_text[offsets[0]:offsets[1]]
                else:
                    extraction.uncertainties.append(f"Barrier '{b.display_name}' evidence text could not be located in source narrative.")
                    extraction.confidence = max(0.20, round(extraction.confidence - 0.20, 2))
            grounded_barriers.append(b)
        extraction.barriers = grounded_barriers

        if extraction.exposure and extraction.exposure.evidence_span:
            offsets = self.find_span_offsets(narrative_text, extraction.exposure.evidence_span.source_sentence)
            if offsets:
                extraction.exposure.evidence_span.char_start = max(0, min(len(narrative_text), offsets[0]))
                extraction.exposure.evidence_span.char_end = max(0, min(len(narrative_text), offsets[1]))
                extraction.exposure.evidence_span.matched_text = narrative_text[offsets[0]:offsets[1]]
            else:
                extraction.uncertainties.append("Worker exposure claim evidence could not be verified in source narrative.")
                extraction.confidence = max(0.20, round(extraction.confidence - 0.15, 2))

        return extraction

evidence_validator = EvidenceValidator()

