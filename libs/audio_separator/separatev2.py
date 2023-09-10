import argparse
import demucs.separate
import os
import shutil

def main():
    parser = argparse.ArgumentParser(description='Run demucs')
    parser.add_argument('filename', type=str, help='The file name')
    parser.add_argument('out', type=str, help='Output directory')
    parser.add_argument('name', type=str, help='The model name')
    parser.add_argument('mp3_quality', type=str,default=2, help='Quality of the mp3 file, 2-best , 7-fast')

    args = parser.parse_args()

    run_args = ["--mp3","--mp3-preset",args.mp3_quality, "-n", args.name, args.filename]

    if args.name == "htdemucs":
        run_args += ["--two-stems", "vocals"]

    run_args += ["--out", args.out]

    demucs.separate.main(run_args)

    model_out_dir = os.path.join(args.out, args.name)
    audio_file_name = os.path.splitext(os.path.basename(args.filename))[0]
    audio_file_out_dir = os.path.join(model_out_dir, audio_file_name)
    if os.path.exists(audio_file_out_dir):
        for filename in os.listdir(audio_file_out_dir):
            shutil.move(os.path.join(audio_file_out_dir, filename), args.out)
        os.rmdir(audio_file_out_dir)
        os.rmdir(model_out_dir)

if __name__ == "__main__":
    main()