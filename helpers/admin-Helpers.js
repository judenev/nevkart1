var db = require('../connection/connections')
var collection = require('../connection/collections')
var bcrypt = require('bcrypt')
const ObjectId = require('mongodb').ObjectId
const accountSID = "AC54fbbc7bc94b60cdd2a36eb85fab59e0"
const serviceSID = "VA048467ff548984373c0e303417a34c1b"
const authToken = "0553abec342c12ca730deba61aef379c"

const adminotp = require('twilio')(accountSID, authToken)


module.exports = {

    getotp: (mobnumber) => {

        // console.log(mobnumber);
        return new Promise((resolve, reject) => {
            adminotp.verify.services(serviceSID).verifications.create({
                to: `+91${mobnumber}`,
                channel: 'sms'
            }).then((v) => {
                console.log(v);
                resolve(mobnumber)
                // resp.status(200).json({v})
            })

        })
    },
    verifyotp: (verifyotp, verifynumber) => {
        // console.log("this is otp"+verifyotp);
        // console.log(verifynumber);
        return new Promise((resolve, reject) => {
            adminotp.verify.services(serviceSID).verificationChecks.create({
                to: `+91${verifynumber}`,
                code: verifyotp
            }).then((l) => {
                // console.log(l);
                resolve(l)
                // resp.status(200).json({v})
            })

        })
    },
    Orderstatus: (pgno = 1, page_size = 10) => {
        let skips = page_size * (pgno - 1)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.order_collection).find().skip(skips).limit(page_size).toArray().then((data) => {


                resolve(data)

            })
        })
    },
    userAllorderCancel: (orderId) => {
        return new Promise((resolve, reject) => {
            let status = 'Order Canceled'
            db.get().collection(collection.order_collection).updateOne({ _id: ObjectId(orderId) }, { $set: { 'Orderdetails.DeliveryStatus': status } }).then(() => {
                resolve(true)
            })
        })

    },
    Orderstatusupdate: (orderid, status,) => {
        console.log("kooooi", status);

        return new Promise((resolve, reject) => {
            db.get().collection(collection.order_collection).updateOne({ _id: ObjectId(orderid) }, { $set: { 'Orderdetails.DeliveryStatus': status.orderStatus } }).then(async (data) => {
                if (status.orderStatus == "Order Canceled") {
                    let orderDet = await db.get().collection(collection.order_collection).findOne({ _id: ObjectId(orderid) })

                    let walletrefund = parseInt(orderDet.Orderdetails.total)
                    let userId = orderDet.Orderdetails.userID
                    //     orderDet.Orderdetails.product.map(async(item)=>{
                    //     if(item.status=='Order cancelled by user'){
                    //         let tot=parseInt(  orderDet.Orderdetails.total)
                    //         walletrefund =Math.ceil(tot-item.product[0].product.discprice)
                    //     }
                    //     else{
                    //         let userId = orderDet.Orderdetails.userID
                    //         walletrefund = parseInt(orderDet.Orderdetails.total)
                    //         console.log(userId);
                    //     }
                    // })
                    console.log("walletrefunda", walletrefund);
                    console.log("user", userId);

                    let isWallet = await db.get().collection(collection.Wallet_collection).findOne({ user: ObjectId(userId) })
                    let total = isWallet.TotalAmount
                    let walletAmount = total + walletrefund
                    let wallet = {
                        Amount: walletrefund,
                        date: new Date(),
                        cause: "Order cancelled"

                    }

                    db.get().collection(collection.Wallet_collection).updateOne({ user: ObjectId(userId) }, { $push: { wallettarnsactions: wallet } }).then(() => {
                        db.get().collection(collection.Wallet_collection).updateOne({ user: ObjectId(userId) }, { $set: { TotalAmount: walletAmount } })
                        console.log("wallet keriyeee");
                        resolve(true)

                    })


                }

            })
        })
    },
    Orderdelete: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.order_collection).deleteOne({ _id: ObjectId(orderId) }).then(() => {
                resolve(true)
            })
        })
    },

    getCat: () => {
        return new Promise(async (resolve, reject) => {

            const cat = await db.get().collection(collection.Category_collection).find().toArray().then((data) => {
                resolve(data)

            })
        })
    },
    getbrand: () => {
        return new Promise(async (resolve, reject) => {

            const cat = await db.get().collection(collection.brand_collection).find().toArray().then((data) => {
                resolve(data)

            })
        })
    },
    getmodel: () => {
        return new Promise(async (resolve, reject) => {

            const cat = await db.get().collection(collection.model_collection).find().toArray().then((data) => {
                resolve(data)

            })
        })
    },
    addCat: (category) => {
        console.log("catId", category);

        return new Promise(async (resolve, reject) => {
            let Offer = 0
            obj = {
                category: category,
                Offer: Offer
            }
            const cat = await db.get().collection(collection.Category_collection).insertOne(obj).then((data) => {
                resolve(data)
            })
        })
    },
    addbrand: (brand) => {

        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.brand_collection).insertOne(brand).then((data) => {
                resolve(data)
            })
        })
    },
    addmodel: (model) => {

        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.model_collection).insertOne(model).then((data) => {
                resolve(data)
            })
        })
    },

    addproduct: (product, catId, proOff) => {
        let ProductOffer = parseInt(proOff)
        let proPrice = parseInt(product.price)
        let proOffer = ProductOffer;
        let catOffer = 0;
        let cartprice = 0;

        console.log("product added", product);
        return new Promise(async (resolve, reject) => {

            let isCat = await db.get().collection(collection.Category_collection).findOne({ _id: ObjectId(catId) })
            console.log("category offer is here", isCat);
            cartprice = 100
            if (isCat.Offer == 0) {
                await db.get().collection(collection.Product_collection).insertOne({ product, proOffer, catOffer, stockstatus: true, cartprice }).then((data) => {
                    let prId = data.insertedId
                    let orgprice = proPrice
                    let discount = orgprice - (orgprice * proOffer) / 100
                    let discprice = Math.ceil(discount)
                    db.get().collection(collection.Product_collection).updateOne({ _id: prId }, { $set: { 'product.discprice': discprice } })
                    resolve(data)
                })
            }
            else {



                let catOffer = isCat.Offer
                proOffer = ProductOffer;
                let orgprice = proPrice
                if (proOffer < catOffer) {

                    let discount = orgprice - (orgprice * catOffer) / 100

                    discprice = Math.ceil(discount)
                    console.log("after cat", discprice);

                } else {

                    let discount = orgprice - (orgprice * proOffer) / 100

                    discprice = Math.ceil(discount)
                    console.log("after pro", discprice);
                }
                cartprice = 100
                await db.get().collection(collection.Product_collection).insertOne({ product, proOffer, catOffer, stockstatus: true, cartprice }).then((resp) => {
                    console.log("pro inserted");
                    let prId = resp.insertedId
                    db.get().collection(collection.Product_collection).updateOne({ _id: prId }, { $set: { 'product.discprice': discprice } })
                    resolve(true)
                })

            }

        })
    },
    deleteproduct: (del) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Product_collection).deleteOne({ _id: ObjectId(del) }).then((delt) => {
                resolve(delt)
            })

        })

    },
    catlist: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Category_collection).find().toArray().then((catdata) => {
                resolve(catdata)

            })
        })
    },

    Instock: (stockId) => {
        console.log("here ua ma", stockId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Product_collection).updateOne({ _id: ObjectId(stockId) }, { $set: { stockstatus: true } }).then(() => {
                resolve(true)
            })
        })
    },
    Outstock: (stockId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Product_collection).updateOne({ _id: ObjectId(stockId) }, { $set: { stockstatus: false } }).then(() => {
                resolve(true)
            })
        })
    },

    // productlist:()=>{

    //       return new Promise(async(resolve,reject)=>{

    //           const cat=await db.get().collection(collection.Product_collection).find().toArray().then((data)=>{
    //               resolve(data)
    //             //  await db.get().collection(collection.Category_collection).find({_id:data._id}).then((data)=>{
    //             //       resolve(data)
    //             //       console.log(data);
    //             //  })
    //           })
    //       })
    //   },

    productlist: () => {

        return new Promise(async (resolve, reject) => {

            const cat = await db.get().collection(collection.Product_collection).aggregate([
                { "$addFields": { "categoryId": { "$toObjectId": "$product.category" } } },
                // {$convert: {input: '$category', to : 'objectId', onError: '',onNull: ''}},
                {
                    $lookup: {
                        from: "category",
                        localField: "categoryId",
                        foreignField: "_id",
                        as: "collect"
                    }
                },
                {
                    $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$collect", 0] }, "$$ROOT"] } }
                },
                { $project: { collect: 0 } },
                { "$addFields": { "brandId": { "$toObjectId": "$product.brand" } } },
                //  { "$addFields": {$convert: {input: '$brand', to : 'objectId', onError: 'ss',onNull: 'ss'}} },
                // {$convert: {input: '$brand', to : 'objectId', onError: '',onNull: ''}},
                {
                    $lookup: {
                        from: "brand",
                        localField: "brandId",
                        foreignField: "_id",
                        as: "collect"
                    }
                },
                {
                    $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$collect", 0] }, "$$ROOT"] } }
                },
                { $project: { collect: 0 } },
            ]).toArray().then((collect) => {



                console.log("Value of collect", collect);
                //  console.log("Value of collect", collect[0].collect[0].categoryName)
                resolve(collect)
            })


        })
    },
    deleteUser: (del) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.User_collection).deleteOne({ _id: ObjectId(del) }).then((delt) => {
                resolve(delt)
            })

        })

    },
    blockUser: (block) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.User_collection).updateOne({ _id: ObjectId(block) }, { $set: { blocked: true } }).then((delt) => {
                resolve(delt)
            })

        })

    },
    unblockUser: (unblock) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.User_collection).updateOne({ _id: ObjectId(unblock) }, { $set: { blocked: false } }).then((unblocked) => {
                resolve(unblocked)
            })

        })

    },
    showlist: (productId) => {
        console.log("this is show product", productId)
        return new Promise((resolve, reject) => {


            db.get().collection(collection.Product_collection).findOne({ _id: ObjectId(productId) }).then(async (one) => {


                await db.get().collection(collection.Product_collection).aggregate([
                    { "$addFields": { "categoryId": { "$toObjectId": "$product.category" } } },

                    {
                        $lookup: {
                            from: collection.Category_collection,
                            localField: "categoryId",
                            foreignField: "_id",
                            as: "collect"
                        }
                    },
                    {
                        $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$collect", 0] }, "$$ROOT"] } }
                    },
                    { $project: { collect: 0 } },
                    { "$addFields": { "brandId": { "$toObjectId": "$product.brand" } } },

                    {
                        $lookup: {
                            from: collection.brand_collection,
                            localField: "brandId",
                            foreignField: "_id",
                            as: "collect"
                        }
                    },
                    {
                        $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$collect", 0] }, "$$ROOT"] } }
                    },
                    { $project: { collect: 0 } },
                ]).toArray().then((show) => {
                    ;
                    console.log("this is show data", show);
                    console.log("this is Onr data", one);

                    resolve([show, one,])
                })
            })
        })


    },
    getbanner: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Banner_collection).find().toArray().then((bannerdata) => {
                console.log("banner data", data);
                resolve(data)

            })
        })
    },
    profind: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Product_collection).findOne({ _id: ObjectId(proId) }).then((data) => {

                resolve(data)
            })
        })
    },
    updateproduct: (updateid, productname, category, brand, stocks, description, fileData) => {
        console.log("cheking it");
        console.log("this is id:" + updateid);
        console.log("this is product name:" + productname);
        console.log("this is brand name:" + brand);
        console.log("this is category name:" + category);
        console.log("this is description :" + description);
        let stock = parseInt(stocks)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Product_collection).updateOne({ _id: ObjectId(updateid) }, [{ $set: { "product.productname": productname, "product.category": category, "product.brand": brand, "product.stockdata": stock, "product.description": description, "product.file": fileData } }]).then(async (updated) => {


                await db.get().collection(collection.Product_collection).aggregate([
                    { "$addFields": { "categoryId": { "$toObjectId": "$category" } } },

                    {
                        $lookup: {
                            from: collection.Category_collection,
                            localField: "categoryId",
                            foreignField: "_id",
                            as: "collect"
                        }
                    },
                    {
                        $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$collect", 0] }, "$$ROOT"] } }
                    },
                    { $project: { collect: 0 } },
                    { "$addFields": { "brandId": { "$toObjectId": "$brand" } } },

                    {
                        $lookup: {
                            from: collection.brand_collection,
                            localField: "brandId",
                            foreignField: "_id",
                            as: "collect"
                        }
                    },
                    {
                        $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$collect", 0] }, "$$ROOT"] } }
                    },
                    { $project: { collect: 0 } },
                ]).toArray().then((updated) => {
                    console.log("updated dataaa jde", updated);
                    resolve(updated)

                })
            })


        })
    },
    userlist: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.User_collection).find().toArray().then((userlist) => {

                resolve(userlist)

            })
        })
    },
    catdele: (categoryId) => {
        console.log("blah", categoryId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Category_collection).deleteOne({ _id: ObjectId(categoryId) }).then(() => {
                resolve(true)
            })
        })
    },
    addbanner: (banner) => {

        // console.log(banner.bannerdata);
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.Banner_collection).insertOne(banner).then((data) => {
                resolve(data)
            })
        })
    },
    deleteBanner: (bannerId) => {
        return new Promise((resolve, reject) => {
            console.log("bannerdelete", bannerId);
            db.get().collection(collection.Banner_collection).deleteOne({ _id: ObjectId(bannerId) }).then(() => {
                resolve(true)
            })
        })

    },
    getbanner: () => {


        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.Banner_collection).find().toArray().then((data) => {
                resolve(data)
            })
        })
    },
    paymentTypesale: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.order_collection).aggregate([{ "$group": { "_id": "$Orderdetails.PaymentMethod", "count": { "$sum": 1 } } }]).toArray().then((data) => {
                console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$555555", data);
                resolve(data)
            })
        })
    },
    setmonthReport: () => {

        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.order_collection).aggregate([{ "$group": { "_id": { $month: { $dateFromString: { dateString: '$Orderdetails.ordered_on' } } }, "count": { "$sum": 1 } } }]).toArray().then(async (data) => {
                let month;
                console.log(data);
                let a = (data[0]._id)
                let count = (data[0].count)
                console.log("kala", a);



                switch (a) {
                    case 1:
                        month = "January";
                        break;
                    case 2:
                        month = "February";
                        break;
                    case 3:
                        month = "March";
                        break;
                    case 4:
                        month = "April";
                        break;
                    case 5:
                        month = "May";
                        break;
                    case 6:
                        month = "June";
                        break;
                    case 7:
                        month = "July";
                        break;
                    case 8:
                        month = "August";
                        break;
                    case 9:
                        month = "September";
                        break;
                    case 10:
                        month = "October";
                        break;
                    case 11:
                        month = "November";
                        break;
                    case 12:
                        month = "December";
                        break;

                }
                let obj = {
                    currentMonth: month,
                    salesCount: count
                }

                // db.get().collection(collection.admin_report_collection).insertOne(obj).then(()=>{})

                let isMonth = await db.get().collection(collection.admin_report_collection).findOne({ currentMonth: month })
                console.log("hello", isMonth);
                if (isMonth) {


                    monthdata = (obj.currentMonth)


                    db.get().collection(collection.admin_report_collection).updateOne({ currentMonth: monthdata }, { $set: { salesCount: count } }).then(() => {

                        resolve(true)




                    })

                } else {
                    db.get().collection(collection.admin_report_collection).insertOne(obj).then(() => {




                        resolve(true)


                    })

                }




            })
        })
    },
    getmonthReport: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.admin_report_collection).find().toArray().then((data) => {
                console.log("month report is here");
                console.log(data);
                resolve(data)
            })
        })
    },
    datesort: (g, h) => {
        let from = new Date(this.getCat)
        let to = new Date(h)

        return new Promise(async (resolve, reject) => {
            let f = await db.get().collection(collection.order_collection).find({ 'Orderdetails.date': { $gte: from, $lte: to } }).toArray()

            console.log("result", f);
            console.log(from, to);
            resolve(f)
        })

    }
    ,
    addcoupon: (coupondata) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Coupon_collection).insertOne(coupondata).then(() => {
                resolve(true)
            })
        })

    },
    getcoupon: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Coupon_collection).find().toArray().then((data) => {
                resolve(data)
            })
        })

    },
    deletecoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Coupon_collection).deleteOne({ _id: ObjectId(couponId) }).then(() => {
                resolve(true)
            })
        })


    },
    catOff: (catId, off) => {
        let offer = parseInt(off)
        console.log({ offer });
        console.log(catId);
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.Category_collection).updateOne({ _id: ObjectId(catId) }, { $set: { Offer: offer } })
            await db.get().collection(collection.Product_collection).updateMany({ 'product.category': catId }, { $set: { catOffer: offer } })
            let products = await db.get().collection(collection.Product_collection).find({ 'product.category': catId }).toArray()
            console.log("catoffff", products);

            let updateproducts = await products.map(async (item) => {
                let orgprice = parseInt(item.product.price)
                // console.log(orgprice ,item.proOffer,item.catOffer);
                console.log("ite, ite", item.proOffer, item.catOffer);

                if (item.proOffer == '0' && item.catOffer == '0') {
                    let orgprice = parseInt(item.product.price)
                    item.product.discprice = '0'

                } else {
                    if (item.proOffer < item.catOffer) {
                        console.log("her cat offer", item.product.discprice);
                        let discount = orgprice - (orgprice * item.catOffer) / 100
                        // let Tostr = Math.ceil(discount)
                        item.product.discprice = Math.ceil(discount)
                        console.log("after", item);

                    } else {

                        let discount = orgprice - (orgprice * item.proOffer) / 100

                        item.product.discprice = Math.ceil(discount)
                    }


                }
                db.get().collection(collection.Product_collection).updateOne({ _id: ObjectId(item._id) }, { $set: item }).then(() => {

                    resolve(true)
                })

            })
        })
    },
    AddproOffer: (proId, offers) => {

        return new Promise((resolve, reject) => {

            let offer = parseInt(offers)
            console.log(offer);
            db.get().collection(collection.Product_collection).updateOne({ _id: ObjectId(proId) }, { $set: { proOffer: offer } }).then((data) => {

                resolve(true)
            })
        })
    },



}
