#!/usr/bin/env python3
"""
Validates the ontology against its own SHACL shapes:
ontology/commongood-atlas.shapes.ttl (hand-authored, structural completeness)
and ontology/commongood-atlas.property-shapes.ttl (generated, per-concept
property constraints -- see docs/06-properties-and-rules.md).

The data graph includes both commongood-atlas.ttl (the schema: concepts,
relationships, properties, business rules) and commongood-atlas.example.ttl
(the worked example's individuals, see docs/07-worked-example.md) -- the
example individuals are typed as instances of real concepts, so the
per-concept property shapes apply to them automatically. An invalid enum
value or a missing required property in the example would fail here.

Run after tools/generate_ontology.py, or as part of CI, to catch any of the
above before they merge.
"""
import sys
from pathlib import Path

from pyshacl import validate
from rdflib import Graph

ROOT = Path(__file__).resolve().parent.parent
DATA_FILES = [
    ROOT / "ontology" / "commongood-atlas.ttl",
    ROOT / "ontology" / "commongood-atlas.example.ttl",
]
SHAPES_FILES = [
    ROOT / "ontology" / "commongood-atlas.shapes.ttl",
    ROOT / "ontology" / "commongood-atlas.property-shapes.ttl",
]


def main():
    data_graph = Graph()
    for f in DATA_FILES:
        data_graph.parse(f, format="turtle")

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
