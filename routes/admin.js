var express = require("express");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const userHelpers = require("../helpers/user-helpers");
const couponHelpers = require("../helpers/coupon-helpers");
const alert = require("alert");
var multer = require("multer");
const fs = require("fs");
const sharp = require("sharp");
const PDFDocument = require("pdfkit");

const verifyLogin = (req, res, next) => {
  if (req.session.admin && req.session.admin.loggedIn) {
    next();
  } else {
    res.redirect("admin/adminLogin");
  }
};

router.get("/", verifyLogin, async function (req, res, next) {
  let admin = req.session.admin;
  let category = await categoryHelpers.getAllCategory();
  productHelpers.getAllProducts().then((products) => {
    res.render("admin/view-products", {
      admin: true,
      products,
      admin,
      category,
    });
  });
});

router.get("/adminLogin", function (req, res) {
  if (req.session.admin) {
    res.redirect("/admin"); //--c
  } else {
    res.render("admin/adminLogin", { loginErr: req.session.adminLoginErr });
    req.session.adminLoginErr = false;
  }
});

router.post("/adminLogin", (req, res) => {
  adminHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      req.session.admin.loggedIn = true;
      res.redirect("/admin");
    } else {
      req.session.adminLoginErr = true;
      res.redirect("/admin/adminLogin");
    }
  });
});

//-----------------multer---------------------------------------------------------------------------------------------------------

const upload = multer({
  dest: "public/images",
  limits: {
    fieldSize: 10 * 1024 * 1024, // Increase the limit to 10MB (adjust the value as needed)
  },
  fileFilter: (req, file, cb) => {
    // Check if the file has a valid image extension
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      // Check if the file has the expected extension
      const originalExt = path.extname(file.originalname).toLowerCase();
      if (originalExt === ext) {
        cb(null, true); // Accept the file
      } else {
        cb(new Error("Invalid file extension."), false); // Reject the file
      }
    } else {
      cb(new Error("Only image files are allowed."), false); // Reject the file
    }
  },
});

 //const upload = multer({ dest:'public/images'});
const path = require("path");

//-------------------------------add product---------------------------------

// //----------------crop feature-----------------------------------

router.post("/add-product", upload.array("image", 4), async (req, res) => {
  const { name, category, price, description } = req.body;

  const photos = [];

  // Process each uploaded file
  for (const file of req.files) {
    const oldPath = `${file.path}`;
    const newPath = `${file.path}.png`;

    try {
      // Check if the file is an image
      if (file.mimetype.startsWith("image/")) {
        // Resize and crop the image using sharp
        await sharp(file.path)
          .resize(700, 700) // Set the desired dimensions for the cropped image
          .toFile(newPath);

        // Remove the original file
        fs.unlinkSync(oldPath);

        // Add the cropped image to the photos array
        photos.push({
          id: path.basename(newPath),
          title: file.originalname,
          fileName: newPath,
        });
      } else {
        // Remove non-image files
        fs.unlinkSync(oldPath);
      }
    } catch (err) {
      console.error(err);
    }
  }

  let caName = name.toUpperCase();
  productHelpers.addProduct(
    {
      name: caName,
      category: category,
      price: price,
      description: description,
      photos: photos,
    },
    (id) => {
      req.session.admin.loggedIn = true;
      res.redirect("/admin");
    }
  );
});

router.get("/delete-product/:id", verifyLogin, (req, res) => {
  let proId = req.params.id;

  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/adminLogin");
  });
});
router.get("/delete-Image/:id", verifyLogin, async (req, res) => {
  let proId = req.params.id;

  let image = await productHelpers.getImage(proId);
  let images = image.photos;

  res.render("admin/images", { images, admin: true });
});
router.get("/delete-this-image/:id", verifyLogin, async (req, res) => {
  let proId = req.params.id;

  productHelpers.deleteImage(proId).then((response) => {
    res.redirect("/admin/adminLogin");
  });
});

router.get("/edit-product/:id", verifyLogin, async (req, res) => {
  let category = await categoryHelpers.getAllCategory();
  let product = await productHelpers.getProductDetails(req.params.id);
  res.render("admin/edit-product", { product, admin: true, category });
});

router.post("/edit-product/:id", upload.array("image", 4), (req, res) => {
  const { name, category, price, description } = req.body;
  const photos = req.files.map((file) => {
    const oldPath = `${file.path}`;
    const newPath = `${file.path}.png`;
    if (fs.existsSync(oldPath)) {
      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err;
      });
    } else {
    }
    return {
      id: path.basename(newPath),
      title: file.originalname,
      fileName: newPath,
    };
  });
  let caName = name.toUpperCase();

  productHelpers
    .updateProduct(req.params.id, {
      name: caName,
      category: category,
      price: price,
      description: description,
      photos: photos,
    })
    .then(() => {
      res.redirect("/admin/adminLogin");
    });
});

router.get("/user-data", verifyLogin, async (req, res) => {
  let users = await adminHelpers.getAllUsers(req.session);
  res.render("admin/all-users", { admin: true, users });
});

