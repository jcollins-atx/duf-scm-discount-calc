// core-populate-map.js

// CALLED AFTER JSON DATA LOADED
function populateMap() {

// AERIAL IMAGE LAYER
//defaultMapBounds = d['imageryExtents'];
imageLayer = L.imageOverlay(c.path+'png/'+d.identifier+'.png',d.imageryExtents,{
    'pane':'imagery',
    'attribution':'<a href="#" data-toggle="modal" data-target="#disclaimerModal">Disclaimer</a>'
}).addTo(map);

// PARCEL LAYER
d.parcelCollection.forEach(function (f) {
	
	randParcelOpenPopup = 'dp'+f.dufPolyId+'EDITED';
	
    l['dp'+f.dufPolyId+'ORIGINAL'] = L.geoJSON(f.geometry.original,{
	    pane:'originalDP',
	    style: originalDP,
	    pmIgnore: true
	}).bindPopup(
	    "<table class=\"popup-table\"><tbody><tr><td colspan=\"2\">Parcel boundaries currently billing</td></tr><tr><td colspan=\"2\"><big>"+f.addressLabel+"</big></td></tr><tr><td>Impervious Area</td><td>"+f.imperviousArea.original+" sq. ft.</td></tr><tr><td>Billable Area</td><td>"+f.billableArea.original+" sq. ft.</td></tr><tr><td>Impervious Percent</td><td>"+f.imperviousPercent.original+"</td></tr><tr><td>Drainage Charge</td><td>"+f.dufEstimate.original+" /mo.</td></tr></tbody></table>"
	).on('popupopen', function(e) {
	    e.layer.setStyle(highlightDP);
	    selectTr('dp'+f.dufPolyId);
	    e.layer.bringToFront();
	}).on('popupclose', function(e){
	    e.layer.setStyle(unhighlightDP);
	    deselectTr('dp'+f.dufPolyId);
	}).addTo(originalGroup).addTo(dpOriginalGroup);
	
	l['dp'+f.dufPolyId+'EDITED'] = L.geoJSON(f.geometry.edited,{
	    pane:'editedDP',
	    style: unhighlightDP,
	    pmIgnore: true
	}).bindPopup(
	    "<table class=\"popup-table\"><tbody><tr><td colspan=\"2\">Parcel boundaries after edits</td></tr><tr><td colspan=\"2\"><big>"+f.addressLabel+"</big></td></tr><tr><td>Impervious Area</td><td>"+f.imperviousArea.effective+" sq. ft.</td></tr><tr><td>Billable Area</td><td>"+f.billableArea.effective+" sq. ft.</td></tr><tr><td>Impervious Percent</td><td>"+f.imperviousPercent.effective+"</td></tr><tr><td>Drainage Charge</td><td>"+f.dufEstimate.effective+" /mo.</td></tr></tbody></table>"
	).on('popupopen', function(e) {
	    e.layer.setStyle(highlightDP);
	    selectTr('dp'+f.dufPolyId);
	    e.layer.bringToFront();
	}).on('popupclose', function(e){
	    e.layer.setStyle(unhighlightDP);
	    deselectTr('dp'+f.dufPolyId);
	}).addTo(editedGroup).addTo(dpEditedGroup);
	
	// BIND TOOLTIPS IF ENABLED
	if (c.mapTooltips) {
		l['dp'+f.dufPolyId+'ORIGINAL'].bindTooltip('Parcel',{sticky:true,opacity:0.8})
		l['dp'+f.dufPolyId+'EDITED'].bindTooltip('Parcel',{sticky:true,opacity:0.8})
	}
});

// IC LAYER
d.imperviousCoverCollection.forEach(function (f) {

	// get simple id feature id from table/cards
	icFeatureCount = $('#card-ic'+f.imperviousCoverId+' .ic-feature-count').html()
	
	// color edited popup text based on edit type
	if (f.editType == 'Created') {textColor = 'success'} else
	if (f.editType == 'Deleted') {textColor = 'danger'} else
	if (f.editType == 'No edits') {textColor = 'secondary'} 
	else {textColor = 'primary'}
	
	// ORIGINAL FEATURE
	l['ic'+f.imperviousCoverId+'ORIGINAL'] = L.geoJSON(f.geometry.original, {
	    style: {fillColor:f.symbol.original},
	    pane: 'originalIC',
	    pmIgnore: true
	}).setStyle(unhighlightIC
	).bindPopup(
	    "<table class=\"popup-table\"><tbody><tr><td colspan=\"2\">Impervious cover currently billing</td></tr><tr><td colspan=\"2\" class=\"border-bottom-0\"><big>"+icFeatureCount+'. '+f.feature.original+"</big></td></tr><tr><td colspan=\"2\"><span class=\"text-"+textColor+"\">"+f.editType+"</span></td></tr><tr><td>Area</td><td>"+f.area.original+" sq. ft.</td></tr><tr><td>Imperviousness</td><td>"+f.percentImpervious.original+"</td></tr><tr><td>Exclusion Reason</td><td>"+f.exclusionReason.original+"</td></tr></tbody></table>"
	).on('popupopen', function(e) {
	    e.layer.setStyle(highlightIC);
	    e.layer.bringToFront();
	    try {selectTr('ic'+f.imperviousCoverId)} catch {}
	    if(c.mapZoomToICFeatureOnClick) fitMapBoundsWithOffset(e.layer.getBounds(),c.mapFlyToSpeed);
	}).on('popupclose', function(e){
	    e.layer.setStyle(unhighlightIC)
	    try {deselectTr('ic'+f.imperviousCoverId)} catch {}
	}).addTo(originalGroup).addTo(icOriginalGroup);
	
	// EDITED FEATURE
	l['ic'+f.imperviousCoverId+'EDITED'] = L.geoJSON(f.geometry.effective, {
	    style: {fillColor:f.symbol.edited},
	    pane: f.editedPane,
	    pmIgnore: true
	}).bindPopup(
	    "<table class=\"popup-table\"><tbody><tr><td colspan=\"2\">Impervious cover after edits</td></tr><tr><td colspan=\"2\" class=\"border-bottom-0\"><big>"+icFeatureCount+'. '+f.feature.effective+"</big></td></tr><tr><td colspan=\"2\"><span class=\"text-"+textColor+"\">"+f.editType+"</span></td></tr><tr><td>Area</td><td>"+f.area.effective+" sq. ft.</td></tr><tr><td>Imperviousness</td><td>"+f.percentImpervious.effective+"</td></tr><tr><td>Exclusion Reason</td><td>"+f.exclusionReason.effective+"</td></tr></tbody></table>"
	).on('popupopen', function(e) {
	    e.layer.setStyle(highlightIC);
	    e.layer.bringToFront();
	    try {selectTr('ic'+f.imperviousCoverId)} catch {}
	    if(c.mapZoomToICFeatureOnClick) fitMapBoundsWithOffset(e.layer.getBounds(),c.mapFlyToSpeed);
	}).addTo(editedGroup).addTo(icEditedGroup);
	
	// BIND TOOLTIPS IF ENABLED
	if (c.mapTooltips) {
		l['ic'+f.imperviousCoverId+'ORIGINAL'].bindTooltip('<span class="text-'+textColor+'">'+icFeatureCount+'. '+f.feature.original+'</span>',{sticky:true,opacity:0.8})
		l['ic'+f.imperviousCoverId+'EDITED'].bindTooltip('<span class="text-'+textColor+'">'+icFeatureCount+'. '+f.feature.effective+'</span>',{sticky:true,opacity:0.8})
	}
	
	// SET STYLE RULES -- STYLE DELETED FEATURES DIFFERENTLY
	if (f.editType == 'Deleted') {
		l['ic'+f.imperviousCoverId+'EDITED'].on('popupclose', function(e){
		    e.layer.setStyle(deletedIC)
		    try {deselectTr('ic'+f.imperviousCoverId)} catch {}
		}).setStyle(deletedIC);
	} else if (f.editType == 'Created' && c.highlightEditedIC) { 
		l['ic'+f.imperviousCoverId+'EDITED'].on('popupclose', function(e){
		    e.layer.setStyle(unhighlightICCreated)
		    try {deselectTr('ic'+f.imperviousCoverId)} catch {}
		}).setStyle(unhighlightICCreated);
	} else if (f.editType != 'No edits' && c.highlightEditedIC) { 
		l['ic'+f.imperviousCoverId+'EDITED'].on('popupclose', function(e){
		    e.layer.setStyle(unhighlightICEdited)
		    try {deselectTr('ic'+f.imperviousCoverId)} catch {}
		}).setStyle(unhighlightICEdited);
	} else {
		l['ic'+f.imperviousCoverId+'EDITED'].on('popupclose', function(e){
		    e.layer.setStyle(unhighlightIC)
		    try {deselectTr('ic'+f.imperviousCoverId)} catch {}
		}).setStyle(unhighlightIC);
	}
	
	// show legend items pertaining to feature as they occur
	if (f.percentImpervious.original == '100%' || f.percentImpervious.effective == '100%') $('#legend-item-incl-100').show();
	if (f.percentImpervious.original == '50%' || f.percentImpervious.effective == '50%') $('#legend-item-incl-50').show();
	if (f.percentImpervious.original == '0%' || f.percentImpervious.effective == '0%') $('#legend-item-incl-0').show();
	if (f.exclusionReason.original == 'Drainage' || f.exclusionReason.effective == 'Drainage') $('#legend-item-excl-drainage').show();
	if (f.exclusionReason.original == 'Right-of-Way' || f.exclusionReason.effective == 'Right-of-Way') $('#legend-item-excl-row').show();
	if (f.exclusionReason.original == 'Drainage' || f.exclusionReason.effective == 'Drainage' || 
		f.exclusionReason.original == 'Right-of-Way' || f.exclusionReason.effective == 'Right-of-Way') $('#legend-item-excl-title').show();
	if (f.editType == 'Created') $('#legend-item-edit-created').show();
	if (f.editType == 'Deleted') $('#legend-item-edit-deleted').show();
	if (f.editType == 'No edits') $('#legend-item-edit-none').show();
	if (f.editType.split(' ')[0] == 'Updated') $('#legend-item-edit-updated').show();
});

// GOOGLE BASEMAP
// Attribution SE user Tekcson: https://gis.stackexchange.com/questions/225098/using-google-maps-static-tiles-with-leaflet
// SE user volzo: https://stackoverflow.com/questions/23017766/google-maps-tile-url-for-hybrid-maptype-tiles
googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 21,
    subdomains:['mt0','mt1','mt2','mt3'],
    'pane': 'imagery',
    opacity:0.4,
    'attribution':'Basemap &copy; Google'
}).addTo(map);

