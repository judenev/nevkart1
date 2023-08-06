var express = require('express');
var router = express.Router();
const adminHelpers = require('../helpers/admin-Helpers');
const url = 'mongodb://localhost:27017'
const { GridFsStorage } = require('multer-gridfs-storage');
const path = require('path')
const multer = require('multer');
const { gfs } = require('../connection/connections');
const Grid = require('gridfs-stream');
const { log } = require('console');
const session = require('express-session');
const { resolve, join } = require('path');
const { paymentTypesale } = require('../helpers/admin-Helpers');
const userHelpers = require('../helpers/user-helpers');
const accountSID = "AC54fbbc7bc94b60cdd2a36eb85fab59e0"
const serviceSID = "VA048467ff548984373c0e303417a34c1b"
const authToken = "eb2db8f2cc009ba5ca93bdbdc54faa9f"
const adminotp = require('twilio')(accountSID, authToken)
const upload = multer({ dest: 'public/images/' });

const checksessionadmin = (req, res, next) => {
  if (req.session.adminloggedIn && req.session.admin) {
  }
  else {
   
    res.render('admin/adminLogin',)
  }
  next()
}


/* const storage = new GridFsStorage({ url,   file: (req, file) => {
    return new Promise((resolve, reject) => {
        const filename = file.originalname;
        const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
        };
        console.log("FILEINFO", fileInfo)
        resolve(fileInfo);
    });
} });

const upload = multer({ storage }); */



/* router.get('/image/:filename', async (req, res) => {
    // console.log(state)
  
    console.log(req.params.filename)
    const allfiles = await  gfs().collection('uploads').find().toArray()
    console.log("FILES AVAILABLE:",allfiles)
    gfs().collection('uploads').findOne({ filename: req.params.filename }, (err, file) => {
      // Check if file
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }
  
      // Check if image
      if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
        // Read output to browser
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
      } else {
        res.status(404).json({
          err: 'Not an image'
        });
      }
    });
  }); */

// ============================Home page start=======================================
router.get('/', function (req, res, next) {
  if (req.session.admin && req.session.adminloggedIn) {
    adminHelpers.paymentTypesale().then((paymentTypeReport) => {

      res.render('admin/adminHome', paymentTypeReport)
    })
  } else {
    let invalid=false

    res.render('admin/adminLogin',{invalid})
  }


});
router.get('/home', checksessionadmin, function (req, res) {
  adminHelpers.paymentTypesale().then((paymentTypeReport) => {

    adminHelpers.getmonthReport().then((sales) => {
      console.log("bsnner data", sales);

      res.render('admin/adminHome', { paymentTypeReport, sales })


    })


  })
})
router.post('/home', checksessionadmin, function (req, res) {
  adminHelpers.paymentTypesale().then((paymentTypeReport) => {

    adminHelpers.getmonthReport().then((sales) => {
      console.log("bsnner data", sales);

      res.render('admin/adminHome', { paymentTypeReport, sales })


    })


  })
})
// ============================Home page End=======================================


// ====================================Admin User/customer actions start=====================================
router.get('/adminUser', checksessionadmin, function (req, res) {
  adminHelpers.userlist().then((userlist) => {

    res.render('admin/adminUser', { userlist })
  })

})
router.post('/deleteuser/:id', function (req, res) {
  console.log("this delete" + (req.params.id));
  adminHelpers.deleteUser(req.params.id).then(() => {
    res.redirect('../adminUser')
  }
  )
})
router.post('/blockuser/:id', function (req, res) {
  adminHelpers.blockUser(req.params.id).then(() => {
    res.redirect('../adminUser')
  }
  )
})
router.post('/unblockuser/:id', function (req, res) {
  adminHelpers.unblockUser(req.params.id).then(() => {
    res.redirect('../adminUser')
  }
  )
})
// ====================================Admin User/customer actions End=====================================




