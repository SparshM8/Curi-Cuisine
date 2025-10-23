import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

export async function classifyImage(imgElement) {
  const model = await mobilenet.load();
  const predictions = await model.classify(imgElement);
  return predictions.map(p => p.className);
}
