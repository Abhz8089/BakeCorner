var express = require("express");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
var alert = require("alert");
// const alert=require("node-popup")
const Swal = require("sweetalert2");
const { response } = require("../app");
const categoryHelpers = require("../helpers/category-helpers");
const couponHelpers = require("../helpers/coupon-helpers");
const { body, validationResult, Result } = require('express-validator');
/* GET home page. */

//middleware--------------
const verifyLogin = async(req, res, next) => {
  if (req.session.user.loggedIn && req.session.user) {
    let cCount=await userHelpers.getCartCount(req.session.user._id)
    req.session.cartCount=cCount;
    next();
  } else {
    res.redirect("/login");
  }
};

//---------------otp -------------------------
var email;
var otp;

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "rico0@ethereal.email",
    pass: "m5HN5aUf6RWrH4rG4g",
  },
});

//------------refferal code generator
const generatedReferralCodes = []; // Array to store generated referral codes

function generateReferralCode() {
  const referralCodeLength = 5;
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

  let referralCode = '';

  while (referralCode === '' || generatedReferralCodes.includes(referralCode)) {
    for (let i = 0; i < referralCodeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      referralCode += characters[randomIndex];
    }
  }

  generatedReferralCodes.push(referralCode); // Store the generated code

  return referralCode;
}



//-------------------
router.get("/", function (req, res, next) {
  res.render("user/landing-page", { admin: false, user: false, guest: true });
});
router.get("/home", async (req, res) => {
  let users = req.session.user;
  let cartCount = null;
  let category= await categoryHelpers.getAllCategory()

  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }else{
    cartCount = null;
  }
  req.session.cartCount = cartCount;
  productHelpers.getAllProductsInHome().then((products) => {
    res.render("user/view-products", {
      user: true,
      products,
      users,
      cartCount,
      category
    });
  });
});

router.get("/login", (req, res) => {
  
  if (req.session.userloggedIn) {
    res.redirect("/home");
  } else {
    res.render("user/login", {
      guest: true,
      loginErr: req.session.userLoginErr,
      pReset: req.session.pReset,
      userF: req.session.userForgot,
      register:req.session.userRegister
    });
    req.session.userForgot = true;
    req.session.userLoginErr = false;
    req.session.pReset = false;
    req.session.userRegister=false;
  }
});
//-----------------------------------------------------------------------

router.get("/signup", (req, res, next) => {
  res.render("user/signup", {
    admin: false,
    user: false,
    guest: true,
    loginErr: req.session.userLoginErr,
    emailNotExist: req.session.emailNot,
    userReg: req.session.errReg
   
  });
  req.session.emailNot = false;
  req.session.userLoginErr = false;
  req.session.errReg=false;
});




router.post("/signup", (req, res) => {
  let code=req.query.referral_code
  req.session.refCode=code;
  userHelpers.doSignup(req.body).then((response) => {
    if (response == 1) {
      req.session.userLoginErr = "Email already used";
      res.redirect("/signup");
    }
    if (response != 1) {
      const { name, email, password } = req.body;
      let userDetails = req.body;
      req.session.userDetails=req.body;
  
     

      otp = otpGenerator.generate(6, {
        digits: true,
        alphabets: false,
        upperCase: false,
        specialChars: false,
      });

      const mailOptions = {
        from: '"Fred Foo 👻" <abhijithabhiz8089@gmail.com>',
        to: email,
        subject: "OTP for sign up",
        text: `Your OTP is ${otp}.`,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
      
          res.status(500).send({ message: "Error sending OTP email" });
          client.close();
          return;
        }
      });

      // Set a timeout of 60 seconds
      setTimeout(() => {
        otp = null;
      
                                        //---------
      }, 60000);
      req.session.otpEnter=false;
      res.render("user/otp-verification", { userDetails, otp });
    }

  });
});
//========================resend=====================


