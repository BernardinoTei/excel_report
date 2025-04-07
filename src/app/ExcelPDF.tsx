/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, FileUp } from "lucide-react";
import logoImage from '@/assets/logoImage'




function ExcelPDF() {
  const [excelData, setExcelData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [workbook, setWorkbook] = useState(null);

  // Define the mappings for the event paths
  const eventMappings:any = {
    "/event/billing/product/fee/purchase": "Ativação de plano",
    "/event/delayed/session/telco/gprs": "Serviço de Dados e internet",
    "/event/delayed/session/telco/gsm": "Serviço de Voz",
    "/event/delayed/session/telco/gsm/sms": "Serviço de SMS",
  };

  const calculateDateRange = (rows:any) => {
    if (!rows || rows.length === 0) return { min: "N/A", max: "N/A" };

    let minDate: number | Date | null = null;
    let maxDate: number | Date | null = null;

    rows.forEach((row:any) => {
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
          console.log(e);
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
        } catch (e:any) {
          // Skip invalid dates
          console.log(e);
          
        }
      }
    });

    // Format dates as DD/MM/YYYY
    const formatDate = (date:any) => {
      if (!date) return "N/A";
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    return {
      min: formatDate(minDate),
      max: formatDate(maxDate)
    };
  };

  // Function to handle file upload and parse Excel data
  const handleFileUpload = (event:any) => {
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
            const ab = e?.target?.result;
            const wb:any = XLSX.read(ab, { type: "array" });
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
          } catch (err:any) {
            setError("Error processing Excel file: " + err.message);
            console.error("Error processing Excel file:", err);
          }
        };
        reader.onerror = (err:any) => {
          setError("Error reading file: " + err?.message);
          console.error("File reading error:", err);
        };
        reader.readAsArrayBuffer(file);
      } catch (err:any) {
        setError("Error handling file: " + err?.message);
        console.error("File handling error:", err);
      }
    }
  };

  // Function to process the selected sheet
  const processSheet = (wb:any, sheetName:any) => {
    if (!wb || !sheetName) return;

    try {
      const sheet = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Convert sheet to JSON array

      // Map the event paths in the data
      const updatedData = data.map((row:any) => {
        return row.map((cell:any) => {
          // Check if the cell contains an event path and replace it
          return eventMappings[cell] || cell; // Replace event path if exists, otherwise keep the cell value
        });
      });

      setExcelData(updatedData); // Set the parsed and updated data to state
    } catch (err:any) {
      setError("Error processing sheet: " + err.message);
      console.error("Sheet processing error:", err);
    }
  };

  // Handle sheet selection change
  const handleSheetChange = (e:any) => {
    const newSelectedSheet = e;
    setSelectedSheet(newSelectedSheet);
    processSheet(workbook, newSelectedSheet);
  };

  // Function to convert units based on service type
  const convertUnits = (amount:any, serviceType:any) => {
    let value = parseFloat(amount) || 0;
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
      (h:any) =>
        h &&
        h.toString().toLowerCase().includes("start") &&
        h.toString().toLowerCase().includes("time")
    );
    const endTimeIndex = headers.findIndex(
      (h:any) =>
        h &&
        h.toString().toLowerCase().includes("end") &&
        h.toString().toLowerCase().includes("time")
    );
    const usageTypeIndex = headers.findIndex(
      (h:any) =>
        h &&
        (h.toString().toLowerCase().includes("usage") ||
          h.toString().toLowerCase().includes("type"))
    );
    const amountIndex = headers.findIndex(
      (h:any) => h && h.toString().toLowerCase().includes("amount")
    );

    // Extract only the rows with the required fields and non-zero amounts
    const extractedRows = excelData
      .slice(1)
      .map((row:any) => {
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
              : "DD/MM/AAAA",
          end_time:
            endTimeIndex >= 0 && row[endTimeIndex]
              ? formatDateTime(row[endTimeIndex])
              : "DD/MM/AAAA",
          usage_type: usageType,
          raw_amount: parseFloat(rawAmount) || 0,
          display_amount: convertedAmount.display,
        };
      })
      .filter((row:any) => row.raw_amount > 0); // Filter out rows with zero amount

    // Group by usage type for summary
    const groupedByType = extractedRows.reduce((acc:any, row:any) => {
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
  const formatDateTime = (dateTimeString:any) => {
    if (!dateTimeString) return "DD/MM/AAAA";

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
      console.log(e);
    }

    return String(dateTimeString);
  };

  // Function to truncate text for PDF table cells
  const truncateText = (text:any, maxLength = 20) => {
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
      // doc.setFillColor(41, 128, 185);
      // doc.rect(margin, 10, 30, 15, "F");
      doc.addImage(logoImage, 'PNG', margin, 10, 30, 15);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      // doc.text("Africell", margin + 8, 20);

      // Add document number and user name at the top
      doc.setTextColor(44, 62, 80);
      doc.setFontSize(14);
      doc.text(
        `Nº do Cliente: ${documentNumber || "N/A"}`,
        pageWidth - margin,
        15,
        { align: "right" }
      );
      doc.setFontSize(12);
      doc.text(`Cliente: ${userName || "N/A"}`, pageWidth - margin, 25, {
        align: "right",
      });
      // doc.setFontSize(12);
      // doc.text(`${dateRange.min} - ${dateRange.max}`, pageWidth - margin, 35, {
      //   align: "right",
      // });

      // Add title
      doc.setFontSize(16);
      doc.setTextColor(44, 62, 80);
      doc.text("Relatório de Consumo", pageWidth / 2, 35, { align: "center" });

      // Add sheet name and timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const date = new Date().toLocaleString();
      // Display the date range

      // doc.text(`Sheet: ${selectedSheet}`, margin, 45);
      doc.text(`${dateRange.min} - ${dateRange.max}`,  margin, 45);
      doc.text(`Gerado em: ${date}`, pageWidth - margin, 45, {
        align: "right",
      });

      // Add summary section
      let yPos = 55;
      const rowHeight = 10;
      // Draw summary header
      doc.setFillColor(160, 23, 117);
      doc.rect(margin, yPos, usableWidth, 10, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo de Consumo", margin + 5, yPos + 7);

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
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(summary.usage_type + ":", margin + 5, yPos + 7);
        doc.setFont("helvetica", "normal");
        doc.text(summary.display_total, pageWidth - margin - 5, yPos + 7, {
          align: "right",
        });

        yPos += rowHeight + 5;
      });

      // Set starting Y position for table
      yPos += 10;

      // Define column widths as percentages of usable width
      const colWidths = [
        usableWidth * 0.2, // Start Time (smaller)
        usableWidth * 0.2, // End Time (smaller)
        usableWidth * 0.35, // Usage Type (larger)
        usableWidth * 0.25, // Amount (medium)
      ];

      // Draw table header
      doc.setFillColor(160, 23, 117);
      doc.rect(margin, yPos, usableWidth, 10, "F");

      // Draw header text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");

      let xPos = margin;
      doc.text("Data de Início", xPos + 2, yPos + 7);
      xPos += colWidths[0];

      doc.text("Data Final", xPos + 2, yPos + 7);
      xPos += colWidths[1];

      doc.text("Tipo de Consumo", xPos + 2, yPos + 7);
      xPos += colWidths[2];

      doc.text("Consumo", xPos + 2, yPos + 7);

      yPos += 10; // Move to first data row

      // Draw data rows
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      

      rows.forEach((row:any, index:any) => {
        // Add a page if we're about to overflow
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = margin;

          // Add header on new page
          doc.setFillColor(160, 23, 117);
          doc.rect(margin, yPos, usableWidth, 10, "F");

          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");

          xPos = margin;
          doc.text("Data de Início", xPos + 2, yPos + 7);
          xPos += colWidths[0];

          doc.text("Data Final", xPos + 2, yPos + 7);
          xPos += colWidths[1];

          doc.text("Tipo de Consumo", xPos + 2, yPos + 7);
          xPos += colWidths[2];

          doc.text("Consumo", xPos + 2, yPos + 7);

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
      // const totalPages = doc?.internal?.getNumberOfPages();
      const totalPages = doc?.internal?.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages}`, margin, pageHeight - 10);
      }

      // Save the generated PDF
      doc.save(`usage-statement-${documentNumber || "report"}.pdf`);
    } catch (err: any) {
      setError("Error generating PDF: " + err.message);
      console.error("PDF generation error 2:", err);
    }
  };

  const { rows, typeSummaries } = extractRequiredData()
  const dateRange = rows.length > 0 ? calculateDateRange(rows) : { min: "DD/MM/AAAA", max: "DD/MM/AAAA" }


  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
    <h1 className="text-2xl font-bold text-slate-800 pb-4 border-b border-slate-200 mb-4">
        Gerador de Relatório de Consumo dos Clientes
    </h1>

    {error && (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}

    <Card className="mb-8 shadow-none">
      <CardHeader>
        <CardTitle>Informação do Documento</CardTitle>
        <CardDescription>Insira os detalhes do relatorio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="userName">Nome do Cliente</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter user name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documentNumber">Numero do Cliente</Label>
            <Input
              id="documentNumber"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Enter document number"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-md font-medium mb-2">Período de Consumo</h3>
          <p className="text-sm text-slate-600">{`${dateRange.min} - ${dateRange.max}`}</p>
        </div>

        <div className="space-y-2 pt-2">
          <Label htmlFor="fileUpload">Upload do ficheiro Excel</Label>
          <div className="flex items-center gap-2">
            <Input id="fileUpload" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="flex-1" />
            <Button variant="outline" size="icon" onClick={() => document.getElementById("fileUpload")?.click()}>
              <FileUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {availableSheets.length > 0 && (
          <div className="space-y-2 z-30">
            <Label htmlFor="sheetSelect">Select Sheet</Label>
            <Select value={selectedSheet} onValueChange={handleSheetChange}>
              <SelectTrigger id="sheetSelect">
                <SelectValue placeholder="Select a sheet" />
              </SelectTrigger>
              <SelectContent>
                {availableSheets.map((sheet) => (
                  <SelectItem key={sheet} value={sheet}>
                    {sheet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={generatePDF} disabled={!excelData} variant="outline" className="w-full md:w-auto bg-white">
          Gerar o Relatio PDF
        </Button>
      </CardContent>
    </Card>

    {excelData && (
      <div className="space-y-8">
        <div className="pb-8">
          <h3 className="text-xl font-semibold text-slate-800 pb-3 border-b border-slate-200 mb-4">Resumo de Consumo</h3>
          <div className="rounded-md border overflow-hidden max-w-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Consumo</TableHead>
                  <TableHead>Consumo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typeSummaries.map((summary, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{summary.usage_type}</TableCell>
                    <TableCell>{summary.display_total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="pb-8">
          <h3 className="text-xl font-semibold text-slate-800 pb-3 border-b border-slate-200 mb-4">
          Pré-visualização de Dados com Conversões de Unidade
          </h3>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Data Final</TableHead>
                    <TableHead>Tipo de Consumo</TableHead>
                    <TableHead>Quantidade Bruta</TableHead>
                    <TableHead>Quantidade Convertida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row:any, index:any) => (
                    <TableRow key={index}>
                      <TableCell>{row.start_time}</TableCell>
                      <TableCell>{row.end_time}</TableCell>
                      <TableCell>{row.usage_type}</TableCell>
                      <TableCell>{row.raw_amount}</TableCell>
                      <TableCell>{row.display_amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

      </div>
    )}
  </div>
  );
}

export default ExcelPDF;