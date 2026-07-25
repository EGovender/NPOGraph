#!/usr/bin/env python3
"""
Generates ontology/npograph.{ttl,rdf,nt,jsonld} and ontology/context.jsonld
from the canonical, hand-maintained JSON in ontology/source/.

Do not hand-edit the generated files under ontology/ -- edit
ontology/source/concepts.json and ontology/source/relationships.json instead,
then re-run this script. See docs/05-data-model.md for the full policy.

Output must be byte-reproducible across machines/CI so the drift check in
.github/workflows/ontology.yml is meaningful. rdflib's RDF/XML and JSON-LD
serializers iterate internal sets whose order isn't guaranteed stable across
Python/rdflib versions or processes, so npograph.rdf and npograph.jsonld are
built directly from the sorted source data instead of via g.serialize(). Only
Turtle and N-Triples use rdflib's serializer, and N-Triples is explicitly
sorted -- both have been verified stable across seeds/environments.
"""
import json
import xml.etree.ElementTree as ET
from pathlib import Path

from rdflib import Graph, Namespace, Literal, RDF, RDFS, OWL, URIRef
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "ontology" / "source"
OUT_DIR = ROOT / "ontology"

BASE = "https://egovender.github.io/NPOGraph/ontology/"
REL_BASE = BASE + "relations/"
NPO = Namespace(BASE)
NPOREL = Namespace(REL_BASE)

RDF_NS = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
RDFS_NS = "http://www.w3.org/2000/01/rdf-schema#"
OWL_NS = "http://www.w3.org/2002/07/owl#"
SKOS_NS = "http://www.w3.org/2004/02/skos/core#"

ONTOLOGY_COMMENT = (
    "Generated from ontology/source/*.json. Do not hand-edit. "
    "See docs/05-data-model.md."
)


def load_source():
    concepts = json.loads((SOURCE_DIR / "concepts.json").read_text())
    relationships = json.loads((SOURCE_DIR / "relationships.json").read_text())

    concepts = sorted(concepts, key=lambda c: c["id"])
    relationships = sorted(relationships, key=lambda r: r["id"])

    concept_ids = [c["id"] for c in concepts]
    assert len(set(concept_ids)) == len(concept_ids), "duplicate concept id"
    rel_ids = [r["id"] for r in relationships]
    assert len(set(rel_ids)) == len(rel_ids), "duplicate relationship id"
    predicates = [r["predicate"] for r in relationships]
    assert len(set(predicates)) == len(predicates), "duplicate relationship predicate"

    return concepts, relationships


def doc_url(doc_ref: str) -> str:
    return "https://github.com/EGovender/NPOGraph/blob/main/" + doc_ref


def concept_iri(concept_id: str) -> URIRef:
    return NPO[concept_id]


def relation_iri(predicate: str) -> URIRef:
    return NPOREL[predicate]


def build_graph(concepts, relationships) -> Graph:
    """Used for the Turtle and N-Triples outputs (both verified deterministic)."""
    g = Graph()
    g.bind("npo", NPO)
    g.bind("nporel", NPOREL)
    g.bind("owl", OWL)
    g.bind("rdfs", RDFS)
    g.bind("skos", SKOS)

    ontology_iri = URIRef(BASE.rstrip("/"))
    g.add((ontology_iri, RDF.type, OWL.Ontology))
    g.add((ontology_iri, RDFS.label, Literal("NPOGraph Grantmaking Ontology")))
    g.add((ontology_iri, RDFS.comment, Literal(ONTOLOGY_COMMENT)))

    for c in concepts:
        iri = concept_iri(c["id"])
        g.add((iri, RDF.type, OWL.Class))
        g.add((iri, RDFS.label, Literal(c["label"])))
        g.add((iri, SKOS.definition, Literal(c["definition"])))
        g.add((iri, NPO.category, Literal(c["category"])))
        g.add((iri, RDFS.isDefinedBy, URIRef(doc_url(c["docRef"]))))
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
        g.add((iri, RDFS.isDefinedBy, URIRef(doc_url(r["docRef"]))))

    return g


def write_turtle_and_ntriples(g: Graph):
    ttl = g.serialize(format="turtle")
    (OUT_DIR / "npograph.ttl").write_text(ttl.rstrip("\n") + "\n")

    nt_lines = sorted(g.serialize(format="nt").strip().splitlines())
    (OUT_DIR / "npograph.nt").write_text("\n".join(nt_lines) + "\n")