router.post('/resend',function(req,res){
  let userDetails = req.body;

  var userEmail = req.session.userDetails.email;

  // Check if OTP has expired
  if (!otp) {
    // Generate a new OTP
    otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });

    // Set a new timeout of 60 seconds
    setTimeout(() => {
      otp = null;
  
                  
    }, 60000);
  }

  const mailOptions = {
    from: '"Fred Foo 👻" <abhijithabhiz8089@gmail.com>',
    to: userEmail,
    subject: "OTP for sign up",
    text: `Your Resent OTP is ${otp}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
   
      client.close();
      return;
    }
  });

  res.render("user/otp-verification", { userDetails });
  
});
//******************************************** */

router.post("/otp", async (req, res) => {
                                                     //------------------
  const referralCode = generateReferralCode();
 
  if (otp == req.body.otp) {

    const {
     name,
     email,
     password,
     cpassword
    } = req.session.userDetails;

    let refCode=req.session.refCode
    
    await userHelpers.doSignUpSuccess({
      name: name,
      email: email,
      password: password,
      Cpassword: cpassword,
      referralCode:referralCode
    });
    if(refCode){
      await userHelpers.addRefWallet(refCode)

    }
    req.session.userRegister=true;
    res.redirect("/login");
   
  } else {
    req.session.userRegister=false;
    req.session.errReg=true;
    res.redirect("/signup");
  }


});

//----------------------------------------------------------------------------------------------------------------------

router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.user.loggedIn = true;
      req.session.couponApply=false;
      req.session.walletApply=false;

      res.redirect("/home");
    } else {
      req.session.userLoginErr = "Invalid username or Password";
      res.redirect("/login");
    }
  });
});

//------------------view ----------------

router.get("/view/:id", async (req, res) => {
  let users = req.session.user;
  cartCount = req.session.cartCount;

  let product = await productHelpers.getProductDetails(req.params.id);


  res.render("user/open-product", { product, user: true, users, cartCount });
});

//----------------cart set in---------------
router.get("/cart", verifyLogin, async (req, res) => {
  req.session.couponApply=false;
  req.session.walletApply=false;
  let users = req.session.user;
  let products = await userHelpers.getCartProducts(req.session.user._id);

  let totalVal = await userHelpers.getTotalAmount(req.session.user._id);
  req.session.user.totalValue=totalVal
  let walletAmount=await userHelpers.getWallet(req.session.user._id)
  let AllcCode=await userHelpers.getAllCode(req.session.user._id)
  
  if (totalVal == 0) {
    req.session.Tvalue = false;
  } else {
    req.session.Tvalue = true;
  }
  // let cCount=await userHelpers.getCartCount(req.session.user._id)
  let cartCount = req.session.cartCount;
  res.render("user/cart", {
    user: true,
    user: req.session.user._id,
    users,
    products,
    cartCount,
    AllcCode,
    totalValue:req.session.user.totalValue,
    Tvalue: req.session.Tvalue,
    walletAmount
  });
});
router.post('/couponCode',async(req,res)=>{
  var cCode=req.body.code;
  let users = req.session.user;
  let cartCount = req.session.cartCount;
  let products = await userHelpers.getCartProducts(req.session.user._id);
  let walletAmount=await userHelpers.getWallet(req.session.user._id)
  let code = await couponHelpers.getUserCoupon(cCode)
  let AllcCode=await userHelpers.getAllCode(req.session.user._id)
  if(code!==1){
  
  let userId=req.session.user._id;
  let userCode= await userHelpers.getCode(cCode,userId)
  
 


  if(userCode==1){
  
    res.render('user/cart', {
      user: true,
      user: req.session.user._id,
      users,
      products,
      cartCount,
      totalValue: req.session.user.totalValue,
      Tvalue: req.session.Tvalue,
      msg: 'Invalid Coupon Code' ,
      success: false,
      walletAmount,
      AllcCode
    })
      
  }else{
    req.session.couponApply=true;
    req.session.couponCode=cCode;
    let discount=code.discount
   
    let totalVal = await userHelpers.getTotalAmount(req.session.user._id);
   
    let val=(totalVal-(totalVal*(discount/100)));
    
    req.session.user.totalValue=val
  
    res.render('user/cart', {
      user: true,
      user: req.session.user._id,
      users,
      products,
      cartCount,
      totalValue: req.session.user.totalValue,
      Tvalue: req.session.Tvalue,
      msg: 'Coupon applied successfully' ,
      success: true,
      walletAmount,
      AllcCode
    });
   
   
  }
  }else{
    res.render('user/cart', {
      user: true,
      user: req.session.user._id,
      users,
      products,
      cartCount,
      totalValue: req.session.user.totalValue,
      Tvalue: req.session.Tvalue,
      msg: 'Coupon expired' ,
      success: false,
      walletAmount,
      AllcCode
    })

  }

})
//wallet apply-----
router.post('/use-wallet',async(req,res)=>{
  let userId=req.body.userId;
  let wallet=req.body.wallet;
  let Amount=req.session.user.totalValue
  let balance=Math.abs(Amount-wallet);
  req.session.user.totalValue=balance;
  req.session.walletApply=true;
  if(Amount<wallet){
    req.session.balance=balance;
  }else{
    req.session.balance=null;
  }
  let response={}
  response.total=balance;

  res.json(response)
 
})


router.get("/add-to-cart/:id", async (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});

router.post("/change-product-quantity", (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user);

    res.json(response);
  });
});

router.post("/remove-product", (req, res, next) => {
  let userId = req.body.cartId;
  let productId = req.body.product;

  userHelpers
    .removeProductFromCart(userId, productId)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({ status: false, error: "Error removing product from cart" });
    });
});



//----------place order ----------------------

router.get("/place-order", verifyLogin, async (req, res) => {
  let users = req.session.user;
  let cartCount = req.session.cartCount;
  // let total = await userHelpers.getTotalAmount(req.session.user._id);
  let total=req.session.user.totalValue

  let addresses = await userHelpers.getUserAddress(req.session.user._id);

  res.render("user/place-order", {
    total,
    user: true,
    users,
    addresses,
    cartCount,
  });
});


router.post("/place-order", async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId);
  let totalPrice = req.session.user.totalValue
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
   if(req.body['payment-method']==='COD'){
   
    res.json({ codSuccess: true });
   }else{
    userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
       res.json(response)
    })
   }
   
  });
});


//------------------address add -----------------------------------------
router.get("/add-address", async(req, res) => {
  let cartCount = req.session.cartCount;
  let addresses = await userHelpers.getUserAddress(req.session.user._id);
  res.render("user/user-address", {
    users: req.session.user,
    user: true,
    cartCount,
    addAddress:req.session.addAddress,
    addresses
  });
  req.session.addAddress=false;
});


router.post("/add-address", [

  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
  body('phone').trim().isMobilePhone().withMessage('Invalid phone number'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('pincode').isNumeric().isLength({ min: 6, max: 6 }).withMessage('Invalid pincode'),
  

  async (req, res) => {
    const errors = validationResult(req);
  
    
    if (errors.errors.length) {
      // Return the validation errors to the client
      let cartCount = req.session.cartCount;
      const errorMessages = errors.array().map(error => error.msg);
      req.session.addAddress=false;
      users=req.session.user
      let addresses = await userHelpers.getUserAddress(req.session.user._id);
     res.render('user/user-address', { errors: errorMessages ,users,cartCount,user:true,addresses});
    }else{

    const { name, phone, address, pincode, userId } = req.body;
    try {
      await userHelpers.addAddress(userId, {
        name: name,
        phone: phone,
        address: address,
        pincode: pincode,
      });

      req.session.addAddress=true;
      res.redirect("/add-address");
    } catch (error) {
      res.redirect("/add-address");
    }
  }
}

]);

router.post("/delete-address", (req, res) => {
  const userId = req.body.userId;

  userHelpers
    .deleteAddress(userId)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({ status: false, error: "Error removing address" });
    });
});
router.post("/edit-address", (req, res) => {
  userHelpers.editAddress(req.body).then((response) => {
    res.redirect("/place-order");
  });
});

router.get("/user-address/:id", async (req, res) => {
  let users = req.session.user;
  let cartCount = req.session.cartCount;
  // let total = await userHelpers.getTotalAmount(req.session.user._id);
  let total=req.session.user.totalValue
  let addresses = await userHelpers.getUserAddress(req.session.user._id);
  let address = await userHelpers.getOneAddress(req.params.id);

  req.session.address = address;
  //  res.redirect('/place-order')
  res.render("user/place-order", {
    address,
    addresses,
    total,
    cartCount,
    users,
    user: true,
  });
});

//---------------------------------------------------------------------

router.get("/order-success", async(req, res) => {
let totalVal=req.session.user.totalValue;
let userId=req.session.user._id;
if(req.session.walletApply){
  let remainingWal=req.session.balance
  if(remainingWal==null){
    remainingWal=0;
  }
  await userHelpers.changeWallet(remainingWal,userId)
  
}

if(req.session.couponApply){
  
  let cCode=req.session.couponCode
 await userHelpers.deleteCoupon(cCode,userId)
}
let coupon=await couponHelpers.haveCoupon(totalVal)

if(coupon){
  
 await userHelpers.addCoupon(userId,coupon)
}else{
}

  res.render("user/order-success", { users: req.session.user, user: true ,coupon});
});

router.get("/orders", async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id);
 
  res.render("user/orders", { users: req.session.user, orders, user: true });
});

router.get("/view-order-products/:id", async (req, res) => {
  let users = req.session.user;
  let cartCount = req.session.cartCount;

  let products = await userHelpers.getOrderProducts(req.params.id);
  let orderProduct = await userHelpers.getOrderedProduct(req.params.id);

  res.render("user/view-order-products", {
    user: true,
    users,
    products,
    cartCount,
    orderProduct,
  });
});

//--------------cancel order-------------------
router.post("/cancel-order", async (req, res) => {
  userHelpers.cancelOrder(req.body.orderId);
  res.redirect("/orders");
});
router.post("/return-order", async (req, res) => {
  userHelpers.returnOrder(req.body.orderId);
  res.redirect("/orders");
});

//--------------------------------forgot P---------------------------

router.get("/forgot-password", (req, res) => {
   
 
  res.render("user/forgot-p", {
    userF: req.session.userForgot,
    
  });

  
 
  req.session.userForgot = false;
});


router.post("/Enter-otp", async(req, res) => {
  // const { email, password, Cpassword } = req.body;
  req.session.enterEmail=req.body.email
  
 let userExist=await userHelpers.mailCheck(req.body.email)

 if(userExist!=1){
  req.session.emailNot =true;
   res.redirect('/signup')
 }else{
  let Femail=req.body.email
  //
  let userDetails = req.body;

  
  // Check if OTP has expired
  if (!otp) {
    // Generate a new OTP
    otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });

    // Set a new timeout of 60 seconds
    setTimeout(() => {
      otp = null;
    }, 60000);
  }

  const mailOptions = {
    from: '"Fred Foo 👻" <abhijithabhiz8089@gmail.com>',
    to: Femail,
    subject: "OTP for sign up",
    text: `Your Resent OTP is ${otp}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      client.close();
      return;
    }
  });

  req.session.details = userDetails;
  req.session.userForgot = false;

  res.redirect("/forgot-password");
}
});

