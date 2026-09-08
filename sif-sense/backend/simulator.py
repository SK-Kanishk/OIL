"""
SIF-Sense AI — Intelligent Procedural Incident Simulator
Generates dynamic, realistic industrial safety reports with randomized dates,
facilities, trades, equipment, and narratives every single time.
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

INDUSTRIES = [
    {
        "name": "Oil & Gas / Refining",
        "sites": [
            "Refinery Unit 4 (FCCU Fluid Cracker)",
            "Offshore Platform Bravo-7 (Drilling Deck)",
            "Crude Oil Distillation Column Area",
            "Sour Gas Sweetening Plant (H2S Unit)",
            "Marine Tanker Offloading Terminal 2",
            "Pipeline Compressor Station #12"
        ],
        "trades": ["Pipefitter", "Process Operator", "Instrument Tech", "Boilermaker", "Insulator", "Flange Specialist"],
        "equipment": ["Sour Gas Flare Header", "High-Pressure Separator Vessel", "Crude Charge Pump P-101", "Amine Contact Tower", "Pig Launcher / Receiver Barrel"]
    },
    {
        "name": "Heavy Manufacturing & Automotive",
        "sites": [
            "Automotive Stamping Bay 3 (Line 4)",
            "Steel Foundry & Continuous Casting Floor",
            "Robotic Welding Cell #18",
            "Heavy Machining & Gear Milling Shop",
            "Sheet Metal Slitting & Shearing Area",
            "Automated Pallet Conveyor Transfer Line"
        ],
        "trades": ["Millwright", "Tool & Die Specialist", "Industrial Electrician", "Maintenance Fitter", "Press Operator", "Robotics Tech"],
        "equipment": ["500-Ton Hydraulic Stamping Press", "In-Running Roller Conveyor C-4", "Overhead Coil Lifter", "Rotary Lathe Chuck", "Robotic Spot Welder Arm"]
    },
    {
        "name": "Construction & Infrastructure",
        "sites": [
            "Bridge Pier Construction Sector B",
            "Commercial High-Rise Scaffolding Level 14",
            "Deep Drainage Trench Excavation Bay 5",
            "Structural Steel Erection Zone West",
            "Tunnel Boring Machine (TBM) Access Shaft",
            "Precast Concrete Staging & Yard"
        ],
        "trades": ["Scaffolder", "Ironworker", "Tower Crane Operator", "Rigger", "Formwork Carpenter", "Excavation Groundworker"],
        "equipment": ["50-Ton Mobile Rough-Terrain Crane", "Suspended Mast Climbing Platform", "Hydraulic Trench Box Shoring", "Concrete Boom Pump Truck", "Four-Leg Wire Rope Sling"]
    },
    {
        "name": "Chemical Processing",
        "sites": [
            "Polymer Reactor Bay Building 2",
            "Bulk Sulfuric Acid Storage Tank Farm",
            "Chlorine Gas Cylinders Manifold Area",
            "Fluidized Bed Drying Unit",
            "Solvent Extraction & Recovery Plant"
        ],
        "trades": ["Chemical Plant Operator", "Hazmat Specialist", "Maintenance Millwright", "Sampling Technician"],
        "equipment": ["Glass-Lined Reaction Vessel", "Positive Displacement Acid Pump", "Corrosive Chemical Scrubbing Tower", "Nitrogen Purge Header"]
    },
    {
        "name": "Power Generation & Utilities",
        "sites": [
            "High-Voltage Substation 9 (Switchyard)",
            "Thermal Power Plant Turbine Hall Deck",
            "480V Motor Control Center (MCC Room 3)",
            "Steam Boiler Feed Pump Gallery",
            "Underground Electrical Cable Vault"
        ],
        "trades": ["High-Voltage Electrician", "Relay Protection Tech", "Turbine Overhaul Fitter", "Cable Splicer"],
        "equipment": ["13.8kV Medium-Voltage Switchgear", "Step-Up Power Transformer", "Steam Turbine High-Pressure Casing", "Air Circuit Breaker Cabinet"]
    },
    {
        "name": "Logistics & Warehousing",
        "sites": [
            "High-Bay Distribution Center Aisle 22",
            "Intermodal Shipping Container Terminal",
            "Cross-Dock Freight Transfer Staging",
            "Automated Storage & Retrieval System (ASRS)"
        ],
        "trades": ["Reach Truck Operator", "Warehouse Marshall", "Inventory Auditor", "Dock Supervisor"],
        "equipment": ["Counterbalance Forklift 3-Ton", "Reach Truck Mast", "Hydraulic Dock Leveler Ramp", "Pallet Inverter"]
    }
]

SHIFTS = [
    "Day Shift (07:00 – 15:30)",
    "Evening Shift (15:00 – 23:30)",
    "Night Shift (23:00 – 07:00)",
    "Turnaround Overhaul Shift (12h Day)",
    "Weekend Maintenance Shutdown"
]

CRITICAL_SIF_TEMPLATES = [
    "A {trade} at {site} was clearing a jammed component on the {equipment} while the system was still energized. The worker's glove was caught in the rotating nip points, resulting in a traumatic amputation of two fingers and severe crushing trauma.",
    "While performing maintenance on the {equipment} at {site}, a {trade} entered the area without Lockout/Tagout isolation. The machinery cycled unexpectedly, trapping and fracturing the technician's arm against the structural frame.",
    "At {site}, a {trade} was working from an elevated platform at 22 feet height to service the {equipment}. The worker unclipped their harness to reposition, lost balance, and fell to the concrete slab below, sustaining severe cranial trauma and multiple fractured ribs.",
    "During an overhaul at {site}, a {trade} entered a confined space inside {equipment} without atmospheric gas testing or an entry permit. The worker encountered high concentrations of toxic gas/H2S and collapsed due to asphyxiation, requiring emergency standby extraction.",
    "An electrician / {trade} at {site} was troubleshooting the {equipment} with the panel cover removed. A dropped screwdriver contacted live 480V busbars, triggering an explosive arc flash that caused second and third-degree thermal burns to the face and torso.",
    "At {site}, an overhead lift of a 4-ton load using {equipment} suffered a synthetic sling failure. The suspended load dropped onto the walkway below, striking a {trade} and pinning them against an adjacent stanchion with severe pelvic and lower-limb crushing fractures.",
    "A {trade} was working inside an 8-foot deep trench at {site} adjacent to {equipment} with no trench shoring box installed. An adjacent wall collapsed without warning, burying the worker up to the chest and causing traumatic asphyxia."
]

HIGH_RISK_NEAR_MISS_TEMPLATES = [
    "During pre-shift inspection at {site}, a safety auditor discovered that a {trade} had bypassed the safety interlock switch on the {equipment} to run continuous testing without machine guarding in place. Near miss stopped immediately.",
    "At {site}, a {trade} was observed working at an unguarded platform edge at 18 feet elevation without clipping their fall arrest harness lanyard to an approved anchor point while inspecting {equipment}.",
    "A {trade} at {site} opened the manway cover of {equipment} without a signed Confined Space Entry Permit. Atmospheric gas monitor was powered off. Supervisor intervened before entry was initiated.",
    "Technicians at {site} were working on the {equipment} under the assumption that electrical isolation was complete. A voltage test revealed the secondary breaker was still energized at 480V. Lockout/Tagout was improperly applied.",
    "At {site}, a crane was lifting a 3-ton pipe bundle directly above workers walking through the laydown area. The exclusion zone was not barricaded. Rigging tag line snapped, causing the load to swing violently.",
    "A hot work welding operation on {equipment} at {site} commenced without a gas sniffer test or fire watch. Combustible solvent drums were located 4 meters away."
]

MEDIUM_PRECURSOR_TEMPLATES = [
    "A {trade} at {site} slipped on hydraulic oil leaking from {equipment} onto the metal grating. Worker caught handrail to prevent fall, suffering a strained shoulder and wrist contusion.",
    "During shift handover at {site}, operators noted that emergency stop button on {equipment} was sticking and failed to trigger instantly during functional test. Work halted for recalibration.",
    "A forklift operating near {site} struck a temporary bollard while maneuvering around {equipment}. No injuries, but structural guard suffered cosmetic deformation.",
    "Contractor at {site} was observed using a damaged grinding disc with visible hairline cracks on {equipment}. Guard was present but disc was immediately confiscated."
]

LOW_RISK_OBSERVATIONS = [
    "Routine housekeeping audit at {site} noted several discarded cardboard boxes and empty plastic wrapping near the entrance of {equipment} room. Area cleared within 15 minutes.",
    "Safety observation at {site}: Lighting fixture above the pedestrian walkway near {equipment} was flickering. Work order submitted for LED replacement.",
    "During daily tool check at {site}, a {trade} identified that a 10-meter extension cord had faded inspection tags. Cord was tested, found electrically sound, and retagged.",
    "A minor water puddle was observed beneath the breakroom cooler at {site}. Cleaned up and slip caution sign posted."
]


def generate_random_date(days_back: int = 14) -> Dict[str, Any]:
    """Generate a realistic randomized date and time within the past N days."""
    now = datetime.now()
    random_seconds = random.randint(0, days_back * 86400)
    event_time = now - timedelta(seconds=random_seconds)
    
    # Specific realistic shift hours
    hour = event_time.hour
    if 7 <= hour < 15:
        shift_guess = SHIFTS[0]
    elif 15 <= hour < 23:
        shift_guess = SHIFTS[1]
    else:
        shift_guess = SHIFTS[2]
        
    return {
        "iso": event_time.strftime("%Y-%m-%dT%H:%M:%S"),
        "formatted": event_time.strftime("%b %d, %Y • %H:%M:%S"),
        "date_only": event_time.strftime("%Y-%m-%d"),
        "time_only": event_time.strftime("%H:%M"),
        "shift": shift_guess
    }


def generate_incident(severity_type: str = "ANY") -> Dict[str, Any]:
    """
    Procedurally generate a complete, unique incident record every time.
    
    severity_type: "ANY" | "CRITICAL_SIF" | "HIGH_RISK_NEAR_MISS" | "MEDIUM_PRECURSOR" | "LOW_OBSERVATION"
    """
    industry_data = random.choice(INDUSTRIES)
    site = random.choice(industry_data["sites"])
    trade = random.choice(industry_data["trades"])
    equipment = random.choice(industry_data["equipment"])
    
    date_info = generate_random_date(days_back=random.randint(1, 30))
    
    # Select category
    sev_upper = severity_type.upper()
    if sev_upper == "CRITICAL_SIF":
        cat = "CRITICAL_SIF"
    elif sev_upper in ["HIGH_RISK_NEAR_MISS", "NEAR_MISS"]:
        cat = "HIGH_RISK_NEAR_MISS"
    elif sev_upper in ["MEDIUM_PRECURSOR", "MEDIUM"]:
        cat = "MEDIUM_PRECURSOR"
    elif sev_upper in ["LOW_OBSERVATION", "LOW"]:
        cat = "LOW_OBSERVATION"
    else:
        # Weighted random distribution representing real facility reporting
        roll = random.random()
        if roll < 0.45:
            cat = "CRITICAL_SIF"
        elif roll < 0.75:
            cat = "HIGH_RISK_NEAR_MISS"
        elif roll < 0.90:
            cat = "MEDIUM_PRECURSOR"
        else:
            cat = "LOW_OBSERVATION"

    # Pick narrative template and inject dynamic tokens
    if cat == "CRITICAL_SIF":
        template = random.choice(CRITICAL_SIF_TEMPLATES)
        badge_label = "CRITICAL SIF"
        expected_sif = True
        severity_level = "CRITICAL"
    elif cat == "HIGH_RISK_NEAR_MISS":
        template = random.choice(HIGH_RISK_NEAR_MISS_TEMPLATES)
        badge_label = "HIGH-POTENTIAL NEAR MISS"
        expected_sif = True
        severity_level = "HIGH"
    elif cat == "MEDIUM_PRECURSOR":
        template = random.choice(MEDIUM_PRECURSOR_TEMPLATES)
        badge_label = "MEDIUM RISK PRECURSOR"
        expected_sif = False
        severity_level = "MEDIUM"
    else:
        template = random.choice(LOW_RISK_OBSERVATIONS)
        badge_label = "LOW RISK / OBSERVATION"
        expected_sif = False
        severity_level = "LOW"

    narrative = template.format(
        site=site,
        trade=trade,
        equipment=equipment
    )

    incident_id = f"SIM-{random.randint(1000, 9999)}-{random.choice(['A', 'B', 'C', 'X'])}"

    return {
        "id": incident_id,
        "uuid": str(uuid.uuid4())[:8],
        "event_date": date_info["formatted"],
        "event_date_iso": date_info["iso"],
        "date_only": date_info["date_only"],
        "time_only": date_info["time_only"],
        "shift": date_info["shift"],
        "industry": industry_data["name"],
        "site": site,
        "trade": trade,
        "equipment": equipment,
        "category": badge_label,
        "severity_level": severity_level,
        "expected_sif": expected_sif,
        "narrative": narrative,
        "generated_at": datetime.now().isoformat()
    }


def generate_batch(count: int = 5, severity_type: str = "ANY") -> List[Dict[str, Any]]:
    """Generate a batch of unique simulated incidents across dates."""
    incidents = []
    for _ in range(count):
        incidents.append(generate_incident(severity_type))
    # Sort chronologically
    incidents.sort(key=lambda x: x["event_date_iso"], reverse=True)
    return incidents