//----------------user block and unblock---------

router.get("/edit-user/:id", (req, res) => {
  const userId = req.params.id;
  adminHelpers.doBlock(userId).then(() => {
    res.redirect("/admin/user-data");
  });
});
router.get("/unedit-user/:id", (req, res) => {
  const userId = req.params.id;
  adminHelpers.doUnBlock(userId).then(() => {
    res.redirect("/admin/user-data");
  });
});

//-----------------------category name------------------------------
router.get("/view-category", verifyLogin, (req, res) => {
  let admin = req.session.admin;
  categoryHelpers.getAllCategory().then((category) => {
    res.render("admin/view-category", { admin: true, category, admin });
  });
});

router.get("/add-category", verifyLogin, (req, res) => {
  res.render("admin/add-category", {
    admin: true,
    user: false,
    guest: false,
    categoryError: req.session.categoryError,
  });
  req.session.categoryError = false;
});

router.post("/add-category", (req, res) => {
  req.body.Cname = req.body.Cname.toUpperCase();

  categoryHelpers.addCategory(req.body, (id) => {
    if (id) {
      res.redirect("view-category");
    } else {
      req.session.categoryError = true;
      res.redirect("add-category");
    }
  });
});

router.get("/edit-category/:id", verifyLogin, async (req, res) => {
  let category = await categoryHelpers.getCategoryDetails(req.params.id);

  res.render("admin/edit-category", { category, admin: true });
});

router.post("/edit-category/:id", (req, res) => {
  categoryHelpers.updateCategory(req.params.id, req.body).then((response) => {
    if (response == 1) {
      req.session.categoryError = true;
      alert("Category is already Added");

      res.redirect("/admin/edit-category/" + req.params.id);
    } else {
      req.session.categoryError = false;
      res.redirect("/admin/view-category");
    }
  });
});

router.get("/delete-category/:id", verifyLogin, (req, res) => {
  let catId = req.params.id;
  categoryHelpers.deleteCategory(catId).then((response) => {
    res.redirect("/admin/view-category");
  });
});

router.get("/adminOrders", verifyLogin, async (req, res) => {
  let orders = await adminHelpers.getAllUsersOrders();
  res.render("admin/orders", { orders, admin: true });
});

router.get("/admin-cancel/:id", async (req, res) => {
  let id = req.params.id;

  await userHelpers.cancelOrder(id);
  res.redirect("/admin/adminOrders");
});

router.get("/out-of-stock/:id", async (req, res) => {
  let id = req.params.id;

  await adminHelpers.delivered(id);
  res.redirect("/admin/adminOrders");
});

router.get("/return-success/:id", async (req, res) => {
  let id = req.params.id;

  await adminHelpers.returnSuccess(id);
  res.redirect("/admin/adminOrders");
});

router.get("/view-admin-order/:id", verifyLogin, async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id);
  let orderProduct = await userHelpers.getOrderedProduct(req.params.id);

  res.render("admin/view-orders", { admin: true, products, orderProduct });
});
//-------------------coupon---------------------------------------------------------
router.get("/coupon", verifyLogin, async (req, res) => {
  let coupon = await couponHelpers.getAllCoupon();
  res.render("admin/coupon", { admin: true, coupon });
});

router.post("/add-coupon", async (req, res) => {
  let details = req.body;

  await couponHelpers.addCoupon(details).then((response) => {
    if (response == 1) {
      alert("Coupon Added");
    } else {
      alert("coupon Already Exist");
    }
    req.session.admin.loggedIn = true;
    res.redirect("/admin/coupon");
  });
});

router.get("/edit-coupon/:id", verifyLogin, async (req, res) => {
  let couponId = req.params.id;

  let coupon = await couponHelpers.getCoupon(couponId);

  res.render("admin/edit-coupon", { coupon, admin: true });
});

router.post("/edit-coupon/:id", async (req, res) => {
  let coupon = req.body;

  await couponHelpers.updateCoupon(coupon, req.params.id).then((response) => {
    if (response == 1) {
      alert("Update Success");
    } else {
      alert("Coupon is Already Exist");
    }
  });
  res.redirect("/admin/coupon");
});

router.get("/delete-coupon/:id", async (req, res) => {
  await couponHelpers.deleteCoupon(req.params.id).then((response) => {
    req.session.admin.loggedIn = true;
    res.redirect("/admin/coupon");
  });
});

