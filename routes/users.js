var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient
var bcrypt = require('bcrypt');
const session = require('express-session')
const userHelpers = require('../helpers/user-helpers');
var adminHelpers = require('../helpers/admin-Helpers');
const { response } = require('express');
const { TaskRouterGrant } = require('twilio/lib/jwt/AccessToken');
const { ObjectId } = require('mongodb');
const { Razorpay } = require('../helpers/user-helpers');

const paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AYxZk5qW-6hJPEmV6RV6oYQq9ON_0ON4nXEHVBHZinaK6IyyJxQAsAk1P2Scemqqv9vDYwIN6higQTgT',
  'client_secret': 'EC6c4zjyWB9XQ03bjykNqmEQl3fQAPW3Dl_zlDHZAb3svP0mLoNWedQKCZkIT7dLdVB_ulyasVHzDm60'
});
/* GET users listing. */

/* ===sesssion checking Middleware start======*/
const checksession = (req, res, next) => {
  if (req.session.loggedIn && req.session.user) {
    userHelpers.stockvalid()
  }
  else {
    res.render('user/userLogin', { title: 'Express' });
  }
  next()
}

/* ===sesssion checking Middleware end======*/



/*=======root router start==========*/
router.get('/', function (req, res, next) {

  if (req.session.loggedIn && req.session.user) {

    res.redirect('/Home')
  }
  else {
    let invalid = true
    res.render('user/userLogin', { title: 'Express', invalid });
  }
});
router.post('/userotp', function (req, res) {
  console.log("heloooooo otp");
  req.session.otpnumber = req.body.clientNumber
  userHelpers.getotp(req.body.clientNumber).then((number) => {
    let userotp = true
    let showdiv = true

    res.render('user/otp', { number, userotp, showdiv })
  })

})
router.get('/otplogin', function (req, res) {
  let userotp = true
  res.render('user/UserotpLogin', { userotp })
})
router.post('/otplogin', function (req, res) {
  let userotp = true
  res.render('user/UserotpLogin', { userotp })
})
router.get('/resetPass', function (req, res) {
  res.render('user/resetpass', { userotp: true })
})
router.post('/usersendotpverify', function (req, res) {
  req.session.otpnumber = req.body.clientNumber
  userHelpers.getotp(req.body.clientNumber).then((number) => {
    let userotp = true
    let showdiv = true
    res.render('user/resetverify', { number, userotp, showdiv })
  })

})
router.post('/userresetotpverify', function (req, res) {
  console.log("user verify");

  userHelpers.verifyotp(req.body.ver, req.body.verify).then((l) => {
    console.log("userverify name", l.to);

    if (l.valid) {
      res.render('user/userresetpassword')
      // alert("login success")

    } else {

      let userotp = l.valid
      console.log("resend number", req.session.otpnumber);
      let number = req.session.otpnumber
      res.render('user/UserotpLogin', { userotp, number })
    }
  })

})
router.post('/resetpassword', function (req, res) {
  console.log("new password", req.body);
  userHelpers.resetpass(req.body).then((data) => {
    let invalid = true
    res.render('user/userLogin', { invalid })
  })
})
/*=======root router End==========*/

// ======================================= User Home Router Section Start============================================
router.get('/Home', async function (req, res) {
  if (req.session.loggedIn && req.session.user) {
    userHelpers.stockvalid()


    userHelpers.cartcount(req.session.user).then((cartcounts) => {
      adminHelpers.getCat().then((categories) => {
        adminHelpers.getbrand().then((brands) => {
          userHelpers.getbanner().then(async (bannerdata) => {

            for (let catNo in categories) {
              categories[catNo]["brands"] = brands.filter((brand) => brand.category == categories[catNo]._id)
            }
            user = req.session.userName
            let userstatus = (req.session.loggedIn)
            console.log(categories)
            await userHelpers.OfferPro().then((allpro) => {


              res.render('user/NevKartuser', { categories, brands, cartcounts, user, bannerdata, allpro, userstatus })
            })
          })




        })

      })
    })
  } else {
    let invalid = true
    res.render('user/userLogin', { invalid });

  }

})

// ======================================= User Home Router Section End============================================


