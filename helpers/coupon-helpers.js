var db=require('../config/connection')
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectId


module.exports={

    addCoupon:(details)=>{
        return new Promise(async(resolve,reject)=>{
          let couponCode=details.code
          
          let couponExist=await db.get().collection(collection.COUPON_COLLECTION).findOne({code:couponCode})
          
          if(!couponExist){
        await db.get().collection(collection.COUPON_COLLECTION).insertOne(details).then((response)=>{
            resolve(1)
        })
      }else{
        resolve(2)
      }
        })
    },
    getAllCoupon:()=>{

        return new Promise(async(resolve,reject)=>{
          let coupons=  await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
          if(coupons){
          resolve(coupons)
          }else{
            resolve()
          }
        })
    },
    getCoupon:(couponId)=>{
      return new Promise(async(resolve,reject)=>{
        let coupon=await db.get().collection(collection.COUPON_COLLECTION).findOne({_id:objectId(couponId)})
        resolve(coupon)
      })
    },
    updateCoupon:(coupon,id)=>{
      return new Promise(async(resolve,reject)=>{
        let couponCode=coupon.code;
      
        let couponExist=await db.get().collection(collection.COUPON_COLLECTION).findOne({code:couponCode})
       
        if(!couponExist){
       
        await db.get().collection(collection.COUPON_COLLECTION).updateOne({_id:objectId(id)},
        {$set:{
          code:coupon.code,
          discount:coupon.discount,
          StartDate:coupon.StartDate,
          EndDate:coupon.EndDate,
          MaxUsage:coupon.MaxUsage,
          UsageCount:coupon.UsageCount

          
        }}).then(()=>{
          resolve(1)
        })

        }else{
          resolve(2)
         
        }
      })
    },
    deleteCoupon:(id)=>{
      return new Promise(async(resolve,reject)=>{
        await db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(id)}).then((response)=>{
          resolve(response)
        })
      })
    },
    getUserCoupon: (cCode) => {
      return new Promise(async (resolve, reject) => {
        let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ code: cCode });
    
        let currDate = new Date();
      
        
        if (!coupon) {
          resolve(1);
        } else {
          let endDate = new Date(coupon.EndDate); // Convert the coupon's EndDate to a Date object
          if (currDate > endDate) {
            resolve(1);
          } else {
            resolve(coupon);
          }
        }
      });
    },
    

    haveCoupon:(price)=>{
      
      return new Promise(async(resolve,reject)=>{
        
        let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find({ $expr: { $lt: [{ $toInt: "$MaxUsage" }, price] } })
        .sort({ MaxUsage: 1 })
        .limit(1)
        .toArray();
        
        if(coupon.length){
          resolve(coupon[0].code)
        }else{
          resolve(null)
        }
      })
    }
  

    


}

