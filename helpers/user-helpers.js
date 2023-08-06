var db = require('../connection/connections')
var collection = require('../connection/collections')
var bcrypt = require('bcrypt')
var ObjectId = require('mongodb').ObjectId
var adminHelpers = require('../helpers/admin-Helpers')
const accountSID = "AC54fbbc7bc94b60cdd2a36eb85fab59e0"
const serviceSID = "VA048467ff548984373c0e303417a34c1b"
const authToken = "eb2db8f2cc009ba5ca93bdbdc54faa9f"
const Razorpay = require('razorpay')
const { log } = require('console')
const { resolve } = require('path')
var instance = new Razorpay({
    key_id: "rzp_test_9JuKTUdvSUARFP",
    key_secret: "xCHD6JGTFt5S7b5eKOPfTdTu"
})

const userotp = require('twilio')(accountSID, authToken)
module.exports = {
    doSignup: (userdata) => {
        return new Promise(async (resolve, reject) => {
            userdata.password = await bcrypt.hash(userdata.password, 10)
            db.get().collection(collection.User_collection).insertOne({ ...userdata, blocked: false }).then((data) => {
                console.log(data)
                resolve(data)

            })
        })


    },
    resetpass: (data) => {
        return new Promise(async (resolve, reject) => {
            data.newpassword = await bcrypt.hash(data.newpassword, 10)
            db.get().collection(collection.User_collection).updateOne({ email: data.email }, { $set: { password: data.newpassword } }).then(() => {
                let mess = "Password updated Succesfully"
                resolve(mess)
            })
        })
    },

    getotp: (mobnumber) => {

        // console.log(mobnumber);
        return new Promise((resolve, reject) => {
            userotp.verify.services(serviceSID).verifications.create({
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
        console.log("verify number", verifynumber);
        return new Promise((resolve, reject) => {
            userotp.verify.services(serviceSID).verificationChecks.create({
                to: `+91${verifynumber}`,
                code: verifyotp
            }).then((l) => {
                // console.log(l);
                resolve(l)
                // resp.status(200).json({v})
            })

        })
    },
    userfind: (mob) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.User_collection).findOne({ Mobnumber: mob }).then((data) => {
                console.log("mobnumber data ", data);
                resolve(data)
            })
        })
    },
    showproduct: (page_size = 5, page_num = 1) => {
        {

            return new Promise(async (resolve, reject) => {

                const cat = await db.get().collection(collection.Product_collection).aggregate([
                    { "$addFields": { "categoryId": { "$toObjectId": "$category" } } },

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
                    { "$addFields": { "brandId": { "$toObjectId": "$brand" } } },

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
                    resolve(collect)
                })


            })
        }


    },
    userCheck: (userdata) => {

        return new Promise(async (resolve, reject) => {
            let login = false
            let dat = {}

            let user = await db.get().collection(collection.User_collection).findOne({ email: userdata.email })

            if (user && !user.blocked) {
                bcrypt.compare(userdata.password, user.password).then((status) => {
                    if (status) {
                        console.log(" logged true");
                        dat.dataa = user
                        dat.status = true
                        resolve(dat)
                    } else {
                        console.log(' logged false')
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("Loggin failed dude")
                resolve({ status: false })
            }



        })



    },
    //view All
    getAllproduct: (pgno = 1, page_size = 2) => {
        let skips = page_size * (pgno - 1)


        return new Promise((resolve, reject) => {
            db.get().collection(collection.Product_collection).find()
                .toArray().then((data) => {

                    data.map(async (item) => {

                        if (item.proOffer < item.catOffer) {
                            orgprice = parseInt(item.product.price)
                            item.product.discprice = Math.ceil(orgprice - (orgprice * item.catOffer) / 100)

                        } else {
                            orgprice = parseInt(item.product.price)
                            item.product.discprice = Math.ceil(orgprice - (orgprice * item.proOffer) / 100)

                        }
                        await db.get().collection(collection.Product_collection).updateOne({ _id: ObjectId(item._id) }, { $set: item })
                    })


                    db.get().collection(collection.Product_collection).find().skip(skips).limit(page_size)
                        .toArray().then(async (data) => {
                            let All = await db.get().collection(collection.Product_collection).find().toArray()

                            console.log("all prod", All);
                            resolve([data, All])

                        })
                })
        })
    },
    //paginated 
    getproduct: (brandid, pgno = 1, page_size = 3) => {
        let skips = page_size * (pgno - 1)


        return new Promise((resolve, reject) => {
            db.get().collection(collection.Product_collection).find({ "product.brand": brandid })
                .skip(skips).limit(page_size)
                .toArray().then((data) => {

                    resolve(data)
                })
        })
    },
    getproducts: (prId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.Product_collection).findOne({ _id: ObjectId(prId) }).then((data) => {
                resolve(data)
                console.log("get data");
                console.log(data);
            })
        })
    },

    Addwishlist: (productId, userId) => {
        let productitem = {
            item: ObjectId(productId),
            stock: 1
        }
        return new Promise(async (resolve, reject) => {
            let isCart = await db.get().collection(collection.wish_list_collection).findOne({ user: ObjectId(userId) })

            if (isCart) {
                let isitem = isCart.products.findIndex(products => products.item == productId)

                if (isitem != -1) {
                    db.get().collection(collection.wish_list_collection).
                        updateOne({ user: ObjectId(userId), 'products.item': ObjectId(productId) }, {
                            $inc: { 'products.$.stock': 1 }
                        }).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.wish_list_collection).
                        updateOne({ user: ObjectId(userId) }, { $push: { products: productitem } }).then(() => {
                            resolve()
                        })

                }

            } else {

                let cartobj = {
                    user: ObjectId(userId),
                    products: [productitem]
                }
                db.get().collection(collection.wish_list_collection).insertOne(cartobj).then(() => {
                    resolve()
                })

            }
        })

    },
    delewishlist: (wishdata) => {
        console.log("wish data", wishdata);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.wish_list_collection).updateOne({ _id: ObjectId(wishdata.wishlist) },
                {
                    $pull: { products: { item: ObjectId(wishdata.product) } }
                }).then(() => {
                    resolve(true)
                })
        })
    },
    getwishlist: (userId) => {

        return new Promise(async (resolve, reject) => {
            let cartlist = await db.get().collection(collection.wish_list_collection).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        stock: '$products.stock'
                    }
                }, {

                    $lookup: {
                        from: collection.Product_collection,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, stock: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()


            resolve(cartlist)

        })
    },
    addtocart: (productId, userId) => {

        let productitem = {
            item: ObjectId(productId),
            stock: 1
        }
        return new Promise(async (resolve, reject) => {

            let isCart = await db.get().collection(collection.cart_collection).findOne({ user: ObjectId(userId) })
            console.log("iscartitems", isCart);

            if (isCart) {
                let isitem = isCart.products.findIndex(products => products.item == productId)
                console.log("indexdatata", isitem);
                if (isitem !== -1) {
                    db.get().collection(collection.cart_collection).
                        updateOne({ user: ObjectId(userId), 'products.item': ObjectId(productId) }, {
                            $inc: { 'products.$.stock': 1 }
                        }).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.cart_collection).
                        updateOne({ user: ObjectId(userId) }, { $push: { products: productitem } }).then(() => {
                            resolve()
                        })

                }

            } else {

                let cartobj = {
                    user: ObjectId(userId),
                    products: [productitem]
                }
                db.get().collection(collection.cart_collection).insertOne(cartobj).then(() => {
                    resolve()
                })

            }
        })
    },
    getcart: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartlist = await db.get().collection(collection.cart_collection).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        stock: '$products.stock'
                    }
                },
                {

                    $lookup: {
                        from: collection.Product_collection,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, stock: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            console.log("jude jude jude", cartlist);

            resolve(cartlist)

        })
    },
    deletecartpro: (delcartproduct) => {
        console.log("deletemannnn", delcartproduct);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.cart_collection).updateOne({ _id: ObjectId(delcartproduct.cart) },
                {
                    $pull: { products: { item: ObjectId(delcartproduct.product) } }
                }
            ).then((response) => {
                resolve({ removeProduct: true })
            })
        })
    },
    deleteaddress: (addId, userId) => {
        console.log(addId, userId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.user_address_collection).updateOne({ user: ObjectId(userId) },
                {
                    $pull: { address: { Addid: ObjectId(addId) } }
                }).then((response) => {
                    resolve(true)
                })
        })
    },
    cartproductcount: (details) => {

        count = parseInt(details.count)
        console.log("count cointeeeee", details);

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.cart_collection).updateOne({ _id: ObjectId(details.cart) },
                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
            } else {
                db.get().collection(collection.cart_collection).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                    {
                        $inc: { 'products.$.stock': count }
                    }).then((response) => {

                        resolve(true)
                    })
            }
        })

    },
    stockvalid: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Product_collection).find().toArray().then((data) => {
                data.map((item) => {
                    if (item.product.stockdata == 0) {
                        item.product.stockstatus = false
                    } else {
                        item.product.stockstatus = true
                    }
                })
                resolve(true)
            })
        })
    },
    reduceStock: async (proId, count, userId) => {
        console.log("stock reduce here", count);
        let Crtpro = await db.get().collection(collection.cart_collection).aggregate([
            {
                '$match': {
                    user: ObjectId(userId)
                }
            }, {
                '$unwind': {
                    path: '$products'
                }
            },
            {
                $project: {
                    item: '$products.item',
                    stock: '$products.stock'
                }
            }
        ]).toArray()
        console.log("cartreducestock", Crtpro);
        if (Crtpro.length == 0) {


            db.get().collection(collection.Product_collection).updateOne({ _id: ObjectId(pro.item) }, { $inc: { 'product.stockdata': -(Crtpro.stock) } })

        }
        await Crtpro.map((pro) => {

            db.get().collection(collection.Product_collection).updateOne({ _id: ObjectId(pro.item) }, { $inc: { 'product.stockdata': -(pro.stock) } })
        })

    },

    delivery: (details, userId) => {
        console.log("details evde", details);


        return new Promise(async (resolve, reject) => {
            let [orderCart] = await db.get().collection(collection.cart_collection).aggregate([
                {
                    '$match': {
                        'user': new ObjectId(userId)
                    }
                }, {
                    '$unwind': {
                        'path': '$products',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$lookup': {
                        from: collection.Product_collection,
                        'localField': 'products.item',
                        'foreignField': '_id',
                        'as': 'products.product'
                    }
                }, {
                    $set:
                    {
                        "products.status": "Order received"
                    }
                }, {
                    '$group': {
                        '_id': '$_id',
                        'user': {
                            '$first': '$user'
                        },
                        'products': {
                            '$push': '$products'
                        }
                    }
                }
            ]).toArray()

            let username = await db.get().collection(collection.User_collection).findOne({ _id: ObjectId(userId) })





            console.dir(orderCart, { depth: null });
            // console.log("porduct aggregate2",orderCart[1]);
            let add = details.flexRadioDefault
            db.get().collection(collection.user_address_collection).aggregate([
                {
                    $match: { user: ObjectId(userId) }

                },
                {
                    $unwind: "$address"
                },
                {
                    $match: { "address.Addid": ObjectId(add) }
                }
            ]).toArray().then(async (addressdata) => {
                // console.log("orderdata is here", addressdata);

                if (details.discountAmount) {
                    discount = true
                } else {
                    discount = false
                }



                console.log("02020202020", details);
                console.log("kona nona", username.userName);
                const obj = {
                    userID: ObjectId(userId),
                    name: username.userName,
                    tracking_id: new ObjectId(),
                    ordered_on: new Date(Date.now()).toLocaleDateString(),

                    date: new Date(),
                    address: addressdata,
                    couponDiscount: details.discountAmount,
                    Couponname: details.couponName,
                    Discount: discount,
                    //   orderstatus: paymentStatus,name ame anme anmen
                    PaymentMethod: details.paymentType,
                    product: orderCart.products,
                    // quantity: quandity[0].result,
                    total: details.totalprice,
                    Oldtotal: details.Oldtotalprice,
                    DeliveryStatus: "Order received",
                };
                await db.get().collection(collection.order_collection).insertOne({ Orderdetails: obj }).then(async (response) => {





                    console.log("Ops response after opayment");
                    console.log(response.insertedId);
                    resolve(response.insertedId)
                })







            })

        })



    },
    walletCheck: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Wallet_collection).findOne({ user: ObjectId(userId) }).then((data) => {

                resolve(data)
            })
        })
    },
    walletdeduct: (details, userId) => {
        return new Promise(async (resolve, reject) => {
            let isWallet = await db.get().collection(collection.Wallet_collection).findOne({ user: ObjectId(userId) })
            console.log({ isWallet });
            console.log("details", details)

            let total = parseInt(details.totalprice)
            let walletDeduct = (isWallet.TotalAmount - total)
            console.log({ walletDeduct });
            let wallet = {
                Amount: walletDeduct,
                date: new Date(),
                cause: "Wallet payment"

            }
            db.get().collection(collection.Wallet_collection).updateOne({ user: ObjectId(userId) }, { $push: { wallettarnsactions: wallet } }).then(async () => {

                await db.get().collection(collection.Wallet_collection).updateOne({ user: ObjectId(userId) }, { $set: { TotalAmount: walletDeduct } })
                resolve(true)

            })



        })
    },
    getbanner: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Banner_collection).find().toArray().then((data) => {
                console.log("banner data", data);
                resolve(data)

            })
        })
    },
    deleteAllcart: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.cart_collection).deleteOne({ user: ObjectId(userId) }).then(() => {
                resolve(true)
            })
        })
    },
    orderstatus: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.order_collection).find({ "Orderdetails.userID": ObjectId(userId) }).sort({ "_id": -1 }).toArray().then((data) => {

                // console.log("orderstatusllllllllll");
                // console.log("Product:",data[0].Orderdetails.product[0].product);
                // console.log("Stock:",data[0].Orderdetails.product[0].stock);
                // console.log("Product 2:",data[0].Orderdetails.product[0].product[0].product);
                resolve(data)
            })
        })

    },

    orderUp: async (s, orderId, proId, status, userId, qty) => {
        let refund

        console.log("order call");
        let h = await db.get().collection(collection.order_collection).aggregate([


            {
                '$match': {
                    '_id': new ObjectId(orderId)
                }
            }, {
                '$unwind': {
                    'path': '$Orderdetails.product'
                }
            }, {
                '$match': {
                    'Orderdetails.product.product._id': new ObjectId(proId)
                }
            }, {
                '$project': {
                    'cancelAmount': '$Orderdetails.product.product.product.discprice'
                }
            }

        ]).toArray()
        let order = await db.get().collection(collection.order_collection).findOne({ _id: ObjectId(orderId) })
        let individualproduct = h[0].cancelAmount
        if (order.Orderdetails.Discount) {
            let D = parseInt(order.Orderdetails.couponDiscount)
            refund = (individualproduct - D / order.Orderdetails.product.length)


        } else {

            refund = (individualproduct * qty)
        }

        console.log("refund sce", individualproduct, qty);
        console.log("refund tot", refund);
        let p = await db.get().collection(collection.order_collection).findOne({ _id: ObjectId(orderId) })
        console.log("pppppp", p.Orderdetails.total);
        let tot = p.Orderdetails.total
        finalAmount = Math.ceil(p.Orderdetails.total - refund)
        console.log("papapp", finalAmount);
        await db.get().collection(collection.order_collection).updateOne({ _id: ObjectId(orderId) }, { $set: { 'Orderdetails.total': finalAmount } })

        let stock = parseInt(s)
        await db.get().collection(collection.Product_collection).updateOne({ _id: ObjectId(proId) }, { $inc: { 'product.stockdata': (stock) } })


        console.log("ORDERUP", orderId, proId, status)

        return new Promise((resolve, reject) => {

            db.get().collection(collection.order_collection).updateOne({ _id: ObjectId(orderId), 'Orderdetails.product.item': ObjectId(proId) }, { $set: { 'Orderdetails.product.$.status': status } }).then(async (data) => {

                let refundAmount = refund
                console.log("refund product after", refundAmount);
                let order = await db.get().collection(collection.order_collection).findOne({ _id: ObjectId(orderId) })
                if (order.Orderdetails.PaymentMethod == 'Internet Banking' || order.Orderdetails.PaymentMethod == 'Wallet' || order.Orderdetails.PaymentMethod == 'Paypal') {

                    let productcount = order.Orderdetails.product.length
                    let couponAmount = parseInt(order.Orderdetails.couponDiscount)
                    let singleCoupon
                    let walletAmount
                    if (couponAmount === 'NaN') {
                        singleCoupon = Math.ceil(couponAmount / productcount)
                        walletAmount = refundAmount - singleCoupon
                    } else {

                        walletAmount = refundAmount
                    }
                    console.log("singlecoup[on", singleCoupon);
                    console.log("refund product order", order);
                    console.log("number of products", productcount);
                    console.log("coupon Amount", couponAmount);
                    let isWallet = await db.get().collection(collection.Wallet_collection).findOne({ user: ObjectId(userId) })
                    console.log("Wallet damount", walletAmount);
                    let TotalAmounts = walletAmount
                    if (isWallet) {
                        let amount = walletAmount
                        console.log(amount);
                        let total = isWallet.TotalAmount
                        let TotalAmountse = total + amount
                        console.log(TotalAmountse);
                        console.log("wallet updated", isWallet);
                        let wallet = {
                            Amount: walletAmount,
                            date: new Date(),
                            cause: "Order cancelled"

                        }
                        console.log("hu hu kannapi 1", wallet);
                        db.get().collection(collection.Wallet_collection).updateOne({ user: ObjectId(userId) }, { $push: { wallettarnsactions: wallet } }).then(() => {
                            db.get().collection(collection.Wallet_collection).updateOne({ user: ObjectId(userId) }, { $set: { TotalAmount: TotalAmountse } })
                        })

                    } else {
                        console.log("wallet inserted");
                        let wallet = {
                            Amount: walletAmount,
                            date: new Date(),
                            cause: "Order cancelled"

                        }

                        obj = {
                            user: ObjectId(userId),
                            wallettarnsactions: [wallet],
                            TotalAmount: TotalAmounts

                        }
                        console.log("hu hu kannapi", obj);

                        db.get().collection(collection.Wallet_collection).insertOne(obj).then(() => {
                            resolve(true)
                        })
                    }


                } else {
                    resolve(true)
                }
            })
        }
        )
    },
    myWallet: (userId) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.Wallet_collection).findOne({ user: ObjectId(userId) }).then((data) => {


                // let wallet= data.wallettarnsactions
                // let total
                // for (let index = 0; index < wallet.length; index++) {
                //     const element = wallet[index];
                //     total +=  element.Amount
                // }

                console.log("walettttttt ssanmnmmmn 222222222", data);
                resolve(data)

            })
        })
    },
    applycoupon: (userId, coupon) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Coupon_collection).findOne({ Couponname: coupon }).then((data) => {
                resolve(data)
            })
        })
    },
    cartcount: (userid) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.cart_collection).findOne({ user: ObjectId(userid) })
            let count = 0
            if (cart) {
                count = cart.products.length

            }

            resolve(count)
        })
    },
    wishcount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.wish_list_collection).findOne({ user: ObjectId(userId) })


            let count = 0
            if (wishlist) {
                let s = wishlist.products
                count = s.length
            }
            console.log(count);
            resolve(count)
        })
    },
    ordercount: (userID) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.order_collection).findOne({ userId: ObjectId(userID) })
            console.log("ttttttttttttttttttttttt");
            //  console.log(orders);
            let count = 0
            if (orders) {
                count = orders.length
            }
            console.log(count);
            resolve(count)
        })
    },
    insertAddress: (userId, addressdetails) => {

        console.log("useraaaddresssss", addressdetails);
        return new Promise(async (resolve, reject) => {
            let isaddress = await db.get().collection(collection.user_address_collection).findOne({ user: ObjectId(userId) })


            if (isaddress) {
                db.get().collection(collection.user_address_collection).updateOne({ user: ObjectId(userId) }, { $push: { address: addressdetails } }).then(() => {
                    resolve(true)
                })


            }

            else {
                let addObj = {
                    user: ObjectId(userId),
                    address: [addressdetails]
                }
                db.get().collection(collection.user_address_collection).insertOne(addObj).then(() => {
                    resolve(true)
                })
            }





        })
    },
    findAddress: (AddressId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.user_address_collection).findOne({ user: ObjectId(AddressId) }).then((data) => {
                console.log("addresss find all", data);
                resolve(data)
            })
        })
    },
    fetchAddress: (AddressId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.user_address_collection).aggregate([
                {
                    $match: { user: ObjectId(userId) }

                },
                {
                    $unwind: "$address"
                },
                {
                    $match: { "address.Addid": ObjectId(AddressId) }
                }

            ]).toArray().then((data) => {
                console.log("unwind datat here");
                console.log(data);
                resolve(data)
            })
        })
    },
    useraddressAll: (userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.user_address_collection).find({ user: ObjectId(userId) }).toArray().then((data) => {
                console.log("useraddress", data);
                resolve(data)
            })
        })
    },
    getaddress: (addresId, userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.user_address_collection).aggregate([
                {
                    $match: { user: ObjectId(userId) }

                },
                {
                    $unwind: "$address"
                },
                {
                    $match: { "address.Addid": ObjectId(addresId) }
                }
            ]).toArray().then((data) => {

                resolve(data)
            })
        })
    },
    updateuserAddress: (matchid, userId, details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.user_address_collection).updateOne({ 'address.Addid': ObjectId(matchid) }, {
                $set: {
                    'address.$.name': details.name,
                    'address.$.email': details.email,
                    'address.$.Mobilenumber': details.Mobilenumber,
                    'address.$.deliveryaddress': details.deliveryaddress,
                    'address.$.city': details.city,
                    'address.$.state': details.state,
                    'address.$.zipCode': details.zipCode
                }
            }).then(() => {
                resolve(true)
            })
        })
    },
    // await db.get().collection(collection.cart_collection).aggregate([
    //     {
    //         $match: { user: ObjectId(userId) }
    //     }, {
    //         $unwind: '$products'
    //     }, {
    //         $project: {
    //             item: '$products.item',
    //             stock: '$products.stock'
    //         }
    //     }, {

    //         $lookup: {
    //             from: collection.Product_collection,
    //             localField: 'item',
    //             foreignField: '_id',
    //             as: 'product'
    //         }
    //     },
    //     {
    //         $project: {
    //             item: 1, stock: 1, product: '$product'
    //         }
    //     }

    // ]),
    Razorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var amount1 = parseInt(total)
            var options = {
                amount: amount1 * 100,
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                console.log("order", order);
                resolve(order)
            })
        })
    },
    verifypayment: (verify) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'xCHD6JGTFt5S7b5eKOPfTdTu')
            hmac.update(verify['response[razorpay_order_id]'] + '|' + verify['response[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            console.log(hmac == verify['response[razorpay_signature]']);
            console.log(hmac);
            console.log(verify['response[razorpay_signature]']);
            if (hmac == verify['response[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changepaymentStatus: (orderId, status) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.order_collection).updateOne({ _id: ObjectId(orderId) }, { $set: { 'Orderdetails.DeliveryStatus': status } }).then(() => {
                resolve(true)

            })
        })
    },
    OfferPro: (() => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.Product_collection).find().toArray().then((data) => {

                resolve(data)
            })
        })
    })

}