// =============User verify section start==========
router.post('/userotpverify', function (req, res) {
  console.log("user verify");

  userHelpers.verifyotp(req.body.ver, req.body.verify).then((l) => {
    console.log("userverify name", l.to);

    if (l.valid) {
      userHelpers.stockvalid()
      // alert("login success")
      userHelpers.userfind(l.to).then((data) => {
        userId = data._id
        usernamed = data.userName
        req.session.loggedIn = true;
        req.session.user = userId
        req.session.username = usernamed
        userHelpers.cartcount(req.session.user).then((cartcounts) => {
          console.log("carrrrrcount us ")
          console.log(cartcounts)
          adminHelpers.getCat().then((categories) => {
            adminHelpers.getbrand().then(async (brands) => {
              userHelpers.getbanner().then(async (bannerdata) => {
                for (let catNo in categories) {
                  categories[catNo]["brands"] = brands.filter((brand) => brand.category == categories[catNo]._id)
                }
                console.log(categories)
                let user = (req.session.username);
                await userHelpers.OfferPro().then((allpro) => {
                  let userstatus = (req.session.loggedIn)
                  res.render('user/NevKartuser', { bannerdata, categories, brands, cartcounts, user, allpro, userstatus })
                })

              })


            })

          })
        })
      })

    } else {

      let userotp = l.valid
      console.log("resend number", req.session.otpnumber);
      let number = req.session.otpnumber
      res.render('user/UserotpLogin', { userotp, number })
    }
  })

})
router.post('/userLogin', function (req, res) {

  userHelpers.stockvalid()
  userHelpers.userCheck(req.body).then((data) => {
    console.log("session data it is ");
    console.log(data.dataa);
    if (data.status) {
      req.session.loggedIn = true;
      req.session.user = true
      req.session.user = data.dataa._id
      req.session.username = data.dataa.userName
      userHelpers.cartcount(req.session.user).then((cartcounts) => {
        console.log("carrrrrcount us ")
        console.log(cartcounts)
        adminHelpers.getCat().then((categories) => {
          adminHelpers.getbrand().then((brands) => {
            userHelpers.getbanner().then(async (bannerdata) => {

              console.log("cat here 23232323232", categories);
              for (let catNo in categories) {
                categories[catNo]["brands"] = brands.filter((brand) => brand.category == categories[catNo]._id)
              }
              console.log(categories)
              let user = (req.session.username);
              let userstatus = (req.session.loggedIn)
              await userHelpers.OfferPro().then((allpro) => {


                res.render('user/NevKartuser', { bannerdata, categories, brands, cartcounts, user, userstatus, allpro })
              })
            })


          })

        })
      })





    }
    else {

      let invalid = data.status
      console.log("invalid", invalid);
      res.render('user/userLogin', invalid)
    }

  })
})
// =============User verify section End==========


// ==================User Reg Section start====================

router.get('/accountreg', function (req, res) {
  let invalid = true
  res.render('user/userLogin', { title: 'Express', invalid });

})
router.get('/register', function (req, res) {
  res.render('user/userReg')
})
router.post('/userReg', (req, res) => {
  if (req.session.loggedIn) {

    res.render('user/NevKartuser')
  }
  else {
    userHelpers.doSignup(req.body)
    let invalid = true
    res.render('user/userLogin', { invalid })
  }

})
// ==================User Reg Section End====================




// ==================Logout Section start===============================

router.post('/logout', (req, res) => {
  console.log("here logout mplease");
  req.session.user = false
  req.session.destroy();
  res.set('Clear-Site-Data:"cookies","storage","executionContexts"');
  let invalid = true
  res.render('user/userLogin', { invalid })
})
// ==================Logout Section End===============================


//===========================view all products page start=====================
router.get('/getpro/:pg', checksession, async function (req, res) {
  userHelpers.stockvalid()
  console.log(req.params.id, req.params.pg, "-----------------------------")
  await userHelpers.cartcount(req.session.user).then((cartcounts) => {


    userHelpers.getAllproduct(req.params.pg).then(([products, All]) => {

      console.log("Alllll", All.length);
      let g = (All.length / 2)
      let pagNo = []
      for (let index = 1; index <= g; index++) {
        pagNo.push(index);

      }
      console.log(pagNo);





      adminHelpers.getCat().then((categories) => {
        adminHelpers.getbrand().then((brands) => {
          // console.log("bras");
          // console.log(brands);
          for (let catNo in categories) {
            categories[catNo]["brands"] = brands.filter((brand) => brand.category == categories[catNo]._id)
          }
          console.log("products here33", products)
          // if(products.product.discprice!==0){
          //   isDisc =true
          // }
          // else{
          //   isDisc=false
          // }
          // console.log(isDisc);
          let userstatus = (req.session.loggedIn)
          res.render('user/view-products', { categories, brands, products, userstatus, cartcounts, page: pagNo })

        })

      })

    })

  })
})
// =========================================All products End====================================================================


