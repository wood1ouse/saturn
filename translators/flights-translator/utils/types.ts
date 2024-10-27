import { FlightState, FlightStateKeys } from "../models/api";

export const toHaveCoordinates = (
	state: FlightState,
): state is FlightState & {
	[FlightStateKeys.LONGITUDE]: number;
	[FlightStateKeys.LATITUDE]: number;
} =>
	state[FlightStateKeys.LONGITUDE] !== null &&
	state[FlightStateKeys.LATITUDE] !== null;
