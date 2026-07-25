#!/usr/bin/env python3
"""
Generates ontology/npograph.{ttl,rdf,nt,jsonld}, ontology/context.jsonld, and
ontology/npograph.property-shapes.ttl from the canonical, hand-maintained JSON
in ontology/source/.

Do not hand-edit the generated files under ontology/ -- edit the JSON files in
ontology/source/ instead, then re-run this script. See docs/05-data-model.md
and docs/06-properties-and-rules.md for the full policy.

Output must be byte-reproducible across machines/CI so the drift check in
.github/workflows/ontology.yml is meaningful. rdflib's RDF/XML and JSON-LD
serializers iterate internal sets whose order isn't guaranteed stable across
Python/rdflib versions or processes, so npograph.rdf and npograph.jsonld are
built directly from the sorted source data instead of via g.serialize(). The
main Turtle and N-Triples outputs use rdflib's serializer (verified stable
across seeds/environments for a graph with no blank nodes), but the property
shapes file uses SHACL property shapes and RDF list nodes for sh:in, both of
which are blank-node-based -- rdflib's Turtle serializer's blank node/list
ordering is NOT guaranteed stable there, so that file is hand-built as text
from the sorted source data too, same as the RDF/XML and JSON-LD outputs.
"""
import json
import xml.etree.ElementTree as ET
from pathlib import Path

from rdflib import Graph, Literal, Namespace, OWL, RDF, RDFS, URIRef, XSD
from rdflib.namespace import SKOS

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "ontology" / "source"
OUT_DIR = ROOT / "ontology"

BASE = "https://egovender.github.io/NPOGraph/ontology/"
REL_BASE = BASE + "relations/"
PROP_BASE = BASE + "properties/"
RULE_BASE = BASE + "rules/"
NPO = Namespace(BASE)
NPOREL = Namespace(REL_BASE)
NPOPROP = Namespace(PROP_BASE)
NPORULE = Namespace(RULE_BASE)

RDF_NS = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
RDFS_NS = "http://www.w3.org/2000/01/rdf-schema#"
OWL_NS = "http://www.w3.org/2002/07/owl#"
SKOS_NS = "http://www.w3.org/2004/02/skos/core#"
XSD_NS = "http://www.w3.org/2001/XMLSchema#"

ONTOLOGY_COMMENT = (
    "Generated from ontology/source/*.json. Do not hand-edit. "
    "See docs/05-data-model.md and docs/06-properties-and-rules.md."
)

DATATYPE_TO_XSD = {
    "string": XSD.string,
    "decimal": XSD.decimal,
    "date": XSD.date,
    "boolean": XSD.boolean,
    # Enum values are represented as plain strings; the allowed set is
    # enforced by SHACL sh:in, not by an OWL-level datatype restriction.
    "enum": XSD.string,
}


def load_source():
    concepts = json.loads((SOURCE_DIR / "concepts.json").read_text())
    relationships = json.loads((SOURCE_DIR / "relationships.json").read_text())
    properties = json.loads((SOURCE_DIR / "properties.json").read_text())
    business_rules = json.loads((SOURCE_DIR / "business-rules.json").read_text())
    meta = json.loads((SOURCE_DIR / "meta.json").read_text())

    concepts = sorted(concepts, key=lambda c: c["id"])
    relationships = sorted(relationships, key=lambda r: r["id"])
    properties = sorted(properties, key=lambda p: p["id"])
    business_rules = sorted(business_rules, key=lambda r: r["id"])

    concept_ids = {c["id"] for c in concepts}
    assert len(concept_ids) == len(concepts), "duplicate concept id"
    rel_ids = [r["id"] for r in relationships]
    assert len(set(rel_ids)) == len(rel_ids), "duplicate relationship id"
    predicates = [r["predicate"] for r in relationships]
    assert len(set(predicates)) == len(predicates), "duplicate relationship predicate"

    prop_ids = [p["id"] for p in properties]
    assert len(set(prop_ids)) == len(prop_ids), "duplicate property id"
    for p in properties:
        assert p["concept"] in concept_ids, f"unknown concept in property {p['id']}"
        assert p["datatype"] in DATATYPE_TO_XSD, f"unknown datatype in property {p['id']}"
        if p["datatype"] == "enum":
            assert p["allowedValues"], f"enum property missing allowedValues: {p['id']}"
        else:
            assert p["allowedValues"] is None, f"non-enum property has allowedValues: {p['id']}"

    rule_ids = [r["id"] for r in business_rules]
    assert len(set(rule_ids)) == len(rule_ids), "duplicate business rule id"
    for r in business_rules:
        for cid in r["concepts"]:
            assert cid in concept_ids, f"unknown concept in business rule {r['id']}"

    return concepts, relationships, properties, business_rules, meta


