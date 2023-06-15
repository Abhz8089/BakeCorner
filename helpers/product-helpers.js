var db=require('../config/connection')
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectId

module.exports={
    addProduct:(product,callback)=>{
    
        db.get().collection("product").insertOne(product).then((data)=>{
            console.log("this is the id :"+data.insertedId)
            callback(data.insertedId)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
          let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
          resolve(products)
        })
      },
      getAllProductsInHome:()=>{
        return new Promise(async(resolve,reject)=>{
          let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({_id:-1}).limit(8).toArray()
          resolve(products)
        })
      },
     deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
         db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)}).then((response)=>{
           console.log(response)
           resolve(response)
         })
        })
       },
       getProductDetails:(prodId)=>{
        
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product)=>{
            console.log(product.photos[0].fileName+"gerproudut details 31")

            resolve(product)
          })
        })
      },
      updateProduct:(proId,proDetails)=>{
        console.log(proDetails.name +"38")
        console.log(proDetails.price)
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
            $set:{
              name:proDetails.name,
              description:proDetails.description,
              price:proDetails.price,
              category:proDetails.category,
              
              
  
            },
            $push: {
              photos: {
                $each: proDetails.photos
              }
                
              
            }
          }).then((response)=>{
            resolve()
          })
        })
      },
      getImage:(id)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(id)},{photos:1}).then((photos)=>{
            
            resolve(photos)
          })
        })
      },
      getCatProduct:(CaName)=>{
      return new Promise(async(resolve,reject)=>{
      let products =await db.get().collection(collection.PRODUCT_COLLECTION).find({category:CaName}).toArray()
    
     resolve(products)          
        
      })
      }
      
      ,
      deleteImage:(imgId)=>{
        return new Promise(async(resolve,reject)=>{
          await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ "photos.id": imgId },
          { $pull: { photos: { id: imgId } } }
          )
          resolve()

        })
      },
     
      getSearchProduct: (search, category) => {
        let searchingWord = search;
      
        return new Promise(async (resolve, reject) => {
          try {
            let pipeline = [];
      
            // Match stage to filter products by category
            if (category) {
              pipeline.push({
                $match: { category: category }
              });
            }
      
            // Match stage to filter products by search query
            if (searchingWord) {
              pipeline.push({
                $match: {
                  $or: [
                    { name: { $regex: searchingWord, $options: 'i' } },
                   { description: { $regex: searchingWord, $options: 'i' } }
                  ]
                }
              });
            }
      
            // Add additional pipeline stages if needed (e.g., sorting)
      
            // Projection stage to include only required fields
            pipeline.push({
              $project: {
                _id: 1,
                name: 1,
                category: 1,
                price: 1,
                description: 1,
                photos: 1
              }
            });
      
            // Execute the aggregation pipeline
            var products = await db
              .get()
              .collection(collection.PRODUCT_COLLECTION)
              .aggregate(pipeline)
             
              .toArray();
      
            resolve(products);
          } catch (error) {
            reject(error);
          }
        });
      },

      
      getCatProducts: (Cname, page, perPage) => {
        return new Promise(async (resolve, reject) => {
          let products = await db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ category: Cname })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .toArray();
      
          resolve(products);
        });
      },
      
      // Helper method to get the total number of category products
      getTotalCatProducts: (Cname) => {
        return new Promise(async (resolve, reject) => {
          let totalProducts = await db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ category: Cname })
            .count();
      
          resolve(totalProducts);
        });
      },
      getCatProductByPage: (Cname, skip, perPage) => {
        return new Promise(async (resolve, reject) => {
          try {
            // const pageNumber = parseInt(skip)+1;
             perPage=12
            // const productsPerPage = parseInt(perPage);
            //  const skip=(pageNumber-1)*productsPerPage;
            //    console.log(skip)
            const products = await db
              .get()
              .collection(collection.PRODUCT_COLLECTION)
              .find({ category: Cname })
              .skip(skip)
              .limit(perPage)
              .toArray();
      
            resolve(products);
          } catch (error) {
            reject(error);
          }
        });
      },
      getCatProductCount: (Cname) => {
        return new Promise(async (resolve, reject) => {
          try {
            const count = await db.get().collection(collection.PRODUCT_COLLECTION)
              .countDocuments({ category: Cname });
            resolve(count);
          } catch (error) {
            reject(error);
          }
        });
      },
      totalProduct:()=>{
        return new Promise(async(resolve,reject)=>{
          db.get().collection(collection.PRODUCT_COLLECTION).countDocuments({}, (err, count) => {
            if (err) {
              reject(err);
            }
            // Access the total count of products
            resolve(count);
          });
          
        })
      }
      
      
      
      
    
}