import os
import subprocess
import imageio_ffmpeg


def _ffmpeg() -> str:
    return imageio_ffmpeg.get_ffmpeg_exe()


def process_single_video(file_path: str, output_dir: str = "output") -> str:
    """Extract 16 kHz mono WAV from any video or audio file via bundled ffmpeg."""
    os.makedirs(output_dir, exist_ok=True)
    whisper_audio_path = os.path.join(output_dir, "audio_whisper_ready.wav")
    subprocess.run(
        [_ffmpeg(), "-y", "-i", file_path,
         "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
         whisper_audio_path],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True,
    )
    return whisper_audio_path


# kept for backwards compatibility
def extract_and_preprocess(video_path: str, output_dir: str = "output") -> str:
    return process_single_video(video_path, output_dir)
