// init
function initDiscount (){
	ba = parseFloat($('.new-billable-area').html().replace(/,/g, ''));
	ia = parseFloat($('.new-impervious-area').html().replace(/,/g, ''));
	duf = parseFloat($('.new-duf').html().replace(/[$,]/g, ''));
	D = new stormwaterDiscount(ba,ia,duf)
	updateEstimateView()
}

// add new form from prototype on selector change
prototypeIndex = 1;
$('#new-scm-selector a.dropdown-item:not(.disabled)').on('click',function(e){
	
	console.log('prototype_'+$(this).attr('href').substr(1)+'.html')
	
	$.get('prototype_'+$(this).attr('href').substr(1)+'.html',function(d){
		// Append prototype copy
		$('.form-area').append(d)
		
		$('#scm').attr('id','scm-'+prototypeIndex)
		
		$('.form-active [name="scm-id"]').val(prototypeIndex)
		$('.form-active input,.form-active button,.form-active .btn,.form-active select')
			.attr('scmid',prototypeIndex)
			.on('focus',function(){
				$('.helptext[for="'+$(this).attr('name')+'"]').show(100)
			})
			.on('focusout',function(){
				$('.helptext[for="'+$(this).attr('name')+'"]').hide(100)
			})
		
		userLayers['scm-'+prototypeIndex] = {}
		
		prototypeIndex++;
		
		// disable other forms
		$('.edit-button').attr('disabled','disabled')
		$('#new-scm-selector .dropdown-toggle').addClass('disabled').attr('aria-disabled','true')
		$('.form-closed tbody td').css('color','#999')
	
	})
});

var userLayers = {all: {}}
var revertForm = null; // assists canceling an edit task

map.pm.setGlobalOptions({ snapDistance: 12, templineStyle: {color: 'yellow'}, hintlineStyle: {color: 'yellow', dashArray: [5, 5]} });
map.pm.setPathOptions({
	color: 'yellow',
	fillColor: 'yellow'
});


function evalCondition(t,condition){
	cond = condition.split(' ')
	v = $(t).val()
	cv = cond[1]
	if($.isNumeric(cv) && cv.indexOf('.') >= 0) {
		cv = parseFloat(cv)
	} else if($.isNumeric(cv)) {
		cv = parseInt(cv)
	}
	if (cond[0] == '==') {
		if(v == cv){
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').show()
		}else{
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').hide()
		}
	} else if (cond[0] == '<'){
		if(v < cv){
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').show()
		}else{
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').hide()
		}
	} else if (cond[0] == '>'){
		if(v > cv){
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').show()
		}else{
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').hide()
		}
	} else if (cond[0] == '<='){
		if(v <= cv){
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').show()
		}else{
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').hide()
		}
	} else if (cond[0] == '>='){
		if(v >= cv){
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').show()
		}else{
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').hide()
		}
	} else if (cond[0] == '!='){
		if(v != cv){
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').show()
		}else{
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').hide()
		}
	} else if (cond[0] == '!'){
		if(!$(t).val()){
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').show()
		}else{
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').hide()
		}
	} else if (cond[0] == '!!'){
		if(!!$(t).val()){
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').show()
		}else{
			$('.form-active [condition="'+$(t).attr('name')+condition+'"]').hide()
		}
	} else {
		console.log('error - could not interpret conditional <'+condition+'> called by '+t)
	}
}