// LAYER CONTROL AND LAYER GROUP INIT
if (c.layerControlCombined) {
	layerControl = L.control.groupedLayers(null,{"View": {"After edits": editedGroup, "Currently billing": originalGroup, "Imagery only": nullGroup},"Aerial Imagery (2017)": {"":imageLayer}},{'autoZIndex':true, exclusiveGroups: ["View"], 'position':'topleft'});
	editedGroup.addTo(map);
} else {
	layerControl = L.control.groupedLayers(null,{"Parcel Boundaries":{"After edits": dpEditedGroup, "Currently billing": dpOriginalGroup} , "Impervious Cover": {"After edits": icEditedGroup, "Currently billing": icOriginalGroup},"Aerial Imagery (2017)": {"":imageLayer}},{'autoZIndex':true, exclusiveGroups: ["Parcel Boundaries","Impervious Cover"], 'position':'topleft'});
	dpEditedGroup.addTo(map);
	icEditedGroup.addTo(map);
}
layerControl.addTo(map);

// DOC READY INITS
$(function() {
	// MAP VIEW INIT
	fitMapBoundsWithOffset(editedGroup.getBounds(),0);
	
	// VIEW RESTRICTIONS AND ADAPTIVE ZOOM
	$(map).on('resize',function(){  
		if(c.mapRestrictView != 0) map.setMaxBounds(map.getBounds().pad(c.mapRestrictView));
		if(c.mapAdaptiveZoom) {
			map.setMinZoom(map.getZoom()-1)
			map.setMinZoom(map.getBoundsZoom(d['imageryExtents']))
		}
	}).resize()
	
	// OPEN INIT POPUP
	imageLayer.on('load',function(){ // add event listener to fix issue with popup opening before image loaded
		if (!c.mobile && c.mapOpenPopupOnStart) {l[randParcelOpenPopup].openPopup()}
		imageLayer.off('load') //only fire once
	})
    
    // REORDER TOP LEFT CONTROLS
    $('.leaflet-top.leaflet-left').prepend($('.leaflet-control-layers'))
    
    // INJECT OPACITY SLIDER INTO LAYERCONTROL
    var slider = "<input class=\"slider\" id=\"opacityControl\" type=\"range\" min=\"0\" max=\"1\" step=\"0.01\" value=\""+c.imageryDefaultOpacity+"\">";
    var imgControlLabel = $($('.leaflet-control-layers-overlays').find('label').slice(-1)[0]);
    imgControlLabel.append(slider);
    imgControlLabel.css('width','150px');
    $(imgControlLabel.children()[0]).addClass("imgControl");
    $(imgControlLabel.find('input[type=checkbox]')[0]).remove();
    
    // UPDATE IMAGERY OPACITY WHEN SLIDER MOVED AND INITIALIZE
    $('#opacityControl').on('input', function () {updateOpacity(this.value)});
    updateOpacity($('#opacityControl').attr('value')); // INIT OPACITY BASED ON SLIDER DEFAULT
    
    // DISABLE MAP PAN WHEN CURSOR OVER CONTROLS
    $('.leaflet-control-layers,.legend ').on('mouseover', function () {map.dragging.disable()});
    $('.leaflet-control-layers,.legend ').on('mouseout', function () {map.dragging.enable()});
    
    // ADD CLICK EVENT TO LAYERCONTROL RADIO BUTTONS TO RECORD VISIBLE LAYERS
    // SUPPORTS selectFeature() TO LINK TABLE ROW CLICK TO VISIBLE FEATURE
    layerRadioButtons = $('.leaflet-control-layers-overlays').find('.leaflet-control-layers-selector');
    for (i=0;i<layerRadioButtons.length;i++) {
	    // support changes in c.layerControlCombined
        if(layerRadioButtons.length == 4) {
        	params = ["(0,'EDITED')","(0,'ORIGINAL')","(1,'EDITED')","(1,'ORIGINAL')"];
			$(layerRadioButtons[i]).attr('onclick','toggleMapState'+params[i]);
		} else if(layerRadioButtons.length == 3) {
			params = ["(2,'EDITED')","(2,'ORIGINAL')","(2,'EDITED')"];
			$(layerRadioButtons[i]).attr('onclick','toggleMapState'+params[i]);
		}
    }
    
    // FORCE LAYER CONTROL OPEN
    if (c.layerControlKeepOpen){
    	$('.leaflet-control-layers').on("mouseover mouseout",function(){layerControl._expand()});
    	$('#map').on("click",function(){layerControl._expand()});
    	layerControl._expand();
    }
    
    // SWITCH ORDER OF LAYER AND MEASURE CONTROL
    if(layerControl.position == 'topright'){$('.leaflet-control-measure').insertAfter('.leaflet-control-layers')}
    
    // RECENTER MAP ON WINDOW RESIZE
    $(window).on('resize',function(){
	    fitMapBoundsWithOffset(d["imageryExtents"],0)
    })
});

} // end func populateMap