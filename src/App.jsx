import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import SignatureCanvas from 'react-signature-canvas';
import numWords from 'num-words';
import './App.css';

const App = () => {
  const componentRef = useRef();
  const sigCanvas = useRef();

  // At the top of App.jsx
  const searchPrintRef = useRef();

  const handlePrintSearch = useReactToPrint({
    contentRef: searchPrintRef,
  });

  const [isListView, setIsListView] = useState(false); // New state for toggling view



  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  // Display billNo (editable for current bill)
  const [displayBillNo, setDisplayBillNo] = useState(() => {
    return Number(localStorage.getItem('displayBillNo')) || Number(localStorage.getItem('persistentCounter')) || 1;
  });

  // Persistent counter (for Next Bill logic)
  const [persistentCounter, setPersistentCounter] = useState(() =>
    Number(localStorage.getItem('persistentCounter')) || 1
  );

  // Form data (resets on Next Bill)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    name: '',
    amount: '',
    paymentMode: '',
    onAccount: '',
    secondDate: new Date().toISOString().split('T')[0],
    signature: null
  });

  // Sync billNo to localStorage
  useEffect(() => {
    localStorage.setItem('persistentCounter', persistentCounter.toString());
    localStorage.setItem('displayBillNo', displayBillNo.toString());
  }, [persistentCounter, displayBillNo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // NEW: Next Bill function
  const handleNextBill = () => {
    // 1. Validation: Only proceed if 'Received With Thanks From' (name) is NOT empty
    if (!formData.name || formData.name.trim() === "") {
      alert("Please enter a Customer Name before moving to the next bill.");
      return; // Stop here; don't save or increment
    }

    // 2. Commit current bill to history (Saved Bills)
    const currentRecord = {
      billNo: displayBillNo,
      ...formData
    };

    const updatedHistory = [...savedBills, currentRecord];
    setSavedBills(updatedHistory);
    localStorage.setItem('savedBills', JSON.stringify(updatedHistory));

    // 3. INCREMENT ONLY AFTER VALIDATION
    const nextPersistent = persistentCounter + 1;
    setPersistentCounter(nextPersistent);
    setDisplayBillNo(nextPersistent);

    // 4. CLEAR ALL FORM ENTRIES
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      name: '',
      amount: '',
      paymentMode: '',
      onAccount: '',
      secondDate: new Date().toISOString().split('T')[0],
      signature: null
    });

    // 5. CLEAR THE DRAWING PAD
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };




  // NEW: Reset Counter state
  const [showResetCounter, setShowResetCounter] = useState(false);
  const [newCounter, setNewCounter] = useState('');

  const handleResetCounter = () => {
    if (newCounter && !isNaN(newCounter)) {
      setPersistentCounter(Number(newCounter));  // Only changes persistent counter
      setDisplayBillNo(Number(newCounter));

      setShowResetCounter(false);
      setNewCounter('');
    }
  };

  // State to hold all previous bills
  const [savedBills, setSavedBills] = useState(() => {
    return JSON.parse(localStorage.getItem('savedBills')) || [];
  });

  // Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);


  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    // Removed auto-increment from print (now only on Next Bill)
  });

  const saveSignature = () => {
    if (!sigCanvas.current.isEmpty()) {
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

  const formatToDDMMYYYY = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
  };

  const performSearch = () => {
    const result = savedBills.find(bill => bill.billNo === Number(searchQuery));
    setSearchResult(result || "Not Found");
  };


  const handleDeleteBill = (billNoToDelete) => {
    // Confirm with the user first
    const isConfirmed = window.confirm(`Are you sure you want to delete Bill No. ${billNoToDelete}? This action cannot be undone.`);

    if (isConfirmed) {
      // 1. Filter out the specific bill from the array
      const updatedHistory = savedBills.filter(bill => bill.billNo !== billNoToDelete);

      // 2. Update state and localStorage
      setSavedBills(updatedHistory);
      localStorage.setItem('savedBills', JSON.stringify(updatedHistory));

      // 3. Clear the search result so the modal updates
      setSearchResult(null);
      setSearchQuery('');
      alert(`Bill No. ${billNoToDelete} has been deleted.`);
    }
  };


  return (
    <div className="container">
      {/* LEFT: Your existing form */}
      <div className="form-panel">
        <h2>Receipt Generator</h2>
        <div className="input-group">
          <label>Bill No:</label>
          <input
            type="number"
            value={displayBillNo}
            onChange={(e) => setDisplayBillNo(Number(e.target.value))}
            className="bill-no-input"
          />
        </div>


        {/* All your existing form fields unchanged */}
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

        <input
          type="text"
          name="name"
          placeholder="Received With Thanks From..."
          value={formData.name}   // <--- ADD THIS
          onChange={handleChange}
        />

        <input
          type="number"
          name="amount"
          placeholder="Amount (₹)"
          value={formData.amount} // <--- ADD THIS
          onChange={handleChange}
        />


        <div className="input-group">
          <label>Payment Mode:</label>
          <input list="modes" name="paymentMode" value={formData.paymentMode} onChange={handleChange} />
          <datalist id="modes">
            <option value="Cash" /><option value="Cheque" /><option value="UPI" /><option value="Card" />
          </datalist>
        </div>

        <input
          type="text"
          name="onAccount"
          placeholder="On Account Of..."
          value={formData.onAccount} // <--- ADD THIS
          onChange={handleChange}
        />

        {/* NEW: Explicit input for Footer Date */}
        <div className="input-group">
          <label>Footer Date:</label>
          <input type="date" name="secondDate" value={formData.secondDate} onChange={handleChange} />
        </div>

        {/* <div className="sig-container">
          <label>Digital Signature:</label>
          <SignatureCanvas ref={sigCanvas} canvasProps={{ className: 'sigPad' }} />
          <div className="sig-buttons">
            <button onClick={saveSignature}>Add Signature</button>
            <button onClick={clearSignature}>Clear</button>
          </div>
          <div className="upload-sig">
            <label>Or Upload Signature Image:</label>
            <input type="file" accept="image/*" onChange={handleSignatureUpload} className="file-input" />
          </div>
        </div> */}

        <button className="print-btn" onClick={handlePrint}>Print A5 Receipt</button>

        {/* NEW: Next Bill Button */}
        <button className="next-bill-btn" onClick={handleNextBill}>Next Bill</button>

      </div>

      {/* CENTER: Your existing preview (updated billNo) */}
      <div className="preview-panel">
        <div ref={componentRef} className="receipt-template">
          <img src="/billtemplate.png" alt="Template" className="bg-image" />
          <span className="field bill-no">{displayBillNo}</span>
          <span className="field receipt-date">{formatToDDMMYYYY(formData.date)}</span>
          <span className="field client-name">{formData.title} {formData.name}</span>
          <span className="field amount-words">
            {formData.amount && !isNaN(formData.amount)
              ? numWords(parseInt(formData.amount, 10)).toUpperCase() + " RUPEES ONLY"
              : ""}
          </span>
          <span className="field pay-mode">{formData.paymentMode}</span>
          <span className="field account-details">{formData.onAccount}</span>
          <span className="field footer-date">{formatToDDMMYYYY(formData.secondDate)}</span>
          <span className="field amount-box">{formData.amount !== '' ? `${formData.amount}/-` : ''}</span>
          {formData.signature && (
            <img src={formData.signature} alt="Sig" className="field signature-img" />
          )}
        </div>
      </div>

      {/* RIGHT: Collapsible Settings Panel */}
      <div className={`settings-panel ${isSettingsOpen ? 'open' : 'collapsed'}`}>
        {/* Header is always visible; clicking it toggles the panel */}
        <div className="settings-header" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
          <h3>⚙️ Settings</h3>
          <span className="toggle-icon">{isSettingsOpen ? '−' : '+'}</span>
        </div>

        {/* Content only renders when open */}
        {isSettingsOpen && (
          <div className="settings-content">
            <div className="counter-section">
              <button
                className="reset-counter-btn"
                onClick={() => setShowResetCounter(!showResetCounter)}
              >
                {showResetCounter ? 'Cancel' : 'Reset Counter'}
              </button>

              {showResetCounter && (
                <div className="set-counter-form">
                  <input
                    type="number"
                    value={newCounter}
                    onChange={(e) => setNewCounter(e.target.value)}
                    placeholder="New No."
                    className="counter-input"
                  />
                  <button onClick={handleResetCounter} className="set-btn">Set</button>
                </div>
              )}

              {/* <div className="current-counter-box">
          Current Counter Base: <strong>{persistentCounter}</strong>
          <p style={{fontSize: '11px', color: '#666', marginTop: '5px'}}>
            (Next Bill will be {persistentCounter + 1})
          </p>
        </div> */}
            </div>
          </div>
        )}

        <div className="permanent-settings-footer">
          <button
            className="search-trigger-btn"
            onClick={() => setIsSearchOpen(true)}
          >
            🔍 Search Bills
          </button>
        </div>
      </div>



      {isSearchOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isListView ? 'All Bill Records' : (searchResult && searchResult !== "Not Found" ? 'Bill Details' : 'Search Bills')}</h3>
              <button className="close-btn" onClick={() => {
                setIsSearchOpen(false);
                setSearchResult(null);
                setSearchQuery('');
                setIsListView(false);
              }}>×</button>
            </div>

            {/* 1. DETAIL VIEW: Only shows if searchResult has a valid bill object */}
            {searchResult && searchResult !== "Not Found" ? (
              <div className="bill-details">
                <button className="back-btn" onClick={() => setSearchResult(null)}>← Back</button>
                <p><strong>Bill No:</strong> {searchResult.billNo}</p>
                <p><strong>Receipt Date:</strong> {formatToDDMMYYYY(searchResult.date)}</p>
                <p><strong>Footer Date:</strong> {formatToDDMMYYYY(searchResult.secondDate)}</p>
                <p><strong>Customer:</strong> {searchResult.title} {searchResult.name}</p>
                <p><strong>Amount:</strong> ₹{searchResult.amount}</p>
                <p><strong>Mode:</strong> {searchResult.paymentMode}</p>
                <p><strong>On Account:</strong> {searchResult.onAccount}</p>

                <div className="search-action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={handlePrintSearch} style={{ flex: 1, background: '#28a745', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    🖨️ Print
                  </button>
                  <button onClick={() => handleDeleteBill(searchResult.billNo)} style={{ flex: 1, background: '#dc3545', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    🗑️ Delete
                  </button>
                </div>

                {/* Hidden Print Component */}
                <div style={{ display: 'none' }}>
                  <div ref={searchPrintRef} className="receipt-template">
                    <img src="/billtemplate.png" alt="Template" className="bg-image" />
                    <span className="field bill-no">{searchResult.billNo}</span>
                    <span className="field receipt-date">{formatToDDMMYYYY(searchResult.date)}</span>
                    <span className="field client-name">{searchResult.title} {searchResult.name}</span>
                    <span className="field amount-words">
                      {searchResult.amount ? numWords(parseInt(searchResult.amount, 10)).toUpperCase() + " RUPEES ONLY" : ""}
                    </span>
                    <span className="field pay-mode">{searchResult.paymentMode}</span>
                    <span className="field account-details">{searchResult.onAccount}</span>
                    <span className="field footer-date">{formatToDDMMYYYY(searchResult.secondDate)}</span>
                    <span className="field amount-box">{searchResult.amount}/-</span>
                    {searchResult.signature && <img src={searchResult.signature} alt="Sig" className="field signature-img" />}
                  </div>
                </div>
              </div>
            ) : isListView ? (
              /* 2. LIST VIEW: Shows all bills when "Show All" is clicked */
              <div className="bills-list-view">
                <button className="back-btn" onClick={() => setIsListView(false)}>← Back to Search</button>
                <div className="bills-list" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee' }}>
                  {savedBills.length === 0 ? <p style={{ padding: '20px' }}>No bills saved yet.</p> :
                    savedBills.map((bill) => (
                      <div key={bill.billNo} className="bill-list-item" onClick={() => setSearchResult(bill)}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                        <span><strong>No. {bill.billNo}</strong></span>
                        <span>{bill.name}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            ) : (
              /* 3. INITIAL SEARCH VIEW: Search bar and Show All button */
              <div className="search-init">
                <div className="search-bar" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <input
                    type="number"
                    placeholder="Enter Bill No."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, padding: '8px' }}
                  />
                  <button onClick={performSearch} style={{ padding: '8px 15px' }}>Search</button>
                </div>

                {searchResult === "Not Found" && <p style={{ color: 'red', marginBottom: '10px' }}>No bill found with that number.</p>}

                <button onClick={() => setIsListView(true)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  📋 Show All Bills
                </button>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
};

export default App;
