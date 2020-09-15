// core-populate-tables.js


imperviousCoverCountAll = 0; // for numbering ic rows
imperviousCoverCountEdited = 0; // for display feature count when no edits features hidden

function populateTables() {
	d.parcelCollection.forEach(function (f) {
		
		// default increases (default)
		f.dufEstimate.changeType = '<b>increases by '+f.dufEstimate.change+'</b>, from '+f.dufEstimate.original+' to <span class="new-duf">'+f.dufEstimate.edited+'</span>,'
		
		// correct order of negative and dollar sign
		if (f.dufEstimate.change.includes('-')) {
			f.dufEstimate.change = '$'+ f.dufEstimate.change.substr(2,f.dufEstimate.change.length-2)
			f.dufEstimate.changeType = '<b>decreases by '+f.dufEstimate.change+'</b>, from '+f.dufEstimate.original+' to <span class="new-duf">'+f.dufEstimate.edited+'</span>,'
		} else if (f.dufEstimate.change == '$0.00') {
			f.dufEstimate.changeType = '<b>does not change from <span class="new-duf">'+f.dufEstimate.original+'</span>,'
		}
		
		$('.collection-parcel').append('\
			<div class="card shadow-sm dp'+f.dufPolyId+'" onclick="selectFeature(0,\'dp'+f.dufPolyId+'\');" style="cursor:pointer">\
				<div class="card-header" id="card-dp'+f.dufPolyId+'">\
					'+f.addressLabel+'\
				</div>\
				<div class="card-body">\
					<div class="alert alert-info">The drainage charge of this parcel '+f.dufEstimate.changeType+' with the proposed edits.</div>\
					<table class="table table-sm table-va-middle mb-0">\
						<thead>\
							<tr>\
								<th>&nbsp;</th>\
								<th>Original</th>\
								<th>New</th>\
								<th>Change</th>\
							</tr>\
						</thead>\
						<tbody>\
							<tr>\
								<td data-toggle="tooltip" data-placement="top" title="Sum of all impervious area for which a parcel\'s owner is responsible">Impervious area <small class="text-muted">sq. ft.</small></td>\
								<td class="numeric">'+f.imperviousArea.original+'</td>\
								<td class="numeric new-impervious-area">'+f.imperviousArea.edited+'</td>\
								<td class="numeric bold">'+f.imperviousArea.change+'</td>\
							</tr>\
							<tr>\
								<td data-toggle="tooltip" data-placement="top" title="Area of the parcel in square feet, based on the parcel shape from the relevant tax appraisal district">Billable area <small class="text-muted">sq. ft.</small></td>\
								<td class="numeric">'+f.billableArea.original+'</td>\
								<td class="numeric new-billable-area">'+f.billableArea.edited+'</td>\
								<td class="numeric bold">'+f.billableArea.change+'</td>\
							</tr>\
							<tr>\
								<td data-toggle="tooltip" data-placement="top" title="Impervious area divided by billable area multiplied by 100">Impervious percent</td>\
								<td class="numeric">'+f.imperviousPercent.original+'</td>\
								<td class="numeric">'+f.imperviousPercent.edited+'</td>\
								<td class="numeric bold">'+f.imperviousPercent.change+'</td>\
							</tr>\
						</tbody>\
					</table>\
				</div>\
			</div><br>\
		');
		
		// IMPERVIOUS COVER
		d.imperviousCoverCollection.forEach(function (i) {
			if(i.area.change!=0){effAreaChg = i.area.change} else {effAreaChg = ''}
			// GROUP IC BY DUF POLY ID, ONLY WRITE IC ASSIGNED TO ACTIVE DUF POLY
			if (i.dufPolyId.effective == f.dufPolyId) {
				
				// count edited features
				if(i.editType != 'No edits') {imperviousCoverCountEdited++}
				imperviousCoverCountAll++;
				
				if (i.feature.edited != '') {featureEffective = i.feature.edited} else {featureEffective = i.feature.original}
				
				// tooltip help texts
				rowTitle = {
					'feature': '<li class="list-group-item"><h6><span data-toggle="tooltip" data-placement="top" title="Category to which the impervious cover feature belongs">Type</span></h6>',
					'area': '<li class="list-group-item"><h6><span data-toggle="tooltip" data-placement="top" title="Area of the feature in sqaure feet, not including any reduction from 50% imperviousness">Area <small class="text-muted">sq. ft.</small></span></h6>',
					'percentImpervious': '<li class="list-group-item"><h6><span data-toggle="tooltip" data-placement="top" title="Describes how impervious a feature is and how much is counted as impervious cover (e.g., a 100 sq. ft., 50% impervious feature adds 50 sq. ft. impervious cover)">Imperviousness</span></h6>',
					'exclusionReason': '<li class="list-group-item"><h6><span data-toggle="tooltip" data-placement="top" title="The reason an impervious cover feature is not counted in the overall sum, if applicable">Exclusion Reason</span></h6>',
					'dufPolyId': '<li class="list-group-item"><h6><span data-toggle="tooltip" data-placement="top" title="The ID number of the parcel to which an impervious cover feature is assigned">Parcel ID</span></h6>'
				}
				
				// basic header
				var cardContent = '\
				<div class="card shadow-sm ic'+i.imperviousCoverId+' editType-'+i.editType.split(' ')[0]+'">\
					<div class="card-header" id="card-ic'+i.imperviousCoverId+'" onclick="selectFeature(1,\'ic'+i.imperviousCoverId+'\');" onmouseover="$(this).addClass(\'shadow-lg text-primary\')" onmouseout="$(this).removeClass(\'shadow-lg text-primary\')"'+ //>';
				 'data-toggle="collapse-off" data-target="#collapse-ic'+i.imperviousCoverId+'" aria-expanded="false" aria-controls="collapse-ic'+i.imperviousCoverId+'" style="cursor:pointer">';
				
				if (i.editType != 'Created') {
					// badge color
						badgeColor = 'primary'
						if (i.editType == 'Deleted') {badgeColor = 'danger';i.area.edited = '0'} else if (i.editType == 'No edits') {badgeColor = 'secondary'};
					// header
						cardContent += '<span class="ic-feature-count">'+imperviousCoverCountAll+'</span>. '+featureEffective+' <span class="badge float-lg-right badge-'+badgeColor+'">'+i.editType+'</span></div>\
						<ul id="collapse-ic'+i.imperviousCoverId+'" class="collapse list-group list-group-flush" aria-labelledby="card-ic'+i.imperviousCoverId+'" data-parent="#icAccordion">';
					// type
						cardContent += rowTitle.feature
						if (i.feature.change == 'change-mark') {cardContent += '<i class="change-mark"></i><strike>'+i.feature.original+'</strike> &#8594; '+i.feature.edited} else {cardContent += i.feature.original};
						cardContent += '</li>'
					// area
						cardContent += rowTitle.area
						if (i.area.change != 0) {cardContent += '<i class="change-mark"></i><strike>'+i.area.original+'</strike> &#8594; '+i.area.edited+' ('+i.area.change+')'} else {cardContent += i.area.original};
						cardContent += '</li>'
					// imperviousness
						cardContent += rowTitle.percentImpervious
						if (i.percentImpervious.change == 'change-mark') {cardContent += '<i class="change-mark"></i><strike>'+i.percentImpervious.original+'</strike> &#8594; '+i.percentImpervious.edited} else {cardContent += i.percentImpervious.original};
						cardContent += '</li>'
					// exclusion
						cardContent += rowTitle.exclusionReason
						if (i.exclusionReason.change == 'change-mark') {cardContent += '<i class="change-mark"></i><strike>'+i.exclusionReason.original+'</strike> &#8594; '+i.exclusionReason.edited} else {cardContent += i.exclusionReason.original};
						cardContent += '</li>'
					// parcel
						//cardContent += rowTitle.dufPolyId
						//if (i.dufPolyId.change == 'change-mark') {cardContent += '<i class="change-mark"></i><strike>'+i.dufPolyId.original+'</strike> &#8594; '+i.dufPolyId.edited} else {cardContent += i.dufPolyId.original};
						//cardContent += '</li>'
				} else if (i.editType == 'Created') {
					// header
						cardContent += '<span class="ic-feature-count">'+imperviousCoverCountAll+'</span>. '+featureEffective+' <span class="badge float-lg-right badge-success">'+i.editType+'</span></div>\
						<ul id="collapse-ic'+i.imperviousCoverId+'" class="collapse list-group list-group-flush" aria-labelledby="card-ic'+i.imperviousCoverId+'" data-parent="#icAccordion">';
					// type
						cardContent += rowTitle.feature+i.feature.edited+'</li>'
					// area
						cardContent += rowTitle.area+i.area.edited+'</li>'
					// imperviousness
						cardContent += rowTitle.percentImpervious+i.percentImpervious.edited+'</li>'
					// exclusion
						cardContent += rowTitle.exclusionReason+i.exclusionReason.edited+'</li>'
					// parcel
						//cardContent += rowTitle.dufPolyId+i.dufPolyId.edited+'</li>'
				}
				
				cardContent += '</ul></div></div></div>';
				
				$('.collection-ic').append(cardContent);
			}
		});
	});
	
	// DOC READY INITS
	$(function(){
	    // enable card tool tips
		$('.card [data-toggle="tooltip"]').tooltip({container:'body'}).append(' <i class="fa fa-question-circle" style="opacity:0.3"></i>')
		
		// hide no edits on default, enable show toggle
		$('#showNoEdits').on('change',function(){
			if (this.checked) {
				$('.collection-ic').append($('.collection-ic-hide .card'))
				$('#count-ic-features').html(imperviousCoverCountAll) 
			} else { 
				$('.collection-ic-hide').append($('.collection-ic .badge-secondary').closest('.card'))
				$('#count-ic-features').html(imperviousCoverCountEdited) 
			}
		}).change()
		
		// IC tooltip on card header hover
		$('.collection-ic-generic .card-header').on('mouseover',function(){
		    target = l[$(this).attr('id').split('-')[1]+mapStates[1]]
		    if(!target._popup.isOpen()) target.openTooltip();
		}).on('mouseout',function(){
		    l[$(this).attr('id').split('-')[1]+mapStates[1]].closeTooltip()
		})
				
		// highlight ic card rows with changes
		$('.editType-Updated .change-mark').parent().addClass('list-group-item-primary');
		
	    // feature counts
		$('#count-parcels').html(d.parcelCollection.length)
		//$('#count-ic-features').html(d.imperviousCoverCollection.length) 
	});
} // end func populateTables