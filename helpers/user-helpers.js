var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const alert=require('alert')
const { response } = require('express')
const { promises } = require('nodemailer/lib/xoauth2')
var objectId=require('mongodb').ObjectId
const moment = require('moment');
const Razorpay=require('razorpay')
var instance = new Razorpay({
  key_id: 'rzp_test_3LzlSFPtGLCQLv',
  key_secret: 'bmA4D5khXMaDsyz8kKp8Qqks',
});

module.exports ={
    doSignup: (userData) => {
        
        return new Promise(async (resolve, reject) => {
          let userExist=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
           if(userExist){
            resolve(1)
           }else{
            resolve(2)
           }


        });

      },
      doSignUpSuccess:(Data)=>{
        console.log(Data)
       return new Promise(async(resolve,reject)=>{
    
        Data.password = await bcrypt.hash(Data.password, 10); 
        Data.Cpassword = await bcrypt.hash(Data.Cpassword, 10);   
        const currentDate = moment().toDate();
        Data.Date = currentDate;  
        Data.wallet=0;  
        const data = await db.get().collection(collection.USER_COLLECTION).insertOne(Data);
        resolve(data);

       })
      } ,
      

      doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false;
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                  if(!user.isBlocked){
                    if(status){
                        console.log("login success")
                        response.user=user;
                        response.status=true;
                        resolve(response)
                    }else{
                        console.log("login fail");
                        resolve({status:false})
                    }
                  }else{
                    alert("you are blocked")
                    resolve({status:false})
                  }
                })
            }else{
                console.log('login failed');
                resolve({status:false});
            }
        })
    },
     doMailVarify:(userEmail)=>{
     
      return new Promise(async(resolve,reject)=>{
          await db.get().collection(collection.USER_COLLECTION).updateOne({email:userEmail},{$set:{isBlocked:true}},(err,result)=>{
              if(err){
                  console.log("error :"+err)
                  res.status(500).send("Error blocking")
              }else{
                  
                  resolve()
              }
          })
      })

    },
    doMailVarifySuccess:(userOtp)=>{
      return new Promise(async(resolve,reject)=>{
          await db.get().collection(collection.USER_COLLECTION).updateOne({otp:userOtp.otp},{$set:{isBlocked:false}},(err,result)=>{
              if(err){
                  console.log("error :"+err)
                  res.status(500).send("Error blocking")
              }else{
                  console.log('User Blocked')
                  resolve("success")
                  alert("Account successfully created")
              }
          })
      })

    },
    deleteBlockedUser:(otpuser)=>{
       return new Promise(async(resolve,reject)=>{
        
        await db.get().collection(collection.USER_COLLECTION).deleteOne({otp:otpuser}).then(()=>{
          alert('wrong Otp')
          resolve()
        })
       
        
       })
    },



    doMailCheck:(userOtp)=>{

      return new Promise(async(resolve,reject)=>{
        let response={}
       let getOtp= await db.get().collection(collection.USER_COLLECTION).findOne({otp:userOtp.otp})
      
     
       
       if(getOtp){
           
           response.status=true
           resolve(response)
       }
       else{
        response.status=false
        
        resolve(response)
       }
      })

    },
    insertOtp:(userData,userotp)=>{
   
      return new Promise(async(resolve,reject)=>{
        await db.get().collection(collection.USER_COLLECTION).updateOne({email:userData.email},{$set:{otp:userotp}},(err,result)=>{
          if(err){
              console.log("error :"+err)
              res.status(500).send("Error blocking")
          }else{
              console.log("otp set cheythu")
              resolve("success")
          }
      })
      })
    },
    addToCart:(proId,userId,image)=>{
      let proObj={
        item:objectId(proId),
        quantity:1
      }
      return new Promise(async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(userCart){
          let proExist=userCart.products.findIndex(product=>product.item==proId)
          console.log(proExist);
          if(proExist!=-1){
            db.get().collection(collection.CART_COLLECTION).updateOne({'products.item':objectId(proId),user:objectId(userId)},{
              $inc:{'products.$.quantity':1}
            }).then(()=>{
              resolve()
            })
          }else{
            db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},{$push:{products:proObj}}).then((response)=>{
              resolve()
             })
          }
          
        }else{
          let cartObj={
            user:objectId(userId),
            products:[proObj]
          }
          db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
            resolve()
          })
        }
      })
    },
    getCartProducts:(userId)=>{
      return new Promise(async(resolve,reject)=>{
        let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
          {
            $match:{user:objectId(userId)}
          },{
            $unwind:'$products'
          },
          {
            $project:{
              item:'$products.item',
              quantity:'$products.quantity'
            }
          },
          {
            $lookup:{
              from:collection.PRODUCT_COLLECTION,
              localField:'item',
              foreignField:'_id',
              as:'product'
            }
          },
          {
            $project:{
              item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }
          }
    
        ]).toArray()
        
        resolve(cartItems)
      })
    },
    getCartCount:(userId)=>{
      return new Promise(async(resolve,reject)=>{
        let count=0
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart){
          count=cart.products.length
        }
        resolve(count)
      })
    },
    changeProductQuantity:(details)=>{
      details.count=parseInt(details.count)
      details.quantity=parseInt(details.quantity)
      return new Promise((resolve,reject)=>{
        if(details.count==-1 && details.quantity==1){
          db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},{
            $pull:{products:{item:objectId(details.product)}}
          }).then((response)=>{
            resolve({removeProduct:true})
          })
        }else{
        db.get().collection(collection.CART_COLLECTION).updateOne({'products.item':objectId(details.product),_id:objectId(details.cart)},{
          $inc:{'products.$.quantity':details.count}
        }).then((response)=>{
          
          resolve({status:true})
        })
      }
      })
    },
   
    
    removeProductFromCart:(userId,productId)=>{
      console.log(userId)
      console.log(productId)
      return new Promise(async(resolve,reject)=>{
        db.get().collection(collection.CART_COLLECTION).updateOne(
          {_id:objectId(userId)},
          {$pull:{products:{item:objectId(productId)}}}
        ).then((response)=>{
          resolve({removeProduct:true})
        })
      })
    },
    getTotalAmount:(userId)=>{
      return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart){
         
          console.log(cart+"this is the cart")
        let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
          {
            $match:{user:objectId(userId)}
          },{
            $unwind:'$products'
          },
          {
            $project:{
              item:'$products.item',
              quantity:'$products.quantity'
            }
          },
          {
            $lookup:{
              from:collection.PRODUCT_COLLECTION,
              localField:'item',
              foreignField:'_id',
              as:'product'
            }
          },
          {
            $project:{
              item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }
          },
          
          {
            
            $group:{ 
              _id:null, 
              total:{ $sum: { $multiply: [ '$quantity',{ $toInt:'$product.price' } ] } } 
          }
            
          }
    
        ]).toArray()
        
       if(total.length){
         
        resolve(total[0].total)
       }else{
        resolve(0)
       }
         
      }else{
        resolve(0)
      }
      })

    },
    placeOrder:(order,products,total)=>{
      const currDate=new Date()
      const dateString = currDate.toLocaleDateString();
      return new Promise((resolve,reject)=>{
      console.log(order,products,total)
      let status=order['payment-method']==='COD'?'placed':'pending'
      let orderObj={
        deliveryDetails:{
          name:order.name,
          mobile:order.phone,
          address:order.address,
          pincode:order.pincode,
          
        },
        userId:objectId(order.userId),
        paymentMethod:order['payment-method'],
        products:products,
        totalAmount:total,
        status:status,
        Date:dateString,
        wholeDate:new Date()
      }
      db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
         console.log(response.insertedId)
         console.log('response user helper 371');
        db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})

        resolve(response.insertedId)
      })

      })
    },
    getCartProductList:(userId)=>{
      return new Promise(async(resolve,reject)=>{
        console.log("****"+userId)
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
       
        resolve(cart.products)
      })
    },
    getUserOrders:(userId)=>{
      return new Promise(async(resolve,reject)=>{
        let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
        
        resolve(orders)
      })
    },
    getOrderProducts:(orderId)=>{
      return new Promise(async(resolve,reject)=>{
        let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match:{_id:objectId(orderId)}
          },
          {
            $unwind:'$products'
          },
          {
            $project:{
              item:'$products.item',
              quantity:'$products.quantity'
            }
          },
          {
            $lookup:{
              from:collection.PRODUCT_COLLECTION,
              localField:'item',
              foreignField:'_id',
              as:'product'
            }
          },
          {
            $project:{
              item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }
          }
          
        ]).toArray()
        resolve(orderItems)
        
      })
    },
    cancelOrder:async (orderId)=>{
      await new Promise(async (resolve, reject) => {
       
        await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, { $set: { 'status': 'Cancelled' } })
      })
      resolve()
    },
    returnOrder:async (orderId)=>{
      await new Promise(async (resolve, reject) => {
        const result = await db.get().collection(collection.ORDER_COLLECTION).find(
          { _id: objectId(orderId) },
          { projection: { status: 1, userId: 1 ,totalAmount:1} }
        ).toArray();
        
        let userId=result[0].userId;
        let status=result[0].status;
        let totalAmount=result[0].totalAmount;
   
        
        const user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) });
        console.log(user)
        
        if (user) {
        const walletBalance = user.wallet || 0;
        const updatedWalletBalance = walletBalance + totalAmount;

       
        await db.get().collection(collection.USER_COLLECTION).updateOne(
          { _id: objectId(userId) },
          { $set: { wallet: updatedWalletBalance } }
        );
      }
        
        await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, { $set: { 'status': 'Return' } })
      })
      resolve()
    },

    addAddress:(userId,address)=>{  
      return new Promise(async (resolve, reject) => {
        const userAddressCollection = db.get().collection(collection.USERADDRESS_COLLECTION);
        const userAddress = {
          userId: userId,
          address: address
        };
        await userAddressCollection.insertOne(userAddress)
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
          
     
       })
    },
    getUserAddress:(userId)=>{
      return new Promise(async(resolve,reject)=>{
        const addresses=await db.get().collection(collection.USERADDRESS_COLLECTION).find({userId:userId}).toArray();
       
        if(addresses){
         resolve(addresses)
        }else{
          resolve('empty')
        }
      })
    },
    getOneAddress:(id)=>{
      return new Promise(async(resolve,reject)=>{
        const address=await db.get().collection(collection.USERADDRESS_COLLECTION).find({_id:objectId(id)}).toArray();
        console.log(address)
        console.log('address-414 user js')
        if(address){
         resolve(address)
        }else{
          resolve('empty')
        }
      })
    },

    deleteAddress:(userId)=>{
      return new Promise(async(resolve,reject)=>{
        await db.get().collection(collection.USERADDRESS_COLLECTION).deleteOne({_id:objectId(userId)}).then((response)=>{
          resolve({removeAddress:true})
        })
      })
    },

    editAddress: (newAddress) => {
      return new Promise(async (resolve, reject) => {
        try {
          await db.get().collection(collection.USERADDRESS_COLLECTION).updateOne(
            { _id: objectId(newAddress.id) },
            {
              $set: {
                "address.name": newAddress.name,
                "address.address": newAddress.address,
                "address.phone": newAddress.phone,
                "address.pincode": newAddress.pincode
              }
            },
            { upsert: false }
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },
    getOrderedProduct:(id)=>{
      return new Promise(async (resolve,reject)=>{
       let product= await db.get().collection(collection.ORDER_COLLECTION).find({_id:objectId(id)}).toArray()
       resolve(product)
      })
    },
    changePassword:(user)=>{
      console.log(user.email)
      return new Promise(async(resolve,reject)=>{
        let userExist=await db.get().collection(collection.USER_COLLECTION).findOne({email:user.email})
        if(userExist){
          user.password = await bcrypt.hash(user.password, 10); 
          user.Cpassword = await bcrypt.hash(user.Cpassword, 10);
         await db.get().collection(collection.USER_COLLECTION).updateOne({email:user.email},{$set:{
          password:user.password,
          Cpassword:user.Cpassword

         }})
         resolve(2)
        }else{
          resolve(1)
        }
      })
    },
    generateRazorpay:(orderId,total)=>{
     
      return new Promise((resolve,reject)=>{
        var options = {
          amount: total*100,  // amount in the smallest currency unit
          currency: "INR",
          receipt: ""+orderId
        };
        instance.orders.create(options, function(err, order) {
          console.log(order);
          resolve(order)
        });

      })
    },
    verifyPayment:(details)=>{
      console.log('varifylogin')
      return new Promise((resolve,reject)=>{
        const crypto = require('crypto');
        
        let hmac = crypto.createHmac('sha256', 'bmA4D5khXMaDsyz8kKp8Qqks')
        console.log(hmac)
        console.log('hmac')
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
        hmac=hmac.digest('hex')
        if(hmac==details['payment[razorpay_signature]']){
          resolve()
        }else{
          reject()
        }
      })
    },
    changePaymentStatus:(orderId)=>{
      console.log(orderId)
      console.log('orderid ------------')
      return new Promise(async(resolve,reject)=>{
      await  db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
          $set:{
            status:'placed'
          }
        }).then(()=>{
          resolve()
        })
      })
    },
    addCoupon:(userId,coupon)=>{
      return new Promise(async(resolve,reject)=>{
      await db.get().collection(collection.USER_COLLECTION).updateOne(
        { _id: objectId(userId) },
        { $push: { couponCodes: coupon } }
      ).then(()=>{
        resolve()
      })

      })
    },
    getCode:(cCode,userId)=>{
      return new Promise(async(resolve,reject)=>{
        let coupon = await db.get().collection(collection.USER_COLLECTION).findOne(
          { _id: objectId(userId), couponCodes: { $in: [cCode] } },
          { couponCodes: 1 }
        )
        if(coupon){
            resolve(2)
        }else{
          resolve(1)
        }
      })
   
    },
    deleteCoupon: (code, userId) => {
      return new Promise(async (resolve, reject) => {
        try {
          const userCollection = db.get().collection(collection.USER_COLLECTION);
          const user = await userCollection.findOne({ _id: objectId(userId) });
          const couponCodes = user.couponCodes;
          
          // Find the index of the first occurrence of the coupon code
          const index = couponCodes.indexOf(code);
          
          // Remove the coupon code from the array at the specified index
          if (index > -1) {
            couponCodes.splice(index, 1);
          }
          
          // Update the user document with the modified couponCodes array
          await userCollection.updateOne(
            { _id: objectId(userId) },
            { $set: { couponCodes: couponCodes } }
          );
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }
    ,
    mailCheck:async (email)=>{
      try {
        return await new Promise(async (resolve, reject) => {
          let emailExist = await db.get().collection(collection.USER_COLLECTION).findOne({ email: email })
      
          if (emailExist) {
            resolve(1)
          } else {
            resolve(2)
          }
        })
      } catch (error) {
        reject(error) // Reject the promise with the error
      }

    },
    getUserInLastSevenDay:()=>{
      return new Promise(async(resolve,reject)=>{
        const sevenDaysAgo = moment().subtract(7, 'days').toDate();
        db.get().collection(collection.USER_COLLECTION).aggregate([
          {
            $match: {
              Date: {
                $gte: sevenDaysAgo
              }
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 }
            }
          }
        ]).toArray()
          .then((result) => {
            const userCount = result.length > 0 ? result[0].count : 0;
           
            resolve(userCount)
          })
          .catch((error) => {
            console.log('Error:', error);
          });
      })
    },
    getUserInLastMonth:()=>{
      return new Promise(async(resolve,reject)=>{
        const sevenDaysAgo = moment().subtract(30, 'days').toDate();
        db.get().collection(collection.USER_COLLECTION).aggregate([
          {
            $match: {
              Date: {
                $gte: sevenDaysAgo
              }
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 }
            }
          }
        ]).toArray()
          .then((result) => {
            const userCount = result.length > 0 ? result[0].count : 0;
           
            resolve(userCount)
          })
          .catch((error) => {
            console.log('Error:', error);
          });
      })
    },
    getUserInLastYear:()=>{
      return new Promise(async(resolve,reject)=>{
        const sevenDaysAgo = moment().subtract(360, 'days').toDate();
        db.get().collection(collection.USER_COLLECTION).aggregate([
          {
            $match: {
              Date: {
                $gte: sevenDaysAgo
              }
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 }
            }
          }
        ]).toArray()
          .then((result) => {
            const userCount = result.length > 0 ? result[0].count : 0;
           
            resolve(userCount)
          })
          .catch((error) => {
            console.log('Error:', error);
          });
      })
    },
    totalUser:()=>{
      return new Promise(async(resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).countDocuments({}, (err, count) => {
          if (err) {
            reject(err);
          }
          // Access the total count of products
          resolve(count);
        });
        
      })
    },
    getWallet: (userId) => {
      return new Promise((resolve, reject) => {
        db.get().collection(collection.USER_COLLECTION).findOne(
          { _id: objectId(userId) },
          { projection: { wallet: 1 } },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.wallet);
            }
          }
        );
      });
    },
    changeWallet: (balance, userId) => {
      return new Promise((resolve, reject) => {
        db.get().collection(collection.USER_COLLECTION).updateOne(
          { _id: objectId(userId) },
          { $set: { wallet: balance } },
          (error, response) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          }
        );
      });
    },
    addRefWallet: (refCode) => {
      return new Promise((resolve, reject) => {
        db.get().collection(collection.USER_COLLECTION).updateOne(
          { referralCode: refCode },
          { $inc: { wallet: 100 } }, // Increment the wallet field by 100
          (error, response) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          }
        );
      });
    },
    getAllCode:(userId)=>{
      return new Promise(async(resolve,reject)=>{
        let coupons=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)},{couponCodes:1})
        
        resolve(coupons.couponCodes)

      })
    }
    
  
}





    