def doc_url(doc_ref: str) -> str:
    return "https://github.com/EGovender/NPOGraph/blob/main/" + doc_ref


def concept_iri(concept_id: str) -> URIRef:
    return NPO[concept_id]


def relation_iri(predicate: str) -> URIRef:
    return NPOREL[predicate]


def property_iri(property_id: str) -> URIRef:
    return NPOPROP[property_id]


def rule_iri(rule_id: str) -> URIRef:
    return NPORULE[rule_id]


def build_graph(concepts, relationships, properties, business_rules, meta) -> Graph:
    """Used for the Turtle and N-Triples outputs (both verified deterministic)."""
    g = Graph()
    g.bind("npo", NPO)
    g.bind("nporel", NPOREL)
    g.bind("npoprop", NPOPROP)
    g.bind("nporule", NPORULE)
    g.bind("owl", OWL)
    g.bind("rdfs", RDFS)
    g.bind("skos", SKOS)

    ontology_iri = URIRef(BASE.rstrip("/"))
    g.add((ontology_iri, RDF.type, OWL.Ontology))
    g.add((ontology_iri, RDFS.label, Literal("NPOGraph Grantmaking Ontology")))
    g.add((ontology_iri, RDFS.comment, Literal(ONTOLOGY_COMMENT)))
    g.add((ontology_iri, NPO.version, Literal(meta["version"])))

    # rdfs:Class, not owl:Class -- ConceptShape targets owl:Class for actual
    # domain concepts, and BusinessRule is a meta-class for rule instances,
    # not a concept itself (it has no definition/category/docRef of its own).
    g.add((NPO.BusinessRule, RDF.type, RDFS.Class))
    g.add((NPO.BusinessRule, RDFS.label, Literal("Business Rule")))

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

    for p in properties:
        iri = property_iri(p["id"])
        g.add((iri, RDF.type, OWL.DatatypeProperty))
        g.add((iri, RDFS.label, Literal(p["label"])))
        g.add((iri, RDFS.comment, Literal(p["description"])))
        g.add((iri, RDFS.domain, concept_iri(p["concept"])))
        g.add((iri, RDFS.range, DATATYPE_TO_XSD[p["datatype"]]))
        g.add((iri, NPO.group, Literal(p["group"])))
        g.add((iri, NPO.required, Literal(p["required"])))
        g.add((iri, NPO.cardinality, Literal(p["cardinality"])))
        for value in p.get("allowedValues") or []:
            g.add((iri, NPO.allowedValue, Literal(value)))

    for r in business_rules:
        iri = rule_iri(r["id"])
        g.add((iri, RDF.type, NPO.BusinessRule))
        g.add((iri, RDFS.label, Literal(r["label"])))
        g.add((iri, RDFS.comment, Literal(r["description"])))
        g.add((iri, RDFS.isDefinedBy, URIRef(doc_url(r["docRef"]))))
        for cid in r["concepts"]:
            g.add((iri, NPO.appliesTo, concept_iri(cid)))

    return g


def turtle_string(s: str) -> str:
    """Turtle triple-quoted string literal, safe for text containing quotes
    or apostrophes without needing per-character escaping."""
    return '"""' + s.replace("\\", "\\\\") + '"""'