//=======================================================filter products start=============================================
router.get('/getpro/:id/:pg', async function (req, res) {

  console.log(req.params.id, req.params.pg, "-----------------------------")
  await userHelpers.cartcount(req.session.user).then((cartcounts) => {


    userHelpers.getproduct(req.params.id, req.params.pg).then((products) => {



      adminHelpers.getCat().then((categories) => {
        adminHelpers.getbrand().then((brands) => {
          // console.log("bras");
          for (let catNo in categories) {
            categories[catNo]["brands"] = brands.filter((brand) => brand.category == categories[catNo]._id)
          }

          console.log("sikkumukku", products)


          // if(products.product.discprice!==0){
          //   isDisc =true
          // }
          // else{
          //   isDisc=false
          // }
          // console.log(isDisc);
          res.render('user/view-products', { categories, brands, products, cartcounts });
          //  res.redirect('/getpro')

        })

      })

    })

  })
})
//=======================================================filter products End=============================================

// ================================================product details  view=================================================================
router.get('/productview/:id', function (req, res) {
  userHelpers.stockvalid()
  userHelpers.cartcount(req.session.user).then(async (cartcounts) => {
    await userHelpers.getproducts(req.params.id).then((product) => {
      console.log("productview data");
      console.log(product)

      res.render('user/productview', { product, cartcounts })
    })

  })


})
// ================================================roduct details  End=================================================================



// ======================================Cart product count start============================================================

router.post('/cartcount/', function (req, res) {
  userHelpers.stockvalid()
  userHelpers.cartproductcount(req.body).then((data) => {
    res.json(data)

    // render('user/Usercart')
  })
})
// ======================================Cart product count End============================================================





// ==============================Add to cart start=======================================================
router.get('/Addtocart/:id', function (req, res) {

  userHelpers.addtocart(req.params.id, req.session.user).then((cartdata) => {
    console.log("cart data is jher");
    console.log(cartdata);
    res.json({ status: true })

  })
})
// ==============================Add to cart End=======================================================







// ========================== cart product delete start=============================================

router.post('/cartproductdelete/', function (req, res) {
  userHelpers.deletecartpro(req.body).then(() => {
    res.render('user/usercart', { order: true })

  })
})
// ========================== cart product delete End=============================================



// ============================ Cart product total calculation start==============================================

router.get('/userkart', checksession, async function (req, res) {

  await userHelpers.cartcount(req.session.user).then(async (cartcounts) => {
    let cartproducts = await userHelpers.getcart(req.session.user)
    // console.log("*******", cartproducts[0].product.product);
    let total = 0


    for (let index = 0; index < cartproducts.length; index++) {
      const element = cartproducts[index];


      if (element.product.product.discprice) {
        element.product.cartprice = element.stock * element.product.product.discprice
        total += element.stock * element.product.product.discprice
      } else {
        element.product.cartprice = element.stock * element.product.product.discprice
        total += element.stock * element.product.product.price

      }
    }
    let cartpro = (cartproducts);
    let order = true
    if (cartcounts == 0) {
      order = false

    } else {
      order = true

    }
    let user = (req.session.username);
    let userstatus = (req.session.loggedIn)
    console.log("Cartpor", cartpro);
    userHelpers.stockvalid()
    res.render('user/Usercart', { cartpro, user, cartcounts, userstatus, total, order, })

  })

})
// ============================ Cart product total calculation End==============================================



