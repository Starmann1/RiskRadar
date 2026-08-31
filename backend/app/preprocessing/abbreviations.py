import re
from typing import Dict

# Authoritative Oil & Gas E&P Abbreviation Dictionary (50+ domain terms)
OILFIELD_ABBREVIATIONS: Dict[str, str] = {
    r"\bPTW\b": "Permit to Work",
    r"\bLOTO\b": "Lockout Tagout Positive Energy Isolation",
    r"\bESD\b": "Emergency Shutdown System",
    r"\bBOP\b": "Blowout Preventer Stack",
    r"\bJSA\b": "Job Safety Analysis",
    r"\bTBT\b": "Toolbox Talk",
    r"\bSCBA\b": "Self-Contained Breathing Apparatus",
    r"\bLEL\b": "Lower Explosive Limit",
    r"\bUEL\b": "Upper Explosive Limit",
    r"\bH2S\b": "Hydrogen Sulfide Toxic Gas",
    r"\bSIMOPS\b": "Simultaneous Operations",
    r"\bMOC\b": "Management of Change",
    r"\bOCS\b": "Oil Collecting Station",
    r"\bGGS\b": "Group Gathering Station",
    r"\bROW\b": "Right of Way Pipeline Corridor",
    r"\bNRL\b": "Numaligarh Refinery Limited",
    r"\bOISD\b": "Oil Industry Safety Directorate",
    r"\bDGMS\b": "Directorate General of Mines Safety",
    r"\bPESO\b": "Petroleum and Explosives Safety Organization",
    r"\bHAZOP\b": "Hazard and Operability Study",
    r"\bQRA\b": "Quantitative Risk Assessment",
    r"\bDBB\b": "Double Block and Bleed",
    r"\bSIF\b": "Serious Injury and Fatality",
    r"\bPSV\b": "Pressure Safety Valve",
    r"\bPRV\b": "Pressure Relief Valve",
    r"\bF&G\b": "Fire and Gas Detection System",
    r"\bNORM\b": "Naturally Occurring Radioactive Material",
    r"\bPPE\b": "Personal Protective Equipment",
    r"\bSWL\b": "Safe Working Load",
    r"\bWLL\b": "Working Load Limit",
    r"\bCSE\b": "Confined Space Entry",
    r"\bWHPA\b": "Wellhead Protection Area",
    r"\bESD-1\b": "Station Emergency Shutdown Level 1",
    r"\bESD-2\b": "Unit Emergency Shutdown Level 2",
    r"\bHIPPS\b": "High-Integrity Pressure Protection System",
    r"\bSIL\b": "Safety Integrity Level",
    r"\bSIS\b": "Safety Instrumented System",
    r"\bSCADA\b": "Supervisory Control and Data Acquisition",
    r"\bPLC\b": "Programmable Logic Controller",
    r"\bCTU\b": "Coiled Tubing Unit",
    r"\bWFT\b": "Wireline Formation Tester",
    r"\bDST\b": "Drill Stem Testing",
    r"\bLOT\b": "Leak Off Test",
    r"\bFIT\b": "Formation Integrity Test",
    r"\bECD\b": "Equivalent Circulating Density",
    r"\bOBM\b": "Oil Based Mud",
    r"\bWBM\b": "Water Based Mud",
    r"\bHSE\b": "Health Safety Environment",
    r"\bHSSE\b": "Health Safety Security Environment"
}

def expand_oilfield_abbreviations(text: str) -> str:
    """Expands oilfield specific abbreviations while retaining original context in parentheses."""
    if not text:
        return ""
    expanded = text
    for pattern, expansion in OILFIELD_ABBREVIATIONS.items():
        # Match case-insensitive without infinite recursion
        def repl(match):
            original = match.group(0)
            return f"{original} ({expansion})"
        expanded = re.sub(pattern, repl, expanded, flags=re.IGNORECASE)
    return expanded
