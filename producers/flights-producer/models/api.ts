type FlightState = [
	string, // 0: ICAO 24-bit address (e.g., "a4754b")
	string | null, // 1: Call sign (e.g., "N387A   ") - can be null if no call sign was received
	string, // 2: Origin country (e.g., "United States")
	number | null, // 3: Time of last position update in seconds since epoch - can be null
	number | null, // 4: Time of last contact in seconds since epoch
	number | null, // 5: Longitude in decimal degrees - can be null
	number | null, // 6: Latitude in decimal degrees - can be null
	number | null, // 7: Barometric altitude in meters - can be null
	boolean, // 8: Whether it's on ground
	number | null, // 9: Velocity in m/s - can be null
	number | null, // 10: True track in degrees clockwise from north - can be null
	number | null, // 11: Vertical rate in m/s - can be null
	number[] | null, // 12: Sensors (array of int IDs) - can be null
	number | null, // 13: Geometric altitude in meters - can be null
	string | null, // 14: Squawk code - can be null
	boolean, // 15: Special purpose indicator (SPI) - true if active
	number, // 16: Position source (0 = ADS-B, 1 = ASTERIX, 2 = MLAT, 3 = FLARM)
	number, // 17: Category (0 = No info, 1 = No ADS-B, 2 = Light, etc.)
];

export interface Response {
	time: number;
	states: FlightState[];
}

export const openApiEndpoints = {
	states: {
		all: "https://opensky-network.org/api/states/all?lamin=45.8389&lomin=5.9962&lamax=47.8229&lomax=10.5226",
	},
};
