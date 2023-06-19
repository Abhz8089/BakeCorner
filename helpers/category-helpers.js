var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;

module.exports = {
  addCategory: (category, callback) => {
    return new Promise(async (resolve, reject) => {
      console.log(category.Cname);
      let catExist = await db
        .get()
        .collection(collection.CATEGORY_COLLECTON)
        .findOne({ Cname: category.Cname });
      console.log(catExist);
      if (!catExist) {
        db.get()
          .collection("category")
          .insertOne(category)
          .then((data) => {
            console.log("this is the id :" + data.insertedId);
            callback(data.insertedId);
          });
      } else {
        callback(null);
      }
    });
  },
  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      let category = await db
        .get()
        .collection(collection.CATEGORY_COLLECTON)
        .find()
        .toArray();
      console.log(category);
      resolve(category);
    });
  },
  getCategoryDetails: (catId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTON)
        .findOne({ _id: objectId(catId) })
        .then((category) => {
          resolve(category);
        });
    });
  },
  updateCategory: (catId, catDetails) => {
    return new Promise(async (resolve, reject) => {
      console.log("catdetails" + catDetails.name);
      let catExist = await db
        .get()
        .collection(collection.CATEGORY_COLLECTON)
        .findOne({ Cname: catDetails.name });
      if (!catExist) {
        db.get()
          .collection(collection.CATEGORY_COLLECTON)
          .updateOne(
            { _id: objectId(catId) },
            {
              $set: {
                Cname: catDetails.name,
              },
            }
          )
          .then((response) => {
            resolve();
          });
      } else {
        resolve(1);
      }
    });
  },
  deleteCategory: (catId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTON)
        .deleteOne({ _id: objectId(catId) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },
};
