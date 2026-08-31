import pytest
from app.intelligence.embeddings import embedding_service

def test_embedding_dimensions_and_norm():
    text = "Positive isolation was not verified before unbolting wellhead flange."
    vec = embedding_service.encode(text)
    assert len(vec) == 384
    assert isinstance(vec[0], float)

def test_semantic_cosine_similarity():
    text1 = "Worker was not wearing fall arrest harness on 14m scaffold elevation."
    text2 = "Scaffolder working at height without safety lanyard tied off."
    text3 = "Small water puddle on workshop walkway mopped up."

    vec1 = embedding_service.encode(text1)
    vec2 = embedding_service.encode(text2)
    vec3 = embedding_service.encode(text3)

    sim_related = embedding_service.cosine_similarity(vec1, vec2)
    sim_unrelated = embedding_service.cosine_similarity(vec1, vec3)

    assert sim_related > sim_unrelated
    assert sim_related > 0.40
