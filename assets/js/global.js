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
  