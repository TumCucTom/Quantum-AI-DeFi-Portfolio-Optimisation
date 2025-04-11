import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

QUANTUM_CONTEXT = (
    "You are a Quantum DeFi Research Assistant. "
    "Provide concise, technically accurate answers for quantum algorithms like QAOA, quantum order routing, latency-aware slicing, "
    "and financial applications of quantum computing in DeFi."
)

def quantum_prompt(user_input: str) -> str:
    return f"{QUANTUM_CONTEXT}\nUser: {user_input}\nAssistant:"

def query_groq(prompt: str, model="llama3-70b-8192") -> str:
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
