from fireworks.client import Fireworks
from youtube_transcript_api.formatters import TextFormatter
import re

class llama_Model:
    def modelResponse(content:str):
        formatter = TextFormatter()
        
        text_formatted = formatter.format_transcript(content)
        client = Fireworks(api_key="fw_3ZXWdNPL9SmEHTEAB1DLiHCx")
        response = client.chat.completions.create(
        model="accounts/fireworks/models/llama-v3p1-8b-instruct",
        
        messages=[{
        "role": "user",
        "content": f"""
                    Understand the text delimited by triple backticks \
                    and generate some questions from that.
                    Also mention the answer for the question below the question. Always give answers as clear and concise as possible.
                    Start the question with Question: and answer with Answer: only.
                    ```{text_formatted}```
                    """,
        }],
        )
        text_data = response.choices[0].message.content.strip()
        qa_pairs = [re.sub(r'[^:\?A-Za-z0-9\s]', '', line) for line in text_data.split("\n")]
        questions_and_answers = []
        current_question = None
        
        for line in qa_pairs:
            if line.startswith("Question:"):
                current_question = line[len("Question:"):].strip()
            elif line.startswith("Answer:") and current_question:
                current_answer = line[len("Answer:"):].strip()
                questions_and_answers.append((current_question, current_answer))
                current_question = None
        return questions_and_answers 
    
    
    def generate_summary(text_formatted):
        client = Fireworks(api_key="fw_3ZXWdNPL9SmEHTEAB1DLiHCx")
        response = client.chat.completions.create(
        model="accounts/fireworks/models/llama-v3p1-8b-instruct",
        messages=[{
            "role": "user",
            "content": f"""
                    Understand the text delimited by triple backticks \
                    and generate concise yet informative summary from that.
                    ```{text_formatted}```
                    """,
        }],
        )

        return response.choices[0].message.content