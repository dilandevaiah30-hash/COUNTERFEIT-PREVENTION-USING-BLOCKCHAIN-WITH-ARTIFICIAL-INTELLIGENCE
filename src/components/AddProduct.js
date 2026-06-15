import React, { useState, useRef } from "react";
import { ethers } from "ethers";
import { QRCodeCanvas } from "qrcode.react";
import "../App.css";

const AddProduct = ({ account, central }) => {
  const [companyContractAddress, setCompanyContractAddress] = useState("");
  const [productId, setProductId] = useState("");
  const [manufactureId, setManufactureId] = useState("");
  const [productName, setProductName] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [status, setStatus] = useState("");
  const [productHash, setProductHash] = useState(""); // ✅ Displayed hash
  const qrRef = useRef(null);

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!central) {
      alert("❌ Central contract not loaded. Please connect MetaMask first.");
      return;
    }

    if (!companyContractAddress || !ethers.utils.isAddress(companyContractAddress)) {
      alert("❌ Please enter a valid company contract address.");
      return;
    }

    if (!productId) {
      alert("⚠️ Please enter a Product ID.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const company = new ethers.Contract(
        companyContractAddress,
        [
          "function owner() public view returns (address)",
          "function central() public view returns (address)",
        ],
        provider
      );

      const ownerAddress = await company.owner();

      // ✅ Use identical encoding logic to VerifyProduct.js
      const encoded = ethers.utils.defaultAbiCoder.encode(
        ["string", "string", "string", "string"],
        [productId, manufactureId, productName, productBrand]
      );
      const hash = ethers.utils.keccak256(encoded);

      console.log("🧮 Generated Product Hash (AddProduct):", hash);
      setProductHash(hash);

      setStatus("⏳ Adding product... Please confirm MetaMask transaction.");

      const signer = provider.getSigner();
      const centralWithSigner = central.connect(signer);

      // ✅ Add product using same structure as before
      const tx = await centralWithSigner.addproduct(
        ownerAddress,
        companyContractAddress,
        [hash]
      );
      await tx.wait();

      setStatus("✅ Product successfully added to blockchain!");

      // 🧾 Create QR data (contains all fields)
      const qrData = JSON.stringify({
        productId,
        manufactureId,
        productName,
        productBrand,
        productHash: hash,
        companyContractAddress,
      });
      setQrValue(qrData);
    } catch (error) {
      console.error("❌ Error adding product:", error);
      setStatus(`❌ Smart Contract Error: ${error.reason || error.message}`);
    }
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current.querySelector("canvas");
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${productName || "product"}_QR.png`;
    link.click();
  };

  return (
    <section className="AddProduct section">
      <h2 className="Component__title">Add Products</h2>

      <form onSubmit={handleAddProduct} className="Component__form">
        <div className="form__content">
          <label className="form__label">Enter Company contract address</label>
          <input
            type="text"
            value={companyContractAddress}
            onChange={(e) => setCompanyContractAddress(e.target.value)}
            className="form__input"
          />
        </div>

        <div className="form__content">
          <label className="form__label">Enter Product ID</label>
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="form__input"
          />
        </div>

        <div className="form__content">
          <label className="form__label">Enter Manufacture ID</label>
          <input
            type="text"
            value={manufactureId}
            onChange={(e) => setManufactureId(e.target.value)}
            className="form__input"
          />
        </div>

        <div className="form__content">
          <label className="form__label">Enter Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="form__input"
          />
        </div>

        <div className="form__content">
          <label className="form__label">Enter Product Brand</label>
          <input
            type="text"
            value={productBrand}
            onChange={(e) => setProductBrand(e.target.value)}
            className="form__input"
          />
        </div>

        <button type="submit" className="form__button button__toggle">
          Add Product
        </button>
      </form>

      {status && <p className="Home__instructions">{status}</p>}

      {qrValue && (
        <div className="qr__section" ref={qrRef} style={{ textAlign: "center", marginTop: "2rem" }}>
          <h3 style={{ color: "var(--first-color)", marginBottom: "1rem" }}>Product QR Code</h3>
          <QRCodeCanvas value={qrValue} size={180} />
          <br />
          <button
            className="button__toggle"
            onClick={handleDownloadQR}
            style={{ marginTop: "1rem" }}
          >
            Download QR Code
          </button>

          <p style={{ marginTop: "1rem", wordBreak: "break-all", color: "#00c853" }}>
            <strong>Generated Product Hash:</strong> {productHash}
          </p>
        </div>
      )}
    </section>
  );
};

export default AddProduct;
