import sys
import torch
from separator import Separator

if len(sys.argv) < 2:
    print("Please provide a file path as an argument.")
    sys.exit(1)

file_path = sys.argv[1]
cuda = torch.cuda.is_available()

# Initialize the Separator with the audio file and model name
output_dir = sys.argv[2] if len(sys.argv) > 2 else 'output'
model_name = sys.argv[3] if len(sys.argv) > 3 else 'Kim_Vocal_2'

separator = Separator(file_path, model_file_dir="URV_Models", model_name=model_name, output_dir=output_dir, use_cuda=cuda)

# Perform the separation
primary_stem_path, secondary_stem_path = separator.separate()

print(f'Primary stem saved at {primary_stem_path}')
print(f'Secondary stem saved at {secondary_stem_path}')