from typing import cast

import torch

from PIL import Image
from colpali_engine.models import ColPali, ColPaliProcessor

model_name = "vidore/colpali-v1.2"

model = ColPali.from_pretrained(
    model_name,
    torch_dtype=torch.bfloat16,
    device_map="cuda:0",
).eval()

processor = ColPaliProcessor.from_pretrained(model_name)

images = [
    Image.new("RGB", (32, 32), color="white"),
    Image.new("RGB", (32, 32), color="black")
]

queries= [
    "Is attnetion really all you need?",
    "Are Benjamin, Antoine, Merve and Jo best friends?"
]

batch_images = processor.process_images(images).to(model.device)
batch_queries = processor.process_queries(queries).to(model.device)

with torch.no_grad():
    image_embeddings = model(**batch_images)
    query_embeddings = model(**batch_queries)

scores = processor.score_multi_vector(query_embeddings, image_embeddings)


