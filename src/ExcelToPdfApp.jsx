// import React, { useState } from 'react';
// import * as XLSX from 'xlsx';
// import { PDFDownloadLink } from '@react-pdf/renderer';
// import ExcelPDFDocument from './ExcelPDFDocument';
// import { FixedSizeList as List } from 'react-window';
// import 'react-virtualized/styles.css'; // Optional: if you use react-virtualized elsewhere

// const ALLOWED_COLUMNS = [
//   'START_TIME',
//   'END_TIME',
//   'CALLING_FROM',
//   'USAGE_TYPE',
//   'ACT_DURATION',
//   'AMOUNT',
//   'RESOURCE_NAME',
// ];

// export default function ExcelToPdfApp() {
//   const [excelData, setExcelData] = useState([]);
//   const [headers, setHeaders] = useState([]);
//   const [loadingExcel, setLoadingExcel] = useState(false);
//   const [loadingPDF, setLoadingPDF] = useState(false);

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setLoadingExcel(true);

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       try {
//         const binaryStr = event.target.result;
//         const workbook = XLSX.read(binaryStr, { type: 'binary' });

//         const sheetName = 'Export Worksheet';
//         const worksheet = workbook.Sheets[sheetName];

//         if (!worksheet) {
//           alert(`Sheet "${sheetName}" not found in the Excel file.`);
//           setLoadingExcel(false);
//           return;
//         }

//         const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//         const originalHeaders = jsonData[0];
//         const allowedIndexes = originalHeaders
//           .map((col, index) => (ALLOWED_COLUMNS.includes(col) ? index : -1))
//           .filter((index) => index !== -1);

//         const filteredHeaders = allowedIndexes.map((i) => originalHeaders[i]);
//         const filteredData = jsonData.slice(1).map((row) =>
//           allowedIndexes.map((i) => row[i])
//         );

//         setHeaders(filteredHeaders);
//         setExcelData(filteredData);
//       } catch (err) {
//         console.error('Failed to parse Excel:', err);
//       } finally {
//         setLoadingExcel(false);
//       }
//     };

//     reader.readAsBinaryString(file);
//   };

//   return (
//     <div className="p-6 max-w-6xl mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Excel to PDF (React PDF)</h1>

//       <input
//         type="file"
//         accept=".xlsx, .xls"
//         onChange={handleFileUpload}
//         className="mb-4"
//       />

//       {loadingExcel && (
//         <div className="flex items-center gap-2 mb-4">
//           <div className="w-4 h-4 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
//           <span className="text-blue-600">Loading Excel data...</span>
//         </div>
//       )}

//       {!loadingExcel && excelData.length > 0 && (
//         <>
//           {/* Headers */}
//           <div
//             className="grid font-semibold bg-gray-200 text-sm border-y"
//             style={{
//               display: 'grid',
//               gridTemplateColumns: `repeat(${headers.length}, minmax(150px, 1fr))`,
//             }}
//           >
//             {headers.map((header, i) => (
//               <div key={i} className="p-2 border-r">
//                 {header}
//               </div>
//             ))}
//           </div>

//           {/* Virtualized rows */}
//           <div className="border max-h-[500px] overflow-y-auto mb-4">
//             <List
//               height={400}
//               itemCount={excelData.length}
//               itemSize={35}
//               width="100%"
//             >
//               {({ index, style }) => (
//                 <div
//                   style={style}
//                   className="grid border-b text-sm even:bg-gray-50"
//                   key={index}
//                   style={{
//                     ...style,
//                     display: 'grid',
//                     gridTemplateColumns: `repeat(${headers.length}, minmax(150px, 1fr))`,
//                   }}
//                 >
//                   {excelData[index].map((cell, j) => (
//                     <div key={j} className="p-2 border-r truncate">
//                       {String(cell)}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </List>
//           </div>

//           {/* PDF Download */}
//           <PDFDownloadLink
//             document={<ExcelPDFDocument headers={headers} data={excelData} />}
//             fileName="excel-report.pdf"
//             className="bg-blue-600 text-white px-4 py-2 rounded"
//             loading={() => {
//               setLoadingPDF(true);
//               return null;
//             }}
//           >
//             {({ loading }) => {
//               if (loading) {
//                 return (
//                   <span className="text-blue-600 animate-pulse">
//                     Generating PDF...
//                   </span>
//                 );
//               } else {
//                 setTimeout(() => setLoadingPDF(false), 500); // delay to ensure clean UI
//                 return 'Download PDF';
//               }
//             }}
//           </PDFDownloadLink>
//         </>
//       )}
//     </div>
//   );
// }
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ExcelPDFDocument from './ExcelPDFDocument';
import { FixedSizeList as List } from 'react-window';
import { Tooltip } from './Tooltip'; // Assuming you'll create or import a tooltip component

// List of allowed columns from the Excel sheet
const ALLOWED_COLUMNS = [
  'START_TIME',
  'END_TIME',
  'CALLING_FROM',
  'USAGE_TYPE',
  'ACT_DURATION',
  'AMOUNT',
  'RESOURCE_NAME',
];

export default function ExcelToPdfApp() {
  const [excelData, setExcelData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [displayRowCount, setDisplayRowCount] = useState(100);
  const [totalRowCount, setTotalRowCount] = useState(0);

  // Load theme preference from localStorage on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
    
    // Load saved row count preference
    const savedRowCount = localStorage.getItem('displayRowCount');
    if (savedRowCount) {
      setDisplayRowCount(parseInt(savedRowCount, 10));
    }
  }, []);

  // Update localStorage and apply theme changes when darkMode changes
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Save row count preference
  useEffect(() => {
    localStorage.setItem('displayRowCount', displayRowCount.toString());
  }, [displayRowCount]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleRowCountChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setDisplayRowCount(value);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoadingExcel(true);
    setErrorMessage('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary', cellStyles: true });

        // Get the first sheet if "Export Worksheet" doesn't exist
        let sheetName = 'Export Worksheet';
        if (!workbook.Sheets[sheetName]) {
          sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            throw new Error('No sheets found in the Excel file.');
          }
        }

        const worksheet = workbook.Sheets[sheetName];
        
        // Process visible rows only
        const jsonData = [];
        let visibleRows = new Set();
        
        // Find all non-hidden rows
        if (worksheet['!rows']) {
          worksheet['!rows'].forEach((row, index) => {
            if (!row || !row.hidden) {
              visibleRows.add(index);
            }
          });
        } else {
          // If no row info, assume all rows are visible
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
          for (let i = range.s.r; i <= range.e.r; i++) {
            visibleRows.add(i);
          }
        }
        
        // Convert to JSON considering only visible rows
        const tempData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        tempData.forEach((row, idx) => {
          if (visibleRows.has(idx)) {
            jsonData.push(row);
          }
        });
        
        if (jsonData.length <= 1) {
          throw new Error('Excel file contains no visible data rows.');
        }

        const originalHeaders = jsonData[0];
        const allowedIndexes = originalHeaders
          .map((col, index) => (ALLOWED_COLUMNS.includes(col) ? index : -1))
          .filter((index) => index !== -1);

        if (allowedIndexes.length === 0) {
          throw new Error('No matching columns found. Expected columns: ' + ALLOWED_COLUMNS.join(', '));
        }

        const filteredHeaders = allowedIndexes.map((i) => originalHeaders[i]);
        const filteredData = jsonData.slice(1)
          .filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''))
          .map((row) => allowedIndexes.map((i) => row[i] ?? ''));

        setHeaders(filteredHeaders);
        setExcelData(filteredData);
        setTotalRowCount(filteredData.length);
      } catch (err) {
        console.error('Failed to parse Excel:', err);
        setErrorMessage(err.message || 'Failed to parse Excel file.');
        setHeaders([]);
        setExcelData([]);
        setTotalRowCount(0);
      } finally {
        setLoadingExcel(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const resetData = () => {
    setExcelData([]);
    setHeaders([]);
    setFileName('');
    setErrorMessage('');
    setTotalRowCount(0);
  };

  // Generate class names based on the current theme
  const themeClasses = {
    container: darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800',
    header: darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800',
    headerItem: darkMode ? 'border-gray-700' : 'border-gray-200',
    row: darkMode ? 'border-gray-700 even:bg-gray-800' : 'border-gray-200 even:bg-gray-50',
    cell: darkMode ? 'border-gray-700' : 'border-gray-200',
    button: darkMode ? 'bg-white hover:bg-white' : 'bg-white hover:bg-white',
    themeToggle: darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300',
    resetButton: darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600',
    input: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300',
  };

  // Calculate rows to display (either all rows or limited by displayRowCount)
  const displayData = excelData.slice(0, displayRowCount);

  return (
    <div className={`p-6 max-w-6xl mx-auto min-h-screen transition-colors duration-200 ${themeClasses.container}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Excel to PDF Converter</h1>
        
        <button
          onClick={toggleTheme}
          className={`px-3 py-1 rounded-full flex items-center ${themeClasses.themeToggle}`}
        >
          {darkMode ? (
            <>
              <span className="mr-2">☀️</span>
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <span className="mr-2">🌙</span>
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <label className="block mb-2 font-medium">Upload Excel File:</label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className={`file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold ${
              darkMode
                ? 'file:bg-blue-600 file:text-white hover:file:bg-blue-700'
                : 'file:bg-blue-500 file:text-white hover:file:bg-blue-600'
            }`}
          />
          
          {fileName && (
            <button
              onClick={resetData}
              className={`text-white px-3 py-1 rounded text-sm ${themeClasses.resetButton}`}
            >
              Reset
            </button>
          )}
        </div>
        
        {fileName && <p className="mt-2 text-sm opacity-75">File: {fileName}</p>}
        <p className="mt-1 text-xs opacity-75">Only visible rows (not hidden by filters) will be processed</p>
      </div>

      {loadingExcel && (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 border-2 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-600">Processing Excel data...</span>
        </div>
      )}

      {errorMessage && (
        <div className={`p-4 mb-6 rounded-lg bg-red-100 text-red-700 ${darkMode ? 'bg-opacity-20' : ''}`}>
          <p className="font-medium">Error:</p>
          <p>{errorMessage}</p>
        </div>
      )}

      {!loadingExcel && excelData.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm mb-1">Rows to display:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={totalRowCount}
                    value={displayRowCount}
                    onChange={handleRowCountChange}
                    className={`w-20 px-2 py-1 border rounded ${themeClasses.input}`}
                  />
                  <span className="text-sm opacity-75">of {totalRowCount}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Quick select:</label>
                <div className="flex gap-1">
                  {[50, 100, 250, 500].map(count => (
                    <button
                      key={count}
                      onClick={() => setDisplayRowCount(Math.min(count, totalRowCount))}
                      className={`px-2 py-1 text-xs rounded ${
                        displayRowCount === count 
                          ? darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'
                          : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                  <button
                    onClick={() => setDisplayRowCount(totalRowCount)}
                    className={`px-2 py-1 text-xs rounded ${
                      displayRowCount === totalRowCount 
                        ? darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'
                        : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>
            </div>
            
            <PDFDownloadLink
              document={<ExcelPDFDocument headers={headers} data={excelData} fileName={fileName} />}
              fileName={`${fileName.split('.')[0] || 'excel-report'}.pdf`}
              className={`text-white px-4 py-2 rounded flex items-center ${themeClasses.button}`}
            >
              {({ loading, error }) => {
                if (loading) {
                  setLoadingPDF(true);
                  return (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      Preparing PDF...
                    </span>
                  );
                } else if (error) {
                  return 'Error generating PDF';
                } else {
                  setTimeout(() => setLoadingPDF(false), 500);
                  return (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
                    </>
                  );
                }
              }}
            </PDFDownloadLink>
          </div>

          {/* Display info */}
          <div className="mb-2 text-sm">
            <p>
              Showing {Math.min(displayRowCount, totalRowCount)} of {totalRowCount} visible rows {
                displayRowCount < totalRowCount && 
                `(${((displayRowCount / totalRowCount) * 100).toFixed(1)}%)`
              }
            </p>
          </div>

          {/* Table container */}
          <div className={`border rounded-lg overflow-hidden ${themeClasses.headerItem}`}>
            {/* Headers */}
            <div
              className={`grid font-semibold text-sm ${themeClasses.header}`}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${headers.length}, minmax(150px, 1fr))`,
              }}
            >
              {headers.map((header, i) => (
                <div key={i} className={`p-3 border-r ${themeClasses.headerItem}`}>
                  <Tooltip content={header}>
                    <div className="truncate">{header}</div>
                  </Tooltip>
                </div>
              ))}
            </div>

            {/* Virtualized rows */}
            <div className="max-h-[500px] overflow-y-auto">
              <List
                height={Math.min(500, displayData.length * 35 + 2)}
                itemCount={displayData.length}
                itemSize={35}
                width="100%"
                className={darkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}
              >
                {({ index, style }) => (
                  <div
                    style={{
                      ...style,
                      display: 'grid',
                      gridTemplateColumns: `repeat(${headers.length}, minmax(150px, 1fr))`,
                    }}
                    className={`text-sm ${index % 2 === 0 ? '' : darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                  >
                    {displayData[index].map((cell, j) => (
                      <div key={j} className={`p-2 border-r ${themeClasses.cell} truncate`}>
                        <Tooltip content={String(cell || '')}>
                          <div className="truncate">{String(cell || '')}</div>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                )}
              </List>
            </div>
          </div>
          
          {displayRowCount < totalRowCount && (
            <div className="mt-3 text-xs opacity-75">
              <p>Note: All {totalRowCount} visible rows will be included in the PDF export regardless of display setting.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}