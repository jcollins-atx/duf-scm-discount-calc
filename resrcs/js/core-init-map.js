// core-init-map.js

// CORE VARIABLES
var	c = { // (c)onfig
		'ID': getUrlParameter('i'), // store unique identifier from URL param
		'layerControlCombined': true, // default: true - show layer groups as combined "currently billing" and "after edits"
		'layerControlKeepOpen': true, // default: true - keep the layer control open at all times
		'imageryDefaultOpacity': 0.65, // default: 0.65 - default opacity of aerial imagery layer
		'mapAdaptiveZoom': true, // default: true - map will set max zoom at the level needed to display all features
		'mapRestrictView': 0.4, // default: 0.4 - ratio of initial map view to allow the user to pan beyond before restricting further panning, if 0 the view is unrestricted
		'mapOpenPopupOnStart': false,
		'mapZoomToICFeatureOnClick': true, // default: true
		'mapFlyToSpeed': 0.5, // default: 0.5 - must be > 0 - sets speed of animation of zooming to a selected feature
		'mapTooltips': true, // default: true - show tooltips on hovering over map elements
		'mapMeasuring': true, // default: true - enable measure tool on map
		'mapAnnotating': false, // default: true - enable annotation tools on map
		'mapAnnotatingNotes': true, // default: true - enable user-input labels on annotations
		'highlightEditedIC': true, // default: true - highlight edited IC features in edited layer based on edit type (styles defined below) and show legend items
		'mobile': false // DO NOT CHANGE general variable for if screen is narrow width, updated by window resize event in support funcs
	},
	d = [], // (d)ata
	l = {}, // (l)ayers
	mapStates = {0:'EDITED',1:'EDITED'};

// INIT MAP
var map = L.map('map', {
    maxZoom: 23,
    minZoom: 16,
    zoomControl: false,
    preferCanvas: false,
    fullscreenControl: {
        pseudoFullscreen: false // if true, fullscreen to page width and height
    }
}).setView([30.3, -97.7], 10);

// SCALE
L.control.scale({metric:false}).addTo(map);

// LAYER CONTROL -- POPULATED IN CORE-POPULATE-MAP.JS
var layerControl;

// VIEW CONTROL
var viewControl = new L.Control.zoomHome().addTo(map);

// MEASURE CONTROL
var measureControl = new L.control.measure({
	position: 'topleft',
	primaryLengthUnit: 'feet',
	secondaryLengthUnit: 'miles',
	primaryAreaUnit: 'sqfeet',
	secondaryAreaUnit: 'acres',
	snapDistance: 20
});
if(c.mapMeasuring){
	measureControl.addTo(map);
	$('.map-panel').on("click",function(){
		if (measureControl._latlngs.length == 1) {$('.results').html('Start creating a measurement by adding points to the map')}
	});
	$(map).on("measurefinish",function(){
		bindUnloadMessage()
	});
}

// ANNOTATING TOOLS
if (c.mapAnnotating){
	// add leaflet-geoman controls with some options to the map
	map.pm.addControls({
	  position: 'topleft',
	  drawMarker: false,
	  drawCircle: false,
	  drawRectangle: false,
	  //drawCircleMarker: false,
	  cutPolygon: false,
	  editMode: false,
	  dragMode: false
	});
	// force popups closed when drawing
	map.on('pm:globalremovalmodetoggled pm:globaldragmodetoggled pm:drawstart', e => {
	  $(".map-panel").on("click",function(){map.closePopup();if(!map.pm.globalRemovalEnabled() && !map.pm.globalDragModeEnabled()){$('.map-panel').off("click");} });
	});
	map.on('pm:drawend', e => {
	  $('.map-panel').off("click");
	});
	// other options
	map.pm.setGlobalOptions({ snapDistance: 12, templineStyle: {color: 'yellow'}, hintlineStyle: {color: 'yellow', dashArray: [5, 5]} });
	map.pm.setPathOptions({
	  color: 'yellow',
	  fillColor: 'yellow'
	});
	$('.action-removeLastVertex').html('Undo');
	$('.leaflet-pm-actions-container').hide();
	// new annotation created
	temp = null;
	json = null;
	map.on('pm:create', e => {
		bindUnloadMessage()
		temp = e;
		if (c.mapAnnotatingNotes) {
			e.layer.bindPopup('<textarea style="height:60px;" onclick="map.pm.disableDraw()">Type a label or note here</textarea>',{
				closeButton:true,
				closeOnClick:false,
				autoClose:false,
				maxWidth:100,
				className:'annotation-label'
			}).openPopup();
			ta = $(e.layer.getPopup().getElement()).find('textarea');
			e.layer.getPopup().on("remove",function(){
				this.setContent('<textarea style="height:'+ta.height()+'px">'+ta.val()+'</textarea>');
		  	});
	  	}
	});
}

// RECONCILE ANNOTATION AND MEASURE TOOLS - CAN ONLY USE ONE AT A TIME
// LOG IF USER USES MEASURE OR ANNOTATE TO WARN BEFORE LEAVING PAGE
if (c.mapMeasuring && c.mapAnnotating){
	map.on("measurestart",function(){
		map.pm.disableGlobalDragMode();map.pm.disableGlobalEditMode();map.pm.disableGlobalRemovalMode();map.pm.disableDraw();
	});
	$('.leaflet-pm-toolbar').on("click",function(){
		measureControl._finishMeasure()
	});
}

