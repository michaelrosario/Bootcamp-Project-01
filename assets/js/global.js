
var access = localStorage.getItem('rimot');

if(!access){

  window.location = "./development/";

}

$(".navbar-toggler").on("click",function(){
    if($(this).hasClass("open")){
      $(this).removeClass("open");
    } else {
      $(this).addClass("open");
    }
}); 

$(window).scroll(function() {
           
    $("#parallax-header").css("backgroundPositionY",($(window).scrollTop())*0.5);
    if ($(window).scrollTop() > 100) {
        $('.fixed').addClass('is-sticky');
    } else {
        $('.fixed').removeClass('is-sticky');
    };
});
  
$('.responsiveRow').slick({
  dots: false,
  infinite: true,
  speed: 300,
  lazyLoad: true,
  slidesToShow: 3,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 1,
        infinite: true,
        dots: false
      }
    },
    {
      breakpoint: 960,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1
      }
    },
    {
      breakpoint: 640,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1
      }
    }
    // You can unslick at a given breakpoint now by adding:
    // settings: "unslick"
    // instead of a settings object
  ]
});