import { invoke } from "@tauri-apps/api/core";
import type { ScreenSelection } from "../types/app";

export async function captureScreenImage() {
  try {
    const base64 = await invoke<string>("capture_primary_screen");
    return `data:image/png;base64,${base64}`;
  } catch {
    return captureWithBrowserMedia();
  }
}

async function captureWithBrowserMedia() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Screen capture is unavailable in this environment.");
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false
  });

  const [track] = stream.getVideoTracks();
  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;

  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });

  await video.play();

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    track.stop();
    throw new Error("Unable to create capture canvas.");
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  track.stop();
  stream.getTracks().forEach((item) => item.stop());

  return canvas.toDataURL("image/png");
}

export async function openLiveScreenStream() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Live screen sharing is unavailable in this environment.");
  }

  return navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: { ideal: 10, max: 15 },
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  });
}

export async function createPreviewVideoFromStream(stream: MediaStream) {
  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });

  await video.play();
  return video;
}

export function captureVideoFrame(video: HTMLVideoElement, maxWidth = 1440) {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("The shared screen is not ready yet.");
  }

  const scale = Math.min(1, maxWidth / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to read the live screen frame.");
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export async function cropImageDataUrl(imageDataUrl: string, selection?: ScreenSelection | null) {
  if (!selection || selection.width <= 0 || selection.height <= 0) {
    return imageDataUrl;
  }

  const image = await loadImage(imageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = selection.width;
  canvas.height = selection.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create crop canvas.");
  }

  context.drawImage(
    image,
    selection.x,
    selection.y,
    selection.width,
    selection.height,
    0,
    0,
    selection.width,
    selection.height
  );

  return canvas.toDataURL("image/png");
}

async function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load screenshot."));
    image.src = dataUrl;
  });
}
