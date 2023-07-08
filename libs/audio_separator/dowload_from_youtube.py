import os
import sys
import yt_dlp


def download_audio_from_youtube(youtube_url, output_path):
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": os.path.join(output_path, "audio.%(ext)s"),
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
            }
        ],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python download_audio.py <youtube_url> <output_path>")
        sys.exit(1)

    youtube_url = sys.argv[1]
    output_path = sys.argv[2]

    download_audio_from_youtube(youtube_url, output_path)