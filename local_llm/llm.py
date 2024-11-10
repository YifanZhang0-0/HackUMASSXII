from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from unicall.server import typed, serve

# loading model, wrapper is created and run once
checkpoint = "HuggingFaceTB/SmolLM2-1.7B-Instruct"
device = 'mps' if torch.backends.mps.is_available() else 'cpu'

tokenizer = AutoTokenizer.from_pretrained(checkpoint)
model = AutoModelForCausalLM.from_pretrained(checkpoint).to(device)

@typed(str, returns=str)
def ask_model(question):

    messages = [{"role": "user", "content": f"{question}? Answer concisely in 1 to 2 sentences."}]
    input_text = tokenizer.apply_chat_template(messages, tokenize=False)
    inputs = tokenizer.encode(input_text, return_tensors="pt").to(device)

    outputs = model.generate(inputs, pad_token_id=tokenizer.pad_token_id, max_new_tokens=50, temperature=0.2, top_p=0.9, do_sample=True)

    model_answer = tokenizer.decode(outputs[0])
    return model_answer.split("assistant")[-1].split('<')[0]

serve()