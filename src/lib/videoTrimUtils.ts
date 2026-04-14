/**
 * Trims a video blob in the browser using MediaRecorder + captureStream.
 * Returns a new Blob containing only the selected time range.
 */
export async function trimVideoBlob(
  videoUrl: string,
  startTime: number,
  endTime: number
): Promise<{ blob: Blob; url: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = videoUrl;

    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const stream = canvas.captureStream(30);

      // Try to capture audio too
      try {
        const audioVideo = document.createElement("video");
        audioVideo.src = videoUrl;
        audioVideo.muted = false;
        audioVideo.currentTime = startTime;
        // We can't easily capture audio from a second video element reliably,
        // so we'll proceed with video-only for trimming
      } catch {}

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        // Cleanup
        video.pause();
        video.removeAttribute("src");
        video.load();
        resolve({ blob, url });
      };

      recorder.onerror = () => {
        reject(new Error("MediaRecorder error during trimming"));
      };

      video.currentTime = startTime;

      video.onseeked = () => {
        recorder.start();
        video.play();

        const drawFrame = () => {
          if (video.currentTime >= endTime || video.paused || video.ended) {
            video.pause();
            recorder.stop();
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        };

        drawFrame();
      };
    };

    video.onerror = () => {
      reject(new Error("Failed to load video for trimming"));
    };
  });
}
