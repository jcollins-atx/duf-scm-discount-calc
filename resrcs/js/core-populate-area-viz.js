// core-populate-area-viz.js

// global helper vars
var areaVizCombineThreshold = 2, // default: 1 (1%) - features less than this percent of total edited parcel impervious area will be combined into "additional small features"
	areaVizForcesState = null, // default: null (alt: EDITED, ORIGINAL) - when clicking viz segments, do not force the map ic layer into a particular state (EDITED or ORIGINAL)
	areaVizEnabled = false; // default (DO NOT EDIT): false - global area viz enabled var to support ic layer toggling


// check diff indicator - if not enough room to properly display diff indicator (text line breaks), will be hidden
function checkDiffIndicator(){
	di = $('.diff-indicator')
	if(di.height() != $('.original-ref').height()){di.css('opacity',0)}else{di.css('opacity',1)}
}

// check axis labels - simplify or hide if edited bar width is too small
function checkAxisLabels(){
	
	w = $('.area-viz-scale-wrap').width();
	if(w < 200 && w >= 95){
		$('.tick-25,.tick-75').hide();
		$('.tick-50,.tick-100').show().css('width','50%');
		$('.tick-50').addClass('first');
		$('.axis-label').show();
	} else if (w < 95) {
		$('.percent-tick').hide();
		$('.axis-label').hide();
	} else {
		$('.percent-tick').show().css('width','25%');
		$('.tick-50').removeClass('first');
		$('.axis-label').show();
	}
}

