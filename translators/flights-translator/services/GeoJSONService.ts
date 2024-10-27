import { feature, featureCollection } from "@turf/helpers";
import { FeatureCollection, Point } from "geojson";

import {
	FlightStateKeys,
	FlightStateProperties,
	Response,
} from "../models/api";
import { toHaveCoordinates } from "../utils/types";

export class GeoJSONService {
	static toFlightsPositionFeatureCollection(
		response: Response,
	): FeatureCollection<Point, FlightStateProperties> {
		const features = response.states.filter(toHaveCoordinates).map((state) => {
			return feature(
				{
					type: "Point",
					coordinates: [
						state[FlightStateKeys.LONGITUDE],
						state[FlightStateKeys.LATITUDE],
					],
				},
				{
					icao: state[FlightStateKeys.ICAO24],
					callsign: state[FlightStateKeys.CALLSIGN],
					origin_country: state[FlightStateKeys.ORIGIN_COUNTRY],
					time_position: state[FlightStateKeys.TIME_POSITION],
					last_contact: state[FlightStateKeys.LAST_CONTACT],
					baro_altitude: state[FlightStateKeys.BARO_ALTITUDE],
					on_ground: state[FlightStateKeys.ON_GROUND],
					velocity: state[FlightStateKeys.VELOCITY],
					true_track: state[FlightStateKeys.TRUE_TRACK],
					vertical_rate: state[FlightStateKeys.VERTICAL_RATE],
					sensors: state[FlightStateKeys.SENSORS],
					geo_altitude: state[FlightStateKeys.GEO_ALTITUDE],
					squawk: state[FlightStateKeys.SQUAWK],
					spi: state[FlightStateKeys.SPI],
					position_source: state[FlightStateKeys.POSITION_SOURCE],
					category: state[FlightStateKeys.CATEGORY],
				},
			);
		});
		return featureCollection<Point, FlightStateProperties>(features);
	}
}