// ====================================Admin Login/Logout and verification start==================================
router.post('/adminotp', function (req, res) {
  // console.log("adminotp");
  // console.log(req.body.clientNumber);
  adminHelpers.getotp(req.body.clientNumber).then((number) => {

    res.render('admin/adminLogin', { number,invalid:true })
  })

})
router.post('/adminotpverify', function (req, res) {
  console.log("admin verify");
  //  console.log(req.body.ver);
  //  console.log(req.body.verify);
  adminHelpers.verifyotp(req.body.ver, req.body.verify).then((l) => {
    console.log(l.valid);
    if (l.valid) {
      req.session.loggedIn = true;
      // alert("login success")
      adminHelpers.paymentTypesale().then((paymentTypeReport) => {
        adminHelpers.setmonthReport()
        adminHelpers.getmonthReport().then((sales) => {
          console.log("bsnner data", sales);
          req.session.loggedIn = true;
          res.render('admin/adminHome', { paymentTypeReport, sales })


        })


      })
    } else {
      res.redirect('/')
    }
  })

})
router.post('/adminlogin', function (req, res) {
  const dbemail = 'admin1@gmail.com'
  const dbpassword = 'admin1'

  var { email, password } = req.body
  if ((dbpassword === password) && (dbemail === email)) {
    req.session.admin = true
    adminHelpers.paymentTypesale().then((paymentTypeReport) => {
      adminHelpers.setmonthReport()
      adminHelpers.getmonthReport().then((sales) => {
        console.log("bsnner data", paymentTypeReport);
        req.session.adminloggedIn = true;
        res.render('admin/adminHome', { paymentTypeReport, sales })


      })


    })

  } else {
    
    res.render('admin/adminLogin',{invalid:false})
  }
})
router.post('/logouts', (req, res) => {
  console.log("here logout mplease");
  req.session.admin = false
  req.session.adminloggedIn = false
  req.session.destroy();
  res.set('Clear-Site-Data:"cookies","storage","executionContexts"');
  res.redirect('/admin')
})
// ====================================Admin Login and verification End==================================