// populate area viz
function populateAreaViz() {
	parcel = d.parcelCollection[0];
	
	// check that it is appropriate to show area viz (enabled by generator, one parcel, change in pacel IC, parcel has some IC)
	if (d.options.showAreaViz == 'y' && d.parcelCollection.length == 1 && parcel.imperviousArea.change.toString() != '0' && parcel.imperviousArea.edited.toString() != '0') {
		areaVizEnabled = true; // set global var, used elsewhere
		
		// clean parcel variables
		parcelAreaEffectiveInt = parseInt(parcel.imperviousArea.effective.replace(/,/g, ''));
		parcelAreaOriginalInt = parseInt(parcel.imperviousArea.original.replace(/,/g, ''));
		
		// helper vars for combining small features
		var percentSum = 0,
			areaSum = 0;
			
		// add effective percent of total attr
		d.imperviousCoverCollection.forEach(function (f) {
			f.area.effectivePercentOfTotal = 0;
			if (f.editType != 'Deleted' && f.exclusionReason.edited == "None") {
				featureEffectiveAreaInt = parseInt(f.area.effective.toString().replace(/,/g, ''));
				featureEffectivePercentFloat = parseFloat(f.percentImpervious.effective.replace(/%/g, ''))/100;
				fEffectiveAreaNum = featureEffectiveAreaInt*featureEffectivePercentFloat;
				fEffectiveAreaStr = fEffectiveAreaNum.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
				f.area.effectiveAreaWithPercentNum = fEffectiveAreaNum;
				f.area.effectiveAreaWithPercentStr = fEffectiveAreaStr;
				f.area.effectivePercentOfTotal = (featureEffectiveAreaInt/parcelAreaEffectiveInt*100*featureEffectivePercentFloat);
			}
		});
		
		// sort by effective percentage of total
		d.imperviousCoverCollection.sort(function(a,b){
		    return a.area.effectivePercentOfTotal - b.area.effectivePercentOfTotal
		});
		
		// add segments
		d.imperviousCoverCollection.forEach(function (f) {
			p = f.area.effectivePercentOfTotal;
			if (p>areaVizCombineThreshold){
				p = p.toFixed(0);
				percentSum += parseFloat(p);
				areaSum += f.area.effectiveAreaWithPercentNum;
				// color based on edit type
				if (f.editType == 'Created') {indicateEdit = '#28a745'} else
				if (f.editType == 'Deleted') {indicateEdit = '#dc3545'} else
				if (f.editType == 'No edits') {indicateEdit = '#6c757d'} 
				else {indicateEdit = '#007bff'}
				// create area viz element
				$('.area-viz-edited-segment-wrapper').prepend('<div class="area-viz-spacer" style="display:inline-block;width:.5%"></div>'); // EXPERIMENTAL, REPLACE BORDER WITH SPACER (search +areavizspacer+)
				$('.area-viz-edited-segment-wrapper').prepend('<div class="ic'+f.imperviousCoverId+'" onclick="selectFeature(1,\'ic'+f.imperviousCoverId+'\','+areaVizForcesState+');" style="height: inherit;width:'+(p-.5)+ //+areavizspacer+
				'%;background:'+f.symbol.edited+';border-bottom:4px solid '+indicateEdit+'" title="&lt;b&gt;'+f.feature.effective+'&lt;/b&gt;, effective area &lt;b&gt;'+f.area.effectiveAreaWithPercentStr+' sq. ft.&lt;/b&gt;, '+p+'% of new impervious area" data-toggle="tooltip" data-placement="top" data-html="true"><i> </i></div>');
			}
		});
		percentSum = 100-percentSum;
		areaSum = (parcelAreaEffectiveInt-areaSum).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
		if(percentSum>0) { 
			$('.area-viz-edited-segment-wrapper').append('<div style="height: inherit;width: '+(percentSum-0.15)+'%;background: #ccc;cursor:default" title="&lt;b&gt;Small features&lt;/b&gt;, combined effective  area &lt;b&gt; '+areaSum+' sq. ft.&lt;/b&gt;, '+percentSum.toFixed(0)+'% of new impervious area &lt;!--(less than '+areaVizCombineThreshold+'% each)--&gt;" data-toggle="tooltip" data-placement="top" data-html="true"><i> </i></div>');
		} else {
			$('.area-viz-edited-segment-wrapper').find('.area-viz-spacer').last().remove()
		}
		
		// set element widths
		// if IC was reduced (edited less than original)
		if (parcel.imperviousArea.edited < parcel.imperviousArea.original) {
			pDiff = parcelAreaEffectiveInt/parcelAreaOriginalInt*100;
			$(".original-ref").width("100%");
			$(".area-viz-scale-wrap").css('width',(pDiff+"%"));
			$(".diff-indicator").css('width',(100-pDiff)+"%");
			checkDiffIndicator();
			
			// expand edited bar on hover
			$('.area-viz').hover(function(){
					$('.area-viz-label').stop(true,false).animate({display:'none'},0);
					$('.area-viz-scale-wrap').stop(true,false).animate({width:'100%'},100,function(){checkAxisLabels()});
				},function(){ 
					$('.area-viz-scale-wrap').stop(true,false).animate({width:pDiff+'%'},100,function(){checkAxisLabels()});
				}
			);
		// if IC increased (edited more than original)
		} else {	
			pDiff = parcelAreaOriginalInt/parcelAreaEffectiveInt*100;
			$(".original-ref").css("width",pDiff+"%");
			$(".area-viz-scale-wrap").css("width","100%");
			$(".diff-indicator").hide();
		}
		
		// hide edited bar label on hover
		$('.area-viz').hover(function(){
				$('.area-viz-label').stop(true,false).hide();
			},function(){
				$('.area-viz-label').stop(true,false).show();
			}
		);
		
		// IC tooltip on card header hover
		/*$('.area-viz-edited-segment-wrapper div[class]').on('mouseover',function(){
		    l[$(this).attr('class')+mapStates[1]].openTooltip()
		}).on('mouseout',function(){
		    l[$(this).attr('class')+mapStates[1]].closeTooltip()
		})*/
		
		// populate static labels
		$('#area-viz-total-ic-old').html(parcel.imperviousArea.original);
		$('#area-viz-total-ic-change').html(parcel.imperviousArea.change);
		$('#area-viz-total-ic-new').html(parcel.imperviousArea.edited);
		
		// manage helptext
		/*$('.area-viz-edited-segment-wrapper div:not(.selected)').on('mouseover',function(){
			$('.area-viz-edited-segment-wrapper .selected').tooltip('hide');
		})
		$('.area-viz-edited-segment-wrapper').on('mouseout',function(){
			$('.area-viz-edited-segment-wrapper .selected').tooltip('show');
		});*/
		
		// init tooltips
		$('.area-viz-edited-segment-wrapper [data-toggle="tooltip"]').tooltip({container:'body'})
	
	// if length of duf poly list not 1, hide the viz
	} else {
		$('.area-viz').hide();
	}
} // end func populateAreaViz