def build_property_shapes_text(properties) -> str:
    """Per-concept SHACL PropertyShapes enforcing required-ness, datatype, and
    allowed values for each attribute in properties.json. Generated -- see
    docs/06-properties-and-rules.md. Kept separate from the hand-authored
    ontology/npograph.shapes.ttl, which validates the ontology's own
    structural completeness rather than per-concept business data.

    Built as text, not an rdflib Graph, because SHACL property shapes and the
    RDF list underlying sh:in are blank-node structures whose serialized
    order rdflib does not guarantee stable across environments."""
    by_concept: dict[str, list] = {}
    for p in properties:
        by_concept.setdefault(p["concept"], []).append(p)

    lines = [
        "@prefix sh: <http://www.w3.org/ns/shacl#> .",
        f"@prefix npo: <{BASE}> .",
        f"@prefix npoprop: <{PROP_BASE}> .",
        f"@prefix xsd: <{XSD_NS}> .",
        "",
    ]

    for concept_id in sorted(by_concept):
        prop_blocks = []
        for p in sorted(by_concept[concept_id], key=lambda p: p["id"]):
            xsd_local = DATATYPE_TO_XSD[p["datatype"]].rsplit("#", 1)[-1]
            parts = [
                f"sh:path npoprop:{p['id']}",
                f"sh:datatype xsd:{xsd_local}",
                f"sh:minCount {1 if p['required'] else 0}",
            ]
            if p["cardinality"] == "one":
                parts.append("sh:maxCount 1")
            if p["allowedValues"]:
                values = " ".join(turtle_string(v) for v in p["allowedValues"])
                parts.append(f"sh:in ( {values} )")
            prop_blocks.append("[ " + " ; ".join(parts) + " ]")

        lines.append(f"npo:{concept_id}-property-shape")
        lines.append("    a sh:NodeShape ;")
        lines.append(f"    sh:targetClass npo:{concept_id} ;")
        lines.append("    sh:property " + " ,\n        ".join(prop_blocks) + " .")
        lines.append("")

    return "\n".join(lines).rstrip("\n") + "\n"


def write_turtle_and_ntriples(g: Graph):
    ttl = g.serialize(format="turtle")
    (OUT_DIR / "npograph.ttl").write_text(ttl.rstrip("\n") + "\n")

    nt_lines = sorted(g.serialize(format="nt").strip().splitlines())
    (OUT_DIR / "npograph.nt").write_text("\n".join(nt_lines) + "\n")


def write_property_shapes(properties):
    header = (
        "# Generated by tools/generate_ontology.py from ontology/source/properties.json.\n"
        "# Do not hand-edit -- see docs/06-properties-and-rules.md.\n\n"
    )
    (OUT_DIR / "npograph.property-shapes.ttl").write_text(
        header + build_property_shapes_text(properties)
    )


def write_rdf_xml(concepts, relationships, properties, business_rules, meta):
    for prefix, uri in (("rdf", RDF_NS), ("rdfs", RDFS_NS), ("owl", OWL_NS),
                        ("skos", SKOS_NS), ("npo", BASE), ("nporel", REL_BASE),
                        ("npoprop", PROP_BASE), ("nporule", RULE_BASE)):
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
    ET.SubElement(ontology_el, qname(BASE, "version")).text = meta["version"]

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

    for p in properties:
        desc = ET.SubElement(root, qname(RDF_NS, "Description"),
                              {qname(RDF_NS, "about"): str(property_iri(p["id"]))})
        ET.SubElement(desc, qname(RDF_NS, "type"),
                      {qname(RDF_NS, "resource"): OWL_NS + "DatatypeProperty"})
        ET.SubElement(desc, qname(RDFS_NS, "label")).text = p["label"]
        ET.SubElement(desc, qname(RDFS_NS, "comment")).text = p["description"]
        ET.SubElement(desc, qname(RDFS_NS, "domain"),
                      {qname(RDF_NS, "resource"): str(concept_iri(p["concept"]))})
        ET.SubElement(desc, qname(RDFS_NS, "range"),
                      {qname(RDF_NS, "resource"): str(DATATYPE_TO_XSD[p["datatype"]])})
        ET.SubElement(desc, qname(BASE, "group")).text = p["group"]
        ET.SubElement(desc, qname(BASE, "required")).text = str(p["required"]).lower()
        ET.SubElement(desc, qname(BASE, "cardinality")).text = p["cardinality"]
        for value in p.get("allowedValues") or []:
            ET.SubElement(desc, qname(BASE, "allowedValue")).text = value

    for r in business_rules:
        desc = ET.SubElement(root, qname(RDF_NS, "Description"),
                              {qname(RDF_NS, "about"): str(rule_iri(r["id"]))})
        ET.SubElement(desc, qname(RDF_NS, "type"),
                      {qname(RDF_NS, "resource"): BASE + "BusinessRule"})
        ET.SubElement(desc, qname(RDFS_NS, "label")).text = r["label"]
        ET.SubElement(desc, qname(RDFS_NS, "comment")).text = r["description"]
        ET.SubElement(desc, qname(RDFS_NS, "isDefinedBy"),
                      {qname(RDF_NS, "resource"): doc_url(r["docRef"])})
        for cid in r["concepts"]:
            ET.SubElement(desc, qname(BASE, "appliesTo"),
                          {qname(RDF_NS, "resource"): str(concept_iri(cid))})

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
        "npoprop": PROP_BASE,
        "nporule": RULE_BASE,
        "owl": "http://www.w3.org/2002/07/owl#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "skos": "http://www.w3.org/2004/02/skos/core#",
        "xsd": XSD_NS,
        "label": "rdfs:label",
        "definition": "skos:definition",
        "altLabel": "skos:altLabel",
        "category": "npo:category",
        "comment": "rdfs:comment",
        "version": "npo:version",
        "group": "npo:group",
        "required": {"@id": "npo:required", "@type": "xsd:boolean"},
        "cardinality": "npo:cardinality",
        "allowedValues": "npo:allowedValue",
        "subClassOf": {"@id": "rdfs:subClassOf", "@type": "@id"},
        "domain": {"@id": "rdfs:domain", "@type": "@id"},
        "range": {"@id": "rdfs:range", "@type": "@id"},
        "isDefinedBy": {"@id": "rdfs:isDefinedBy", "@type": "@id"},
        "appliesTo": {"@id": "npo:appliesTo", "@type": "@id", "@container": "@set"},
        "type": "@type",
        "id": "@id",
    }


