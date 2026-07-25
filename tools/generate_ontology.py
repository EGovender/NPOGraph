#!/usr/bin/env python3
"""
Generates ontology/npograph.{ttl,rdf,nt,jsonld} and ontology/context.jsonld
from the canonical, hand-maintained JSON in ontology/source/.

Do not hand-edit the generated files under ontology/ -- edit
ontology/source/concepts.json and ontology/source/relationships.json instead,
then re-run this script. See docs/05-data-model.md for the full policy.
"""
import os
import sys

# rdflib's RDF/XML serializer iterates a set() of subjects, whose order
# depends on Python's per-process string hash randomization. Without a fixed
# seed, two runs over identical input produce byte-different (but semantically
# equivalent) npograph.rdf -- which breaks the CI drift check and makes diffs
# noisy. Re-exec with a fixed seed if it isn't already set, so generation is
# byte-reproducible regardless of how this script is invoked.
if os.environ.get("PYTHONHASHSEED") != "0":
    os.environ["PYTHONHASHSEED"] = "0"
    os.execvpe(sys.executable, [sys.executable, __file__] + sys.argv[1:], os.environ)

import json
from pathlib import Path

from rdflib import Graph, Namespace, Literal, RDF, RDFS, OWL, URIRef
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "ontology" / "source"
OUT_DIR = ROOT / "ontology"

BASE = "https://egovender.github.io/NPOGraph/ontology/"
NPO = Namespace(BASE)
NPOREL = Namespace(BASE + "relations/")


def concept_iri(concept_id: str) -> URIRef:
    return NPO[concept_id]


def relation_iri(predicate: str) -> URIRef:
    return NPOREL[predicate]


def build_graph(concepts, relationships) -> Graph:
    g = Graph()
    g.bind("npo", NPO)
    g.bind("nporel", NPOREL)
    g.bind("owl", OWL)
    g.bind("rdfs", RDFS)
    g.bind("skos", SKOS)

    ontology_iri = URIRef(BASE.rstrip("/"))
    g.add((ontology_iri, RDF.type, OWL.Ontology))
    g.add((ontology_iri, RDFS.label, Literal("NPOGraph Grantmaking Ontology")))
    g.add((
        ontology_iri,
        RDFS.comment,
        Literal(
            "Generated from ontology/source/*.json. Do not hand-edit. "
            "See docs/05-data-model.md."
        ),
    ))

    for c in concepts:
        iri = concept_iri(c["id"])
        g.add((iri, RDF.type, OWL.Class))
        g.add((iri, RDFS.label, Literal(c["label"])))
        g.add((iri, SKOS.definition, Literal(c["definition"])))
        g.add((iri, NPO.category, Literal(c["category"])))
        g.add((iri, RDFS.isDefinedBy, URIRef(
            "https://github.com/EGovender/NPOGraph/blob/main/" + c["docRef"]
        )))
        for alias in c.get("aliases", []):
            g.add((iri, SKOS.altLabel, Literal(alias)))
        if c.get("subClassOf"):
            g.add((iri, RDFS.subClassOf, concept_iri(c["subClassOf"])))

    for r in relationships:
        iri = relation_iri(r["predicate"])
        g.add((iri, RDF.type, OWL.ObjectProperty))
        g.add((iri, RDFS.label, Literal(r["label"])))
        g.add((iri, RDFS.comment, Literal(r["description"])))
        g.add((iri, RDFS.domain, concept_iri(r["subject"])))
        g.add((iri, RDFS.range, concept_iri(r["object"])))
        g.add((iri, RDFS.isDefinedBy, URIRef(
            "https://github.com/EGovender/NPOGraph/blob/main/" + r["docRef"]
        )))

    return g


def write_jsonld(g: Graph):
    context = {
        "@version": 1.1,
        "npo": BASE,
        "nporel": BASE + "relations/",
        "owl": "http://www.w3.org/2002/07/owl#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "skos": "http://www.w3.org/2004/02/skos/core#",
        "label": "rdfs:label",
        "definition": "skos:definition",
        "altLabel": "skos:altLabel",
        "category": "npo:category",
        "comment": "rdfs:comment",
        "subClassOf": {"@id": "rdfs:subClassOf", "@type": "@id"},
        "domain": {"@id": "rdfs:domain", "@type": "@id"},
        "range": {"@id": "rdfs:range", "@type": "@id"},
        "isDefinedBy": {"@id": "rdfs:isDefinedBy", "@type": "@id"},
        "type": "@type",
        "id": "@id",
    }
    (OUT_DIR / "context.jsonld").write_text(
        json.dumps({"@context": context}, indent=2, sort_keys=True) + "\n"
    )

    jsonld_str = g.serialize(format="json-ld", context=context, indent=2)
    (OUT_DIR / "npograph.jsonld").write_text(jsonld_str.rstrip("\n") + "\n")


def main():
    concepts = json.loads((SOURCE_DIR / "concepts.json").read_text())
    relationships = json.loads((SOURCE_DIR / "relationships.json").read_text())

    g = build_graph(concepts, relationships)

    ttl = g.serialize(format="turtle")
    (OUT_DIR / "npograph.ttl").write_text(ttl.rstrip("\n") + "\n")

    rdfxml = g.serialize(format="xml")
    (OUT_DIR / "npograph.rdf").write_text(rdfxml.rstrip("\n") + "\n")

    nt_lines = sorted(g.serialize(format="nt").strip().splitlines())
    (OUT_DIR / "npograph.nt").write_text("\n".join(nt_lines) + "\n")

    write_jsonld(g)

    print(f"Generated ontology from {len(concepts)} concepts and "
          f"{len(relationships)} relationships.")
    for name in ("npograph.ttl", "npograph.rdf", "npograph.nt",
                 "context.jsonld", "npograph.jsonld"):
        print(f"  ontology/{name}")


if __name__ == "__main__":
    main()
