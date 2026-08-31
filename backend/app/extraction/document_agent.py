import re
import io
import csv
import zlib
import uuid
import base64
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

from app.schemas.domain import (
    ExtractionResult,
    ReportCreateRequest,
    ReportType,
    ActualSeverity,
    BarrierStatusEnum
)
from app.extraction.extractor import extractor
from app.scoring.sif_engine import score_sif
from app.rules.iogp_mapper import map_iogp_rules
from app.chain.chain_builder import build_precursor_chain


class DocumentIngestionAgent:
    """
    Intelligent Safety Document & File Ingestion Agent.
    Natively parses PDF reports, extracts text and embedded raster images/photos,
    automatically extracts domain entities (Site, Date, Activity, Energy, Barriers),
    and executes the complete 5-Factor SIF classification and Bowtie Precursor Chain pipeline.
    """

    KNOWN_NON_INCIDENT_LOGO_HASHES = {
        "de5c00fdf2f9f5d5", "be2aebbaf9701c9c", "19a13568e2286a1e",
        "0f44002895725a65", "08b2fef7810f775f", "2ff4043a9299be54",
        "04c42ae23e2a7434", "88732381c29041c2", "1415c603d59fc1f6",
        "26b20c91dfbb01c3", "0e16e3a20ba4ea0a", "c98ad1334237ef55",
        "951bb09215f91e7b", "99f7fb9f9a8820af", "802f873d9fb40756",
        "ec53df31daa0999b", "2fadd06593e97c88", "3e56057f6b2578d9",
        "2733ef31d9274630", "53345be3bf654b55", "eb9e7650183c34c5",
        "4fb6d0a64015a77b", "fb46471ee0c5742a", "d33ab68e07ca7635",
        "dc53438b6edf40bd", "b98a1fa4841759e8", "656df4d5ea875039",
        "50d58ca0a315b50e", "54b4fe3ddd2ebca3", "f6c58a5be97b7730",
        "401112e0561a2ae9", "5b6b61fd58ee3416", "ef7632fb0aafb076"
    }

    def _is_non_incident_logo_or_banner(self, img_data: bytes, page_idx: int) -> bool:
        """
        Detects and filters out non-incident document graphics, header banners,
        and organizational emblems (e.g. OISD gold header banner, ISO 9001:2015 emblem).
        """
        # 1. Byte size threshold (skip tiny bullets/icons)
        if len(img_data) < 3500:
            return True

        # 2. Known logo hash match
        h_prefix = hashlib.sha256(img_data).hexdigest()[:16]
        if h_prefix in self.KNOWN_NON_INCIDENT_LOGO_HASHES:
            return True

        try:
            from PIL import Image
            with Image.open(io.BytesIO(img_data)) as pil_img:
                w, h = pil_img.size

                # Minimum viable dimensions for evidence photo
                if w < 140 or h < 110:
                    return True

                aspect = w / max(h, 1)
                # Filter extreme aspect ratios (lines, thin borders, header rules)
                if aspect > 4.5 or (1 / aspect) > 4.5:
                    return True

                # Low total pixel area
                if w * h < 16000:
                    return True

                # OISD Golden Header Banner (Large horizontal header banner on Page 1 / cover)
                if page_idx == 0 and aspect >= 2.8 and w >= 500:
                    return True

                if aspect >= 3.0 and aspect <= 5.2 and h <= 550:
                    im_rgb = pil_img.convert("RGB")
                    pixels = [im_rgb.getpixel((int(w * fx), int(h * fy))) for fx in [0.1, 0.5, 0.9] for fy in [0.1, 0.5, 0.9]]
                    gold_count = sum(1 for (r, g, b) in pixels if r > 130 and g > 100 and b < 165)
                    if gold_count >= 3:
                        return True

                # OISD Emblem & ISO 9001:2015 Logo (Cover/Page 1 organizational seal)
                if page_idx == 0:
                    if w <= 360 and h <= 450:
                        return True
                    if 0.60 <= aspect <= 1.05:
                        im_rgb = pil_img.convert("RGB")
                        p_top = im_rgb.getpixel((w // 2, int(h * 0.15)))
                        p_bot = im_rgb.getpixel((w // 2, int(h * 0.9)))
                        # Check bottom has white background (ISO section) or top has gold/flame tones
                        if (p_bot[0] > 200 and p_bot[1] > 200 and p_bot[2] > 200) or (p_top[0] > 150 and p_top[1] > 100):
                            return True
        except Exception:
            return True

        return False

    KNOWN_OIL_SITES = [
        ("Moran Oilfield Well #84", ["moran", "well #84", "well 84", "moran oilfield"]),
        ("Field Site 4 - Duliajan Central", ["duliajan", "duliajan central", "site 4", "field site 4"]),
        ("Naharkatiya OCS Central", ["naharkatiya", "ocs central", "naharkatia"]),
        ("NRL Hydrocracker Unit 2", ["nrl", "numaligarh", "hydrocracker", "refinery"]),
        ("Rajasthan Basin Well #14", ["rajasthan", "tanot", "jaisalmer", "western asset"]),
        ("KG Basin Offshore Platform Bravo", ["kg basin", "offshore", "platform bravo", "kakinada"]),
        ("Trunk Pipeline PS7 - Barauni", ["trunk pipeline", "pipeline", "ps7", "barauni", "pump station"]),
        ("Digboi Heritage Wellhead 12", ["digboi", "heritage wellhead", "wellhead 12"]),
        ("Jorajan GGS-3 Gathering Station", ["jorajan", "ggs-3", "gathering station"]),
        ("Kumchai Field Arunachal Pradesh", ["kumchai", "arunachal"])
    ]

    ACTIVITY_KEYWORDS = {
        "mechanical_electrical_maintenance": [
            "flange", "unbolting", "valve", "pipe", "spool", "line breaking", "pump",
            "compressor", "gasket", "turbine", "loto", "isolation", "blind", "bleeder",
            "maintenance", "overhaul", "fitting", "mechanic"
        ],
        "lifting_rigging": [
            "crane", "lift", "rigging", "sling", "hoist", "shackle", "casing bundle",
            "suspended load", "slew", "crane hook", "boom", "mobile crane", "tagline"
        ],
        "work_at_height": [
            "monkey board", "derrick", "mast", "scaffold", "scaffolding", "elevation",
            "harness", "lanyard", "fall arrest", "ladder", "working at height", "14m", "10m"
        ],
        "confined_space_entry": [
            "confined space", "tank", "vessel entry", "pit", "manhole", "mud tank",
            "mixing tank", "gas detector", "scba", "oxygen", "toxic", "h2s"
        ],
        "hot_work_welding": [
            "welding", "grinding", "cutting", "hot work", "torch", "oxy-acetylene",
            "spark", "fire watch", "fire blanket", "habitat"
        ],
        "simultaneous_operations": [
            "simops", "concurrent", "simultaneous", "crane over welding", "lift over habitat",
            "multi-activity", "co-activity"
        ],
        "exploration_drilling": [
            "drilling", "bop", "blowout", "kick", "mud weight", "top drive", "drill string",
            "casing", "well control", "rotary table"
        ]
    }

    # =========================================================================
    # 1. PDF TEXT & EMBEDDED IMAGE EXTRACTION
    # =========================================================================

    def extract_text_and_images_from_pdf(self, pdf_bytes: bytes) -> Tuple[str, List[str]]:
        """
        Extracts clean text and embedded raster images (JPEG/PNG) from binary PDF data.
        Returns: (extracted_text, list_of_base64_data_uris)
        """
        text_content = ""
        extracted_images: List[str] = []

        # Strategy A: pypdf library
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            for page_idx, page in enumerate(reader.pages):
                # Text extraction
                extracted = page.extract_text()
                if extracted:
                    text_content += extracted + "\n"

                # Image extraction (Strictly filters out logos, icons, and banner graphics)
                try:
                    for img_file in page.images:
                        try:
                            img_data = img_file.data
                            if self._is_non_incident_logo_or_banner(img_data, page_idx):
                                continue

                            ext = img_file.name.split(".")[-1].lower() if "." in img_file.name else "jpg"
                            mime = "image/jpeg" if ext in ("jpg", "jpeg") else ("image/png" if ext == "png" else "image/webp")
                            b64 = base64.b64encode(img_data).decode("utf-8")
                            extracted_images.append(f"data:{mime};base64,{b64}")
                            if len(extracted_images) >= 6:
                                break
                        except Exception:
                            pass
                except Exception:
                    pass
        except Exception:
            pass

        # Strategy B: Built-in PDF stream parser with zlib FlateDecode fallback
        if not text_content.strip():
            try:
                stream_pattern = re.compile(rb"stream[\r\n]+([\s\S]*?)[\r\n]+endstream")
                matches = stream_pattern.findall(pdf_bytes)
                for raw_stream in matches:
                    decompressed = None
                    try:
                        decompressed = zlib.decompress(raw_stream)
                    except Exception:
                        try:
                            decompressed = zlib.decompress(raw_stream, -zlib.MAX_WBITS)
                        except Exception:
                            decompressed = raw_stream

                    if decompressed:
                        tj_matches = re.findall(rb"\(([\s\S]*?)\)\s*Tj", decompressed)
                        for tj in tj_matches:
                            try:
                                text_content += tj.decode("utf-8", errors="ignore") + " "
                            except Exception:
                                pass
            except Exception:
                pass

        # Strategy C: Direct ascii/utf-8 text extraction fallback
        if not text_content.strip():
            try:
                raw_str = pdf_bytes.decode("utf-8", errors="ignore")
                clean_raw = re.sub(r"[^\x20-\x7E\n\r\t]", " ", raw_str)
                words = [w for w in clean_raw.split() if len(w) > 2 and not w.startswith("/")]
                text_content = " ".join(words[:200])
            except Exception:
                text_content = "Safety Observation Log extracted from uploaded document."

        return text_content.strip(), extracted_images

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        text, _ = self.extract_text_and_images_from_pdf(pdf_bytes)
        return text

        # Strategy B: Built-in PDF stream parser with zlib FlateDecode
        try:
            stream_pattern = re.compile(rb"stream[\r\n]+([\s\S]*?)[\r\n]+endstream")
            matches = stream_pattern.findall(pdf_bytes)
            for raw_stream in matches:
                decompressed = None
                try:
                    decompressed = zlib.decompress(raw_stream)
                except Exception:
                    try:
                        decompressed = zlib.decompress(raw_stream, -zlib.MAX_WBITS)
                    except Exception:
                        decompressed = raw_stream

                if decompressed:
                    # Extract text inside (text) Tj or [(text)] TJ
                    tj_matches = re.findall(rb"\(([\s\S]*?)\)\s*Tj", decompressed)
                    for tj in tj_matches:
                        try:
                            text_content += tj.decode("utf-8", errors="ignore") + " "
                        except Exception:
                            pass

                    # Extract array strings
                    array_matches = re.findall(rb"\[([\s\S]*?)\]\s*TJ", decompressed)
                    for arr in array_matches:
                        sub_strs = re.findall(rb"\(([\s\S]*?)\)", arr)
                        for s in sub_strs:
                            try:
                                text_content += s.decode("utf-8", errors="ignore") + " "
                            except Exception:
                                pass
        except Exception:
            pass

        # Strategy C: Direct ascii/utf-8 text extraction from raw bytes
        if not text_content.strip():
            try:
                raw_str = pdf_bytes.decode("utf-8", errors="ignore")
                clean_raw = re.sub(r"[^\x20-\x7E\n\r\t]", " ", raw_str)
                # Keep words longer than 3 chars
                words = [w for w in clean_raw.split() if len(w) > 2 and not w.startswith("/")]
                text_content = " ".join(words[:200])
            except Exception:
                text_content = "Safety Observation Log extracted from uploaded document."

        return text_content.strip()

    # =========================================================================
    # 2. CSV / SPREADSHEET INGESTION (Automatic Column Mapping)
    # =========================================================================

    def parse_csv_file(self, csv_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Parses CSV data with automatic column sniffing and robust encoding support.
        Supports standard HSE logs with varying column naming schemes.
        """
        # Try different encodings
        content = None
        for enc in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
            try:
                content = csv_bytes.decode(enc)
                break
            except Exception:
                continue

        if not content:
            content = csv_bytes.decode("utf-8", errors="ignore")

        # Detect dialect / delimiter
        sample = content[:2048]
        delimiter = ","
        if "\t" in sample and sample.count("\t") > sample.count(","):
            delimiter = "\t"
        elif ";" in sample and sample.count(";") > sample.count(","):
            delimiter = ";"
        elif "|" in sample and sample.count("|") > sample.count(","):
            delimiter = "|"

        reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)
        rows: List[Dict[str, Any]] = []

        for row in reader:
            if not row:
                continue

            # Normalize keys to lowercase stripped
            norm_row = {k.strip().lower().replace(" ", "_"): (v.strip() if v else "") for k, v in row.items() if k}

            # Find narrative column
            narrative = ""
            for key in ["narrative_text", "narrative", "description", "details", "observation", "incident_details", "summary", "text", "event_description"]:
                if key in norm_row and norm_row[key]:
                    narrative = norm_row[key]
                    break

            if not narrative:
                # Combine all values
                narrative = " ".join([v for v in norm_row.values() if len(v) > 10])

            if not narrative or len(narrative.strip()) < 5:
                continue

            # Find site
            site = "Field Site 4 - Duliajan Central"
            for key in ["site", "location", "installation", "facility", "asset", "rig", "well"]:
                if key in norm_row and norm_row[key]:
                    site = norm_row[key]
                    break

            # Find activity
            activity = None
            for key in ["activity", "operation", "task", "job", "work_type"]:
                if key in norm_row and norm_row[key]:
                    activity = norm_row[key]
                    break

            # Find date
            report_date = datetime.now().strftime("%Y-%m-%d")
            for key in ["report_date", "date", "incident_date", "timestamp", "event_date"]:
                if key in norm_row and norm_row[key]:
                    report_date = norm_row[key]
                    break

            # Find report type
            report_type = "NEAR_MISS"
            for key in ["report_type", "type", "category", "classification"]:
                if key in norm_row and norm_row[key]:
                    val = norm_row[key].upper()
                    if "NEAR" in val:
                        report_type = "NEAR_MISS"
                    elif "UA" in val or "UNSAFE ACT" in val:
                        report_type = "UA"
                    elif "UC" in val or "UNSAFE COND" in val:
                        report_type = "UC"
                    elif "INCIDENT" in val or "ACCIDENT" in val:
                        report_type = "INCIDENT"
                    break

            # Find contractor
            contractor_involved = True
            for key in ["contractor", "contractor_involved", "third_party"]:
                if key in norm_row and norm_row[key]:
                    val = norm_row[key].lower()
                    contractor_involved = val in ("true", "1", "yes", "y")
                    break

            rows.append({
                "narrative_text": narrative,
                "site": site,
                "activity": activity,
                "report_date": report_date,
                "report_type": report_type,
                "contractor_involved": contractor_involved
            })

        return rows

    # =========================================================================
    # 3. INTELLIGENT DOCUMENT METADATA AGENT
    # =========================================================================

    def infer_document_metadata(self, raw_text: str, filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyzes raw document text (e.g. HSE flash report, permit sheet, or inspection audit)
        and extracts structured metadata including Site, Date, Activity, Report Type, and Clean Narrative.
        """
        text_lower = raw_text.lower()

        # 1. Detect Site
        detected_site = "Field Site 4 - Duliajan Central"
        for site_name, aliases in self.KNOWN_OIL_SITES:
            if any(alias in text_lower for alias in aliases):
                detected_site = site_name
                break

        # Check for explicit "Site:" or "Location:"
        site_match = re.search(r"(?:site|location|installation|facility)\s*[:\-]\s*([A-Za-z0-9\s#\-]+?)(?:\n|\r|\.|\,|$)", raw_text, re.IGNORECASE)
        if site_match:
            candidate = site_match.group(1).strip()
            if len(candidate) > 3 and len(candidate) < 50:
                detected_site = candidate

        # 2. Detect Activity
        detected_activity = "mechanical_electrical_maintenance"
        max_score = 0
        for act, keywords in self.ACTIVITY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > max_score:
                max_score = score
                detected_activity = act

        # Check for explicit "Activity:" or "Operation:"
        act_match = re.search(r"(?:activity|operation|task|work type)\s*[:\-]\s*([A-Za-z0-9\s_\-]+?)(?:\n|\r|\.|\,|$)", raw_text, re.IGNORECASE)
        if act_match:
            candidate_act = act_match.group(1).strip().lower().replace(" ", "_")
            if candidate_act in self.ACTIVITY_KEYWORDS:
                detected_activity = candidate_act

        # 3. Detect Date
        detected_date = datetime.now().strftime("%Y-%m-%d")
        date_match = re.search(r"\b(202[0-9][\-\/][0-1][0-9][\-\/][0-3][0-9])\b", raw_text)
        if date_match:
            detected_date = date_match.group(1).replace("/", "-")
        else:
            date_match2 = re.search(r"\b([0-3]?[0-9][\-\/][0-1]?[0-9][\-\/]202[0-9])\b", raw_text)
            if date_match2:
                parts = re.split(r"[\-\/]", date_match2.group(1))
                if len(parts) == 3:
                    detected_date = f"{parts[2]}-{int(parts[1]):02d}-{int(parts[0]):02d}"

        # 4. Detect Report Type (UA vs UC vs NEAR_MISS vs INCIDENT)
        report_type = ReportType.NEAR_MISS
        if any(w in text_lower for w in ["first-aid", "first aid", "hospital", "injury sustained", "fracture", "cut on hand", "bruise", "medical treatment", "lost time", "spill of 50"]):
            report_type = ReportType.INCIDENT
        elif any(w in text_lower for w in ["without securing", "without wearing", "without gas testing", "without permit", "without signing", "without authorization", "entered without", "working without", "using mobile", "stood beneath", "stood under", "bypassed", "silenced alarm", "unsafe act", "behavioral"]):
            report_type = ReportType.UA
        elif any(w in text_lower for w in ["corroded", "corrosion", "worn sling", "damaged guard", "missing guard", "oil puddle", "wet walkway", "loose bolt", "defective", "frayed wire", "unsafe condition", "slippery surface", "pothole"]):
            report_type = ReportType.UC
        elif any(w in text_lower for w in ["near miss", "ejection", "ejected", "swung over", "stepped back", "narrowly avoided", "dropped pipe", "sudden release", "alarm triggered", "flash report"]):
            report_type = ReportType.NEAR_MISS

        # 5. Clean narrative text
        clean_text = raw_text.strip()
        # Remove repeated header labels if any
        clean_text = re.sub(r"^(?:OIL INDIA LIMITED|HSE FLASH REPORT|INCIDENT REPORT|SAFETY OBSERVATION)[\s:\-]+", "", clean_text, flags=re.IGNORECASE)

        # 6. Generate Title
        title = f"{detected_site} — {detected_activity.replace('_', ' ').title()}"
        if filename:
            clean_fn = filename.replace(".pdf", "").replace(".csv", "").replace(".txt", "").replace("_", " ")
            title = f"{clean_fn[:45]} ({detected_site})"

        return {
            "site": detected_site,
            "activity": detected_activity,
            "report_date": detected_date,
            "report_type": report_type,
            "contractor_involved": "contractor" in text_lower or "third-party" in text_lower or "vendor" in text_lower,
            "actual_severity": ActualSeverity.NONE,
            "narrative_text": clean_text if len(clean_text) > 15 else raw_text,
            "title": title
        }

    # =========================================================================
    # 4. FULL PIPELINE EXECUTION FOR SINGLE / BATCH FILES
    # =========================================================================

    def process_document(
        self,
        file_bytes: bytes,
        filename: str,
        override_site: Optional[str] = None,
        override_activity: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Universal document processing agent.
        Accepts PDF, CSV, TXT, or JSON files, extracts text/rows,
        runs deterministic extraction & SIF scoring, maps IOGP rules,
        and constructs Bowtie Precursor Chains.
        """
        fn_lower = filename.lower()
        items_to_process: List[Dict[str, Any]] = []

        if fn_lower.endswith(".csv"):
            # Multi-row or single-row CSV
            csv_rows = self.parse_csv_file(file_bytes)
            for row in csv_rows:
                items_to_process.append(row)
        elif fn_lower.endswith(".pdf"):
            # PDF Document with Text & Embedded Image Extraction
            extracted_text, extracted_images = self.extract_text_and_images_from_pdf(file_bytes)
            meta = self.infer_document_metadata(extracted_text, filename)
            meta["extracted_images"] = extracted_images
            items_to_process.append(meta)
        else:
            # Plain Text / Log / Other
            try:
                text = file_bytes.decode("utf-8", errors="ignore")
            except Exception:
                text = str(file_bytes)
            meta = self.infer_document_metadata(text, filename)
            meta["extracted_images"] = []
            items_to_process.append(meta)

        processed_records: List[Dict[str, Any]] = []

        from app.pipeline import pipeline

        for item in items_to_process:
            site = override_site or item.get("site") or "Field Site 4 - Duliajan Central"
            activity = override_activity or item.get("activity") or "mechanical_electrical_maintenance"
            narrative = item.get("narrative_text") or "Safety observation recorded."
            report_date = item.get("report_date") or datetime.now().strftime("%Y-%m-%d")
            report_type = item.get("report_type") or "NEAR_MISS"
            contractor_involved = item.get("contractor_involved", True)
            actual_severity = item.get("actual_severity") or "NONE"
            extracted_images = item.get("extracted_images", [])

            r_id = f"OIL-DOC-{uuid.uuid4().hex[:6].upper()}"
            ext_ref = f"DOC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

            record = pipeline.process_report(
                narrative_text=narrative,
                site=site,
                activity=activity,
                report_date=report_date,
                report_type=report_type.value if hasattr(report_type, "value") else str(report_type),
                actual_severity=actual_severity.value if hasattr(actual_severity, "value") else str(actual_severity),
                contractor_involved=contractor_involved,
                external_ref=ext_ref,
                report_id=r_id,
                extracted_images=extracted_images,
                difficulty_category="document_agent_ingested"
            )
            record["title"] = item.get("title") or f"{site} — Ingested Safety Document"
            record["source_file"] = filename

            processed_records.append(record)

        return processed_records

# Singleton Instance
document_agent = DocumentIngestionAgent()
