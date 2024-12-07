import userModel from "../../models/User.js";
import orderModel from "../../models/order.js";

// //  //  //   //  //          GET DASHBOARD PAGE    //  //  //  //  //  //  // 

const getDashboard = async (req, res) => {
  const { filterType = 'daily' } = req.query;
  let matchCondition = {};
  let dateFormat = "%Y-%m-%d";
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  switch(filterType) {
    case 'daily':
      matchCondition = {
        orderedAt: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      };
      dateFormat = "%H:00";
      break;
    case 'weekly':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      matchCondition = {
        orderedAt: {
          $gte: startOfWeek,
          $lt: new Date()
        }
      };
      dateFormat = "%Y-%m-%d";
      break;
    case 'monthly':
      matchCondition = {
        orderedAt: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1)
        }
      };
      dateFormat = "%Y-%m-%d";
      break;
    case 'yearly':
      matchCondition = {
        orderedAt: {
          $gte: new Date(currentYear, 0, 1),
          $lt: new Date(currentYear + 1, 0, 1)
        }
      };
      dateFormat = "%Y-%m";
      break;
  }

  try {

    const totalRevenue = await orderModel.aggregate([
      { 
        $match: { 
          ...matchCondition, 
          paymentStatus: "Completed" 
        } 
      },
      { $unwind: "$items" }, 
      { 
        $match: { "items.itemStatus": "Delivered" } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: "$items.itemTotal" } 
        } 
      }
    ]);
    
    const totalOrders = await orderModel.countDocuments({
      ...matchCondition,
      paymentStatus: "Completed",
      "items.itemStatus": "Delivered"
    });
    
    const totalProductsSold = await orderModel.aggregate([
      { 
        $match: { 
          ...matchCondition, 
          paymentStatus: "Completed", 
          "items.itemStatus": "Delivered" 
        } 
      },
      { $unwind: "$items" },
      { 
        $match: { "items.itemStatus": "Delivered" } 
      },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } }
    ]);

    const totalCustomers = await userModel.countDocuments();

    // Sales and Orders Timeline Data
    const salesData = await orderModel.aggregate([
      { 
        $match: { 
          ...matchCondition, 
          paymentStatus: "Completed", 
          "items.itemStatus": "Delivered" 
        } 
      },
      { $unwind: "$items" },
      { 
        $match: { "items.itemStatus": "Delivered" } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%H:%M", date: "$orderedAt", timezone: "Asia/Kolkata" } },
          revenue: { $sum: "$items.itemTotal" },
          orders: { $sum: 1 },
          itemsSold: { $sum: "$items.quantity" } // Count each item after unwinding
        }
      },
      { $sort: { _id: 1 } }
    ]);

    
    const parsedSalesData = Array.isArray(salesData) ? salesData : [];

    const formattedSalesData = parsedSalesData.map(item => {
      const [hour, minute] = item._id.split(':');
      const hour12 = hour % 12 || 12; // In here iam doing 24 hour format Convert to 12-hour format
      const ampm = hour < 12 ? 'AM' : 'PM';
      return {
        ...item,
        _id: `${hour12}:${minute} ${ampm}` // Format as "hh:mm AM/PM"
      };
    });



    // Best Selling Products
    const bestSellingProducts = await orderModel.aggregate([
      { 
        $match: { 
          ...matchCondition, 
          paymentStatus: "Completed", 
          "items.itemStatus": "Delivered" 
        } 
      },
      { $unwind: "$items" },
      {
        $match: { "items.itemStatus": "Delivered" } 
      },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.itemTotal"] } }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          productName: "$productDetails.name",
          productImage: "$productDetails.image",
          totalSold: 1,
          totalRevenue: 1,
          averagePrice: { $divide: ["$totalRevenue", "$totalSold"] }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Best Selling Categories
    const bestSellingCategories = await orderModel.aggregate([
      { 
        $match: { 
          ...matchCondition, 
          paymentStatus: "Completed", 
          "items.itemStatus": "Delivered" 
        } 
      },
      { $unwind: "$items" },
      {
        $match: { "items.itemStatus": "Delivered" } 
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.itemTotal"] } }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: "$categoryDetails" },
      {
        $project: {
          categoryName: "$categoryDetails.name",
          categoryImage: "$categoryDetails.image",
          totalSold: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    res.render('admin/dashboard', {
      title: "Dashboard",
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders,
      totalProductsSold: totalProductsSold[0]?.total || 0,
      totalCustomers,
      salesDataChart: formattedSalesData,
      bestSellingProducts,
      bestSellingCategories,
      filterType
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).render('error', { message: "Error loading dashboard" });
  }
};


export default {
  getDashboard
}
