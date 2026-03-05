package com.feasto.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPartnerAvailabilityDTO {

    private Boolean available;
    private LocationDTO currentLocation;
	public Boolean getAvailable() {
		return available;
	}
	public void setAvailable(Boolean available) {
		this.available = available;
	}
	public LocationDTO getCurrentLocation() {
		return currentLocation;
	}
	public void setCurrentLocation(LocationDTO currentLocation) {
		this.currentLocation = currentLocation;
	}

}
