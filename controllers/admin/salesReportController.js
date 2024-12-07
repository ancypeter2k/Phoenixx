import orderModel from '../../models/order.js'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'

 //^ //  //  //   //  //          GET SALES REPORT PAGE   //  //  //  //  //  //  //
export const getSalesReportPage = async (req,res) => {
  try {

    const query = req.query;
    const filterType = query.filterType || 'daily';
    const startDate = query.startDate
    const endDate = query.endDate;
    const page = parseInt(query.page) || 1;
    const limit = 8;
    const skip = (page -1) * limit


    let matchCriteria = {
      paymentStatus: "Completed",
      orderedAt: {}
    }

    //filtering the orders based on the filter type

    switch (filterType) {
     case 'custom':
      if (startDate && endDate) {
        matchCriteria.orderedAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
      break;
    case 'weekly':
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      matchCriteria.orderedAt = { $gte: lastWeek }
      break;
    case 'monthly':
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      matchCriteria.orderedAt = { $gte: lastMonth }
      break;
    
    default:
      const today = new Date();
      matchCriteria.orderedAt = { $gte: new Date(today.setHours(0, 0, 0, 0)) }
      break;
    }

   const orders = await orderModel.find(matchCriteria)
        .populate('user', 'name')
        .populate('items.product', 'name')
        .sort({createdAt: 1})
        .skip(skip)
        .limit(limit)

   const totalOrders = await orderModel.countDocuments(matchCriteria)
   const totalPages = Math.ceil(totalOrders / limit)
   const startIndex = skip + 1;

   const salesReport = await orderModel.aggregate([
       { $match: matchCriteria },
       { $unwind: '$items' },
       { $match: { 'items.itemStatus': 'Delivered' } },
       {
         $group: {
          _id: null,
          totalRevenue: { $sum: '$items.itemTotal' },
          totalDiscount: { $sum: '$items.discountAmount' },
          salesCount: { $sum: 1 },
         }
       }
   ])

   const reportData = salesReport[0] || { totalRevenue: 0, totalDiscount: 0, salesCount: 0}

   res.render('admin/salesReport',{
    orders,
    totalPages,
    reportData,
    currentPage: page,
    filterType,
    startDate,
    endDate,
    startIndex,
    title:"Sales Report"
   })

  }catch (error) {
    console.log("Error in getSalesReportPage",error);
    res.status(500).send("Internal Server Error");   
  }
}
 // //  //  //   //  //          GET MATCH CRITERIA   //  //  //  //  //  //  //
 const getMatchCriteria = (filterType,startDate,endDate) => {
  let matchCriteria = {
    paymentStatus: 'Completed',
    orderedAt: {}
  }

  switch (filterType) {
    case 'custom':
      if (startDate && endDate) {
        matchCriteria.orderedAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
      break;
    case 'weekly':
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      matchCriteria.orderedAt = { $gte: lastWeek }
      break;
    case 'monthly':
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      matchCriteria.orderedAt = { $gte: lastMonth }
      break;
    default:
      const today = new Date();
      matchCriteria.orderedAt = { $gte: new Date(today.setHours(0, 0, 0, 0)) }
      break;
  }
  
  return matchCriteria;
}

//^ //  //  //   //  //         GENERATE PDF REPORT     //  //  //  //  //  //  //

export const generatePDFReport = async (req, res) => {
  try {
    const { filterType, startDate, endDate } = req.query;
    const matchCriteria = getMatchCriteria(filterType, startDate, endDate);

    const salesReport = await orderModel.aggregate([
      { $match: matchCriteria },
      { $unwind: '$items' },
      { $match: { 'items.itemStatus': 'Delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.itemTotal' },
          totalDiscount: { $sum: '$items.discountAmount' },
          salesCount: { $sum: 1 },
        },
      },
      {
        $project: {
          totalRevenue: { $floor: '$totalRevenue' },
          totalDiscount: { $floor: '$totalDiscount' },
          salesCount: { $floor: '$salesCount' },
        },
      },
    ]);

    const reportData = salesReport[0] || { totalRevenue: 0, totalDiscount: 0, salesCount: 0 };

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#333')
      .text('Phoenix Sales Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor('#666')
      .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#333')
      .text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor('#444')
    .text(`Total Revenue: ₹${Math.floor(reportData.totalRevenue)}`)
    .text(`Total Discount: ₹${Math.floor(reportData.totalDiscount)}`)
    .text(`Total Sales Count: ${Math.floor(reportData.salesCount)}`);
    doc.moveDown(1);

    const headers = [
      { label: 'User', width: 80 },
      { label: 'Order ID', width: 80 },
      { label: 'Product', width: 80 },
      { label: 'Qty', width: 40 },
      { label: 'Order Date', width: 60 },
      { label: 'Item Total', width: 60 }
    ];

    let x = doc.x, y = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#007acc')
      .rect(x, y, doc.page.width - doc.page.margins.left - doc.page.margins.right, 18).fill('#007acc');
    headers.forEach((header) => {
      doc.fillColor('#ffffff').text(header.label, x + 5, y + 4, { width: header.width, align: 'center' });
      x += header.width;
    });
    y += 18;

    const truncate = (str, len) => (str.length > len ? `${str.slice(0, len - 3)}...` : str);

    const orders = await orderModel.find(matchCriteria)
      .populate('user', 'name')
      .populate('items.product', 'name');

    doc.font('Helvetica').fontSize(9).fillColor('#000');
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.itemStatus === 'Delivered') {
          x = doc.page.margins.left;
          y += 15;

          const rowData = [
            order.user.name,
            truncate(order._id.toString(), 16),
            truncate(item.product.name, 10),
            item.quantity,
            new Date(order.orderedAt).toLocaleDateString(),
            `₹${item.itemTotal}`
          ];

          rowData.forEach((text, i) => {
            // doc.rect(x, y, headers[i].width, 15).stroke();//boarder
            doc.text(text, x + 3, y + 3, { width: headers[i].width, align: 'center' });
            x += headers[i].width;
          });

          if (y > doc.page.height - 50) {
            doc.addPage();
            y = doc.y;
          }
        }
      });
    });

    doc.end();
  } catch (error) {
    console.error('Error in generatePDFReport:', error);
    res.status(500).send('Internal Server Error');
  }
};

 //^ //  //  //   //  //         GENERATE EXCEL REPORT     //  //  //  //  //  //  //

