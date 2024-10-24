import { point } from '@turf/helpers';
import { Feature, Point } from 'geojson';

export class GeoJSONService {
    static toPointGeoJSON(lat: number, lng: number): Feature<Point> {
        return point([lat, lng])
    }
}