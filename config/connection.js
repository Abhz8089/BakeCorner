const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
    // const url='mongodb://127.0.0.1:27017'
    const url="mongodb+srv://abhi8089:P3mSEKZ7FVCHjUUM@cluster0.vmkblvg.mongodb.net/test"
    const dbname='bakecorner'
  

    mongoClient.connect(url,(err,data)=>{
        
        if(err) return done(err)
        
        state.db=data.db(dbname)
        done()
        
    })
  
}
module.exports.get=function(){
    return state.db
}