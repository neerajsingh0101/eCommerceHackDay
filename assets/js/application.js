$(function() {
	var spy = $('body').scrollspy();

	$('#navbar').find('li a').click(grabLink);
	$('a.animate').click(grabLink);

	$(document).keydown(function(e){
	    if ((e.keyCode == 37)) { 
	    	// Prev
	    	var slide = $('.active_slide').prev();
	    	if(slide.length) {
				$.scrollTo(slide, {
					duration: 1000,
					easing: 'easeInOutQuart'
				});
	    	}

			return false;
	    }
	    else if ((e.keyCode == 39 || e.keyCode == 32)) { 
	    	// Next
	    	var slide = $('.active_slide').next();
	    	if(slide.length) {
				$.scrollTo(slide, {
					duration: 1000,
					easing: 'easeInOutQuart'
				});
	    	}

			return false;
	    }
	    else if ((e.keyCode >= 49 && e.keyCode <= 57) && (!e.metaKey && !e.altKey && !e.ctrlKey)) {
	    	// Slide #
	    	var slide = $('#container .section').eq(e.keyCode - 49);
	    	if(slide.length) {
				$.scrollTo(slide, {
					duration: 1000,
					easing: 'easeInOutQuart'
				});
	    	}

	    	return false;
	    }
	});

});

var grabLink = function(e) {
	e.preventDefault();

	var slide = $($(this).attr('href'));
	$.scrollTo(slide, {
		duration: 1000,
		easing: 'easeInOutQuart'
	});

	return false;
}