// ====================================wishList section start ==========================================================
router.get('/Addtocartwish/:id', function (req, res) {
  // console.log("this is params id dude");
  // console.log(req.params.id);
  userHelpers.addtocart(req.params.id, req.session.user).then((cartdata) => {
    console.log("cart data is jher");
    console.log(cartdata);
    res.redirect('/getwishlist')

  })
})
router.get('/wishlist/:id', checksession, function (req, res) {

  console.log("wishlist params", req.params.id);
  userHelpers.cartcount(req.session.user).then((cartcounts) => {
    userHelpers.Addwishlist(req.params.id, req.session.user).then((wishlistdata) => {
      console.log("cartcounts===========", cartcounts);
      let userstatus = (req.session.loggedIn)
      res.render('user/Userwishlist', { cartcounts, userstatus })
    })
  })


})
router.get('/getwishlist', checksession, function (req, res) {
  userHelpers.cartcount(req.session.user).then(async (cartcounts) => {
    let wishlistdata = await userHelpers.getwishlist(req.session.user)
    console.log("wishlistdata is her", wishlistdata);
    let userstatus = (req.session.loggedIn)
    res.render('user/Userwishlist', { wishlistdata, cartcounts, userstatus })
  })




})
router.post('/wishdelete', function (req, res) {
  console.log("here wish feletee");
  userHelpers.delewishlist(req.body, req.session.user).then(() => {
    res.json({ delete: true })

  })
})
// ====================================wishList section End ==========================================================



// =================================Payment Page section start========================================================
router.post('/payment', checksession, async function (req, res) {
  console.log(req.query.Iswallet);
  console.log("body payement", req.body);
  let cartproducts = await userHelpers.getcart(req.session.user)
  userHelpers.reduceStock(req.body.proId, req.body.quandity, req.session.user)

  await userHelpers.findAddress(req.session.user).then((userdata) => {

    let total = 0

    for (let index = 0; index < cartproducts.length; index++) {
      const element = cartproducts[index];
      if (element.product.product.discprice) {
        total += element.stock * element.product.product.discprice

      } else {

        total += element.stock * element.product.product.price
      }
    }
    //  let datas=(userdata[0]);


    userHelpers.stockvalid()
    let userd = userdata ? userdata.address : []

    userHelpers.walletCheck(req.session.user).then((wallet) => {
      let Iswallet
      if (wallet) {

        let walletAmount = wallet.TotalAmount
        console.log(walletAmount);
        console.log("total totalee", total);
        if (walletAmount > total) {
          Iswallet = true
        } else {
          Iswallet = false
        }
        console.log(Iswallet);
        let userstatus = (req.session.loggedIn)

        res.render('user/paymentForm', { total, cartproducts, userd, Iswallet, userstatus })
      } else {
        let userstatus = (req.session.loggedIn)
        Iswallet = false
        res.render('user/paymentForm', { total, cartproducts, userd, Iswallet, userstatus })
      }
    })
  })

})
// =================================Payment Page section End===========================================================




// ====================================Bill Payment Section Start=======================================================
router.post('/paymentdone', async function (req, res) {
  console.log("77777777777777777", req.body);
  userHelpers.stockvalid()
  let payable = parseInt(req.body.totalprice)

  let paypalAmount = Math.ceil(payable / 80)

  let addid = (req.body.flexRadioDefault)
  userHelpers.delivery(req.body, req.session.user).then((orderId) => {
    if (req.body.paymentType == 'Cash On Delivery') {
      req.session.order = true
      res.json({ codstatus: true })
    } else if (req.body.paymentType == 'Internet Banking') {
      console.log("internet banking razor");

      let status = 'Pending'
      userHelpers.changepaymentStatus(orderId, status)
      userHelpers.Razorpay(orderId, req.body.totalprice).then((data) => {
        res.json({ status: true, order: data })
      })

    } else if (req.body.paymentType == 'Paypal') {

      console.log("stage 1", paypalAmount);
      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3001/success",
          "cancel_url": "http://localhost:3001/cancel"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": "NevkART",
              "sku": "001",
              "price": paypalAmount,
              "currency": "USD",
              "quantity": 1,
            }]
          },
          "amount": {
            "currency": "USD",
            "total": paypalAmount
          },
          "description": "Hat for the best team ever"
        }]
      };

      let status = 'Pending'
      userHelpers.changepaymentStatus(orderId, status)
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              console.log(payment.links[i].href)
              res.json({ paypalstatus: true, link: payment.links[i].href })

            }
          }
        }
      });



      console.log("stage 5", paypalAmount);
      router.get('/success', (req, res) => {
        const payerId = req.query.PayerID;
        const paymentId = req.query.paymentId;
        console.log("stage 6", paypalAmount);
        const execute_payment_json = {
          "payer_id": payerId,
          "transactions": [{
            "amount": {
              "currency": "USD",
              "total": paypalAmount
            }
          }]

        };

        res.render('user/Ordersuccess')
        let status = 'Payment Succesfully'
        userHelpers.changepaymentStatus(orderId, status)
        userHelpers.deleteAllcart(req.session.user)



        console.log("stage 4", paypalAmount);
      });



      router.get('/cancel', (req, res) => res.render('user/PaymentFailed'));

    }
    else {
      req.session.order = true
      let status = 'Payment Succesfully'
      userHelpers.changepaymentStatus(orderId, status)
      userHelpers.walletdeduct(req.body, req.session.user)
      ///userHelpers.updateStock()
      res.json({ codstatus: true })

    }

  })



})
// ====================================Bill Payment Section End=======================================================