// ===================================Admin Product Actions Start======================================
router.get('/addproduct', (req, res) => {
  adminHelpers.getCat().then((categories) => {
    console.log("cacatcat", categories);
    adminHelpers.getbrand().then((brand) => {
      adminHelpers.getmodel().then((model) => {
        res.render('admin/adminAddproducts', { categories, brand, model })
      })
    })

  })

})
router.post('/AddProduct', upload.fields([{ name: "image1", maxCount: 1 },
{ name: "image2", maxCount: 1 },
{ name: "image3", maxCount: 1 },
{ name: "image4", maxCount: 1 }]), function (req, res) {
  console.log("File is", req.files)
  console.log("525252525", req.body);
  console.log(req.body.proOffer);
  let file=req.files
  
  req.body.stockdata = parseInt(req.body.stockdata)
  adminHelpers.addproduct({ ...req.body, file }, req.body.category, req.body.proOffer)
  adminHelpers.paymentTypesale().then((paymentTypeReport) => {

    adminHelpers.getmonthReport().then((sales) => {
      console.log("bsnner data", sales);

      res.render('admin/adminHome', { paymentTypeReport, sales })


    })


  })
})
router.get('/products', checksessionadmin, function (req, res) {
  adminHelpers.productlist().then((products) => {

    //  console.log(products.length);
    console.log("pro", products);
    res.render('admin/adminproducts', { products })
  })

})
router.get('/productsOffers', checksessionadmin, function (req, res) {
  adminHelpers.productlist().then((products) => {
    //  console.log(products.length);
    console.log("productoffer", products);
    res.render('admin/adminProductOffers', { products })
  })

})
router.get('/delete/:id', function (req, res) {


  adminHelpers.deleteproduct(req.params.id).then(() => {

    res.redirect('/admin/products')
  })
})
router.get('/update/:id', function (req, res) {

  adminHelpers.showlist(req.params.id).then(([list, one]) => {
    adminHelpers.getCat().then((cat)=>{
      adminHelpers.getbrand().then((brand)=>{
        var d = req.params.id
        console.log("thi is list uupdate:");
        console.log(list);
    
        res.render('admin/adminEdit', {  list,  one, d ,cat,brand})
      })
    })
   

  })



})
router.post('/updatedata/:id',  upload.fields([{ name: "image1", maxCount: 1 },
{ name: "image2", maxCount: 1 },
{ name: "image3", maxCount: 1 },
{ name: "image4", maxCount: 1 }]), function (req, res) {
  if(Object.keys(req.files).length === 0){
    adminHelpers.profind(req.params.id).then((data)=>{
      console.log("edit find",data.product.file);
      adminHelpers.updateproduct(req.params.id, req.body.productname, req.body.category, req.body.brand, req.body.productstock,
        req.body.description, data.product.file).then((edited) => {
          res.redirect('/admin/products')
        })
    })

  }else{
    
  console.log("this is parmassss mass",req.body);

 
  console.log("!!!!!!!!!!!!!!!!!!!!!!! ", req.files)

  adminHelpers.updateproduct(req.params.id, req.body.productname, req.body.category, req.body.brand, req.body.productstock,
    req.body.description, req.files).then((edited) => {
      res.redirect('/admin/products')
    })

  }
  



})
router.post('/Instock/:id', function (req, res) {
  adminHelpers.Instock(req.params.id).then(() => {
    res.redirect('../products')
  })
})
router.post('/stock/:id', function (req, res) {
  adminHelpers.Outstock(req.params.id).then(() => {
    res.redirect('../products')
  })
})
router.post('/addproOffer/:id', function (req, res) {

  console.log(req.body, req.params.id);

  adminHelpers.AddproOffer(req.params.id, req.body.ProOffer).then((data) => {
    userHelpers.OfferPro()
    userHelpers.getAllproduct()
    res.redirect('../productsOffers')
  })

})
router.post('/delproOffer/:id', function (req, res) {
  userHelpers.getAllproduct()
  adminHelpers.AddproOffer(req.params.id, '0').then((data) => {
    res.redirect('../productsOffers')
  })
})
// ======================================Admin Product Actions End=========================================




// =======================================Admin category Actions start========================================
router.get('/addcat', checksessionadmin, function (req, res) {
  adminHelpers.getCat().then((categories) => {
    adminHelpers.getbrand().then((brand) => {
      adminHelpers.getmodel().then((model) => {
        res.render('admin/adminAddcategory', { categories, brand, model })
      })
    })

  })



})
router.post('/addcat', function (req, res) {
  adminHelpers.addCat(req.body).then(() => {
    adminHelpers.getCat().then((categories) => {
      adminHelpers.getbrand().then((brand) => {
        res.render('admin/adminAddcategory', { categories, brand })
      })
    })
  })
})
router.post('/catedelete/:id', function (req, res) {
  console.log("this is params id dude");
  console.log(req.params.id);
  adminHelpers.catdele(req.params.id).then((data) => {
    res.redirect('/admin')

  })
})
router.get('/showCat', function (req, res) {
  adminHelpers.catlist().then((catdata) => {
    res.render('admin/adminshowcat', { catdata })

  })
})
router.post('/ApplyOffer/:id', function (req, res) {
  console.log("duscc", req.body);
  adminHelpers.catOff(req.params.id, req.body.disc).then(() => {
    res.redirect('/showCat')
  })
})
router.post('/cartOfferdel/:id', checksessionadmin, function (req, res) {
  console.log("catOffer delete", req.params.id);
  const off = 0
  adminHelpers.catOff(req.params.id, off).then(() => {
    console.log("done cat delete");
    res.json({ status: true })
  })
})

// =======================================Admin category Actions End========================================