function placePoint(trigger){
	var cancelText = 'Cancel',
		form = $('.form-active'),
		triggerId = $(trigger).attr('scmid'),
		pointName = 'scm-point',
		measureName = $(trigger).attr('target'),
		targetField = $('[name="'+measureName+'"]');
	
	if ($(trigger).html() == cancelText) {
		map.pm.disableDraw()
		
		// re-enable all active form fields and return to default button text
		enableForm(form)
		$(trigger).html('Place point on map').removeClass('btn-danger').addClass('btn-primary')
		targetField.attr('placeholder','Coordinates')
	} else {
	
		// disable all active form fields
		disableForm(form)
		defTriggerLabel = $(trigger).html()
		$(trigger).html(cancelText).removeAttr('disabled').removeClass('btn-primary').addClass('btn-danger')
		
		map.closePopup()
	
		targetField.attr('placeholder','Click map to place point...')
		
		if (!!userLayers.all[pointName+'-'+triggerId]) {
			userLayers.all[pointName+'-'+triggerId].remove()
			delete userLayers.all[pointName+'-'+triggerId]
			delete userLayers['scm-'+triggerId][pointName]
		}
		
		map.pm.enableDraw('CircleMarker')
		map.on('pm:create', function (e) {
			map.pm.disableDraw()
			e.layer.bindPopup($('#scm-'+triggerId+' .title').html()).openPopup()
			var type = e.shape,
			  layer = e.layer;
			if (type === 'CircleMarker') {
				
				addUserLayer(e.layer,triggerId,pointName)
				
				latlong = e.layer.getLatLng()
				$('[name="point-lat"]').val(latlong['lat'])
				$('[name="point-lng"]').val(latlong['lng'])
				
				targetField.val(latlong['lat'].toFixed(4)+', '+latlong['lng'].toFixed(4))
				
				//$(trigger).html('Redo: '+$(trigger).html())
				
				// re-enable all active form fields and return to default button text
				enableForm(form)
				$(trigger).html(defTriggerLabel).removeClass('btn-danger').addClass('btn-primary')
				
				// show indicator
				$('#scm-'+triggerId+' .indicator-point-placed').show()
				.parent().css('cursor','pointer').attr('onclick','userLayers.all[\''+pointName+'-'+triggerId+'\'].openPopup()')
			}
			map.off('pm:create')
		})
		/*map.on('pm:drawend',function(){
			map.off('pm:create')
		})*/
	}
}

function measureMap(trigger){
	var cancelText = 'Cancel',
		form = $('.form-active'),
		triggerId = $(trigger).attr('scmid'),
		measureName = $(trigger).attr('target'),
		targetField = $('[name="'+measureName+'"]');
	
	if ($(trigger).html() == cancelText) {
		map.pm.disableDraw()
		
		// re-enable all active form fields and return to default button text
		enableForm(form)
		$(trigger).html('Measure area on map').removeClass('btn-danger').addClass('btn-primary')
		targetField.attr('placeholder','')
		
	} else {
		
		// disable all active form fields
		disableForm(form)
		defTriggerLabel = $(trigger).html()
		$(trigger).html(cancelText).removeAttr('disabled').removeClass('btn-primary').addClass('btn-danger')
		
		map.closePopup()
		
		targetField.attr('placeholder','Click map to draw area...')
		
		if (!!userLayers.all[measureName+'-'+triggerId]) {
			userLayers.all[measureName+'-'+triggerId].remove()
			delete userLayers.all[measureName+'-'+triggerId]
			delete userLayers['scm-'+triggerId][measureName]
			targetField.val("")
		}
		
		map.pm.enableDraw('Polygon',{
			allowSelfIntersection: false
		})
		map.on('pm:create', function (e) {
		  var type = e.shape,
		      layer = e.layer;
		  if (type === 'Polygon') {
			var sqftArea = Math.round(L.GeometryUtil.geodesicArea(layer._latlngs[0])*10.76391);
		    
		    targetField.val(sqftArea)
		    
		    addUserLayer(e.layer,triggerId,measureName)
		    
		    //$(trigger).html('Redo: '+$(trigger).html())
		    
		    // re-enable all active form fields and return to default button text
		    enableForm(form)
			$(trigger).html(defTriggerLabel).removeClass('btn-danger').addClass('btn-primary')
		  }
		  map.off('pm:create')
		})
		/*map.on('pm:drawend',function(){
			map.off('pm:create')
		})*/
	}
}

function commitSCM(t){
	form = $('.form-active')
	triggerId = form.find('[name="scm-id"]').val();
	
	if (form.valid()) {	
		
		// build attrObj
		attr = {}
		$('.form-active .attr').serializeArray().forEach(function(o){
			if (!!attr[o.name]) {
				attr[o.name] = attr[o.name]+','+o.value;
			} else {
				attr[o.name] = o.value;
			}
		})
		
		// build layers
		layers = {}
		$.each(userLayers['scm-'+triggerId],function(i,l){
			layers[i] = l.toGeoJSON()
		})
		
		// ++ if item does not exist in D.stormwaterControls
		if (!D.stormwaterControls[triggerId]) {
			D.addStormwaterControl(
				triggerId, // index
				form[0], // form
				[$('.form-active [name="point-lat"]').val(),$('.form-active [name="point-lng"]').val()], // coords
				layers, // layers
				$('.form-active [name="type"]').val(), // type
				$('.form-active [name="capacity"]').val(), // capacity
				attr // attr
			)
		} 
		// ++ if item DOES exist in D.stormwaterControls
		else {
			D.updateStormwaterControl(
				triggerId, // index
				form[0], // form
				[$('.form-active [name="point-lat"]').val(),$('.form-active [name="point-lng"]').val()], // coords
				layers, // layers
				$('.form-active [name="type"]').val(), // type
				$('.form-active [name="capacity"]').val(), // capacity
				attr // attr
			)
		}
		
		// disable form
		disableForm(form)
		$(form).find('.commit-button').hide()
		
		// change form element status
		form.removeClass('form-active').addClass('form-closed')
		form.parent().removeClass('prototype-active').addClass('prototype')
		
		// show selector and edit buttons
		$('.edit-button').removeAttr('disabled').show()
		$('#new-scm-selector .dropdown-toggle').removeClass('disabled').attr('aria-disabled','false')
		//$('.form-closed tbody td').css('color','#669')
		
		// update discount estimate
		updateEstimateView()
	}
	
	// ++ update json string on final submit
}

