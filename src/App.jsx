import React, { useState } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

function App() {
  const [excelData, setExcelData] = useState(null);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [workbook, setWorkbook] = useState(null);

  // Define the mappings for the event paths
  const eventMappings = {
    "/event/billing/product/fee/purchase": "Ativação de plano",
    "/event/delayed/session/telco/gprs": "Serviço de Dados e internet",
    "/event/delayed/session/telco/gsm": "Serviço de Voz",
    "/event/delayed/session/telco/gsm/sms": "Serviço de SMS",
  };

  const calculateDateRange = (rows) => {
    if (!rows || rows.length === 0) return { min: "N/A", max: "N/A" };

    let minDate = null;
    let maxDate = null;

    rows.forEach(row => {
      // Parse start time
      if (row.start_time && row.start_time !== "N/A" && row.amount != 0) {
        try {
          const startDate = new Date(row.start_time);
          if (!isNaN(startDate.getTime())) {
            if (minDate === null || startDate < minDate) {
              minDate = startDate;
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      }

      // Parse end time
      if (row.end_time && row.end_time !== "N/A" && row.amount != 0) {
        try {
          const endDate = new Date(row.end_time);
         
          
          if (!isNaN(endDate.getTime())) {
            if (maxDate === null || endDate > maxDate) {
              maxDate = endDate;
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    // Format dates as DD/MM/YYYY
    const formatDate = (date) => {
      if (!date) return "N/A";
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    return {
      min: formatDate(minDate),
      max: formatDate(maxDate)
    };
  };

  // Function to handle file upload and parse Excel data
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setError(null); // Reset any previous errors
    setExcelData(null); // Reset existing data
    setAvailableSheets([]); // Reset sheet list
    setSelectedSheet(""); // Reset selected sheet

    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const ab = e.target.result;
            const wb = XLSX.read(ab, { type: "array" });
            setWorkbook(wb);

            // Get all sheet names and set them in state
            const sheetNames = wb.SheetNames;
            setAvailableSheets(sheetNames);

            // If there's only one sheet, select it automatically
            if (sheetNames.length === 1) {
              setSelectedSheet(sheetNames[0]);
              processSheet(wb, sheetNames[0]);
            } else if (sheetNames.length > 1) {
              // If there are multiple sheets, let the user select
              setSelectedSheet(sheetNames[0]); // Default to first sheet
            }
          } catch (err) {
            setError("Error processing Excel file: " + err.message);
            console.error("Error processing Excel file:", err);
          }
        };
        reader.onerror = (err) => {
          setError("Error reading file: " + err.message);
          console.error("File reading error:", err);
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        setError("Error handling file: " + err.message);
        console.error("File handling error:", err);
      }
    }
  };

  // Function to process the selected sheet
  const processSheet = (wb, sheetName) => {
    if (!wb || !sheetName) return;

    try {
      const sheet = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Convert sheet to JSON array

      // Map the event paths in the data
      const updatedData = data.map((row) => {
        return row.map((cell) => {
          // Check if the cell contains an event path and replace it
          return eventMappings[cell] || cell; // Replace event path if exists, otherwise keep the cell value
        });
      });

      setExcelData(updatedData); // Set the parsed and updated data to state
    } catch (err) {
      setError("Error processing sheet: " + err.message);
      console.error("Sheet processing error:", err);
    }
  };

  // Handle sheet selection change
  const handleSheetChange = (e) => {
    const newSelectedSheet = e.target.value;
    setSelectedSheet(newSelectedSheet);
    processSheet(workbook, newSelectedSheet);
  };

  // Function to convert units based on service type
  const convertUnits = (amount, serviceType) => {
    let value = parseFloat(amount) || 0;
    let unit = "";
    let display = "";

    switch (serviceType) {
      case "Serviço de Dados e internet":
        // Convert KB to appropriate unit (KB, MB, GB)
        if (value < 1024) {
          // Keep as KB if less than 1 MB
          display = `${value.toFixed(2)} KB`;
        } else if (value < 1048576) {
          // Convert to MB if less than 1 GB
          value = value / 1024;
          display = `${value.toFixed(2)} MB`;
        } else {
          // Convert to GB
          value = value / 1048576;
          display = `${value.toFixed(2)} GB`;
        }
        return { value, display };

      case "Serviço de Voz":
        // Convert seconds to hours:minutes:seconds
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        const seconds = Math.floor(value % 60);
        display = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        return { value, display };

      case "Serviço de SMS":
        // Keep as count
        display = `${value} SMS`;
        return { value, display };

      default:
        display = value.toFixed(2);
        return { value, display };
    }
  };

  // Function to extract required data and calculate total
  const extractRequiredData = () => {
    if (!excelData || excelData.length <= 1)
      return { rows: [], typeSummaries: [] };

    // Find column indexes for the required fields
    const headers = excelData[0];
    const startTimeIndex = headers.findIndex(
      (h) =>
        h &&
        h.toString().toLowerCase().includes("start") &&
        h.toString().toLowerCase().includes("time")
    );
    const endTimeIndex = headers.findIndex(
      (h) =>
        h &&
        h.toString().toLowerCase().includes("end") &&
        h.toString().toLowerCase().includes("time")
    );
    const usageTypeIndex = headers.findIndex(
      (h) =>
        h &&
        (h.toString().toLowerCase().includes("usage") ||
          h.toString().toLowerCase().includes("type"))
    );
    const amountIndex = headers.findIndex(
      (h) => h && h.toString().toLowerCase().includes("amount")
    );

    // Extract only the rows with the required fields and non-zero amounts
    const extractedRows = excelData
      .slice(1)
      .map((row) => {
        const rawAmount =
          amountIndex >= 0 && row[amountIndex] ? row[amountIndex] : 0;
        const usageType =
          usageTypeIndex >= 0 && row[usageTypeIndex]
            ? row[usageTypeIndex]
            : "N/A";

        // Convert units based on usage type
        const convertedAmount = convertUnits(rawAmount, usageType);

        return {
          start_time:
            startTimeIndex >= 0 && row[startTimeIndex]
              ? formatDateTime(row[startTimeIndex])
              : "N/A",
          end_time:
            endTimeIndex >= 0 && row[endTimeIndex]
              ? formatDateTime(row[endTimeIndex])
              : "N/A",
          usage_type: usageType,
          raw_amount: parseFloat(rawAmount) || 0,
          display_amount: convertedAmount.display,
        };
      })
      .filter((row) => row.raw_amount > 0); // Filter out rows with zero amount

    // Group by usage type for summary
    const groupedByType = extractedRows.reduce((acc, row) => {
      if (!acc[row.usage_type]) {
        acc[row.usage_type] = {
          total: 0,
          rows: [],
        };
      }

      acc[row.usage_type].total += row.raw_amount;
      acc[row.usage_type].rows.push(row);

      return acc;
    }, {});

    // Create summary totals
    const typeSummaries = Object.keys(groupedByType).map((type) => {
      const converted = convertUnits(groupedByType[type].total, type);
      return {
        usage_type: type,
        total: groupedByType[type].total,
        display_total: converted.display,
      };
    });

    return {
      rows: extractedRows,
      typeSummaries,
    };
  };

  // Helper function to format date/time strings for better display
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";

    // Try to format the date string to make it more readable and shorter
    try {
      // Check if it's already a date object or can be parsed as one
      const date = new Date(dateTimeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch (e) {
      // If parsing fails, return the original string
    }

    return String(dateTimeString);
  };

  // Function to truncate text for PDF table cells
  const truncateText = (text, maxLength = 20) => {
    if (!text) return "";

    text = String(text);
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  // Function to generate PDF with manually drawn table
  const generatePDF = () => {
    try {
      if (!excelData || excelData.length === 0) {
        setError("No data available to generate PDF");
        return;
      }

      // Extract required data and calculate total
      const { rows, typeSummaries } = extractRequiredData();
      const dateRange = calculateDateRange(rows);
      if (rows.length === 0) {
        setError("Could not extract data from the Excel file or all amounts are zero");
        return;
      }






      // Create new jsPDF instance
      const doc = new jsPDF();

      // Set document properties
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10; // Reduced margin for more space
      const usableWidth = pageWidth - margin * 2;

      // Add a header background
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, pageWidth, 40, "F");

      // Add company logo or placeholder
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, 10, 30, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Africell", margin + 8, 20);

      // Add document number and user name at the top
      doc.setTextColor(44, 62, 80);
      doc.setFontSize(14);
      doc.text(
        `Document #: ${documentNumber || "N/A"}`,
        pageWidth - margin,
        15,
        { align: "right" }
      );
      doc.setFontSize(12);
      doc.text(`User: ${userName || "N/A"}`, pageWidth - margin, 25, {
        align: "right",
      });
      doc.setFontSize(12);
      doc.text(`${dateRange.min} - ${dateRange.max}`, pageWidth - margin, 35, {
        align: "right",
      });

      // Add title
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("Usage Statement", pageWidth / 2, 35, { align: "center" });

      // Add sheet name and timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const date = new Date().toLocaleString();
      // Display the date range

      doc.text(`Sheet: ${selectedSheet}`, margin, 45);
      doc.text(`Generated on: ${date}`, pageWidth - margin, 45, {
        align: "right",
      });

      // Set starting Y position for table
      let yPos = 55;

      // Define column widths as percentages of usable width
      const colWidths = [
        usableWidth * 0.2, // Start Time (smaller)
        usableWidth * 0.2, // End Time (smaller)
        usableWidth * 0.35, // Usage Type (larger)
        usableWidth * 0.25, // Amount (medium)
      ];

      // Draw table header
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, yPos, usableWidth, 10, "F");

      // Draw header text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");

      let xPos = margin;
      doc.text("Start Time", xPos + 2, yPos + 7);
      xPos += colWidths[0];

      doc.text("End Time", xPos + 2, yPos + 7);
      xPos += colWidths[1];

      doc.text("Usage Type", xPos + 2, yPos + 7);
      xPos += colWidths[2];

      doc.text("Consumption", xPos + 2, yPos + 7);

      yPos += 10; // Move to first data row

      // Draw data rows
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      const rowHeight = 10;

      rows.forEach((row, index) => {
        // Add a page if we're about to overflow
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = margin;

          // Add header on new page
          doc.setFillColor(41, 128, 185);
          doc.rect(margin, yPos, usableWidth, 10, "F");

          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");

          xPos = margin;
          doc.text("Start Time", xPos + 2, yPos + 7);
          xPos += colWidths[0];

          doc.text("End Time", xPos + 2, yPos + 7);
          xPos += colWidths[1];

          doc.text("Usage Type", xPos + 2, yPos + 7);
          xPos += colWidths[2];

          doc.text("Consumption", xPos + 2, yPos + 7);

          yPos += 10;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
        }

        // Draw row background (alternating colors)
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, yPos, usableWidth, rowHeight, "F");
        }

        // Draw cell borders
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, usableWidth, rowHeight, "S");

        // Draw vertical lines between cells
        xPos = margin + colWidths[0];
        doc.line(xPos, yPos, xPos, yPos + rowHeight);

        xPos += colWidths[1];
        doc.line(xPos, yPos, xPos, yPos + rowHeight);

        xPos += colWidths[2];
        doc.line(xPos, yPos, xPos, yPos + rowHeight);

        // Draw cell text (truncated to fit)
        doc.setFontSize(8); // Smaller font to fit more text

        xPos = margin;
        doc.text(truncateText(row.start_time, 18), xPos + 2, yPos + 6);
        xPos += colWidths[0];

        doc.text(truncateText(row.end_time, 18), xPos + 2, yPos + 6);
        xPos += colWidths[1];

        doc.text(truncateText(row.usage_type, 28), xPos + 2, yPos + 6);
        xPos += colWidths[2];

        doc.text(truncateText(row.display_amount, 20), xPos + 2, yPos + 6);

        yPos += rowHeight;
      });

      // Add summary section
      yPos += 10;

      // Draw summary header
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, yPos, usableWidth, 10, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Usage Summary by Type", margin + 5, yPos + 7);

      yPos += 10;

      // Draw summary rows
      typeSummaries.forEach((summary, index) => {
        // Add a page if we're about to overflow
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = margin;
        }

        // Draw row background (alternating colors)
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, yPos, usableWidth, rowHeight + 5, "F");
        }

        // Draw text
        doc.setTextColor(44, 62, 80);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(summary.usage_type + ":", margin + 5, yPos + 7);
        doc.setFont("helvetica", "normal");
        doc.text(summary.display_total, pageWidth - margin - 5, yPos + 7, {
          align: "right",
        });

        yPos += rowHeight + 5;
      });

      // Add a footer with company information
      const footerY = pageHeight - 20;
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Africell Angola | Rua dos Municipios dos Portugueses, Luanda, Angola | apoio.cliente@africell.ao | +244 950 180 123",
        pageWidth / 2,
        footerY + 7,
        { align: "center" }
      );

      // Add page numbers to all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages}`, margin, pageHeight - 10);
      }

      // Save the generated PDF
      doc.save(`usage-statement-${documentNumber || "report"}.pdf`);
    } catch (err) {
      setError("Error generating PDF: " + err.message);
      console.error("PDF generation error:", err);
    }
  };

  return (
    <>
    <div
      style={{
        width: "1910px",
        height: "950px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        color: "#2d3748",
        backgroundColor: "#f7fafc",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
      }}
    >
      <h1
        style={{
          color: "#1a365d",
          borderBottom: "2px solid #4299e1",
          paddingBottom: "10px",
          fontSize: "28px",
        }}
      >
        Excel to PDF Statement Generator
      </h1>

      {error && (
        <div
          style={{
            color: "#742a2a",
            backgroundColor: "#fed7d7",
            padding: "12px 20px",
            marginBottom: "20px",
            borderRadius: "5px",
            border: "1px solid #feb2b2",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "24px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#1a365d", fontSize: "20px" }}>Document Information</h3>
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 300px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "600",
                color: "#2d3748",
              }}
            >
              User Name:
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter user name"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #cbd5e0",
                borderRadius: "6px",
                fontSize: "16px",
                transition: "border-color 0.2s ease",
                outline: "none",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            />
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "600",
                color: "#2d3748",
              }}
            >
              Document Number:
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Enter document number"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #cbd5e0",
                borderRadius: "6px",
                fontSize: "16px",
                transition: "border-color 0.2s ease",
                outline: "none",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            />
          </div>
        </div>

        <h3 style={{
          color: "#1a365d",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "10px",
          marginTop: "24px",
          fontSize: "18px",
        }}>
          Statement Period
        </h3>
        <p style={{ color: "#4a5568", fontWeight: "500" }}>
          {`min:${calculateDateRange(extractRequiredData().rows).min} max:${calculateDateRange(extractRequiredData().rows).max}`}
        </p>

        <div style={{ marginTop: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#2d3748",
            }}
          >
            Upload Excel File:
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            style={{
              width: "100%",
              padding: "8px 0",
              marginBottom: "20px",
              color: "#4a5568",
            }}
          />
        </div>

        {/* Sheet Selection Dropdown - Only show if sheets are available */}
        {availableSheets.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "600",
                color: "#2d3748",
              }}
            >
              Select Sheet:
            </label>
            <select
              value={selectedSheet}
              onChange={handleSheetChange}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #cbd5e0",
                borderRadius: "6px",
                fontSize: "16px",
                backgroundColor: "white",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                outline: "none",
              }}
            >
              {availableSheets.map((sheet) => (
                <option key={sheet} value={sheet}>
                  {sheet}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={generatePDF}
          disabled={!excelData}
          style={{
            padding: "12px 24px",
            backgroundColor: !excelData ? "#a0aec0" : "#4299e1",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: !excelData ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "600",
            transition: "background-color 0.2s ease",
            boxShadow: !excelData ? "none" : "0 2px 4px rgba(66, 153, 225, 0.3)",
            outline: "none",
          }}
        >
          Generate Statement PDF
        </button>
      </div>

      {excelData && (
        <div style={{ marginTop: "28px" }}>
          <h3
            style={{
              color: "#1a365d",
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "10px",
              fontSize: "20px",
            }}
          >
            Data Preview with Unit Conversions (Excluding Zero Amounts)
          </h3>
          <div style={{ overflowX: "auto", borderRadius: "8px", boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#2b6cb0", color: "white" }}>
                  <th
                    style={{
                      padding: "14px 18px",
                      border: "1px solid #bee3f8",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Start Time
                  </th>
                  <th
                    style={{
                      padding: "14px 18px",
                      border: "1px solid #bee3f8",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    End Time
                  </th>
                  <th
                    style={{
                      padding: "14px 18px",
                      border: "1px solid #bee3f8",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Usage Type
                  </th>
                  <th
                    style={{
                      padding: "14px 18px",
                      border: "1px solid #bee3f8",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Raw Amount
                  </th>
                  <th
                    style={{
                      padding: "14px 18px",
                      border: "1px solid #bee3f8",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Converted Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {extractRequiredData().rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    style={{
                      backgroundColor: rowIndex % 2 === 0 ? "#ebf8ff" : "white",
                    }}
                  >
                    <td
                      style={{ padding: "12px 18px", border: "1px solid #e2e8f0" }}
                    >
                      {row.start_time}
                    </td>
                    <td
                      style={{ padding: "12px 18px", border: "1px solid #e2e8f0" }}
                    >
                      {row.end_time}
                    </td>
                    <td
                      style={{ padding: "12px 18px", border: "1px solid #e2e8f0" }}
                    >
                      {row.usage_type}
                    </td>
                    <td
                      style={{ padding: "12px 18px", border: "1px solid #e2e8f0" }}
                    >
                      {row.raw_amount}
                    </td>
                    <td
                      style={{ padding: "12px 18px", border: "1px solid #e2e8f0" }}
                    >
                      {row.display_amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3
            style={{
              color: "#1a365d",
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "10px",
              marginTop: "32px",
              fontSize: "20px",
            }}
          >
            Usage Summary
          </h3>
          <div style={{ overflowX: "auto", borderRadius: "8px", boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)" }}>
            <table
              style={{
                width: "50%",
                borderCollapse: "collapse",
                marginBottom: "30px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#2b6cb0", color: "white" }}>
                  <th
                    style={{
                      padding: "14px 18px",
                      border: "1px solid #bee3f8",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Usage Type
                  </th>
                  <th
                    style={{
                      padding: "14px 18px",
                      border: "1px solid #bee3f8",
                      textAlign: "left",
                      fontWeight: "600",
                    }}
                  >
                    Total Consumption
                  </th>
                </tr>
              </thead>
              <tbody>
                {extractRequiredData().typeSummaries.map(
                  (summary, rowIndex) => (
                    <tr
                      key={rowIndex}
                      style={{
                        backgroundColor:
                          rowIndex % 2 === 0 ? "#ebf8ff" : "white",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 18px",
                          border: "1px solid #e2e8f0",
                          fontWeight: "bold",
                          color: "#2d3748",
                        }}
                      >
                        {summary.usage_type}
                      </td>
                      <td
                        style={{
                          padding: "12px 18px",
                          border: "1px solid #e2e8f0",
                          color: "#2d3748",
                        }}
                      >
                        {summary.display_total}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default App;