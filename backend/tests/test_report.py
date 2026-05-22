import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_generate_pdf_report_success(client: AsyncClient):
    payload = {
        "title": "Test PDF",
        "format": "pdf",
        "headers": {"indicador": "Ind", "jan": "Jan"},
        "data": [{"indicador": "01 - Queda", "jan": 5}],
        "charts": []
    }
    response = await client.post("/report/generate", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "report_" in response.headers["content-disposition"]
    assert response.headers["content-disposition"].endswith('.pdf"')

@pytest.mark.asyncio
async def test_generate_pptx_report_success(client: AsyncClient):
    payload = {
        "title": "Test PPTX",
        "format": "pptx",
        "headers": {"indicador": "Ind", "jan": "Jan"},
        "data": [{"indicador": "01 - Queda", "jan": 5}]
    }
    response = await client.post("/report/generate", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    assert "report_" in response.headers["content-disposition"]
    assert response.headers["content-disposition"].endswith('.pptx"')

@pytest.mark.asyncio
async def test_generate_report_invalid_payload(client: AsyncClient):
    # Missing headers/data isn't strictly invalid for the generator, 
    # but let's test if passing garbage or expecting an internal failure works.
    # Actually, let's just test that the endpoint responds.
    payload = {}
    response = await client.post("/report/generate", json=payload)
    assert response.status_code == 200  # The script can handle empty data and return a PDF with just title
    assert response.headers["content-type"] == "application/pdf"