function editSCM(t){
	triggerId = id(t)
	
	// check that no active form exists
	if ($('.form-active').length == 0) {
		// hide selector and other edit buttons and final submit button
		$('.edit-button').attr('disabled','disabled')
		$('#new-scm-selector .dropdown-toggle').addClass('disabled').attr('aria-disabled','true')
		
		// create temp copy of target form
		revertForm = $('.prototype#scm-'+triggerId).clone()
		
		// re-enable all inputs and buttons on the appropriate form
		prototype = $('.prototype#scm-'+triggerId)
		enableForm(prototype)
		prototype.find('.commit-button').show()
		prototype.find('.edit-button').hide()
		
		// mark prototype and form as active again
		prototype.removeClass('prototype').addClass('prototype-active')
		prototype.find('form').removeClass('form-closed').addClass('form-active')
		
		// update discount estimate
		updateEstimateView()
	}
}

function cancelSCM(t){
	triggerId = id(t)
	
	// if item does not exist in D.stormwaterControls:
	if (!D.stormwaterControls[triggerId]) {
		// remove form
		$('.prototype-active').remove()
		
		// destroy layers
		destroyLayers(id(t))
	}
	// if item does exist in D.stormwaterControls ... return to stored values
	else {
		revertForm.insertAfter('.prototype-active')
		$('.prototype-active').remove()
		// ++ add layer handling
	}
	
	// show new SCM selector and edit buttons
	$('.edit-button').removeAttr('disabled')
	$('.edit-button').show()
	$('#new-scm-selector .dropdown-toggle').removeClass('disabled').attr('aria-disabled','false')
	//$('.form-closed tbody td').css('color','#669')
}

function deleteSCM(t){
	triggerId = id(t)
	
	D.removeStormwaterControl(triggerId)
	
	$('#scm-'+triggerId).remove()
	
	// destroy layers
	destroyLayers(triggerId)
	
	// update discount estimate
	updateEstimateView()
	
	// ++ check if D.stormwaterControls length is 0, if so, hide overall form submit button
}


// add to userLayers
function addUserLayer(layer,id,name){
	userLayers['scm-'+id][name] = layer
	userLayers.all[name+'-'+id] = layer
	layer.options.userLayersIndex = name+'-'+id
}

// delete a single layer from trigger element
function deleteUserLayerTrigger(t){
	measureName = $(t).attr('name')
	triggerId = id(t)
	if (!!userLayers.all[measureName+'-'+triggerId]) {
		userLayers.all[measureName+'-'+triggerId].remove()
		delete userLayers.all[measureName+'-'+triggerId]
		delete userLayers['scm-'+triggerId][measureName]
	}
}

// destroy layers (for a given SCM)
function destroyLayers(i){
	delete userLayers['scm-'+i]
	$.each(userLayers.all,function(k,v){
		arr = k.split('-')
		itemId = arr[arr.length - 1]
		if (itemId == i) {
			userLayers.all[k].remove()
			delete userLayers.all[k]
		}
	})
}

// add static object size method to object class
// attribution SE user James Coglan: https://stackoverflow.com/questions/5223/length-of-a-javascript-object
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

// update discount estimate
function updateEstimateView() {
	if (Object.size(D.scm) == 0) {
		$('.estimate-text').hide()
	} else {
		$('.estimate-text').show()
		estimate = D.calculateDiscount()
		$('#discount-estimate-amount').html('$'+estimate.discount)
		$('#discount-estimate-charge').html('$'+estimate.DUFAfterDiscount)
	}
}

