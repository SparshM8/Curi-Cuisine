export async function classifyImage(imgElement) {
  // Lazy-load TFJS and MobileNet to keep them optional at build time
  const tf = await import(/* @vite-ignore */ '@tensorflow/tfjs');
  const mobilenet = await import(/* @vite-ignore */ '@tensorflow-models/mobilenet');
  const model = await mobilenet.load();
  const predictions = await model.classify(imgElement);
  return predictions.map(p => p.className);
}
