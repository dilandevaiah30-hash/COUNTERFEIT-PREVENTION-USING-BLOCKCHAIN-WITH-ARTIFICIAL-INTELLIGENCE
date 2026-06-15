import React, { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import { ethers } from "ethers";
import * as tf from "@tensorflow/tfjs";

const VerifyProduct = ({ central }) => {
  const [companyContractAddress, setCompanyContractAddress] = useState("");
  const [productStatus, setProductStatus] = useState(null);
  const [scannedData, setScannedData] = useState(null);

  const [qrFile, setQrFile] = useState(null);
  const [aiFile, setAiFile] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [model, setModel] = useState(null);

  const qrFileRef = useRef();
  const aiFileRef = useRef();

  // ✅ Load AI model once
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("⏳ Loading AI model...");
        const loadedModel = await tf.loadLayersModel("/web_model/model.json");
        setModel(loadedModel);
        console.log("✅ AI model loaded successfully");
      } catch (err) {
        console.error("❌ Failed to load AI model:", err);
      }
    };
    loadModel();
  }, []);

  // 🧾 Handle company address input
  const handleCompanyChange = (e) => setCompanyContractAddress(e.target.value);

  // 📸 Handle QR image upload
  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    setQrFile(file);
    setScannedData(null);
    setProductStatus(null);

    if (!file) return;
    try {
      const result = await QrScanner.scanImage(file);
      setScannedData(result);
      console.log("📦 QR Data:", result);
    } catch (err) {
      console.error("⚠️ QR scan failed:", err);
      setProductStatus("Failed to read QR code");
    }
  };

  // 🔗 Verify Product on Blockchain (✅ Fixed)
  const checkProduct = async () => {
    if (!central) {
      alert("Central contract not loaded yet. Please wait...");
      return;
    }
    if (!scannedData) {
      alert("Please upload a QR code first.");
      return;
    }

    try {
      const parsedData = JSON.parse(scannedData);
      const {
        productId,
        manufactureId,
        productName,
        productBrand,
        productHash,
        companyContractAddress: qrCompanyAddress,
      } = parsedData;

      // ✅ Use company address from QR if not manually entered
      const targetAddress = companyContractAddress || qrCompanyAddress;

      if (!targetAddress) {
        alert("No company contract address found!");
        return;
      }

      // ✅ Recalculate hash exactly like AddProduct.js
      const encoded = ethers.utils.defaultAbiCoder.encode(
        ["string", "string", "string", "string"],
        [productId, manufactureId, productName, productBrand]
      );
      const recalculatedHash = ethers.utils.keccak256(encoded);

      console.log("🔍 Parsed Data:", parsedData);
      console.log("🧩 Product Hash from QR:", productHash);
      console.log("🔗 Recalculated Hash:", recalculatedHash);
      console.log("🏭 Using Company Contract:", targetAddress);

      setProductStatus("⏳ Verifying product on blockchain...");

      // ✅ Call the central contract
      const result = await central.checkProductByHash(
        targetAddress,
        recalculatedHash
      );

      console.log("🧾 Raw blockchain result:", result);

      const isAuthentic = Boolean(result);

      setProductStatus(
        isAuthentic
          ? "✅ Product is Authentic"
          : "❌ Counterfeit Product Detected"
      );
    } catch (error) {
      console.error("❌ Blockchain verification error:", error);
      setProductStatus("❌ Counterfeit Product Detected");
    }
  };

  // 🧠 AI verification (Logo/Image)
  const handleAiUpload = async (e) => {
    const file = e.target.files[0];
    setAiFile(file);
    setAiResult(null);

    if (!file) return;
    if (!model) {
      alert("AI model not loaded yet.");
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const tensor = tf.browser
          .fromPixels(img)
          .resizeNearestNeighbor([160, 160])
          .toFloat()
          .div(255.0)
          .expandDims();

        const prediction = await model.predict(tensor).data();
        const predictedIndex = prediction.indexOf(Math.max(...prediction));

        const labels = ["Authentic", "Fake"];
        const className = labels[predictedIndex] || "Unknown";
        const probability = prediction[predictedIndex] || 0;

        console.log("🔍 AI Prediction:", { className, probability });
        setAiResult({ className, probability });
      } catch (err) {
        console.error("❌ AI prediction error:", err);
        setAiResult({ className: "Error", probability: 0 });
      }
    };
  };

  return (
    <div
      className="VerifyProduct"
      style={{
        textAlign: "center",
        padding: "30px",
        maxWidth: "700px",
        margin: "0 auto",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <h2 style={{ color: "#00e5ff", fontWeight: "700", marginBottom: "20px" }}>
        🔍 Product Verification Portal
      </h2>

      {/* STEP 1 - QR + Blockchain Verification */}
      <div
        style={{
          border: "2px solid #64b5f6",
          borderRadius: "14px",
          padding: "25px",
          background: "#e3f2fd",
          marginBottom: "25px",
        }}
      >
        <h3 style={{ color: "#0d47a1" }}>
          🧾 Step 1: QR + Blockchain Verification
        </h3>

        <input
          type="text"
          value={companyContractAddress}
          onChange={handleCompanyChange}
          placeholder="Enter company smart contract address"
          style={{
            width: "90%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #90caf9",
            marginBottom: "12px",
          }}
        />

        <div>
          <button
            type="button"
            onClick={() => qrFileRef.current.click()}
            style={{
              backgroundColor: "#1976d2",
              borderRadius: "8px",
              border: "none",
              padding: "8px 16px",
              color: "white",
              cursor: "pointer",
            }}
          >
            Upload QR Image
          </button>
          <input
            type="file"
            ref={qrFileRef}
            onChange={handleQrUpload}
            accept=".png, .jpg, .jpeg"
            className="d-none"
          />
        </div>

        {qrFile && (
          <div style={{ marginTop: "15px" }}>
            <img
              src={URL.createObjectURL(qrFile)}
              alt="QR Preview"
              width={220}
              style={{
                borderRadius: "10px",
                marginBottom: "10px",
                border: "2px solid #90caf9",
              }}
            />
            {scannedData && (
              <p
                style={{
                  fontSize: "0.85em",
                  color: "#0d47a1",
                  wordBreak: "break-all",
                }}
              >
                QR Data: {scannedData}
              </p>
            )}
          </div>
        )}

        <button
          onClick={checkProduct}
          style={{
            marginTop: "10px",
            backgroundColor: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          Verify on Blockchain
        </button>

        {productStatus && (
          <p
            style={{
              color: productStatus.includes("Authentic") ? "green" : "red",
              fontWeight: "bold",
              marginTop: "15px",
              fontSize: "1.1em",
            }}
          >
            Blockchain Result: {productStatus}
          </p>
        )}
      </div>

      {/* STEP 2 - AI Logo Verification */}
      <div
        style={{
          border: "2px solid #ba68c8",
          borderRadius: "14px",
          padding: "25px",
          background: "#f3e5f5",
        }}
      >
        <h3 style={{ color: "#6a1b9a" }}>🧠 Step 2: AI Logo/Image Verification</h3>

        <button
          type="button"
          onClick={() => aiFileRef.current.click()}
          style={{
            backgroundColor: "#8e24aa",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            color: "white",
            cursor: "pointer",
          }}
        >
          Upload Image
        </button>
        <input
          type="file"
          ref={aiFileRef}
          onChange={handleAiUpload}
          accept=".png, .jpg, .jpeg"
          className="d-none"
        />

        {aiFile && (
          <div style={{ marginTop: "15px" }}>
            <img
              src={URL.createObjectURL(aiFile)}
              alt="AI Preview"
              width={220}
              style={{
                borderRadius: "10px",
                marginBottom: "10px",
                border: "2px solid #ba68c8",
              }}
            />
          </div>
        )}

        {aiResult ? (
          <p
            style={{
              color:
                aiResult.className === "Authentic"
                  ? "green"
                  : aiResult.className === "Fake"
                  ? "red"
                  : "gray",
              fontWeight: "bold",
              fontSize: "1.1em",
            }}
          >
            🧠 Brand: {aiResult.className} —{" "}
            {Math.round(aiResult.probability * 100)}%
          </p>
        ) : (
          <p style={{ color: "#7b1fa2", fontStyle: "italic" }}>
            Upload an image to verify with AI.
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyProduct;
