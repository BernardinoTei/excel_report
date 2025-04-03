// import React from 'react';
// import {
//   Document,
//   Page,
//   Text,
//   View,
//   StyleSheet,
// } from '@react-pdf/renderer';

// const styles = StyleSheet.create({
//   page: { padding: 20 },
//   header: { fontSize: 18, marginBottom: 10 },
//   table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1 },
//   tableRow: { flexDirection: 'row' },
//   tableCell: {
//     margin: 2,
//     padding: 4,
//     fontSize: 10,
//     borderStyle: 'solid',
//     borderWidth: 1,
//     flexGrow: 1,
//   },
//   headerCell: {
//     backgroundColor: '#eee',
//     fontWeight: 'bold',
//   },
// });

// // Function to paginate data
// const paginate = (data, rowsPerPage = 30) => {
//   const pages = [];
//   for (let i = 0; i < data.length; i += rowsPerPage) {
//     pages.push(data.slice(i, i + rowsPerPage));
//   }
//   return pages;
// };

// const ExcelPDFDocument = ({ headers, data }) => {
//   const pages = paginate(data, 35); // 35 rows per page

//   return (
//     <Document>
//       {pages.map((pageData, pageIndex) => (
//         <Page key={pageIndex} size="A4" style={styles.page}>
//           <Text style={styles.header}>Excel Data Report - Page {pageIndex + 1}</Text>

//           <View style={styles.table}>
//             <View style={styles.tableRow}>
//               {headers.map((header, i) => (
//                 <Text key={i} style={[styles.tableCell, styles.headerCell]}>
//                   {header}
//                 </Text>
//               ))}
//             </View>
//             {pageData.map((row, rowIndex) => (
//               <View key={rowIndex} style={styles.tableRow}>
//                 {row.map((cell, cellIndex) => (
//                   <Text key={cellIndex} style={styles.tableCell}>
//                     {String(cell)}
//                   </Text>
//                 ))}
//               </View>
//             ))}
//           </View>
//         </Page>
//       ))}
//     </Document>
//   );
// };

// export default ExcelPDFDocument;
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  reportHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#2c5282',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerRight: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5282',
  },
  reportTitle: { 
    fontSize: 14, 
    fontWeight: 'bold',
    color: '#4a5568',
    marginTop: 4,
  },
  table: { 
    display: 'table', 
    width: 'auto', 
    borderStyle: 'solid', 
    borderWidth: 1,
    borderColor: '#cbd5e0',
    marginBottom: 15,
  },
  tableHeader: {
    backgroundColor: '#2c5282',
  },
  tableRow: { 
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
    minHeight: 22,
  },
  tableRowEven: {
    backgroundColor: '#f7fafc',
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    borderRightStyle: 'solid',
    flexGrow: 1,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: 9,
    borderRightColor: '#4a69bd',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#718096',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#718096',
  },
  disclaimerText: {
    fontSize: 7,
    color: '#718096',
    marginTop: 5,
  },
  reportDetails: {
    marginBottom: 15,
    fontSize: 10,
    color: '#4a5568',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    width: 120,
    fontWeight: 'bold',
  },
  detailValue: {
    flex: 1,
  },
});

// Function to format the current date
const formatDate = (date = new Date()) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Function to paginate data
const paginate = (data, rowsPerPage = 30) => {
  const pages = [];
  for (let i = 0; i < data.length; i += rowsPerPage) {
    pages.push(data.slice(i, i + rowsPerPage));
  }
  return pages;
};

const ExcelPDFDocument = ({ 
  headers = [], 
  data = [],
  title = "Excel Data Report",
  companyName = "DATA SERVICES INC.",
  reportDate = formatDate(),
  reportDetails = {},
  rowsPerPage = 35
}) => {
  const pages = paginate(data, rowsPerPage);
  
  return (
    <Document>
      {pages.map((pageData, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* Header with company name and report title */}
          <View style={styles.reportHeader}>
            <View style={styles.headerRight}>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.reportTitle}>{title}</Text>
            </View>
          </View>
          
          {/* Report Details Section - Only on first page */}
          {pageIndex === 0 && reportDetails && Object.keys(reportDetails).length > 0 && (
            <View style={styles.reportDetails}>
              {Object.entries(reportDetails).map(([label, value], index) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label}:</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Report Generated:</Text>
                <Text style={styles.detailValue}>{reportDate}</Text>
              </View>
            </View>
          )}
          
          {/* Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              {headers.map((header, i) => (
                <Text key={i} style={[styles.tableCell, styles.headerCell]}>
                  {header}
                </Text>
              ))}
            </View>
            
            {/* Table Rows */}
            {pageData.map((row, rowIndex) => (
              <View 
                key={rowIndex} 
                style={[
                  styles.tableRow, 
                  rowIndex % 2 === 1 ? styles.tableRowEven : {}
                ]}
              >
                {row.map((cell, cellIndex) => (
                  <Text key={cellIndex} style={styles.tableCell}>
                    {String(cell)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text>{companyName} - Confidential Information</Text>
            <Text style={styles.disclaimerText}>
              This report is for informational purposes only. Please contact support for any discrepancies.
            </Text>
          </View>
          
          {/* Page Number */}
          <Text style={styles.pageNumber}>Page {pageIndex + 1} of {pages.length}</Text>
        </Page>
      ))}
    </Document>
  );
};

// Example of how to use the component
const ExampleUsage = () => {
  const headers = ['ID', 'Date', 'Description', 'Type', 'Amount', 'Status'];
  
  const data = [
    ['001', '2025-03-01', 'Item Description 1', 'Type A', '$100.00', 'Completed'],
    ['002', '2025-03-02', 'Item Description 2', 'Type B', '$250.00', 'Pending'],
    // Add more rows as needed
  ];
  
  const reportDetails = {
    'Report ID': 'REP-2025-0001',
    'Department': 'Sales',
    'Period': 'March 2025'
  };
  
  return (
    <ExcelPDFDocument 
      headers={headers}
      data={data}
      title="Sales Data Report"
      reportDetails={reportDetails}
    />
  );
};

export default ExcelPDFDocument;