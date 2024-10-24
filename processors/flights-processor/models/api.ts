export interface DebeziumResponse<Data extends object> {
    payload: {
        after: Data
    }
}

export interface FlightsResponse {
    date: number;
    lat: number;
    lng: number;
}