import axios from "axios";
import { openApiEndpoints, Response } from "../models/api";

export class OpenSkyService {
	static async getStates(): Promise<Response> {
		const response = await axios.get<Response>(openApiEndpoints.states.all, {
            auth: {
                username: 'woodlouse',
                password: 'openskypassword'
            }
        });

		return response.data;
	}
}
