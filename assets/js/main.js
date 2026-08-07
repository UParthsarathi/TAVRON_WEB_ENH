/**
* Template Name: Company - v2.0.1
* Template URL: https://bootstrapmade.com/company-free-html-bootstrap-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
!(function($) {
  "use strict";

	$(header).each(function(){
		$(this).load($(this).data("load"), function(){
			var menuId = "#" + $(this).data("active-menu");
			var menuElement = $(this).find(menuId);
			if(menuElement.length) {
			$(menuElement).addClass("active");
			}
			
			// Mobile Navigation
			  if ($('.nav-menu').length) {
				var $mobile_nav = $('.nav-menu').clone().prop({
				  class: 'mobile-nav d-lg-none'
				});
				$('body').append($mobile_nav);
				$('body').prepend('<button type="button" class="mobile-nav-toggle d-lg-none"><i class="icofont-navigation-menu"></i></button>');
				$('body').append('<div class="mobile-nav-overly"></div>');

				$(document).on('click', '.mobile-nav-toggle', function(e) {
				  $('body').toggleClass('mobile-nav-active');
				  $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
				  $('.mobile-nav-overly').toggle();
				});

				$(document).on('click', '.mobile-nav .drop-down > a', function(e) {
				  e.preventDefault();
				  $(this).next().slideToggle(300);
				  $(this).parent().toggleClass('active');
				});

				$(document).click(function(e) {
				  var container = $(".mobile-nav, .mobile-nav-toggle");
				  if (!container.is(e.target) && container.has(e.target).length === 0) {
					if ($('body').hasClass('mobile-nav-active')) {
					  $('body').removeClass('mobile-nav-active');
					  $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
					  $('.mobile-nav-overly').fadeOut();
					}
				  }
				});
			  } else if ($(".mobile-nav, .mobile-nav-toggle").length) {
				$(".mobile-nav, .mobile-nav-toggle").hide();
			  }
		});
	});
	
	$("#footer").each(function(){
		$(this).load($(this).data("load"), function(){
		});
	});

  // Smooth scroll for the navigation menu and links with .scrollto classes
  $(document).on('click', '.nav-menu a, .mobile-nav a, .scrollto', function(e) {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      if (target.length) {
        e.preventDefault();

        var scrollto = target.offset().top;

        if ($('#header').length) {
          scrollto -= $('#header').outerHeight()
        }

        if ($(this).attr("href") == '#header') {
          scrollto = 0;
        }

        $('html, body').animate({
          scrollTop: scrollto
        }, 1500, 'easeInOutExpo');

        if ($(this).parents('.nav-menu, .mobile-nav').length) {
          $('.nav-menu .active, .mobile-nav .active').removeClass('active');
          $(this).closest('li').addClass('active');
        }

        if ($('body').hasClass('mobile-nav-active')) {
          $('body').removeClass('mobile-nav-active');
          $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
          $('.mobile-nav-overly').fadeOut();
        }
        return false;
      }
    }
  });

  

  // Intro carousel
  var heroCarousel = $("#heroCarousel");
  var heroCarouselIndicators = $("#hero-carousel-indicators");
  heroCarousel.find(".carousel-inner").children(".carousel-item").each(function(index) {
    (index === 0) ?
    heroCarouselIndicators.append("<li data-target='#heroCarousel' data-slide-to='" + index + "' class='active'></li>"):
      heroCarouselIndicators.append("<li data-target='#heroCarousel' data-slide-to='" + index + "'></li>");
  });

  heroCarousel.on('slid.bs.carousel', function(e) {
    $(this).find('.carousel-content ').addClass('animated fadeInDown');
  });

  // Product Slider
  $('#carousel-product').on('slide.bs.carousel', function (e) {
    var $e = $(e.relatedTarget);
    var idx = $e.index();
    var itemsPerSlide = 3;
    var totalItems = $('#carousel-product .carousel-item').length;
  
    if (idx >= totalItems-(itemsPerSlide-1)) {
        var it = itemsPerSlide - (totalItems - idx);
        for (var i=0; i<it; i++) {
            // append slides to end
            if (e.direction=="left") {
                $('#carousel-product .carousel-item').eq(i).appendTo('#carousel-product .carousel-inner');
            }
            else {
                $('#carousel-product .carousel-item').eq(0).appendTo('#carousel-product .carousel-inner');
            }
        }
    }
  });

  // Product Image Slider
  $('#product-image-carousel ').on('slide.bs.carousel', function (e) {
    var $e = $(e.relatedTarget);
    var idx = $e.index();
    var itemsPerSlide = 4;
    var totalItems = $('#product-image-carousel .carousel-item').length;

    if (idx >= totalItems-(itemsPerSlide-1)) {
        var it = itemsPerSlide - (totalItems - idx);
        for (var i=0; i<it; i++) {
            // append slides to end
            if (e.direction=="left") {
                $('#product-image-carousel .carousel-item').eq(i).appendTo('#product-image-carousel .carousel-inner');
            }
            else {
                $('#product-image-carousel .carousel-item').eq(0).appendTo('#product-image-carousel .carousel-inner');
            }
        }
    }
  });

  $(document).on("click", '[data-toggle="lightbox"]', function(event) {
    event.preventDefault();
    $(this).ekkoLightbox();
  });

  // Back to top button
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('.back-to-top').fadeIn('slow');
    } else {
      $('.back-to-top').fadeOut('slow');
    }
  });

  $('.back-to-top').click(function() {
    $('html, body').animate({
      scrollTop: 0
    }, 1500, 'easeInOutExpo');
    return false;
  });

  // Porfolio isotope and filter
  $(window).on('load', function() {
    var portfolioIsotope = $('.portfolio-container').isotope({
      itemSelector: '.portfolio-item'
    });

    $('#portfolio-flters li').on('click', function() {
      $("#portfolio-flters li").removeClass('filter-active');
      $(this).addClass('filter-active');

      portfolioIsotope.isotope({
        filter: $(this).data('filter')
      });
      aos_init();
    });

    // Initiate venobox (lightbox feature used in portofilo)
    $(document).ready(function() {
      $('.venobox').venobox();
    });
  });

  // Skills section
  $('.skills-content').waypoint(function() {
    $('.progress .progress-bar').each(function() {
      $(this).css("width", $(this).attr("aria-valuenow") + '%');
    });
  }, {
    offset: '80%'
  });

  // Portfolio details carousel
  $(".portfolio-details-carousel").owlCarousel({
    autoplay: true,
    dots: true,
    loop: true,
    items: 1
  });

  // Initi AOS
  function aos_init() {
    AOS.init({
      duration: 1000,
      once: true
    });
  }
  aos_init();

})(jQuery);