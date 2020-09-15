class stormwaterControl {
	constructor(
		index,
		form,
		coordinates,
		layers,
		type,
		capacity,
		attr
	) {
		this.index = index;
		this.form = form;
		this.coordinates = coordinates;
		this.layers = layers;
		this.type = type;
		this.capacity = capacity;
		this.icMitigated = null;
		this.offsiteMitigated = null;
		this.attr = attr;
	}
	
	_getCoordinates() {
		return this.coordinates
	}
}

class stormwaterDiscount {
	
	constructor(
		billableArea,
		imperviousArea,
		drainageCharge
	) {
		this.billableArea = billableArea;
		this.imperviousArea = imperviousArea;
		this.drainageCharge = drainageCharge;
		this.discount = null;
		this.stormwaterControls = {};
		this.index = 1;
		this.dufRates = {
			baseRate: 0.004980,
			afConst1: 1.542500,
			afConst2: 0.193300,
		}
	}
	
	addStormwaterControl (
		index,
		form,
		coordinates,
		layers,
		type,
		capacity,
		attr
	) {
		this.stormwaterControls[index] = new stormwaterControl(index,form,coordinates,layers,type,capacity,attr);
		return this.stormwaterControls[index];
	}
	
	updateStormwaterControl (
		index,
		form,
		coordinates,
		layers,
		type,
		capacity,
		attr
	) {
		delete this.stormwaterControls[index];
		this.stormwaterControls[index] = new stormwaterControl(index,form,coordinates,layers,type,capacity,attr);
		return this.stormwaterControls[index];
	}
	
	removeStormwaterControl (index) {
		delete this.stormwaterControls[index]
	}
	
	get scm () {
		return this.stormwaterControls
	}
	
	calculateDiscount() {
		// for each stormwater control
		var actualICMitigatedTotal = 0;
		
		$.each(this.stormwaterControls,function(i,o){
			// determine the potential eligible ic area mitigated
			o.tieredCapacity = [0,0,0]
			var capacityInt = parseInt(o.capacity)
			if (capacityInt <= 10000) {
				o.tieredCapacity[0] = capacityInt
			} else if (capacityInt > 10000 && capacityInt <= 100000) {
				o.tieredCapacity[0] = 10000
				o.tieredCapacity[1] = capacityInt-10000
			} else {
				o.tieredCapacity[0] = 10000
				o.tieredCapacity[1] = 90000
				o.tieredCapacity[2] = capacityInt-100000
			}
			o.potentialICMitigated = 	o.tieredCapacity[0]*0.6 +
										o.tieredCapacity[1]*0.2 +
										o.tieredCapacity[2]*0.1;
			
			// compare to actual ic area mitigated
			// return ic area mitigated value
			if (o.type == 'tank' && capacityInt <= 250) {
				o.actualICMitigated = o.potentialICMitigated
			} else if (o.attr['area-drained'] < o.potentialICMitigated) {
				o.actualICMitigated = o.attr['area-drained']
			} else {
				o.actualICMitigated = o.potentialICMitigated
			}
			
			// sum the total ic area actually mitigate
			actualICMitigatedTotal += o.actualICMitigated
		})
		
		this.actualICMitigatedTotal = parseFloat(actualICMitigatedTotal);
		
		// take half the ic area at parcel
		this.ICEligible = Math.round(parseFloat(this.imperviousArea)/2);
		
		// compare the actual ic mitigate and half ic at parcel
		if (this.ICEligible <= this.actualICMitigatedTotal) {
			this.ICAfterReduction = this.ICEligible
		} else {
			this.ICAfterReduction = this.imperviousArea - this.actualICMitigatedTotal
		}
		
		// recalculate duf, calculate difference
		this.DUFAfterDiscount = this.calculateDUF(this.billableArea,this.ICAfterReduction).toFixed(2)
		
		this.discount = (parseFloat(this.drainageCharge) - parseFloat(this.DUFAfterDiscount)).toFixed(2) ;
		
		return {
			'discount': this.discount,
			'DUFAfterDiscount': this.DUFAfterDiscount
		}
	}
	
	calculateDUF(billableArea,imperviousArea) {
		return parseFloat(
			(
				this.dufRates.baseRate * 
				imperviousArea * 
				parseFloat((
					this.dufRates.afConst1 * 
					parseFloat((imperviousArea/billableArea).toFixed(4)) + 
					this.dufRates.afConst2
				).toFixed(6))
			).toFixed(2)
		)
	}
}