// ================================Admin Brands actions start===================================================
router.post('/addbrandname', function (req, res) {
  console.log("catefory body");
  console.log(req.body);
  adminHelpers.addbrand(req.body).then(() => {
    adminHelpers.getCat().then((categories) => {
      adminHelpers.getbrand().then((brand) => {
        res.render('admin/adminAddcategory', { categories, brand })
      })
    })

  })

})
// ================================Admin Brands actions End===================================================






// ==============================Admin Model actiond Start=====================================================
router.post('/addmodelname', function (req, res) {
  adminHelpers.addmodel(req.body)
  adminHelpers.paymentTypesale().then((paymentTypeReport) => {
    res.render('admin/adminHome', paymentTypeReport)
  })
})
// ==============================Admin Model actiond End=====================================================





// =========================================Admin Order Actions Start===============================================



function getOrderLists(req, res,p, orderId = null) {
  console.log("admin page",p);

  adminHelpers.Orderstatus(p).then(async(orderDetails) => {
  
    let j = orderDetails[0]
    if (orderId) {
      j = orderDetails.filter((order) => order._id.toString() === orderId)[0]
    }
    console.log("chikki",j)

    let Stock = j.Orderdetails.product
    let product = j.Orderdetails.product
    let addressdatas = j.Orderdetails.address
    let oid = j._id

    // console.log("thisis j");
    // console.log(j);
    // console.log(orderDetails)
    let pro = j.Orderdetails.product[0]
      
    console.log("33333333333333333333333333333333333333",j.Orderdetails.product.length,j._id);
    orderDetails.map((item)=>{
      let cancelCount=0
       item.Orderdetails.product.map((elem)=>{
        console.log(elem);
    
        if(elem.status=='Order cancelled by user'){
     
          cancelCount++
        }
         if(item.Orderdetails.product.length===cancelCount){

    console.log("kakakr",item._id);
    adminHelpers.userAllorderCancel(item._id)
    }
        console.log("coij",cancelCount);
      })
      cancelCount=0
      })
     


    // flexRadioDefault
    // // console.log(orderDetails[0].Orderdetails); 
    // let addressfind=orderDetails[0].Orderdetails
    // console.log(addressfind.address.flexRadioDefault)
    let s
    //  let status=
    //  if(toString(orderDetails[0].DeliveryStatus)==="Order cancelled by user"){
    //   s=true
    //  }else{
    //   s=false
    //  }
    let name = req.session.username
    console.log(name);
    console.log("STOCK!")
    console.dir(Stock)
    console.log("PRODUCT!")
    console.dir(product)
    console.log("kunnapi",orderDetails.length);
    let g = (orderDetails.length / 10)
    let pagNo = []
    for (let index = 1; index <= g; index++) {
      pagNo.push(index);

    }
  
    res.render('admin/Orderstatus', { j, orderDetails, Stock, product, addressdatas, Orderedlist: true, d: s, pro, name,p, orderId: oid ,page: pagNo})


  })

}
function getOrderList(req, res, orderId = null,p) {

  adminHelpers.Orderstatus(p).then((orderDetails) => {
    let j = orderDetails[0]
    if (orderId) {
      j = orderDetails.filter((order) => order._id.toString() === orderId)[0]
    }
    console.log("jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj", j)

    let Stock = j.Orderdetails.product
    let product = j.Orderdetails.product
    let addressdatas = j.Orderdetails.address
    let oid = j._id

    console.log("thisis j");
    console.log(j);
    console.log(orderDetails)
    let pro = j.Orderdetails.product[0]
    let v = pro.product[0].product.file

    console.log("higl",v[0]);



    let name = req.session.username
    console.log(name);
    console.log("STOCK!")
    console.dir(Stock)
    console.log("PRODUCT!")
    console.dir(product)
    res.render('admin/Orderstatusproduct', { j, orderDetails, Stock, product, addressdatas, Orderedlist: true, pro, name, orderId: oid })


  })

}

