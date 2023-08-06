(function ($) {
  "use strict";

  // Dropdown on mouse hover
  $(document).ready(function () {
    function toggleNavbarMethod() {
      if ($(window).width() > 992) {
        $('.navbar .dropdown').on('mouseover', function () {
          $('.dropdown-toggle', this).trigger('click');
        }).on('mouseout', function () {
          $('.dropdown-toggle', this).trigger('click').blur();
        });
      } else {
        $('.navbar .dropdown').off('mouseover').off('mouseout');
      }
    }
    toggleNavbarMethod();
    $(window).resize(toggleNavbarMethod);
  });


  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $('.back-to-top').fadeIn('slow');
    } else {
      $('.back-to-top').fadeOut('slow');
    }
  });
  $('.back-to-top').click(function () {
    $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
    return false;
  });



  // $('.vendor-carousel').owlCarousel({
  //     loop: true,
  //     margin: 29,
  //     nav: false,
  //     autoplay: true,
  //     smartSpeed: 1000,
  //     responsive: {
  //         0:{
  //             items:2
  //         },
  //         576:{
  //             items:3
  //         },
  //         768:{
  //             items:4
  //         },
  //         992:{
  //             items:5
  //         },
  //         1200:{
  //             items:6
  //         }
  //     }
  // });


  // // Related carousel
  // $('.related-carousel').owlCarousel({
  //     loop: true,
  //     margin: 29,
  //     nav: false,
  //     autoplay: true,
  //     smartSpeed: 1000,
  //     responsive: {
  //         0:{
  //             items:1
  //         },
  //         576:{
  //             items:2
  //         },
  //         768:{
  //             items:3
  //         },
  //         992:{
  //             items:4
  //         }
  //     }
  // });


  // Product Quantity
  $('.quantity button').on('click', function () {
    var button = $(this);
    var oldValue = button.parent().parent().find('input').val();
    if (button.hasClass('btn-plus')) {
      var newVal = parseFloat(oldValue) + 1;
    } else {
      if (oldValue > 0) {
        var newVal = parseFloat(oldValue) - 1;
      } else {
        newVal = 0;
      }
    }
    button.parent().parent().find('input').val(newVal);
  });

})(jQuery);

// -----------------------------------------------------------image zoom start=====================================================================





// =========================================================================================================================================


function cartAdd(cartid) {

  $.ajax({
    url: '/Addtocart/' + cartid,
    method: 'GET',
    success: (response) => {
      if (response.status) {

        console.log(response.status);
        let count = $('#cartcount').html()
        count = parseInt(count) + 1
        $("#cartcount").html(count)
        Toastify({
          text: "One item Added to cart",
          position: "center",
          gravity: "bottom",
          style: {
            background: "black",
          }
        }).showToast();
        
      }
    }
  })
}
function addstock(cartId, productId, count) {
  console.log("ajax addid",cartId,productId,count);
  let quantity = parseInt(document.getElementById(productId).innerHTML)
  count = parseInt(count)
  $.ajax({
    url: '/cartcount/',
    data: {
      cart: cartId,
      product: productId,
      count: count,
      quantity: quantity
    },
    method: 'post',
    success: (response) => {
      if (response.removeProduct) {
        alert("Product removed")
        location.reload(true)
      } else {
        document.getElementById(productId).innerHTML = quantity + count
        location.reload(true)
      }

    }
  })
}
function deleteCartproduct(cartId, productId) {

  $.ajax({
    url: '/cartproductdelete/',
    data: {
      cart: cartId,
      product: productId
    },
    method: 'post',
    success: (response) => {
      if (response.removeProduct) {
        alert("Product removed from your cart")
    
      }

    }
  })
}
function check_num(event) {
  if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);
}

function wishAdd(wishId) {
  $.ajax({
    url: '/wishlist/' + wishId,
    method: 'GET',
    success: (response) => {
      // if (response.status){

      //   let count=$('#cartcount').html()
      //   count=parseInt(count)+1
      //   $("#cartcount").html(count)
      // }
      Toastify({
        text: "One item Added to Wishlist",
        position: "center",
        gravity: "bottom",
        style: {
          background: "black",
        }
      }).showToast();
      
    }
  })
}
function wishdel(wishId, productId) {
  $.ajax({
    url: '/wishdelete',
    data: {
      wishlist: wishId,
      product: productId
    },
    method: 'post',
    success: (response) => {
      if (response.delete) {

        location.reload(true)
      }





    }
  })
}
function Catdel(catId) {
  $.ajax({
    url: 'catedelete/' + catId,
    method: 'POST',
    success: (response) => {
      alert("category removed Succesfully")
      location.href = 'addcat'
      //(true)


    }
  })

}