router.post("/reset-password", (req, res) => {
  const { email, password, Cpassword } = req.session.details;


  if(otp==null){
    req.flash("You Entered a wrong OTP")

  }


  if (otp === req.body.otp) {
    userHelpers
      .changePassword({
        email: email,
        password: password,
        Cpassword: Cpassword,
      })
      .then((response) => {
        if (response == 2) {
          req.session.pReset = true;

          res.redirect("/login");
        } else {
          req.session.emailNot = true;
          res.redirect("/signup");
        }
      });
  } else {
    
    res.redirect("/signup");
  }
});


router.post('/F-resend',function(req,res){
  let userDetails = req.body;

  var userEmail = req.session.details.email;


  // Check if OTP has expired
  if (!otp) {
    // Generate a new OTP
    otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });

    // Set a new timeout of 60 seconds
    setTimeout(() => {
      otp = null;
  
    }, 60000);
  }

  const mailOptions = {
    from: '"Fred Foo 👻" <abhijithabhiz8089@gmail.com>',
    to: userEmail,
    subject: "OTP for sign up",
    text: `Your Resent OTP is ${otp}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      client.close();
      return;
    }
  });

  res.redirect('/forgot-password');
});





//-------------------------------------------------
router.post('/verify-payment',(req,res)=>{

 
  userHelpers.verifyPayment(req.body).then(()=>{

    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err)=>{
    res.json({status:false,errMsg:'payment failed please retry'})
  })
})


//--------------new1--------------------

router.get('/viewCproduct/:id', async (req, res) => {
  let cartCount = req.session.cartCount;
  
  let Cname = req.params.id;
 
  let users = req.session.user;

  let page = parseInt(req.query.page) || 1;
  let perPage = 4; 

  let catProducts = await productHelpers.getCatProducts(Cname, page, perPage); 
 
  let totalProducts = await productHelpers.getTotalCatProducts(Cname); 
 
  let totalPages = Math.ceil(totalProducts / perPage); 

  let pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }
  
  res.render('user/Category-Product', {
    catProducts,
    user: true,
    cartCount,
    Cname,
    users,
    totalPages,
    currentPage: page,
    pages,
    
  });
  

});



  
 
router.post('/fetch-products',async(req,res)=>{
 
    try {
    const { Cname, page, pageSize } = req.body;
  
    // Calculate the skip value based on the requested page and page size
    const skip = (page - 1) * pageSize;
  
    // Retrieve the products for the requested page and page size
    const Catproducts = await productHelpers.getCatProductByPage(Cname, skip, pageSize);

    // Count the total number of products for pagination
    const totalProducts = await productHelpers.getCatProductCount(Cname);

    // Calculate the total number of pages based on the page size
    const totalPages = Math.ceil(totalProducts / pageSize);

    // Send the JSON response with the products, total pages, and current page
    res.json({
      Catproducts,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
})



















//search,sort-----------------------------------

router.post('/search-product', async (req, res) => {
  let search = req.body.searchQuery;
  let catG=req.body.Cname;

  let cartCount = req.session.cartCount;
  
 let users=req.session.user

//  let page = parseInt(req.query.page) || 1;
//  let perPage = 4; 



  try {
    let Catproducts = await productHelpers.getSearchProduct(search,catG);
    let CatproductsJSON = JSON.stringify(Catproducts);
  
    // Send the JSON response
    res.json({ Catproducts: CatproductsJSON });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


//used-----------------------------used--------------

router.post('/sort-and-filter-products', async (req, res) => {

  try {
    const Cname = req.body.Cname;
    const sort = req.body.sortOption;
    const minPrice = req.body.minPrice;
    const maxPrice = req.body.maxPrice;


    let filteredProducts = await productHelpers.getCatProduct(Cname);

    // Apply price filter if minPrice and maxPrice are defined
    if (minPrice !== undefined && maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(
        (product) => {
          const productPrice = parseInt(product.price);
          return productPrice > minPrice && productPrice < maxPrice;
        }
      );
    }

    let sortedProducts;
    switch (sort) {
      case 'price':
        sortedProducts = filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case '-price':
        sortedProducts = filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        sortedProducts = filteredProducts.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;
      case 'rating':
        sortedProducts = filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      default:
        sortedProducts = filteredProducts;
        break;
    }

    res.json({ filteredAndSortedProducts: sortedProducts });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/refferal-link',verifyLogin,(req,res)=>{
  users=req.session.user;
  cartCount=req.session.cartCount;
  
   res.render('user/refferal-link',{user:true,users,cartCount})
})

router.get('/rewards',verifyLogin,async(req,res)=>{
  cartCount=req.session.cartCount
  users=req.session.user;
  let cCode=await userHelpers.getAllCode(req.session.user._id)
  
  res.render('user/rewards',{user:true,cartCount,users,cCode})
})

//-------------log out---------------------
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/home");
});

module.exports = router;