// ========================================Verfiy Internet Banking Start======================================================
router.post('/verifypayment', function (req, res) {
  console.log("klo7", req.body);
  userHelpers.verifypayment(req.body).then(() => {
    console.log("order recipet");
    console.log(req.body['resp[order][receipt]']);
    let status = 'Payment Succesfully'
    userHelpers.changepaymentStatus(req.body['resp[order][receipt]'], status).then(() => {
      console.log('payment successfull');

      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false })
  })

}
)
// ========================================Verfiy Internet Banking End======================================================






// ==============================================Order Confirmed/verification complete section start =================================================
router.get('/Orderconfirmed', checksession, function (req, res) {
  userHelpers.stockvalid()
  if (req.session.order) {
    userHelpers.deleteAllcart(req.session.user).then(() => {

      req.session.order = false


      res.render('user/Ordersuccess')
    })

  }
  else {
    res.render('user/Nevkartuser')
  }

})

router.get('/orderdone', function (req, res) {
  userHelpers.deleteAllcart(req.session.user).then(() => {

    req.session.order = false


    res.render('user/Ordersuccess')
  })
})
// ==============================================Order Confirmed/verification complete section End =================================================




// ========================================== User Address Action section start==========================================================
router.get('/updateaddress/:id', function (req, res) {
  userHelpers.getaddress(req.params.id, req.session.user).then((updateaddress) => {
    console.log("userOne Dresss find aducgeeee", updateaddress);
    res.render('user/userUpdateform', { updateaddress })
  })

}
)
router.get('/deleteAddress/:id', function (req, res) {
  userHelpers.deleteaddress(req.params.id, req.session.user).then(() => {
    res.redirect('/showadd')
  })
})
router.post("/addressupdate/:id", function (req, res) {

  userHelpers.updateuserAddress(req.params.id, req.session.user, req.body).then(() => {
    userHelpers.useraddressAll(req.session.user).then((data) => {

      let addressAll = data[0].address
      console.log("addressAll addressAll", addressAll);
      res.render('user/userShowAddress', { addressAll })

    })
  })
})


router.get('/showadd', function (req, res) {
  userHelpers.useraddressAll(req.session.user).then((data) => {
    console.log("jqjqjqjqjqj", data[0]);
    let addressAll = data[0].address
    console.log("addressAll addressAll", addressAll);
    res.render('user/userShowAddress', { addressAll })

  })
})

router.post('/saveaddress', function (req, res) {
  console.log("ajax");
  console.log(req.body)
  const Obj = {
    Addid: new ObjectId(),
    name: req.body.name,
    email: req.body.email,
    Mobilenumber: req.body.Mobilenumber,
    deliveryaddress: req.body.deliveryaddress,
    city: req.body.city,
    state: req.body.state,
    zipCode: req.body.zipCode
  }
  userHelpers.insertAddress(req.session.user, Obj).then(() => {
    userHelpers.walletCheck(req.session.user).then((wallet) => {
      let walletAmount = wallet.TotalAmount
      console.log(walletAmount);
      let Iswalleted
      if (walletAmount > 5000) {
        Iswalleted = true
      } else {
        Iswalleted = false
      }
      console.log(Iswalleted);
      res.json({ status: true, Iswallet: Iswalleted })
      // res.render('user/paymentForm', Iswallet)
    })

  })
})
// ========================================== User Address Action section End==========================================================