// LEGEND
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = '<table><tbody><tr><td colspan="2" style="padding-bottom:8px;"><div><i style="width:14px;height:14px;border-width:3px;border-color:#fff;background-color:#aaa"></i> <b>Parcel Boundaries</b></div></td></tr><tr><td colspan="2"><div style="border-bottom:1px solid #aaa"><b>Impervious Cover</b></div></td></tr><tr><td><div style="margin-bottom:0">Billable</div></td><td><div style="margin-bottom:0" class="legend-item" id="legend-item-excl-title">Excluded</div></td></tr><tr><td><div class="legend-item" id="legend-item-incl-100"><i style="width:14px;height:14px;border-width:1px;border-color:#444;background:#FFBFBF"></i> 100% Impervious</div><div class="legend-item" id="legend-item-incl-50"><i style="width:14px;height:14px;border-width:1px;border-color:#444;background:#00FFC5"></i> 50% Impervious</div></td><td><div class="legend-item" id="legend-item-excl-drainage"><i style="width:14px;height:14px;border-width:1px;border-color:#444;background:#00C5FF"></i> Drainage</div><div class="legend-item" id="legend-item-excl-row"><i style="width:14px;height:14px;border-width:1px;border-color:#444;background:#ddd"></i> Right-of-Way</div></td></tr><tr class="legend-item" id="legend-item-edit-deleted"><td colspan="2" style="padding-top:4px;"><div><i style="width:14px;height:14px;border-width:2px;border-color:#ff0000"></i> Deleted impervious cover</div></td></tr></tbody></table>\
    <a class="legend-closer" onclick="$(\'.legend\').hide();" style="outline: currentcolor none medium;" title="Hide Legend">×</a>';
    return div;
};
var legendOpener = L.control({position:'bottomright'});
legendOpener.onAdd = function (map) {
    var div = L.DomUtil.create('div');
    div.innerHTML = '<div class="legend-open-control" onclick="$(\'.legend\').show()" title="Show Legend"><a class="legend-opener" style="color:#444">&#9776;</a></div>';
    return div;
};
legend.addTo(map);
$('.legend').on("hide",function(){legendOpener.addTo(map)}).on("show",function(){legendOpener.remove()});
if (c.highlightEditedIC) {
	$('#legend-item-edit-deleted').before('<tr><td colspan="2" style="padding-top:4px;">Edit Type</td></tr>\
	<tr><td colspan="2" class="clearfix">\
		<div class="legend-item float-left" style="width:50%" id="legend-item-edit-updated"><i style="width:14px;height:14px;border-width:2px;border-color:#0000ff;"></i> Updated</div>\
		<div class="legend-item float-left" style="width:50%" id="legend-item-edit-deleted"><i style="width:14px;height:14px;border-width:2px;border-color:#ff0000;"></i> Deleted</div>\
		<div class="legend-item float-left" style="width:50%" id="legend-item-edit-created"><i style="width:14px;height:14px;border-width:2px;border-color:#00ff00;"></i> Created</div>\
		<div class="legend-item float-left" style="width:50%" id="legend-item-edit-none"><i style="width:14px;height:14px;border-width:2px;border-color:#444;"></i> No Edits</div>\
	</td></tr>').remove()
}

// LAYER/LAYER GROUP REFERENCES
imageLayer = null;

dpOriginalGroup = L.featureGroup().on('add', function(){this.bringToBack()});
dpEditedGroup = L.featureGroup().on('add', function(){this.bringToBack()});

icOriginalGroup = L.featureGroup().on('add', function(){this.bringToBack()});
icEditedGroup = L.featureGroup().on('add', function(){this.bringToBack()});

originalGroup = L.featureGroup().on('add', function(){this.bringToBack()});
editedGroup = L.featureGroup().on('add', function(){this.bringToBack()});

randParcelOpenPopup = null; // RANDOM PARCEL TO OPEN POPUP ON LOAD

annotationLayer = L.layerGroup(null,{pane:'annotations'}).addTo(map);
nullGroup = L.layerGroup(); // supports imagery only option on combined layer control

// PANES
map.createPane('annotations');
map.getPane('annotations').style.zIndex = 10;
map.createPane('editedIC');
map.getPane('editedIC').style.zIndex = 5;
map.createPane('originalIC');
map.getPane('originalIC').style.zIndex = -5;
map.createPane('editedDP');
map.getPane('editedDP').style.zIndex = -10;
map.createPane('originalDP');
map.getPane('originalDP').style.zIndex = -10;//-15;
map.createPane('imagery');
map.getPane('imagery').style.zIndex = -20;
map.createPane('basemap');
map.getPane('basemap').style.zIndex = -25;

// STYLES
var highlightDP = {color: '#4ff7e6',weight: 5,fillOpacity: 0};
var unhighlightDP = {color: '#ffffff',weight: 3,opacity: 1,fillOpacity: 0};
var originalDP = unhighlightDP;
var highlightIC = {color: '#4ff7e6',weight: 4,opacity: 1};
var unhighlightIC = {weight: 2,opacity: .5,color: '#000000',fillOpacity: .3};
var unhighlightICEdited = {weight: 2,opacity: .5,color: '#0000ff',fillOpacity: .3};
var unhighlightICCreated = {weight: 2,opacity: .5,color: '#00ff00',fillOpacity: .3};
var deletedIC = {weight: 2,color: '#ff0000',fillOpacity: 0};
var IC_incl_100 = {fillColor: '#FFBFBF'};
var IC_incl_50 = {fillColor: '#FFBFBF'};
var IC_incl_0 = {fillColor: '#AAFF00'};
