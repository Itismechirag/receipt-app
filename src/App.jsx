import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import SignatureCanvas from 'react-signature-canvas';
import numWords from 'num-words';
import './App.css';


const App = () => {
  const componentRef = useRef();
  const sigCanvas = useRef();

  // State for the Bill Number with localStorage persistence
  const [formData, setFormData] = useState({
    billNo: Number(localStorage.getItem('lastBillNo')) + 1 || 1,
    date: new Date().toISOString().split('T')[0],
    title: '',
    name: '',
    amount: '',
    paymentMode: 'Cash',
    onAccount: '',
    secondDate: new Date().toISOString().split('T')[0],
    signature: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    onAfterPrint: () => {
      // Increment and save the number only after a successful print
      const nextNo = Number(formData.billNo);
      localStorage.setItem('lastBillNo', nextNo);
      setFormData(prev => ({ ...prev, billNo: nextNo + 1 }));
    }
  });

  const saveSignature = () => {
    if (!sigCanvas.current.isEmpty()) {
      // Use toDataURL() directly on the ref, not getTrimmedCanvas()
      setFormData(prev => ({
        ...prev,
        signature: sigCanvas.current.toDataURL('image/png')
      }));
    }
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
    setFormData(prev => ({ ...prev, signature: null }));
  };

  const formatToDDMMYYYY = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-'); // "2026-01-20"
    return `${day}-${month}-${year}`;             // "20-01-2026"
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          signature: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="container">
      <div className="form-panel">
        <h2>Receipt Generator</h2>
        <div className="input-group">
          <label>Bill No:</label>
          <input type="number" name="billNo" value={formData.billNo} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Date:</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Title (Select or Type):</label>
          <input list="titles" name="title" value={formData.title} onChange={handleChange} />
          <datalist id="titles">
            <option value="Mr." /><option value="Mrs." /><option value="Ms." /><option value="Dr." />
          </datalist>
        </div>

        <input type="text" name="name" placeholder="Received With Thanks From..." onChange={handleChange} />
        <input type="number" name="amount" placeholder="Amount (₹)" onChange={handleChange} />

        <div className="input-group">
          <label>Payment Mode:</label>
          <input list="modes" name="paymentMode" value={formData.paymentMode} onChange={handleChange} />
          <datalist id="modes">
            <option value="Cash" /><option value="Cheque" /><option value="UPI" /><option value="Card" />
          </datalist>
        </div>

        <input type="text" name="onAccount" placeholder="On Account Of..." onChange={handleChange} />

        <div className="sig-container">
          <label>Digital Signature:</label>
          <SignatureCanvas ref={sigCanvas} canvasProps={{ className: 'sigPad' }} />

          <div className="sig-buttons">
            <button onClick={saveSignature}>Add Signature</button>
            <button onClick={clearSignature}>Clear</button>
          </div>

          {/* Upload option */}
          <div className="upload-sig">
            <label>Or Upload Signature Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleSignatureUpload}
              className="file-input"
            />
          </div>
        </div>


        <button className="print-btn" onClick={handlePrint}>Print A5 Receipt</button>
      </div>

      {/* The Printable Receipt Template */}
      <div className="preview-panel">
        <div ref={componentRef} className="receipt-template">
          <img src="/billtemplate.png" alt="Template" className="bg-image" />


          <span className="field bill-no">{formData.billNo}</span>
          <span className="field receipt-date">{formatToDDMMYYYY(formData.date)}</span>
          <span className="field client-name">{formData.title} {formData.name}</span>
          <span className="field amount-words">
            {formData.amount
              ? numWords(parseInt(formData.amount, 10)).toUpperCase() + " RUPEES ONLY"
              : ""}
          </span>

          <span className="field pay-mode">{formData.paymentMode}</span>
          <span className="field account-details">{formData.onAccount}</span>
          <span className="field footer-date">{formData.secondDate}</span>
          <span className="field amount-box">{formData.amount !== '' ? `${formData.amount}/-` : ''}</span>

          {formData.signature && (
            <img src={formData.signature} alt="Sig" className="field signature-img" />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