//dashbord-----------------
router.get("/dashboard", verifyLogin, async (req, res) => {
  let totalPriceSevenDay = await adminHelpers.getAmountLastSevenDay();
  let totalPriceAMonth = await adminHelpers.getAmountLastMonth();
  let totalPriceAyear = await adminHelpers.getAmountLastYear();

  let totalOrderSevenDay = await adminHelpers.getOrderLastSevenDay();
  let totalOrderAMonth = await adminHelpers.getOrderLastMonth();
  let totalOrderAyear = await adminHelpers.getOrderLastYear();

  let totalProductQuantitySevenDay =
    await adminHelpers.getTotalProductQuantityLastSevenDays();
  let totallProductQuantityAMonth =
    await adminHelpers.getTotalProductQuantityLastMonth();
  let totallProductQuantityAyear =
    await adminHelpers.getTotalProductQuantityLastYear();

  let userInLastSevenDay = await userHelpers.getUserInLastSevenDay();
  let userInLastMonth = await userHelpers.getUserInLastMonth();
  let userInLastYear = await userHelpers.getUserInLastYear();

  let productSells = await adminHelpers.getSellingProductInEachMonth();

  let productSell = JSON.stringify(productSells);

  let topSellProduct = await adminHelpers.getTopSellProduct();

  let totalAmounts = await adminHelpers.totalAmount();
  let totalAmount = totalAmounts.totalAmount;
  let totalOrder = totalAmounts.totalOrders;

  let totalProduct = await productHelpers.totalProduct();

  let totalCustomer = await userHelpers.totalUser();

  res.render("admin/dashboard", {
    admin: true,
    totalPriceSevenDay,
    totalPriceAMonth,
    totalPriceAyear,
    totalOrderSevenDay,
    totalOrderAMonth,
    totalOrderAyear,
    totalProductQuantitySevenDay,
    totallProductQuantityAMonth,
    totallProductQuantityAyear,
    userInLastSevenDay,
    userInLastMonth,
    userInLastYear,
    productSell,
    topSellProduct,
    totalAmount,
    totalOrder,
    totalProduct,
    totalCustomer,
  });
});

router.post("/download", async (req, res) => {
  let totalPriceSevenDay = await adminHelpers.getAmountLastSevenDay();
  let totalPriceAMonth = await adminHelpers.getAmountLastMonth();
  let totalPriceAyear = await adminHelpers.getAmountLastYear();

  let totalOrderSevenDay = await adminHelpers.getOrderLastSevenDay();
  let totalOrderAMonth = await adminHelpers.getOrderLastMonth();
  let totalOrderAyear = await adminHelpers.getOrderLastYear();

  let totalProductQuantitySevenDay =
    await adminHelpers.getTotalProductQuantityLastSevenDays();
  let totallProductQuantityAMonth =
    await adminHelpers.getTotalProductQuantityLastMonth();
  let totallProductQuantityAyear =
    await adminHelpers.getTotalProductQuantityLastYear();

  let userInLastSevenDay = await userHelpers.getUserInLastSevenDay();
  let userInLastMonth = await userHelpers.getUserInLastMonth();
  let userInLastYear = await userHelpers.getUserInLastYear();

  let totalAmounts = await adminHelpers.totalAmount();
  let totalAmount = totalAmounts.totalAmount;
  let totalOrder = totalAmounts.totalOrders;
  let totalCustomer = await userHelpers.totalUser();
  const data = [
    {
      days: "A week",
      sales: totalPriceSevenDay,
      orders: totalOrderSevenDay,
      products: totalProductQuantitySevenDay,
      customers: userInLastSevenDay,
    },
    {
      days: "A month",
      sales: totalPriceAMonth,
      orders: totalOrderAMonth,
      products: totallProductQuantityAMonth,
      customers: userInLastMonth,
    },
    {
      days: "A year",
      sales: totalPriceAyear,
      orders: totalOrderAyear,
      products: totallProductQuantityAyear,
      customers: userInLastYear,
    },
  ];

  const doc = new PDFDocument();

  // Set the response headers for PDF download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");

  // Create the table header
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Days", 50, 50);
  doc.text("Sales (rupees)", 150, 50);
  doc.text("Orders", 250, 50);
  doc.text("Products", 350, 50);
  doc.text("Customers", 450, 50);
  let y = 70;
  // Create the table rows
  doc.font("Helvetica").fontSize(20);
  doc.text("BAKE CORNER", 210, y + -55);
  doc.font("Helvetica").fontSize(10);

  data.forEach((row) => {
    doc.text(row.days, 50, y);
    doc.text(row.sales.toString(), 150, y);
    doc.text(row.orders.toString(), 250, y);
    doc.text(row.products.toString(), 350, y);
    doc.text(row.customers.toString(), 450, y);
    y += 20;
  });

  let date = new Date();
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Total Income:", 250, y + 20);
  doc.text(totalAmount, 350, y + 20);
  doc.text("Total Orders:", 250, y + 40);
  doc.text(totalOrder, 350, y + 40);
  doc.text("Total Customers:", 250, y + 60);
  doc.text(totalCustomer, 350, y + 60);
  doc.text("Date:", 250, y + 80);
  doc.text(date, 350, y + 80);

  // Pipe the PDF document to the response
  doc.pipe(res);

  // End the document
  doc.end();
});

//======================================
router.get("/adminLogout", function (req, res) {
  req.session.admin = null;
  res.redirect("/admin/adminLogin");
});
module.exports = router;