// =========================================User Order actions start=================================================================
function getOrderList(req, res, userId, orderId = null) {
  userHelpers.cartcount(userId).then((cartcounts) => {
    userHelpers.orderstatus(userId).then((orderDetailses) => {
      let orderDetails = orderDetailses.filter((data) => data.Orderdetails.DeliveryStatus !== 'Pending')
      console.log("pendinf filtered", orderDetails);
      let j = orderDetailses[orderDetailses.length - 1]
      if (orderId) {
        j = orderDetailses.filter((order) => order._id.toString() === orderId)[0]
      }
      console.log("jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj", j)

      // let Stock = j.Orderdetails.product
      let product = j.Orderdetails.product
      let addressdatas = j.Orderdetails.address
      let oid = j._id

      console.log("thisis j");
      console.log(j);
      console.log("33333333333333333333333333333333333333");
      console.log(orderDetailses)
      let pro = j.Orderdetails.product[0]

      // flexRadioDefault
      // // console.log(orderDetails[0].Orderdetails); 
      // let addressfind=orderDetails[0].Orderdetails
      // console.log(addressfind.address.flexRadioDefault)
      let s
      //  let status=
      //  if(toString(orderDetails[0].DeliveryStatus)==="Order cancelled by user"){
      //   s=trueOrderstatus
      //  }else{
      //   s=false
      //  }
      let delivered

      if (j.Orderdetails.DeliveryStatus == "Order Delivered") {
        delivered = true
      } else {
        delivered = false
      }
      let name = req.session.username
      // console.log("STOCK!")
      // console.dir(Stock)
      // console.log("PRODUCT!")
      // console.dir(product)
      console.log({ delivered });

      let userstatus = (req.session.loggedIn)
      res.render('user/Orderstatus', { j, delivered, orderDetails, product, userstatus, addressdatas, Orderedlist: true, d: s, cartcounts, pro, name, orderId: oid })


    })
  })
}
router.get('/Orderlist', function (req, res) {
  getOrderList(req, res, req.session.user)
})
router.get('/Orderlist/:id', function (req, res) {
  console.log(", req.session.user, , req.session.user, , req.session.user, , req.session.user, ", req.session.user)
  getOrderList(req, res, req.session.user, req.params.id)
})
router.post('/Orderstatus', function (req, res) {
  let status
  if (req.body.return == 'done') {
    status = "Order returned by user"
  } else {

    status = "Order cancelled by user"

  }
  console.log("req body", req.body);
  userHelpers.orderUp(req.body.stock, req.body.OrderId, req.body.proId, status, req.session.user, req.body.stock).then(() => {

    res.redirect('/Orderlist/' + req.body.OrderId)
  })
})
router.post('/Orderstatuses', function (req, res) {
  let status = "Order returned by user"
  console.log("req body of return", req.body);
  userHelpers.orderUp(req.body.OrderId, req.body.proId, status).then(() => {

    res.redirect('/Orderlist/' + req.body.OrderId)
  })
})


router.get('/userpro', checksession, async function (req, res) {
  await userHelpers.cartcount(req.session.user).then((cart) => {
    userHelpers.wishcount(req.session.user).then((wishlist) => {
      userHelpers.ordercount(req.session.user).then((orders) => {
        let user = req.session.username
        console.log("cartData", cart);
        console.log("wishlist", wishlist);
        console.log("orderdata", orders);
        res.render('user/userProfile', { cart, wishlist, orders, user })
      })
    })
  })

})
// =========================================User Order actions End=================================================================