function id(t){
	return $(t).attr('scmid')
}

function enableForm(t){
	$(t).find('.card').addClass('shadow')
	$(t).find('.card-header').addClass('bg-primary text-light')
	$(t).find('.card-body').removeClass('text-muted')
	$(t).find('input,button,select,.btn').removeAttr('disabled')
	$(t).attr('disabled')
}

function disableForm(t){
	$(t).find('.card').removeClass('shadow')
	$(t).find('.card-header').removeClass('bg-primary text-light')
	$(t).find('.card-body').addClass('text-muted')
	$(t).find('input,button,select,.btn').attr('disabled','disabled')
}

function getIdFromTrigger(t){
	triggerNameArr = $(t).attr('name').split('-')
	triggerId = triggerNameArr[triggerNameArr.length - 1]
	return triggerId
}

var json = []
function updateUserGeometryField(){
	//var json = []
	$.each(userLayers.all,function(i,v){
		newIndex = json.push(v.toGeoJSON()) - 1
		json[newIndex].properties.name = v.options.userLayersIndex
		
	})
	str = JSON.stringify(json)
	console.log(str)
	$('input[name="user-geometry"]').attr('value',str)
}

function calcGardenCapacity(t) {
	triggerId = id(t)
	a = $('#scm-'+triggerId+' [name="area"]').val()
	d = $('#scm-'+triggerId+' [name="depth"]').val()
	if(!isNaN(a*d)) {
		gal = Math.round(a*(d/12)*7.481)
		target = $('#scm-'+triggerId+' [name="capacity"]')
		target.val(gal)
		evalCondition(target,'> 0')
	}
}

// VALIDATION RULES

// rewrite default error placement
// attribution SE user Yevgeniy Afanasyev: https://stackoverflow.com/questions/6545964/jquery-validation-error-placement
$.validator.setDefaults({
    errorPlacement: function(error, element) {
        element.addClass('error');
        var name = element.attr('name');
        var errorSelector = '.form-active .error-message[for="' + name + '"]';
        var $element = $(errorSelector);
        if ($element.length) { 
            $(errorSelector).html(error.html());
        } else {
            error.insertAfter(element);
        }
    },
    success : function(element) {
		element.removeClass('error').remove('error');
		var name = element.attr('name');
        var errorSelector = '.form-active .error-message[for="' + name + '"]';
        var $element = $(errorSelector);
        if ($element.length) { 
            $(errorSelector).html('');
        }
	}
});

$('.form-tank').validate({
	ignore: [],
    rules: {
        'point-latlng': {
            minlength: 1,
            required: true
        },
        'capacity': {
            required: true,
            min: 30
        },
        'area-drained': {
            minlength: 1,
            required: {
	            depends: function(element) {
		            return $('[name="capacity"]').val() > 250;
	            }
            }
            // number only
            // only required if capacity > 250
        },
        'ictype': {
	        required: true
        }
    }
    /*errorPlacement: function(error, element) {
      var placement = $(element).data('error');
      if (placement) {
        $(placement).parent().append(error)
      } else {
        $(element).parent().append('<br>').append(error);
      }
    },
    errorPlacement: function(error, element) { 
      element.addClass('error');
      $('[name="point-latlng"]').closest('.form-group').find('.error-message').html(error);
    },
    errorLabelContainer: '.error-message', 
    highlight: function (element) {
        $(element).addClass('nonvalid')
        .closest('.form-group').removeClass('error');
    }
    success: function (element) {
        //element.addClass('valid')
        //.closest('.form-group').removeClass('error');
        element.remove('error');
        
        /* file upload test
        var file_data = $('#file').prop('files')[0];
        var form_data = new FormData();
        form_data.append('file', file_data);
        $.ajax({
            url: 'http://localhost/ci/index.php/welcome/upload', // point to server-side controller method
            dataType: 'text', // what to expect back from the server
            cache: false,
            contentType: false,
            processData: false,
            data: form_data,
            type: 'post',
            success: function (response) {
                $('#msg').html(response); // display success response from the server
            },
            error: function (response) {
                $('#msg').html(response); // display error response from the server
            }
        });*/
})

$('.form-garden').validate({
	ignore: [],
    errorPlacement: function(error, element) { 
      element.addClass('error');
    },
    highlight: function (element) {
        $(element).addClass('nonvalid')
          .closest('.form-group').removeClass('error');
    },
    success: function (element) {
          element.remove('error');
    }
})