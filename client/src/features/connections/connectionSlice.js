import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  connections: [],
  pendingConnections: [],
  followers: [],
  following: [],
};


export const fetchConnections = createAsyncThunk(
  "connection/fetchConnections",
  async (token, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/user/connections", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


const connectionsSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder

      .addCase(fetchConnections.fulfilled, (state, action) => {
        if (action.payload?.success) {
          state.connections = action.payload.connections || [];
          state.pendingConnections =
            action.payload.pendingConnections || [];
          state.followers = action.payload.followers || [];
          state.following = action.payload.following || [];
        }
      })

     
      .addCase(fetchConnections.rejected, (state, action) => {
        console.error("Fetch connections error:", action.payload);
      });
  },
});

export default connectionsSlice.reducer;