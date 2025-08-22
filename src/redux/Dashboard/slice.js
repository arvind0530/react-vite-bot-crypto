import { createSlice } from "@reduxjs/toolkit"
// import { useNavigate } from "react-router-dom";
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, tokens, token } = action.payload
      state.user = user
      return
    },
    serverError: (state, action) => {
      state.serverError = action.payload
      return
    },
  },
})

export const { setCredentials, logOut, setUserProfile, serverError } =
  authSlice.actions

export default authSlice.reducer

export const selectCurrentUser = state => state.auth.user
