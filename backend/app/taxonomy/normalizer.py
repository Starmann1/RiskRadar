import yaml
import os
from typing import Dict, List, Optional, Any

TAXONOMY_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "taxonomy")

class TaxonomyNormalizer:
    """
    Controlled Domain Taxonomy Normalization Service.
    Resolves raw model terms or narrative snippets into standardized, controlled YAML taxonomy terms.
    """

    def __init__(self):
        self.hazards = self._load_yaml("hazards.yaml")
        self.activities = self._load_yaml("activities.yaml")
        self.energies = self._load_yaml("energies.yaml")
        self.barriers = self._load_yaml("barriers.yaml")
        self.barrier_states = self._load_yaml("barrier_states.yaml")
        self.lsr_mappings = self._load_yaml("lsr_mapping.yaml")
        self.psf_mappings = self._load_yaml("psf_mapping.yaml")

    def _load_yaml(self, filename: str) -> List[Dict[str, Any]]:
        filepath = os.path.join(TAXONOMY_DIR, filename)
        if not os.path.exists(filepath):
            return []
        with open(filepath, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or []

    def normalize_hazard(self, raw_term: str) -> Dict[str, Any]:
        """Maps free text hazard mentions to canonical hazard objects."""
        if not raw_term:
            return {
                "canonical": "operational_hazard",
                "display_name": "Operational Hazard",
                "energy_type": "mechanical",
                "process_safety_fundamental": False
            }

        raw_lower = raw_term.lower().strip()
        # 1. Exact Match on Canonical or Display Name
        for h in self.hazards:
            if h["canonical"].lower() == raw_lower or h["display_name"].lower() == raw_lower:
                return h

        # 2. Alias substring / containment match
        for h in self.hazards:
            for alias in h.get("aliases", []):
                alias_lower = alias.lower()
                if alias_lower in raw_lower or raw_lower in alias_lower:
                    return h

        # 3. Token set intersection match
        raw_tokens = set(raw_lower.replace("_", " ").replace("-", " ").split())
        best_match = None
        best_overlap = 0
        for h in self.hazards:
            for alias in h.get("aliases", []) + [h["display_name"], h["canonical"]]:
                a_tokens = set(alias.lower().replace("_", " ").replace("-", " ").split())
                overlap = len(raw_tokens.intersection(a_tokens))
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_match = h

        if best_match and best_overlap >= 1:
            return best_match

        # Fallback default
        return {
            "canonical": raw_lower.replace(" ", "_"),
            "display_name": raw_term.replace("_", " ").title(),
            "energy_type": "mechanical",
            "process_safety_fundamental": False
        }

    def normalize_activity(self, raw_activity: str) -> Dict[str, Any]:
        """Maps free text activity terms to canonical activity taxonomy objects."""
        if not raw_activity:
            return {
                "canonical": "general_operations",
                "display_name": "General Operations",
                "default_criticality": 1,
                "lifecycle_phase": "General Operations"
            }

        raw_lower = raw_activity.lower().strip()
        # 1. Exact canonical or display match
        for act in self.activities:
            if act["canonical"].lower() == raw_lower or act["display_name"].lower() == raw_lower:
                return act

        # 2. Token overlap ranking (excluding generic words like 'operations', 'general')
        generic_stopwords = {"operations", "general", "work", "routine", "task", "job", "activity"}
        raw_tokens = set(raw_lower.replace("_", " ").replace("-", " ").split()) - generic_stopwords
        
        best_act = None
        best_overlap = 0

        for act in self.activities:
            act_tokens = set(act["canonical"].replace("_", " ").split()) - generic_stopwords
            overlap = len(raw_tokens.intersection(act_tokens))
            if overlap > best_overlap:
                best_overlap = overlap
                best_act = act

        if best_act and best_overlap > 0:
            return best_act

        # 3. Fallback check for known activity keywords
        if "lift" in raw_lower or "crane" in raw_lower or "rigging" in raw_lower:
            return next((a for a in self.activities if a["canonical"] == "lifting_rigging"), None) or self.activities[0]
        if "confined" in raw_lower or "vessel entry" in raw_lower or "tank" in raw_lower:
            return next((a for a in self.activities if a["canonical"] == "confined_space_entry"), None) or self.activities[0]
        if "height" in raw_lower or "scaffold" in raw_lower or "derrick" in raw_lower:
            return next((a for a in self.activities if a["canonical"] == "work_at_height"), None) or self.activities[0]
        if "weld" in raw_lower or "grind" in raw_lower or "hot work" in raw_lower:
            return next((a for a in self.activities if a["canonical"] == "hot_work_welding"), None) or self.activities[0]

        return {
            "canonical": raw_lower.replace(" ", "_"),
            "display_name": raw_activity.replace("_", " ").title(),
            "default_criticality": 1,
            "lifecycle_phase": "General Operations"
        }

    def normalize_barrier(self, raw_barrier: str) -> Dict[str, Any]:
        """Maps free text barrier names to canonical barrier taxonomy objects."""
        if not raw_barrier:
            return {
                "canonical": "engineered_administrative_control",
                "display_name": "Engineered / Administrative Control",
                "type": "physical",
                "life_saving_rule": None
            }

        raw_lower = raw_barrier.lower().strip()
        for b in self.barriers:
            if b["canonical"].lower() == raw_lower or b["display_name"].lower() == raw_lower:
                return b
            for trigger in b.get("triggers", []):
                if trigger.lower() in raw_lower or raw_lower in trigger.lower():
                    return b

        return {
            "canonical": raw_lower.replace(" ", "_"),
            "display_name": raw_barrier.replace("_", " ").title(),
            "type": "procedural",
            "life_saving_rule": None
        }

    def normalize_barrier_state(self, raw_state: str) -> str:
        """
        Enforces controlled barrier failure enum status:
        VERIFIED_INTACT, DEGRADED, UNVERIFIED, WEAK, MISSING, FAILED, BYPASSED.
        Strictly preserves: UNVERIFIED != FAILED.
        """
        if not raw_state:
            return "UNVERIFIED"

        s_upper = raw_state.upper().strip()
        valid_states = {"VERIFIED_INTACT", "DEGRADED", "UNVERIFIED", "WEAK", "MISSING", "FAILED", "BYPASSED"}
        if s_upper in valid_states:
            return s_upper

        s_lower = raw_state.lower()
        if "verified" in s_lower and "intact" in s_lower or "normal" in s_lower or "tested successfully" in s_lower or "ok" in s_lower:
            return "VERIFIED_INTACT"
        elif "missing" in s_lower or "absent" in s_lower or "not worn" in s_lower or "not provided" in s_lower or "no permit" in s_lower:
            return "MISSING"
        elif "bypass" in s_lower or "silenced" in s_lower or "jumper" in s_lower or "override" in s_lower:
            return "BYPASSED"
        elif "unverified" in s_lower or "not verified" in s_lower or "not confirmed" in s_lower or "could not be confirmed" in s_lower:
            return "UNVERIFIED"
        elif "mismatch" in s_lower or "rupture" in s_lower or "burst" in s_lower or "snapped" in s_lower or "broke" in s_lower or "leak" in s_lower:
            return "FAILED"
        elif "overdue" in s_lower or "drift" in s_lower or "degraded" in s_lower or "worn" in s_lower or "corroded" in s_lower:
            return "DEGRADED"
        elif "weak" in s_lower or "substandard" in s_lower:
            return "WEAK"

        return "UNVERIFIED"

    def get_barrier_state(self, state_code: str) -> Dict[str, Any]:
        """Returns details for a barrier failure state code."""
        norm_code = self.normalize_barrier_state(state_code)
        for state in self.barrier_states:
            if state["code"] == norm_code:
                return state
        return {"code": "UNVERIFIED", "score": 2, "meaning": "Unverified status", "color": "#f97316"}

    def get_lsr_by_id(self, lsr_id: str) -> Optional[Dict[str, Any]]:
        """Finds Life-Saving Rule by uppercase ID."""
        for r in self.lsr_mappings:
            if r["id"] == lsr_id:
                return r
        return None

normalizer = TaxonomyNormalizer()