def write_jsonld(concepts, relationships, properties, business_rules, meta):
    context = jsonld_context()
    (OUT_DIR / "context.jsonld").write_text(
        json.dumps({"@context": context}, indent=2, sort_keys=True) + "\n"
    )

    graph_nodes = [
        {
            "id": BASE.rstrip("/"),
            "type": "owl:Ontology",
            "label": "NPOGraph Grantmaking Ontology",
            "comment": ONTOLOGY_COMMENT,
            "version": meta["version"],
        }
    ]

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

    for p in properties:
        node = {
            "id": "npoprop:" + p["id"],
            "type": "owl:DatatypeProperty",
            "label": p["label"],
            "comment": p["description"],
            "domain": "npo:" + p["concept"],
            "range": "xsd:" + DATATYPE_TO_XSD[p["datatype"]].rsplit("#", 1)[-1],
            "group": p["group"],
            "required": p["required"],
            "cardinality": p["cardinality"],
        }
        if p.get("allowedValues"):
            node["allowedValues"] = p["allowedValues"]
        graph_nodes.append(node)

    for r in business_rules:
        graph_nodes.append({
            "id": "nporule:" + r["id"],
            "type": "npo:BusinessRule",
            "label": r["label"],
            "comment": r["description"],
            "isDefinedBy": doc_url(r["docRef"]),
            "appliesTo": ["npo:" + cid for cid in r["concepts"]],
        })

    document = {"@context": context, "@graph": graph_nodes}
    (OUT_DIR / "npograph.jsonld").write_text(
        json.dumps(document, indent=2) + "\n"
    )


def main():
    concepts, relationships, properties, business_rules, meta = load_source()

    g = build_graph(concepts, relationships, properties, business_rules, meta)
    write_turtle_and_ntriples(g)
    write_rdf_xml(concepts, relationships, properties, business_rules, meta)
    write_jsonld(concepts, relationships, properties, business_rules, meta)

    write_property_shapes(properties)

    print(f"Generated ontology from {len(concepts)} concepts, "
          f"{len(relationships)} relationships, {len(properties)} properties, "
          f"and {len(business_rules)} business rules.")
    for name in ("npograph.ttl", "npograph.rdf", "npograph.nt", "context.jsonld",
                 "npograph.jsonld", "npograph.property-shapes.ttl"):
        print(f"  ontology/{name}")


if __name__ == "__main__":
    main()
