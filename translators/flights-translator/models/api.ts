export type FlightState = [
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

export enum FlightStateKeys {
	ICAO24 = 0, // 0: ICAO 24-bit address
	CALLSIGN = 1, // 1: Call sign
	ORIGIN_COUNTRY = 2, // 2: Origin country
	TIME_POSITION = 3, // 3: Time of last position update
	LAST_CONTACT = 4, // 4: Time of last contact
	LONGITUDE = 5, // 5: Longitude
	LATITUDE = 6, // 6: Latitude
	BARO_ALTITUDE = 7, // 7: Barometric altitude
	ON_GROUND = 8, // 8: On ground indicator
	VELOCITY = 9, // 9: Velocity
	TRUE_TRACK = 10, // 10: True track
	VERTICAL_RATE = 11, // 11: Vertical rate
	SENSORS = 12, // 12: Sensors
	GEO_ALTITUDE = 13, // 13: Geometric altitude
	SQUAWK = 14, // 14: Squawk code
	SPI = 15, // 15: Special purpose indicator
	POSITION_SOURCE = 16, // 16: Position source
	CATEGORY = 17, // 17: Aircraft category
}

export interface FlightStateProperties {
	icao: string;
	callsign: string | null;
	origin_country: string;
	time_position: number | null;
	last_contact: number | null;
	baro_altitude: number | null;
	on_ground: boolean;
	velocity: number | null;
	true_track: number | null;
	vertical_rate: number | null;
	sensors: number[] | null;
	geo_altitude: number | null;
	squawk: string | null;
	spi: boolean;
	position_source: number;
	category: number;
}

export interface Response {
	time: number;
	states: FlightState[];
}
