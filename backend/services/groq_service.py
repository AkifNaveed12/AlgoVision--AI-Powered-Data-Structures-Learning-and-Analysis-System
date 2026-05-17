from groq import Groq
from fastapi import HTTPException
from backend.config import settings
import json

client = Groq(api_key=settings.GROQ_API_KEY)

SYSTEM_PROMPT = """You are AlgoVision's AI Tutor, an expert computer science teacher specializing in data structures and algorithms. You help students understand concepts clearly.

Rules:
- Give concise, educational answers
- Use simple analogies when explaining complex concepts
- If asked about code, provide working Python examples
- Keep responses under 200 words unless a detailed explanation is requested
- Always relate your answer back to the data structure the student is currently studying

Current context: {context}"""


def ask_tutor(question: str, context: dict = None) -> dict:
    """
    Query Groq LLaMA 3 70B with a student question and optional context.
    Returns answer + follow_up_questions.
    """
    context_str = (
        f"Structure: {context.get('current_structure', 'general')}, "
        f"Operation: {context.get('current_operation', 'none')}, "
        f"Step: {context.get('current_step', 'N/A')}"
        if context else "general study session"
    )

    # Sanitize: truncate at 500 chars
    question = question.strip()[:500]

    try:
        # Main answer
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT.format(context=context_str)},
                {"role": "user", "content": question},
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        answer = response.choices[0].message.content

        # Follow-up questions
        try:
            follow_up_response = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Generate exactly 2 short follow-up questions a student might ask next. "
                            "Return ONLY a JSON array of 2 strings. No other text, no markdown."
                        ),
                    },
                    {"role": "user", "content": f"Original question: {question}\nAnswer: {answer}"},
                ],
                temperature=0.5,
                max_tokens=200,
            )
            raw = follow_up_response.choices[0].message.content.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            follow_ups = json.loads(raw)
            if not isinstance(follow_ups, list):
                follow_ups = []
        except Exception:
            follow_ups = []

        return {"answer": answer, "follow_up_questions": follow_ups}

    except Exception as e:
        err_str = str(e).lower()
        if "api key" in err_str or "authentication" in err_str or "unauthorized" in err_str:
            raise HTTPException(status_code=503, detail="AI Tutor service unavailable — invalid API key")
        if "rate limit" in err_str:
            raise HTTPException(status_code=503, detail="AI Tutor rate limit reached. Please try again in a moment.")
        raise HTTPException(status_code=503, detail=f"AI Tutor service error: {str(e)}")