export const generateExcelReport = async (req, res) => {
  try {
    const { filterType, startDate, endDate } = req.query;
    const matchCriteria = getMatchCriteria(filterType, startDate, endDate);

    // Fetch orders based on match criteria
    const orders = await orderModel.find(matchCriteria)
      .populate('user', 'name')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    // Calculate summary data using aggregation
    const salesReport = await orderModel.aggregate([
      { $match: matchCriteria },
      { $unwind: '$items' },
      { $match: { 'items.itemStatus': 'Delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.itemTotal' },
          totalDiscount: { $sum: '$items.discountAmount' },
          salesCount: { $sum: 1 },
        },
      },
    ]);

    const reportData = salesReport[0] || { totalRevenue: 0, totalDiscount: 0, salesCount: 0 };
    

    // Initialize workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // columns with headers and keys
    worksheet.columns = [
      { header: 'User', key: 'user', width: 20 },
      { header: 'Order ID', key: 'orderId', width: 30 },
      { header: 'Product', key: 'product', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Discount', key: 'totalDiscount', width: 15 },
      { header: 'Coupon Discount', key: 'couponDiscount', width: 20 },
      { header: 'Total', key: 'itemTotal', width: 15 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
    ];

    //  title row with styling
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Phoenix Sales Report';
    titleCell.font = { name: 'Georgia', size: 16, bold: true };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }; 
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Add filter info  below the title name
    const filterInfoRow = worksheet.getRow(2);
    filterInfoRow.getCell(1).value = `Filter Type: ${filterType || 'All'}`;
    filterInfoRow.getCell(2).value = `Start Date: ${startDate || 'N/A'}`;
    filterInfoRow.getCell(3).value = `End Date: ${endDate || 'N/A'}`;

    // Merge cells for filter info
    worksheet.mergeCells('A2:I2');
    filterInfoRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Style the filter info row
    filterInfoRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFADD8E6' } }; 
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    filterInfoRow.height = 20;

    //  header row with styling
    const headerRow = worksheet.getRow(3);
    const headers = [
      'User',
      'Order ID',
      'Product',
      'Quantity',
      'Discount',
      'Coupon Discount',
      'Total',
      'Payment Status',
      'Date',
    ];

    headers.forEach((header, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007ACC' } }; 
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 25;

    // data rows starting from row 4
    let dataRowIndex = 4; 
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.itemStatus === 'Delivered') {
          const row = worksheet.addRow({
            user: order.user.name,
            orderId: order._id.toString(),
            product: item.product.name,
            quantity: item.quantity,
            totalDiscount: `₹${item.discountAmount.toFixed(2)}`,
            couponDiscount: `₹${item.couponDiscountAmount}`,
            itemTotal: `₹${item.itemTotal}`,
            paymentStatus: order.paymentStatus,
            date: new Date(order.orderedAt).toLocaleDateString(),
          });

          // Styling each cell in the data row
          row.eachCell((cell) => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });

          dataRowIndex++;
        }
      });
    });

    // Add an empty row for spacing before summary
    worksheet.addRow([]);

    // Adding summary data 
    const summaryStartRow = worksheet.lastRow.number + 1;

    //  a helper function to add summary rows
    const addSummaryRow = (label, value) => {
      const row = worksheet.addRow([label, value]);

      //  summary row styling
      row.getCell(1).font = { bold: true };
      row.getCell(2).font = { bold: true };
      row.getCell(1).alignment = { horizontal: 'right' };
      row.getCell(2).alignment = { horizontal: 'left' };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      
      row.height = 20;
    };

    // Adding Total Revenue
    addSummaryRow('Total Revenue:', `₹${reportData.totalRevenue.toFixed(2)}`);

    // Adding Total Discount
    addSummaryRow('Total Discount:', `₹${reportData.totalDiscount.toFixed(2)}`);

    // Adding Total Sales Count
    addSummaryRow('Total Sales Count:', reportData.salesCount);

    // Fine-tune column widths increase
    worksheet.columns.forEach(column => {
      column.width = column.width < 20 ? 20 : column.width;
    });

    // Set response headers for Excel file download
    const filename = `sales_report_${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("Error in generateExcelReport", error);
    res.status(500).send("Internal Server Error");
  }
};
