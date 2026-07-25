#!/usr/bin/env python3
"""
Validates ontology/npograph.ttl against the combined SHACL shapes:
ontology/npograph.shapes.ttl (hand-authored, structural completeness) and
ontology/npograph.property-shapes.ttl (generated, per-concept property
constraints -- see docs/06-properties-and-rules.md).

Run after tools/generate_ontology.py, or as part of CI, to catch concepts,
relationships, or properties missing required fields before they merge.
"""
import sys
from pathlib import Path

from pyshacl import validate
from rdflib import Graph

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "ontology" / "npograph.ttl"
SHAPES_FILES = [
    ROOT / "ontology" / "npograph.shapes.ttl",
    ROOT / "ontology" / "npograph.property-shapes.ttl",
]


def main():
    data_graph = Graph().parse(DATA_FILE, format="turtle")

    shapes_graph = Graph()
    for f in SHAPES_FILES:
        shapes_graph.parse(f, format="turtle")

    conforms, results_graph, results_text = validate(
        data_graph,
        shacl_graph=shapes_graph,
        inference="none",
    )

    print(results_text)
    if not conforms:
        print("SHACL validation FAILED.", file=sys.stderr)
        sys.exit(1)

    print("SHACL validation passed.")


if __name__ == "__main__":
    main()