// =================================user Coupon sections start===================================================================
router.post("/coupon", function (req, res) {
  userHelpers.applycoupon(req.session.user, req.body.couponName).then(async (data) => {
    console.log("coupon.................. data", req.body.couponName);
    console.log("price.................. data", req.body);
    let cartproducts = await userHelpers.getcart(req.session.user)

    let coupon = req.body.couponName
    await userHelpers.findAddress(req.session.user).then(async (userdata) => {

      let total = 0
      for (let index = 0; index < cartproducts.length; index++) {
        const element = cartproducts[index];

        if (element.product.product.discprice) {
          total += element.stock * element.product.product.discprice

        } else {

          total += element.stock * element.product.product.price
        }
      }
      //  let datas=(userdata[0]);
      let discount = parseFloat(data.Discount) / 100.0 * total
      let newPrice = total - discount


      let userd = userdata ? userdata.address : []
      console.log("Oldtotal", total);
      userHelpers.walletCheck(req.session.user).then((wallet) => {
        console.log(wallet);


        if (wallet === null) {
          walletAmount = 0

        } else {

          walletAmount = wallet.TotalAmount
        }
        console.log(walletAmount);
        let Iswallet
        if (walletAmount > 5000) {
          Iswallet = true
        } else {
          Iswallet = false
        }
        console.log(Iswallet);

        res.render('user/paymentForm', { discount, newPrice, total, cartproducts, userd, coupon, Iswallet })
      })

    })
  }).catch(async (err) => {
    console.log("coupon.................. error", err, req.session.user, req.body.couponName);
    let cartproducts = await userHelpers.getcart(req.session.user)


    await userHelpers.findAddress(req.session.user).then((userdata) => {

      let total = 0
      for (let index = 0; index < cartproducts.length; index++) {
        const element = cartproducts[index];
        if (element.product.product.discprice) {
          total += element.stock * element.product.product.discprice

        } else {

          total += element.stock * element.product.product.price
        }
      }
      //  let datas=(userdata[0]);


      let userd = userdata ? userdata.address : []
      console.log(userd);
      userHelpers.walletCheck(req.session.user).then((wallet) => {
        let walletAmount = wallet.TotalAmount
        console.log(walletAmount);
        let Iswallet
        if (walletAmount > 5000) {
          Iswallet = true
        } else {
          Iswallet = false
        }
        console.log(Iswallet);

        res.render('user/paymentForm', { couponerror: "coupon not valid", total, cartproducts, userd, Iswallet })
      })

    })
  })
})
router.get('/removecoupon', function (req, res) {
  userHelpers.applycoupon(req.session.user, req.body.couponName).then(async (data) => {
    console.log("coupon.................. data", req.body.couponName);
    let cartproducts = await userHelpers.getcart(req.session.user)

    let coupon = req.body.couponName
    await userHelpers.findAddress(req.session.user).then((userdata) => {

      let total = 0
      for (let index = 0; index < cartproducts.length; index++) {
        const element = cartproducts[index];
        if (element.product.product.discprice) {
          total += element.stock * element.product.product.discprice

        } else {

          total += element.stock * element.product.product.price
        }
      }
      //  let datas=(userdata[0]);
      let discount = parseFloat(data.Discount) / 100.0 * total
      let newPrice = total - discount


      let userd = userdata ? userdata.address : []
      console.log(coupon);
      userHelpers.walletCheck(req.session.user).then((wallet) => {
        let walletAmount = wallet.TotalAmount
        console.log(walletAmount);
        let Iswallet
        if (walletAmount > 5000) {
          Iswallet = true
        } else {
          Iswallet = false
        }
        console.log(Iswallet);

        res.render('user/paymentForm', { discount, newPrice, total, cartproducts, userd, coupon, Iswallet })
      })

    })
  }).catch(async (err) => {
    console.log("coupon.................. error", err, req.session.user, req.body.couponName);
    let cartproducts = await userHelpers.getcart(req.session.user)


    await userHelpers.findAddress(req.session.user).then((userdata) => {

      let total = 0
      for (let index = 0; index < cartproducts.length; index++) {
        const element = cartproducts[index];
        if (element.product.product.discprice) {
          total += element.stock * element.product.product.discprice

        } else {

          total += element.stock * element.product.product.price
        }
      }
      //  let datas=(userdata[0]);


      let userd = userdata ? userdata.address : []
      console.log(userd);
      userHelpers.walletCheck(req.session.user).then((wallet) => {
        let walletAmount = wallet.TotalAmount
        console.log(walletAmount);
        let Iswallet
        if (walletAmount > 5000) {
          Iswallet = true
        } else {
          Iswallet = false
        }
        console.log(Iswallet);

        res.render('user/paymentForm', { couponerror: "Coupon removed", total, cartproducts, userd, Iswallet })
      })

    })
  })
})
// =================================user Coupon sections end===================================================================



// ==========================================User Wallet section start==========================================================
router.get('/Wallet', checksession, function (req, res) {
  userHelpers.myWallet(req.session.user).then((walletdata) => {
    let user = req.session.username
    console.log({ walletdata, user });
    if (walletdata === null) {
      walletTrans = [0]
      walletdata = 0
      res.render('user/UserWallet', { walletdata, user, walletTrans })
    } else {

      let walletTrans = walletdata.wallettarnsactions

      res.render('user/UserWallet', { walletdata, user, walletTrans })
    }
  })
})

// ==========================================User Wallet section End==========================================================

module.exports = router;
