import os
import json
import logging
from typing import Dict, Any, Optional, Protocol, Union

logger = logging.getLogger("riskradar.llm_client")

class LLMProvider(Protocol):
    """Protocol interface for interchangeable LLM providers."""
    def complete_structured(
        self,
        system_prompt: str,
        task_prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.0
    ) -> Dict[str, Any]:
        ...

class MockLLMProvider:
    """Mock provider for unit tests, offline demos, and CI environments."""
    def __init__(self, mock_response: Optional[Dict[str, Any]] = None):
        self.mock_response = mock_response

    def complete_structured(
        self,
        system_prompt: str,
        task_prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.0
    ) -> Dict[str, Any]:
        if self.mock_response:
            return self.mock_response
        return {
            "activity": "mechanical_electrical_maintenance",
            "location_mentioned": None,
            "hazards": [
                {
                    "canonical_or_raw_term": "stored_pressurized_energy",
                    "energy_type": "pressure",
                    "energy_level": 3,
                    "evidence_span": "Residual pressure was present in the line."
                }
            ],
            "energy_type": "pressure",
            "energy_level": 3,
            "exposure": {
                "present": True,
                "description": "Personnel positioned near flange",
                "proximity": 2,
                "evidence_span": "Worker positioned near the flange noticed a slight release."
            },
            "barriers": [
                {
                    "name": "positive_energy_isolation",
                    "status_description": "not verified before work started",
                    "barrier_status": "UNVERIFIED",
                    "evidence_span": "Positive isolation was not verified with a pressure test before flange breaking commenced."
                }
            ],
            "potential_consequence": "Hydrocarbon release with projectile or flash fire potential",
            "negations_detected": [],
            "contradictions_detected": [],
            "uncertainties": [],
            "confidence": 0.95
        }

class OpenAIProvider:
    """OpenAI API Provider with structured JSON output enforcement."""
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini"):
        import openai
        self.client = openai.OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))
        self.model = model

    def complete_structured(
        self,
        system_prompt: str,
        task_prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.0
    ) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": task_prompt}
        ]
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=temperature
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)

class AnthropicProvider:
    """Anthropic Claude API Provider with structured JSON output enforcement."""
    def __init__(self, api_key: Optional[str] = None, model: str = "claude-3-5-haiku-20241022"):
        import anthropic
        self.client = anthropic.Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
        self.model = model

    def complete_structured(
        self,
        system_prompt: str,
        task_prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.0
    ) -> Dict[str, Any]:
        prompt = f"{system_prompt}\n\nStrictly output valid JSON matching the requested schema.\n\n{task_prompt}"
        response = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())

class GeminiProvider:
    """Google Gemini API Provider via standard HTTP / Google SDK."""
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-1.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model

    def complete_structured(
        self,
        system_prompt: str,
        task_prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.0
    ) -> Dict[str, Any]:
        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_prompt}\n\nTask:\n{task_prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "response_mime_type": "application/json"
            }
        }
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(raw_text)

def get_llm_provider() -> LLMProvider:
    """Factory function: Selects the appropriate LLM provider based on environment variables."""
    provider_type = os.getenv("LLM_PROVIDER", "").lower()
    
    if (provider_type == "openai" or os.getenv("OPENAI_API_KEY")) and provider_type != "mock":
        try:
            return OpenAIProvider()
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI provider: {e}")

    if (provider_type == "anthropic" or os.getenv("ANTHROPIC_API_KEY")) and provider_type != "mock":
        try:
            return AnthropicProvider()
        except Exception as e:
            logger.warning(f"Failed to initialize Anthropic provider: {e}")

    if (provider_type == "gemini" or os.getenv("GEMINI_API_KEY")) and provider_type != "mock":
        try:
            return GeminiProvider()
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini provider: {e}")

    # Default to Mock Provider when no live keys are configured
    return MockLLMProvider()