def write_rdf_xml(concepts, relationships):
    for prefix, uri in (("rdf", RDF_NS), ("rdfs", RDFS_NS), ("owl", OWL_NS),
                        ("skos", SKOS_NS), ("npo", BASE), ("nporel", REL_BASE)):
        ET.register_namespace(prefix, uri)

    def qname(ns, local):
        return f"{{{ns}}}{local}"

    root = ET.Element(qname(RDF_NS, "RDF"))

    ontology_el = ET.SubElement(root, qname(RDF_NS, "Description"),
                                 {qname(RDF_NS, "about"): BASE.rstrip("/")})
    ET.SubElement(ontology_el, qname(RDF_NS, "type"),
                  {qname(RDF_NS, "resource"): OWL_NS + "Ontology"})
    ET.SubElement(ontology_el, qname(RDFS_NS, "label")).text = "NPOGraph Grantmaking Ontology"
    ET.SubElement(ontology_el, qname(RDFS_NS, "comment")).text = ONTOLOGY_COMMENT

    for c in concepts:
        desc = ET.SubElement(root, qname(RDF_NS, "Description"),
                              {qname(RDF_NS, "about"): str(concept_iri(c["id"]))})
        ET.SubElement(desc, qname(RDF_NS, "type"),
                      {qname(RDF_NS, "resource"): OWL_NS + "Class"})
        ET.SubElement(desc, qname(RDFS_NS, "label")).text = c["label"]
        ET.SubElement(desc, qname(SKOS_NS, "definition")).text = c["definition"]
        ET.SubElement(desc, qname(BASE, "category")).text = c["category"]
        ET.SubElement(desc, qname(RDFS_NS, "isDefinedBy"),
                      {qname(RDF_NS, "resource"): doc_url(c["docRef"])})
        for alias in sorted(c.get("aliases", [])):
            ET.SubElement(desc, qname(SKOS_NS, "altLabel")).text = alias
        if c.get("subClassOf"):
            ET.SubElement(desc, qname(RDFS_NS, "subClassOf"),
                          {qname(RDF_NS, "resource"): str(concept_iri(c["subClassOf"]))})

    for r in relationships:
        desc = ET.SubElement(root, qname(RDF_NS, "Description"),
                              {qname(RDF_NS, "about"): str(relation_iri(r["predicate"]))})
        ET.SubElement(desc, qname(RDF_NS, "type"),
                      {qname(RDF_NS, "resource"): OWL_NS + "ObjectProperty"})
        ET.SubElement(desc, qname(RDFS_NS, "label")).text = r["label"]
        ET.SubElement(desc, qname(RDFS_NS, "comment")).text = r["description"]
        ET.SubElement(desc, qname(RDFS_NS, "domain"),
                      {qname(RDF_NS, "resource"): str(concept_iri(r["subject"]))})
        ET.SubElement(desc, qname(RDFS_NS, "range"),
                      {qname(RDF_NS, "resource"): str(concept_iri(r["object"]))})
        ET.SubElement(desc, qname(RDFS_NS, "isDefinedBy"),
                      {qname(RDF_NS, "resource"): doc_url(r["docRef"])})

    ET.indent(root, space="  ")
    body = ET.tostring(root, encoding="unicode")
    (OUT_DIR / "npograph.rdf").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n' + body + "\n"
    )


def jsonld_context() -> dict:
    return {
        "@version": 1.1,
        "npo": BASE,
        "nporel": REL_BASE,
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


def write_jsonld(concepts, relationships):
    context = jsonld_context()
    (OUT_DIR / "context.jsonld").write_text(
        json.dumps({"@context": context}, indent=2, sort_keys=True) + "\n"
    )

    graph_nodes = []
    for c in concepts:
        node = {
            "id": "npo:" + c["id"],
            "type": "owl:Class",
            "label": c["label"],
            "definition": c["definition"],
            "category": c["category"],
            "isDefinedBy": doc_url(c["docRef"]),
        }
        if c.get("aliases"):
            node["altLabel"] = sorted(c["aliases"])
        if c.get("subClassOf"):
            node["subClassOf"] = "npo:" + c["subClassOf"]
        graph_nodes.append(node)

    for r in relationships:
        graph_nodes.append({
            "id": "nporel:" + r["predicate"],
            "type": "owl:ObjectProperty",
            "label": r["label"],
            "comment": r["description"],
            "domain": "npo:" + r["subject"],
            "range": "npo:" + r["object"],
            "isDefinedBy": doc_url(r["docRef"]),
        })

    document = {"@context": context, "@graph": graph_nodes}
    (OUT_DIR / "npograph.jsonld").write_text(
        json.dumps(document, indent=2) + "\n"
    )


def main():
    concepts, relationships = load_source()

    g = build_graph(concepts, relationships)
    write_turtle_and_ntriples(g)
    write_rdf_xml(concepts, relationships)
    write_jsonld(concepts, relationships)

    print(f"Generated ontology from {len(concepts)} concepts and "
          f"{len(relationships)} relationships.")
    for name in ("npograph.ttl", "npograph.rdf", "npograph.nt",
                 "context.jsonld", "npograph.jsonld"):
        print(f"  ontology/{name}")


if __name__ == "__main__":
    main()
