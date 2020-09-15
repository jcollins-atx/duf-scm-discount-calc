// core-support-functions.js

// scrollTo function
// Attribution SE user lepe: https://stackoverflow.com/questions/2346011/how-do-i-scroll-to-an-element-within-an-overflowed-div
jQuery.fn.scrollTo = function(elem, speed) { 
    $(this).animate({
        scrollTop:  $(this).scrollTop() - $(this).offset().top + $(elem).offset().top 
    }, speed == undefined ? 1000 : speed); 
    return this; 
};

// fit map bounds with offset - offset map center when sidebar is over map
function fitMapBoundsWithOffset(bounds,speed){
	if(!c.mobile && speed > 0 && !map.isFullscreen()){
		if (map.getBounds().contains(bounds)) return null;
		if (!map.getBounds().contains(bounds)) return map.flyToBounds(bounds,{paddingBottomRight:[$('.view').outerWidth(),0],duration:speed});
	} else if (!c.mobile && speed == 0 && !map.isFullscreen()) {
		return map.fitBounds(bounds,{paddingBottomRight:[$('.view').outerWidth(),0]})
	} else {
		return map.fitBounds(bounds)
	}
}

// select feature - called when a table row or area viz segment is clicked, selects feature on map
function selectFeature(groupNum,fid,forceState) {
	forceState = forceState || null; // forceState is optional
    if (forceState!=null){
	    toggleMapState(groupNum,forceState);
	    layerRadioButtons[2].click();
    }
    layer = l[fid+mapStates[groupNum]];
    
    if(layer._popup.isOpen()){
	    layer.closePopup()
	    //map.fitBounds(editedGroup.getBounds()) // rebound map to default view
	} else {
		map.closePopup()
		layer.openPopup()
		fitMapBoundsWithOffset(layer.getBounds(),c.mapFlyToSpeed)
	}
}

// select tr - called when a map feature popup is opened, selects a table row/card
function selectTr(fid) {
    $('.'+fid).addClass('selected'); // parcel, ic, and area viz
    $('.card.'+fid).addClass('shadow-lg border-dark'); // parcel and ic
    //$('.collection-ic-generic #card-'+fid).addClass('bg-dark text-light') // ic only
    $('#card-'+fid).addClass('bg-dark text-light')
    if(c.mobile) $('.view').scrollTo('#card-'+fid,0); // scroll to card on mobile
    $('#collapse-'+fid).addClass('show') // show ic card
    // show area viz tooltip
    try {
	    //$('.area-viz-edited-segment-wrapper > .'+fid).tooltip('show')
     } catch {}
}

// deselect tr - called when a map feature popup is closed, returns table row/card to default
function deselectTr(fid) {
    $('.'+fid).removeClass('selected'); // parcel, ic, and area viz
    $('.card.'+fid).removeClass('shadow-lg border-dark'); // parcel and ic
    //$('.collection-ic-generic #card-'+fid).removeClass('bg-dark text-light') // ic only
    $('#card-'+fid).removeClass('bg-dark text-light')
    $('#collapse-'+fid).removeClass('show') // close ic card
    // hide area viz tooltip
    try {
	    //$('.area-viz-edited-segment-wrapper > .'+fid).tooltip('hide')
	} catch {}
}

// toggle map state - called when map state is changed, manages the states stored in the map states array, modifies other elements dependent on map state (ex area viz)
function toggleMapState(groupNum,state) {
    if(groupNum==2){
	    mapStates[0] = state
	    mapStates[1] = state
    }  else {
	    mapStates[groupNum] = state;
    }
    // hide area viz if it is enabled and it will not force map back to EDITED state
    if (areaVizEnabled && areaVizForcesState == null){
	    try{if(groupNum==1 && state=='ORIGINAL'){$('.area-viz').hide()}else if(groupNum==1){$('.area-viz').show()}}catch{}
	}
}

// update opacity - called when opacity slider input changed, changes aerial imagery layer opacity to match slider input
function updateOpacity(value) {$('.leaflet-imagery-pane').css("opacity", value)}

// show warning on page leave after using measure or annotation map tools
function bindUnloadMessage(){
	if(!$('body').hasClass('unload-message-bound')) {
		$('body').addClass('unload-message-bound');
		$(window).on("beforeunload", function(e){
		    var confirmationMessage = 'If you leave or reload this page, any  measurements or annotations made on the map will be lost.';
		
		    (e || window.event).returnValue = confirmationMessage; //Gecko + IE
		    return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
		});
	}
}

// document on ready
$(function(){

	// show/hide instructions based on core vars
	if(!c.mapMeasuring){$('#how-to-measure').hide()}
	if(!c.mapAnnotating){$('#how-to-annotate').hide()}
	if(!c.mapAnnotatingNotes){$('#how-to-annotate-notes').hide()}
	
	// implement responsive layout on document ready - map, tables, layout elements
	$(window).on("resize", function(){ 
		w = $(window).width();
		h = $(window).height();
		
		// RESIZE MAP TO WINDOW HEIGHT, other repsonsive layout elements
		// Attribution: stackexchange user Ogman
		if(w >= 992) { // lg bootstrap breakpoint
			// desktop layout utils
			c.mobile = false;
			$("#map,.view").height(h - $('.navbar').outerHeight());
			$('.leaflet-control-layers,.leaflet-control,.leaflet-bottom.leaflet-right,.leaflet-popup-pane,.area-viz-full-wrap,#opacityControl').show()
			//$('.leaflet-control-fullscreen').hide()
			$('.navbar-brand').removeAttr('style')
			$('.view').css('background-color','rgba(0,0,0,.4)')
			$('.leaflet-top.leaflet-left').append($('.leaflet-control-measure'))
			// EXP: full-width map
			$('.leaflet-control-container').addClass('col-lg-7')
			$(".view").css('margin-top','-'+(h - $('.navbar').outerHeight())+'px')
		} else {
			// mobile layout utils
			c.mobile = true;
			$("#map,.view").height((h - $('.navbar').outerHeight())/2); 
			$('.leaflet-control-layers,.legend,.legend-open-control,.leaflet-popup-pane,.area-viz-full-wrap,.leaflet-control-measure,#opacityControl').hide()
			//$('.leaflet-control-fullscreen').show()
			$('.navbar-brand').css('font-size','1rem')
			$('.view').css('background-color','#03256a')
			$('.leaflet-bottom.leaflet-left').prepend($('.leaflet-control-measure'))
			// EXP: full-width map
			$('.leaflet-control-container').removeClass('col-lg-7')
			$(".view").css('margin-top',0)
            
			// enable popups when map fullscreen
			map.off('fullscreenchange') // avoid binding excess listeners
			.on('fullscreenchange', function () {
			    if (map.isFullscreen()) {
				    $('.leaflet-popup-pane,.leaflet-control-layers,.leaflet-control-measure').show()
				} else {
					$('.leaflet-popup-pane,.leaflet-control-layers,.leaflet-control-measure').hide()
				}
			});
		}
		
		// fix content container height with under fixed navbar of variable height
		$(".container-fluid").height($(window).height() - $('.navbar').outerHeight()).css({
			'overflow-y':'hidden',
			'position':'absolute',
            'top':$('.navbar').outerHeight()
		});
	    
	    // re-render with new size
	    map.invalidateSize();
	    
	    // area viz checks
		checkDiffIndicator();
		checkAxisLabels();
	}).trigger("resize");
	
	// close mobile menu after tapping option
	$('.view-selector').click(function(){
		$('.navbar-collapse').collapse('hide');
	}); 
});