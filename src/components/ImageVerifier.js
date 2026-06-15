// src/components/ImageVerifier.js
import React, { useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

const ImageVerifier = () => {
  const [model, setModel] = useState(null);
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Load MobileNet model once when needed
  const loadModel = async () => {
    if (!model) {
      setLoading(true);
      const loadedModel = await mobilenet.load();
      setModel(loadedModel);
      setLoading(false);
    }
  };

  // Handle file upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageURL = URL.createObjectURL(file);
    setImage(imageURL);
    await loadModel();
    setResult("Analyzing image...");

    const imgElement = new Image();
    imgElement.src = imageURL;
    imgElement.onload = async () => {
      const predictions = await model.classify(imgElement);
      console.log(predictions);

      const topPrediction = predictions[0];
      // Simple heuristic: low confidence = suspicious
      if (topPrediction.probability < 0.4) {
        setResult("⚠️ Suspicious image — might be fake or unclear.");
      } else {
        setResult("✅ Image looks genuine.");
      }
    };
  };

  return (
    <div className="p-4 bg-gray-100 rounded-xl text-center shadow-md mt-4">
      <h3 className="text-lg font-semibold mb-2">AI Image Verifier</h3>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && (
        <img
          src={image}
          alt="Uploaded"
          className="mt-3 rounded-lg w-full max-w-sm mx-auto shadow"
        />
      )}
      <p className="mt-3 font-medium">
        {loading ? "Loading AI model..." : result}
      </p>
    </div>
  );
};

export default ImageVerifier;
