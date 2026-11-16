import { ApiResponse } from "../utils/api-response.js"
import { asyncHandler } from "../utils/async-handler.js"

// const healthCheckFunction = (req, res) => {
//     try {
//         res.status(200).json(
//             new ApiResponse(200, {message: "Server is running"})
//         )
//     } catch (err) {
        
//     }
// }

const healthCheckFunction = asyncHandler(async (req, res) => {
    res.status(200)
        .json(
            new ApiResponse(200, {message: "Server is not running"})
        );
})

export {healthCheckFunction}