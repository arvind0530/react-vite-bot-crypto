import { configureStore } from "@reduxjs/toolkit"
import { apiSlice } from "./api.js"
import authReducer from "./Dashboard/slice"
const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
     auth:authReducer, // Assuming you have an authReducer
    // Add other reducers here if needed
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      apiSlice.middleware,
     
    ),
  devTools: true,
})
export default store
