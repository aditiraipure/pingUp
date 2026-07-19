import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  connections: [],
  pendingConnections: [],
  pendingFollowRequests: [],
  followers: [],
  following: [],
  notificationCounts: {
    pending: 0,
    connections: 0,
  },
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

export const markConnectionNotificationsRead = createAsyncThunk(
  "connection/markNotificationsRead",
  async ({ token, section }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        "/api/user/follow-notifications/read",
        { section },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!data.success) return rejectWithValue(data.message);
      return section;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);


const connectionsSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {
    resolvePendingFollowRequest: (state, action) => {
      const { requestId, requester, accepted } = action.payload;
      state.pendingFollowRequests = state.pendingFollowRequests.filter(
        (request) => request._id !== requestId,
      );
      if (accepted && requester) {
        if (!state.followers.some((user) => user._id === requester._id)) {
          state.followers.unshift(requester);
        }
        if (!state.connections.some((user) => user._id === requester._id)) {
          state.connections.unshift(requester);
        }
      }
    },
    resolveUnfollow: (state, action) => {
      const { userId, connectionRemoved } = action.payload;
      state.following = state.following.filter((user) => user._id !== userId);
      if (connectionRemoved) {
        state.connections = state.connections.filter((user) => user._id !== userId);
      }
    },
    resolveFollowerRemoval: (state, action) => {
      const { userId, connectionRemoved } = action.payload;
      state.followers = state.followers.filter((user) => user._id !== userId);
      if (connectionRemoved) {
        state.connections = state.connections.filter((user) => user._id !== userId);
      }
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchConnections.fulfilled, (state, action) => {
        if (action.payload?.success) {
          state.connections = action.payload.connections || [];
          state.pendingConnections =
            action.payload.pendingConnections || [];
          state.pendingFollowRequests =
            action.payload.pendingFollowRequests || [];
          state.followers = action.payload.followers || [];
          state.following = action.payload.following || [];
          state.notificationCounts = action.payload.notificationCounts || {
            pending: 0,
            connections: 0,
          };
        }
      })

      .addCase(markConnectionNotificationsRead.fulfilled, (state, action) => {
        state.notificationCounts[action.payload] = 0;
      })

     
      .addCase(fetchConnections.rejected, (state, action) => {
        console.error("Fetch connections error:", action.payload);
      });
  },
});

export const { resolveFollowerRemoval, resolvePendingFollowRequest, resolveUnfollow } = connectionsSlice.actions;
export default connectionsSlice.reducer;