router.get('/orderstatus/:pg', checksessionadmin, function (req, res) {

  getOrderLists(req, res,req.params.pg)
})
// router.get('/back',function(req,res){
//   res.redirect('/orderstatus')
// })

router.post('/Orderlists/:id', checksessionadmin, function (req, res) {
  console.log("admin pagination",req.body);
  getOrderList(req, res, req.params.id,req.body.pagin)
})
router.post('/Orderupdate/:id', function (req, res) {
  console.log(req.body);
  adminHelpers.Orderstatusupdate(req.params.id, req.body).then(() => {

    adminHelpers.Orderstatus().then((orderDetails) => {
      console.log("babu",orderDetails);
      let pro = orderDetails.product
      

      res.render('admin/Orderstatus', { orderDetails, pro,})

    })

  })
})
router.post('/deleteOrder/:id', function (req, res) {

  adminHelpers.Orderdelete(req.params.id).then(() => {
    res.redirect('admin/orderstatus')
  })
})
// =========================================Admin Order Actions End===============================================







// ============================================Admin Banner Actions start=========================================

router.post('/Addbanner', upload.single(`file`), function (req, res) {
  console.log("File is", req.body)
  adminHelpers.addbanner({ ...req.body, file: req.file })
  adminHelpers.paymentTypesale().then((paymentTypeReport) => {
    res.render('admin/adminHome', { paymentTypeReport })
  })
})

router.post('/deletebanner/:id', function (req, res) {
  adminHelpers.deleteBanner(req.params.id).then(() => {
    adminHelpers.getbanner().then((data) => {

      res.render('admin/adminBanner', { data })


    })


  })
})
router.get('/getbanner', checksessionadmin, function (req, res) {
  adminHelpers.getmonthReport()
  adminHelpers.getbanner().then((data) => {

    res.render('admin/adminBanner', { data })


  })
})


// ============================================Admin Banner Actions End=========================================




// ==========================================Admin coupon section start========================================
router.get("/coupon", checksessionadmin, function (req, res) {
  adminHelpers.getcoupon().then((Coupons) => {
    res.render("admin/Coupons", { Coupons })
  })
})
router.post("/addcoupon", function (req, res) {
  console.log(req.body, "addcoupon called")
  adminHelpers.addcoupon(req.body).then(() => {
    adminHelpers.getcoupon().then((Coupons) => {
      res.render("admin/Coupons", { Coupons })
    })
  })
})
router.post("/deletecoupon/:id", function (req, res) {
  adminHelpers.deletecoupon(req.params.id).then(() => {
    adminHelpers.getcoupon().then((Coupons) => {
      res.render("admin/Coupons", { Coupons })
    })
  })
})
router.post("/editcoupon", function (req, res) {
  adminHelpers.editcoupon(req.session.user, req.body.couponName)
})

// ==========================================Admin coupon section End========================================






// ===============================================Admin Sales Report start=====================================
router.get('/report', checksessionadmin, function (req, res) {
  adminHelpers.Orderstatus().then((report) => {

    // console.log("sales report",report);
    let date = new Date()
    const g = date => date.toISOString().slice(0, 10);
    let nowDate = g(date)
    console.log("order date is here", report)
    // let p=report.Orderdetails.product[0]
    // let products=p.product[0]
    // console.log("entaponnoooooo",p);
    res.render('admin/adminsalesReport', { report, nowDate })
  })
})
router.post('/datesort', function (req, res) {
  console.log("date sort", req.body);
  let date = new Date()
  const g = date => date.toISOString().slice(0, 10);
  let nowDate = g(date)
  let fromDate = req.body.from
  let toDate = req.body.to

  adminHelpers.datesort(fromDate, toDate).then((report) => {
    console.log(report);
    res.render('admin/adminsalesReport', { report, nowDate })
  })


})
// ===============================================Admin Sales Report End=====================================
module.exports = router;
