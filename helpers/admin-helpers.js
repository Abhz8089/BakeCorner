var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { ObjectId } = require('mongodb')
const moment = require('moment');
module.exports ={
      doLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false;
            let response={}
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({email:adminData.email})
            if(admin){
                bcrypt.compare(adminData.password,admin.password).then((status)=>{
                    if(status){
                        console.log("login success")
                        response.admin=admin;
                        response.status=true;
                        resolve(response)
                    }else{
                        console.log("login fail");
                        resolve({status:false})
                    }
                })
            }else{
                console.log('login failed');
                resolve({status:false});
            }
        })
    },
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
          let users=await db.get().collection(collection.USER_COLLECTION).find({}).toArray()
          resolve(users)
        })
      },
      getUser:(userId)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)}).then((user)=>{
            resolve(user)
          })
        })
      },
      doBlock:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},{$set:{isBlocked:true}},(err,result)=>{
                if(err){
                    console.log("error :"+err)
                    res.status(500).send("Error blocking")
                }else{
                    console.log('User Blocked')
                    resolve("success")
                }
            })
        })

      },
      doUnBlock:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},{$set:{isBlocked:false}},(err,result)=>{
                if(err){
                    console.log("error :"+err)
                    res.status(500).send("Error unblocking")
                }else{
                    console.log('User unBlocked')
                    resolve("success")
                }
            })
        })

      },
      getAllUsersOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let usersOrders=await db.get().collection(collection.ORDER_COLLECTION).find({}).toArray()
            
            resolve(usersOrders)
        })
      },
      delivered:async (orderId)=>{
        await new Promise(async (resolve, reject) => {
          await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, { $set: { 'status': 'Delivered' } })
        })
        resolve()
      },
      returnSuccess:async (orderId)=>{
        await new Promise(async (resolve, reject) => {
          await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, { $set: { 'status': 'Return Success' } })
        })
        resolve()
      },
      getAmountLastSevenDay: () => {
        return new Promise(async (resolve, reject) => {
          const sevenDaysAgo = moment().subtract(7, 'days').toDate();
      
          let totalPrize = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $match: {
                wholeDate: {
                  $gte: sevenDaysAgo
                }
              }
            },
            {
              $group: {
                _id: null,
                totalPrize: {
                  $sum: "$totalAmount"
                }
              }
            }
          ]).toArray();
          console.log(totalPrize)
          resolve(totalPrize[0].totalPrize);
        });
      },
      getAmountLastMonth: () => {
        return new Promise(async (resolve, reject) => {
          const sevenDaysAgo = moment().subtract(30, 'days').toDate();
      
          let totalPrize = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $match: {
                wholeDate: {
                  $gte: sevenDaysAgo
                }
              }
            },
            {
              $group: {
                _id: null,
                totalPrize: {
                  $sum: "$totalAmount"
                }
              }
            }
          ]).toArray();
          console.log(totalPrize)
          resolve(totalPrize[0].totalPrize);
        });
      },
      getAmountLastYear: () => {
        return new Promise(async (resolve, reject) => {
          const sevenDaysAgo = moment().subtract(360, 'days').toDate();
      
          let totalPrize = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $match: {
                wholeDate: {
                  $gte: sevenDaysAgo
                }
              }
            },
            {
              $group: {
                _id: null,
                totalPrize: {
                  $sum: "$totalAmount"
                }
              }
            }
          ]).toArray();
          console.log(totalPrize)
          resolve(totalPrize[0].totalPrize);
        });
      },
      getOrderLastSevenDay:()=>{
        return new Promise(async (resolve, reject) => {
          const startDate = moment().subtract(7, 'days').startOf('day').toDate();
          const endDate = moment().endOf('day').toDate();
      
          try {
            const orderCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
              wholeDate: {
                $gte: startDate,
                $lte: endDate
              }
            });
            console.log(orderCount)
            console.log('orderCount')
            resolve(orderCount);
          } catch (error) {
            reject(error);
          }
        });
      },
      getOrderLastMonth:()=>{
        return new Promise(async (resolve, reject) => {
          const startDate = moment().subtract(30, 'days').startOf('day').toDate();
          const endDate = moment().endOf('day').toDate();
      
          try {
            const orderCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
              wholeDate: {
                $gte: startDate,
                $lte: endDate
              }
            });
            console.log(orderCount)
            console.log('orderCount')
            resolve(orderCount);
          } catch (error) {
            reject(error);
          }
        });
      },
      getOrderLastYear:()=>{
        return new Promise(async (resolve, reject) => {
          const startDate = moment().subtract(360, 'days').startOf('day').toDate();
          const endDate = moment().endOf('day').toDate();
      
          try {
            const orderCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
              wholeDate: {
                $gte: startDate,
                $lte: endDate
              }
            });
            console.log(orderCount)
            console.log('orderCount')
            resolve(orderCount);
          } catch (error) {
            reject(error);
          }
        });
      
      },
       getTotalProductQuantityLastSevenDays:() => {
        return new Promise(async (resolve, reject) => {
          const startDate = moment().subtract(7, 'days').startOf('day').toDate();
          const endDate = moment().endOf('day').toDate();
      
          try {
            const result = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
              {
                $match: {
                  wholeDate: {
                    $gte: startDate,
                    $lte: endDate
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: { $sum: "$products.quantity" } }
                }
              }
            ]).toArray();
      
            // Extract the total quantity from the result
            const totalQuantity = result.length > 0 ? result[0].totalQuantity : 0;
            console.log(totalQuantity)
            console.log('totalQuantity')
            resolve(totalQuantity);
          } catch (error) {
            reject(error);
          }
        });
      },
      getTotalProductQuantityLastMonth:() => {
        return new Promise(async (resolve, reject) => {
          const startDate = moment().subtract(30, 'days').startOf('day').toDate();
          const endDate = moment().endOf('day').toDate();
      
          try {
            const result = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
              {
                $match: {
                  wholeDate: {
                    $gte: startDate,
                    $lte: endDate
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: { $sum: "$products.quantity" } }
                }
              }
            ]).toArray();
      
            // Extract the total quantity from the result
            const totalQuantity = result.length > 0 ? result[0].totalQuantity : 0;
            console.log(totalQuantity)
            console.log('totalQuantity')
            resolve(totalQuantity);
          } catch (error) {
            reject(error);
          }
        });
      },
      getTotalProductQuantityLastYear:() => {
        return new Promise(async (resolve, reject) => {
          const startDate = moment().subtract(360, 'days').startOf('day').toDate();
          const endDate = moment().endOf('day').toDate();
      
          try {
            const result = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
              {
                $match: {
                  wholeDate: {
                    $gte: startDate,
                    $lte: endDate
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: { $sum: "$products.quantity" } }
                }
              }
            ]).toArray();
      
            // Extract the total quantity from the result
            const totalQuantity = result.length > 0 ? result[0].totalQuantity : 0;
            console.log(totalQuantity)
            
            resolve(totalQuantity);
          } catch (error) {
            reject(error);
          }
        });
      },
      getSellingProductInEachMonth:()=>{
        return new Promise(async(resolve,reject)=>{
        await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $group: {
              _id: { $month: { $toDate: "$wholeDate" } },
              totalAmount: { $sum: "$totalAmount" }
            }
          }
        ]).toArray((err, result) => {
          if (err) {
            // Handle the error
            console.error(err);
            return;
          }
          
          resolve(result)
     
        });
        })
      },
      getTopSellProduct: () => {
        return new Promise(async (resolve, reject) => {
          await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $match: { "status": "Delivered" }
            },
            {
              $unwind: "$products"
            },
            {
              $group: {
                _id: "$products.item",
                count: { $sum: "$products.quantity" }
              }
            },
            {
              $sort: { count: -1 }
            },
            {
              $limit: 5
            },
            {
              $lookup: {
                from: "product",
                localField: "_id",
                foreignField: "_id",
                as: "productDetails"
              }
            },
            {
              $project: {
                _id: 0,
                productId: "$_id",
                count: 1,
                productDetails: { $arrayElemAt: ["$productDetails", 0] }
              }
            }
          ]).toArray((err, result) => {
            if (err) {
              reject(err);
            }
            resolve(result);
          });
        });
      },
      totalAmount:()=>{
        return new Promise(async(resolve,reject)=>{
          db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$totalAmount" },
                totalOrders: { $sum: 1 }
              }
            }
          ]).toArray((err, result) => {
            if (err) {
              reject(err);
            }
            // Access the total amount and total orders from the result
            const totalAmount = result[0].totalAmount;
            const totalOrders = result[0].totalOrders;
            resolve({ totalAmount, totalOrders });
          });
          
      })
    }
      
     
      
      
      
      

      
      
      
      
      
      
   
       

}